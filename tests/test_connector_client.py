"""Connector client drills: the stub against a fake host —
attribution on the wire, refusals before any call is made.
"""

import importlib.util
import json
import os
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location(
    "connector_client", ROOT / "connector" / "client.py"
)
client = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(client)

CALLS = []


class _Handler(BaseHTTPRequestHandler):
    def _reply(self):
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length).decode("utf-8") if length else ""
        CALLS.append(
            {
                "method": self.command,
                "path": self.path,
                "caller": self.headers.get("X-Caller"),
                "auth": self.headers.get("Authorization"),
                "body": body,
            }
        )
        payload = json.dumps({"ok": True}).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    do_GET = _reply
    do_POST = _reply

    def log_message(self, *args):
        pass


class ConnectorClientTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), _Handler)
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.thread.join()

    def setUp(self):
        CALLS.clear()
        self.env = {
            "HARNESS_CONNECTOR_URL": f"http://127.0.0.1:{self.port}",
            "HARNESS_CALLER": "drill-caller",
            "HARNESS_CONNECTOR_TOKEN": "drill-token",
        }

    def test_read_call_carries_attribution(self):
        with mock.patch.dict(os.environ, self.env):
            reply = client.call("chat-list")
        self.assertEqual(json.loads(reply), {"ok": True})
        self.assertEqual(CALLS[0]["caller"], "drill-caller")
        self.assertEqual(CALLS[0]["auth"], "Bearer drill-token")
        self.assertEqual(CALLS[0]["path"], "/tools/chat/list")

    def test_send_posts_the_payload(self):
        with mock.patch.dict(os.environ, self.env):
            client.call("chat-send", {"chat": "c1", "text": "hello"})
        self.assertEqual(CALLS[0]["method"], "POST")
        self.assertEqual(
            json.loads(CALLS[0]["body"]), {"chat": "c1", "text": "hello"}
        )

    def test_refused_without_caller_or_token(self):
        env = dict(os.environ)
        env["HARNESS_CONNECTOR_URL"] = self.env["HARNESS_CONNECTOR_URL"]
        env.pop("HARNESS_CALLER", None)
        env.pop("HARNESS_CONNECTOR_TOKEN", None)
        with mock.patch.dict(os.environ, env, clear=True):
            with self.assertRaises(client.Refusal):
                client.call("chat-list")
        self.assertEqual(CALLS, [])

    def test_refused_when_unconfigured(self):
        env = dict(os.environ)
        for key in list(env):
            if key.startswith("HARNESS_"):
                env.pop(key)
        with mock.patch.dict(os.environ, env, clear=True):
            with self.assertRaises(client.Refusal):
                client.call("chat-list")
        self.assertEqual(CALLS, [])

    def test_no_tool_grants_authority(self):
        for name in client.TOOLS:
            self.assertNotIn("approve", name)
            self.assertNotIn("permission-set", name)
        self.assertEqual(
            client.TOOLS["permissions-pending"][2], "read"
        )


if __name__ == "__main__":
    unittest.main()
