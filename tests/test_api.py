import json
import threading
import unittest
import urllib.request
from http.server import ThreadingHTTPServer

from backend.apps.server import make_handler, make_store
from backend.foundation.settings import Settings


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        settings = Settings(port=0)
        cls.server = ThreadingHTTPServer(
            ("127.0.0.1", 0), make_handler(make_store(settings), settings)
        )
        cls.port = cls.server.server_address[1]
        cls.thread = threading.Thread(target=cls.server.serve_forever)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.thread.join()

    def get(self, path):
        with urllib.request.urlopen(
            f"http://127.0.0.1:{self.port}{path}", timeout=5
        ) as res:
            return res.status, json.loads(res.read())

    def test_health(self):
        status, body = self.get("/health")
        self.assertEqual(status, 200)
        self.assertEqual(body["status"], "ok")

    def test_model(self):
        status, body = self.get("/api/v1/model")
        self.assertEqual(status, 200)
        self.assertEqual(len(body["kits"]), 3)

    def test_frontend_served(self):
        with urllib.request.urlopen(
            f"http://127.0.0.1:{self.port}/", timeout=5
        ) as res:
            self.assertIn(b"Field-Kit", res.read())


if __name__ == "__main__":
    unittest.main()
