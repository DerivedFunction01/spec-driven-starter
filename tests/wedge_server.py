#!/usr/bin/env python3
"""Wedged responder for the supervision drills: accepts a
connection, sends response headers and a partial body, then
stalls forever — the shape that hangs an unbounded probe."""

import socket
import sys
import time

port = int(sys.argv[1])
server = socket.socket()
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind(("127.0.0.1", port))
server.listen(5)
while True:
    conn, _ = server.accept()
    try:
        conn.recv(4096)
        conn.sendall(
            b"HTTP/1.1 200 OK\r\nContent-Length: 100\r\n\r\n{partial"
        )
        time.sleep(3600)
    except OSError:
        pass
    finally:
        conn.close()
