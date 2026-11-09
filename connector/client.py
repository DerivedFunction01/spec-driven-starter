#!/usr/bin/env python3
"""Harness connector client stub: the venue-side CLI for the
connector's tool contract (docs/connector-setup.md). Real
HTTP transport; refuses unattributed or unconfigured calls.
"""

import json
import os
import sys
import urllib.error
import urllib.request

# The tool contract: name -> (method, path, scope). Scopes:
# read, write-state, send. No tool grants authority — none
# approves a permission or acts as the owner (setup doc).
TOOLS = {
    "chat-list": ("GET", "/tools/chat/list", "read"),
    "chat-tail": ("GET", "/tools/chat/tail", "read"),
    "chat-send": ("POST", "/tools/chat/send", "send"),
    "permissions-pending": ("GET", "/tools/permissions/pending", "read"),
    "ping-ack": ("POST", "/tools/pings/ack", "write-state"),
    "state-read": ("GET", "/tools/state/read", "read"),
    "state-write": ("POST", "/tools/state/write", "write-state"),
    "ledger-append": ("POST", "/tools/ledger/append", "write-state"),
    "workbench-todos": ("GET", "/tools/workbench/todos", "read"),
}


# The connector is private by default (loopback / tailnet /
# relay): calls go direct, never through an ambient proxy.
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


class Refusal(Exception):
    """A named refusal: unconfigured or unattributed call."""


def _config() -> tuple[str, str, str]:
    base = os.environ.get("HARNESS_CONNECTOR_URL", "")
    caller = os.environ.get("HARNESS_CALLER", "")
    token = os.environ.get("HARNESS_CONNECTOR_TOKEN", "")
    if not base:
        raise Refusal(
            "HARNESS_CONNECTOR_URL is not set: no connector is "
            "configured on this venue (docs/connector-setup.md)"
        )
    if not caller or not token:
        raise Refusal(
            "unattributed call refused: HARNESS_CALLER and "
            "HARNESS_CONNECTOR_TOKEN must both be set — register "
            "the caller first (connector/register_caller.py)"
        )
    return base.rstrip("/"), caller, token


def call(tool: str, params: dict | None = None) -> str:
    """Run one tool call against the configured connector."""
    if tool not in TOOLS:
        raise Refusal(f"unknown tool: {tool}")
    method, path, _scope = TOOLS[tool]
    base, caller, token = _config()
    params = params or {}
    data = None
    if method == "GET" and params:
        query = "&".join(
            f"{key}={value}" for key, value in sorted(params.items())
        )
        path = f"{path}?{query}"
    elif method == "POST":
        data = json.dumps(params).encode("utf-8")
    request = urllib.request.Request(
        base + path,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "X-Caller": caller,
            "Content-Type": "application/json",
        },
    )
    try:
        with OPENER.open(request, timeout=30) as res:
            return res.read().decode("utf-8")
    except urllib.error.HTTPError as err:
        body = err.read().decode("utf-8", "replace")
        raise Refusal(f"connector answered {err.code}: {body}") from err
    except urllib.error.URLError as err:
        raise Refusal(f"connector unreachable: {err.reason}") from err


def main(argv: list[str]) -> int:
    """CLI: client.py <tool> [key=value ...] — prints the reply."""
    if len(argv) < 2 or argv[1] not in TOOLS:
        names = ", ".join(sorted(TOOLS))
        print(f"usage: client.py <tool> [key=value ...]\ntools: {names}")
        return 2
    params = {}
    for pair in argv[2:]:
        key, _, value = pair.partition("=")
        params[key] = value
    try:
        print(call(argv[1], params))
    except Refusal as err:
        print(f"connector: {err}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
