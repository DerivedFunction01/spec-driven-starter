"""HTTP server: parse, wire, dispatch — no logic of its own.

Run: var/venv/bin/python -m backend.apps.server
Serves the API (API.md) and the static frontend from one process
so a fresh instance needs no second server. Stdlib only.
"""

from __future__ import annotations

import json
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from backend.foundation.errors import problem_details
from backend.foundation.settings import REPO_ROOT, Settings
from backend.infra.sample_data import SAMPLE_KITS
from backend.infra.store import JsonFileStore, MemoryStore, Store
from backend.services.model import build_model

FRONTEND_DIR = REPO_ROOT / "frontend"

# Security baseline (docs/fundamentals.md): set once here, at
# the shell, so every route — API and static — inherits them.
SECURITY_HEADERS = {
    "Content-Security-Policy": "default-src 'self'",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
}

STATIC = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/index.html": ("index.html", "text/html; charset=utf-8"),
    "/app.js": ("app.js", "text/javascript; charset=utf-8"),
    "/app.css": ("app.css", "text/css; charset=utf-8"),
}


def make_store(settings: Settings) -> Store:
    if settings.data_path is not None:
        return JsonFileStore(settings.data_path)
    return MemoryStore(SAMPLE_KITS)


def make_handler(store: Store, settings: Settings):
    class Handler(BaseHTTPRequestHandler):
        def _send_security_headers(self) -> None:
            for name, value in SECURITY_HEADERS.items():
                self.send_header(name, value)

        def _send_json(self, payload: dict, status: int = 200) -> None:
            body = json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self._send_security_headers()
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _send_problem(self, code: str, status: int, detail: str) -> None:
            correlation_id = uuid.uuid4().hex
            payload = problem_details(code, status, detail, correlation_id)
            body = json.dumps(payload).encode("utf-8")
            self.send_response(status)
            self._send_security_headers()
            self.send_header("Content-Type", "application/problem+json")
            self.send_header("X-Correlation-Id", correlation_id)
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self) -> None:  # noqa: N802 (stdlib naming)
            if self.path == "/health":
                self._send_json(
                    {
                        "status": "ok",
                        "contract": "api/2",
                        "environment": settings.environment,
                    }
                )
            elif self.path == "/api/v1/model":
                self._send_json(build_model(store, settings))
            elif self.path in STATIC:
                name, ctype = STATIC[self.path]
                body = (FRONTEND_DIR / name).read_bytes()
                self.send_response(200)
                self._send_security_headers()
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
            else:
                self._send_problem("not-found", 404, "No such route.")

        def log_message(self, *args) -> None:
            pass

    return Handler


def main() -> int:
    settings = Settings.from_env()
    server = ThreadingHTTPServer(
        (settings.host, settings.port),
        make_handler(make_store(settings), settings),
    )
    print(f"field-kit sample on http://{settings.host}:{settings.port}")
    server.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
