"""Supervision drills: the ops scripts against a scratch copy
of the tree, the fake systemctl, and the real sample server.
Seams only — the host's own systemd is never touched."""

import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import unittest
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UNIT = "field-kit-drill"
COPY_DIRS = ("backend", "frontend", "ops", "flavors", "tools")
FAKE = ROOT / "tests" / "fake_systemctl.py"
STATE_PARTS = ("var", "state")


def _free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


class SupervisionDrills(unittest.TestCase):
    def setUp(self):
        self.tmp = Path(tempfile.mkdtemp(prefix="kit-drill-"))
        self.repo = self.tmp / "repo"
        self.repo.mkdir()
        for name in COPY_DIRS:
            shutil.copytree(
                ROOT / name,
                self.repo / name,
                ignore=shutil.ignore_patterns("__pycache__"),
            )
        self.units = self.tmp / "units"
        self.fake_state = self.tmp / "fake-state"
        self.units.mkdir()
        self.fake_state.mkdir()
        self.port = _free_port()
        self.env = dict(os.environ)
        self.env.update(
            {
                "FIELDKIT_PORT": str(self.port),
                "FIELDKIT_UNIT": UNIT,
                "FIELDKIT_UNIT_DIR": str(self.units),
                "FIELDKIT_SYSTEMCTL": str(FAKE),
                "FIELDKIT_POLL_SECS": "30",
                "FAKE_SYSTEMCTL_STATE": str(self.fake_state),
                "FAKE_SYSTEMCTL_UNIT_DIR": str(self.units),
            }
        )
        self.addCleanup(self._cleanup)

    def _cleanup(self):
        self.run_ops("serve.sh", "stop", check=False)
        pid = self.fake_pid()
        if pid is not None:
            try:
                os.kill(pid, 9)
            except OSError:
                pass
        shutil.rmtree(self.tmp, ignore_errors=True)

    def run_ops(self, script, *args, check=True, poll_secs=None):
        env = dict(self.env)
        if poll_secs is not None:
            env["FIELDKIT_POLL_SECS"] = str(poll_secs)
            env["FIELDKIT_RESTORE_POLL_SECS"] = str(poll_secs)
        result = subprocess.run(
            ["bash", str(self.repo / "ops" / script), *args],
            cwd=self.repo,
            env=env,
            capture_output=True,
            text=True,
            timeout=120,
        )
        if check and result.returncode != 0:
            self.fail(
                f"{script} {args} exited {result.returncode}: "
                f"{result.stdout} {result.stderr}"
            )
        return result

    @property
    def unit_file(self):
        return self.units / f"{UNIT}.service"

    def state_path(self, name):
        return self.repo.joinpath(*STATE_PARTS, name)

    def fake_pid(self):
        pid_file = self.fake_state / f"{UNIT}.pid"
        if pid_file.is_file():
            try:
                return int(pid_file.read_text(encoding="utf-8").strip())
            except ValueError:
                return None
        return None

    def healthy(self):
        try:
            url = f"http://127.0.0.1:{self.port}/health"
            with urllib.request.urlopen(url, timeout=3) as res:
                return res.status == 200
        except OSError:
            return False

    def wait_healthy(self, seconds=15):
        deadline = time.time() + seconds
        while time.time() < deadline:
            if self.healthy():
                return True
            time.sleep(0.25)
        return self.healthy()

    def wait_unhealthy(self, seconds=10):
        deadline = time.time() + seconds
        while time.time() < deadline:
            if not self.healthy():
                return True
            time.sleep(0.25)
        return not self.healthy()

    def calls(self):
        log = self.fake_state / "calls.log"
        if log.is_file():
            return log.read_text(encoding="utf-8").splitlines()
        return []

    def test_render_complete_and_idempotent(self):
        self.run_ops("install-unit.sh")
        text = self.unit_file.read_text(encoding="utf-8")
        for placeholder in ("@ROOT@", "@PYTHON@", "@HOME@", "@HOST@"):
            self.assertNotIn(placeholder, text)
        self.assertNotIn("@PORT@", text)
        self.assertNotIn("@UNIT@", text)
        self.assertIn(f"FIELDKIT_PORT={self.port}", text)
        log_rel = Path(*STATE_PARTS, f"{UNIT}.log").as_posix()
        self.assertIn(log_rel, text)
        first = self.unit_file.read_bytes()
        self.run_ops("install-unit.sh")
        self.assertEqual(self.unit_file.read_bytes(), first)

    def test_serve_delegates_when_unit_installed(self):
        self.run_ops("install-unit.sh")
        self.run_ops("serve.sh", "start")
        self.assertIn(f"start {UNIT}.service", self.calls())
        self.assertFalse(self.state_path(f"{UNIT}.pid").exists())
        self.assertTrue(self.wait_healthy())
        result = self.run_ops("serve.sh", "status")
        self.assertIn("running", result.stdout)
        self.run_ops("serve.sh", "stop")
        self.assertIn(f"stop {UNIT}.service", self.calls())
        self.assertTrue(self.wait_unhealthy())

    def test_serve_direct_path_without_unit(self):
        self.run_ops("serve.sh", "start")
        self.assertTrue(self.state_path(f"{UNIT}.pid").exists())
        self.assertTrue(self.wait_healthy())
        self.assertNotIn(f"start {UNIT}.service", self.calls())
        self.run_ops("serve.sh", "stop")
        self.assertFalse(self.state_path(f"{UNIT}.pid").exists())
        self.assertTrue(self.wait_unhealthy())

    def test_rung3_presence_before_health_quiet_reinstall(self):
        self.run_ops("install-unit.sh")
        self.run_ops("serve.sh", "start")
        self.assertTrue(self.wait_healthy())
        pid_before = self.fake_pid()
        self.assertIsNotNone(pid_before)
        self.unit_file.unlink()
        result = self.run_ops("watchdog.sh")
        self.assertEqual(result.stdout, "")
        self.assertTrue(self.unit_file.is_file())
        self.assertEqual(self.fake_pid(), pid_before)

    def test_rung6_loaded_unit_restarts(self):
        self.run_ops("install-unit.sh")
        self.run_ops("serve.sh", "start")
        self.assertTrue(self.wait_healthy())
        pid_before = self.fake_pid()
        subprocess.run(
            [str(FAKE), "stop", f"{UNIT}.service"],
            env=self.env,
            check=True,
            capture_output=True,
        )
        self.assertFalse(self.healthy())
        self.run_ops("watchdog.sh")
        self.assertTrue(self.healthy())
        self.assertIsNotNone(self.fake_pid())
        self.assertNotEqual(self.fake_pid(), pid_before)
        self.assertIn(f"restart {UNIT}.service", self.calls())

    def test_rung6_unloaded_unit_starts(self):
        self.assertFalse(self.unit_file.exists())
        self.run_ops("watchdog.sh")
        self.assertTrue(self.unit_file.is_file())
        self.assertTrue(self.healthy())

    def test_watchdog_fails_loudly_on_unstartable_entry(self):
        template = self.repo / "ops" / "server.service.tmpl"
        text = template.read_text(encoding="utf-8")
        template.write_text(
            text.replace("backend.apps.server", "backend.apps.unstartable"),
            encoding="utf-8",
        )
        result = self.run_ops("watchdog.sh", check=False, poll_secs=8)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("watchdog", result.stderr)
        log = self.state_path(f"{UNIT}.log")
        self.assertTrue(log.is_file())
        self.assertIn("ladder failed", log.read_text(encoding="utf-8"))

    def test_watchdog_foreign_responder_fails_loudly(self):
        self.run_ops("serve.sh", "start")
        self.assertTrue(self.wait_healthy())
        pid_file = self.state_path(f"{UNIT}.pid")
        foreign_pid = int(pid_file.read_text(encoding="utf-8").strip())
        try:
            self.run_ops("install-unit.sh")
            result = self.run_ops("watchdog.sh", check=False)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("not the supervised", result.stderr)
            self.assertNotIn(f"start {UNIT}.service", self.calls())
            self.assertNotIn(f"restart {UNIT}.service", self.calls())
        finally:
            try:
                os.kill(foreign_pid, 9)
            except OSError:
                pass

    def healthy_full(self):
        try:
            url = f"http://127.0.0.1:{self.port}/health"
            with urllib.request.urlopen(url, timeout=3) as res:
                res.read()
                return res.status == 200
        except OSError:
            return False

    def test_watchdog_wedged_unit_restarts_and_recovers(self):
        (self.fake_state / "wedge").write_text("", encoding="utf-8")
        self.run_ops("install-unit.sh")
        self.run_ops("serve.sh", "start")
        self.assertFalse(self.healthy_full())
        (self.fake_state / "wedge").unlink()
        started = time.monotonic()
        self.run_ops("watchdog.sh", poll_secs=30)
        self.assertLess(time.monotonic() - started, 60)
        self.assertIn(f"restart {UNIT}.service", self.calls())
        self.assertTrue(self.healthy())

    def test_rung5_bounded_probe_wedged_persistent(self):
        (self.fake_state / "wedge").write_text("", encoding="utf-8")
        self.run_ops("install-unit.sh")
        self.run_ops("serve.sh", "start")
        self.assertFalse(self.healthy_full())
        started = time.monotonic()
        result = self.run_ops("watchdog.sh", check=False, poll_secs=8)
        elapsed = time.monotonic() - started
        self.assertNotEqual(result.returncode, 0)
        self.assertLess(elapsed, 90)

    def test_rung7_fresh_restore_uses_restore_window(self):
        (self.fake_state / "slowstart").write_text("20", encoding="utf-8")
        env = dict(self.env)
        env["FIELDKIT_POLL_SECS"] = "5"
        env["FIELDKIT_RESTORE_POLL_SECS"] = "60"
        started = time.monotonic()
        result = subprocess.run(
            ["bash", str(self.repo / "ops" / "watchdog.sh")],
            cwd=self.repo,
            env=env,
            capture_output=True,
            text=True,
            timeout=120,
        )
        elapsed = time.monotonic() - started
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertGreaterEqual(elapsed, 18)
        self.assertTrue(self.unit_file.is_file())
        self.assertTrue(self.healthy())
        self.assertIn(f"start {UNIT}.service", self.calls())
        self.assertNotIn(f"restart {UNIT}.service", self.calls())

    def test_rung4_render_when_invalid_rerenders(self):
        self.run_ops("install-unit.sh")
        self.run_ops("serve.sh", "start")
        self.assertTrue(self.wait_healthy())
        pid_before = self.fake_pid()
        with open(self.unit_file, "a", encoding="utf-8") as fh:
            fh.write("# stale local edit\n")
        self.run_ops("watchdog.sh")
        text = self.unit_file.read_text(encoding="utf-8")
        self.assertNotIn("stale local edit", text)
        self.assertEqual(self.fake_pid(), pid_before)

    def test_rung8_episode_cap(self):
        template = self.repo / "ops" / "server.service.tmpl"
        text = template.read_text(encoding="utf-8")
        template.write_text(
            text.replace("backend.apps.server", "backend.apps.unstartable"),
            encoding="utf-8",
        )
        first = self.run_ops("watchdog.sh", check=False, poll_secs=8)
        self.assertNotEqual(first.returncode, 0)
        verbs = [
            line
            for line in self.calls()
            if line.startswith(("start ", "restart "))
        ]
        self.assertTrue(verbs)
        second = self.run_ops("watchdog.sh", check=False, poll_secs=8)
        self.assertNotEqual(second.returncode, 0)
        self.assertIn("episode cap", second.stderr)
        verbs_after = [
            line
            for line in self.calls()
            if line.startswith(("start ", "restart "))
        ]
        self.assertEqual(verbs_after, verbs)

    def test_service_flavor_instance_renders(self):
        result = subprocess.run(
            [sys.executable, "tools/apply_flavor.py", "service"],
            cwd=self.repo,
            capture_output=True,
            text=True,
            timeout=60,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertTrue((self.repo / "jobs" / "example-kit-check.yaml").is_file())
        marker = self.repo.joinpath("var", "flavor.txt")
        self.assertEqual(marker.read_text(encoding="utf-8").strip(), "service")
        self.run_ops("install-unit.sh")
        text = self.unit_file.read_text(encoding="utf-8")
        self.assertNotIn("@UNIT@", text)
        self.assertIn(f"Description={UNIT} sample server", text)


if __name__ == "__main__":
    unittest.main()
