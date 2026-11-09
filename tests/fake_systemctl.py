#!/usr/bin/env python3
"""Fake systemctl for the supervision drills: the CLI contract
(start/stop/restart/is-active/enable) executed against the real
rendered unit file, spawning the real process it names."""

import os
import shlex
import signal
import subprocess
import sys
import time
from pathlib import Path

# Not modelled: Restart=always — the real supervisor's business;
# the watchdog ladder covers the cases it would.


def _state() -> Path:
    return Path(os.environ["FAKE_SYSTEMCTL_STATE"])


def _unit_dir() -> Path:
    return Path(os.environ["FAKE_SYSTEMCTL_UNIT_DIR"])


def _name(unit: str) -> str:
    suffix = ".service"
    return unit[: -len(suffix)] if unit.endswith(suffix) else unit


def _unit_file(unit: str) -> Path:
    return _unit_dir() / f"{_name(unit)}.service"


def _pid(name: str) -> int | None:
    pid_file = _state() / f"{name}.pid"
    if not pid_file.is_file():
        return None
    try:
        pid = int(pid_file.read_text(encoding="utf-8").strip())
        os.kill(pid, 0)
    except (OSError, ValueError):
        return None
    stat = Path(f"/proc/{pid}/stat")
    if stat.is_file() and stat.read_text(encoding="utf-8").split()[2] == "Z":
        return None
    return pid


def _read_unit(unit: str) -> dict | None:
    path = _unit_file(unit)
    if not path.is_file():
        return None
    cfg: dict = {"env": {}}
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("ExecStart="):
            cfg["exec"] = line.partition("=")[2]
        elif line.startswith("WorkingDirectory="):
            cfg["cwd"] = line.partition("=")[2]
        elif line.startswith("Environment="):
            for pair in shlex.split(line.partition("=")[2]):
                key, _, value = pair.partition("=")
                cfg["env"][key] = value
        elif line.startswith("StandardOutput=append:"):
            cfg["out"] = line.partition("append:")[2]
        elif line.startswith("StandardError=append:"):
            cfg["err"] = line.partition("append:")[2]
    return cfg


def _open_log(cfg: dict, key: str):
    target = cfg.get(key)
    if target:
        Path(target).parent.mkdir(parents=True, exist_ok=True)
        return open(target, "ab")
    return subprocess.DEVNULL


def _argv(cfg: dict) -> list[str]:
    # State-dir drill flags reshape the spawn: `wedge` stalls
    # the response; `slowstart` (content: seconds) delays it.
    state = _state()
    if (state / "wedge").is_file():
        port = cfg["env"].get("FIELDKIT_PORT", "0")
        wedge = Path(__file__).with_name("wedge_server.py")
        return [sys.executable, str(wedge), port]
    argv = shlex.split(cfg["exec"])
    slow = state / "slowstart"
    if slow.is_file():
        secs = slow.read_text(encoding="utf-8").strip()
        wrapper = Path(__file__).with_name("slow_start.py")
        argv = [sys.executable, str(wrapper), secs, *argv]
    return argv


def _start(unit: str) -> int:
    name = _name(unit)
    if _pid(name) is not None:
        return 0
    cfg = _read_unit(unit)
    if cfg is None or "exec" not in cfg:
        print(f"Failed to start {unit}: unit not found.", file=sys.stderr)
        return 1
    env = dict(os.environ)
    env.update(cfg["env"])
    try:
        proc = subprocess.Popen(
            _argv(cfg),
            cwd=cfg.get("cwd"),
            env=env,
            stdout=_open_log(cfg, "out"),
            stderr=_open_log(cfg, "err"),
            start_new_session=True,
        )
    except OSError:
        return 1
    _state().mkdir(parents=True, exist_ok=True)
    (_state() / f"{name}.pid").write_text(str(proc.pid), encoding="utf-8")
    return 0


def _stop(unit: str) -> int:
    name = _name(unit)
    pid = _pid(name)
    if pid is None:
        return 0
    os.kill(pid, signal.SIGTERM)
    for _ in range(50):
        if _pid(name) is None:
            break
        time.sleep(0.1)
    if _pid(name) is not None:
        os.kill(pid, signal.SIGKILL)
    (_state() / f"{name}.pid").unlink(missing_ok=True)
    return 0


def _is_active(unit: str, quiet: bool) -> int:
    if _pid(_name(unit)) is not None:
        if not quiet:
            print("active")
        return 0
    if not quiet:
        print("inactive")
    return 3


def _enable(unit: str) -> int:
    if not _unit_file(unit).is_file():
        return 1
    _state().mkdir(parents=True, exist_ok=True)
    (_state() / f"{_name(unit)}.enabled").write_text("", encoding="utf-8")
    return 0


def _loaded() -> set[str]:
    # LoadState model: daemon-reload loads every unit file
    # then present; a file removed afterwards is not loaded.
    marker = _state() / "loaded"
    if not marker.is_file():
        return set()
    names = marker.read_text(encoding="utf-8").split()
    return {n for n in names if (_unit_dir() / f"{n}.service").is_file()}


def main(argv: list[str]) -> int:
    _state().mkdir(parents=True, exist_ok=True)
    with open(_state() / "calls.log", "a", encoding="utf-8") as log:
        log.write(" ".join(argv[1:]) + "\n")
    positionals = [arg for arg in argv[1:] if not arg.startswith("-")]
    if not positionals:
        return 1
    verb = positionals[0]
    unit = positionals[1] if len(positionals) > 1 else ""
    if verb == "daemon-reload":
        names = [p.stem for p in _unit_dir().glob("*.service")]
        (_state() / "loaded").write_text(
            "\n".join(names), encoding="utf-8"
        )
        return 0
    if verb == "show":
        name = _name(positionals[-1])
        loaded = name in _loaded()
        print("loaded" if loaded else "not-found")
        return 0
    if verb == "start":
        return _start(unit)
    if verb == "stop":
        return _stop(unit)
    if verb == "restart":
        _stop(unit)
        return _start(unit)
    if verb == "is-active":
        return _is_active(unit, "--quiet" in argv)
    if verb == "is-enabled":
        marker = _state() / f"{_name(unit)}.enabled"
        print("enabled" if marker.is_file() else "disabled")
        return 0 if marker.is_file() else 1
    if verb == "enable":
        return _enable(unit)
    if verb == "disable":
        (_state() / f"{_name(unit)}.enabled").unlink(missing_ok=True)
        return 0
    print(f"fake systemctl: unknown verb {verb}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
