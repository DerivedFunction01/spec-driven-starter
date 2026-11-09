#!/usr/bin/env python3
"""Slow-start wrapper for the supervision drills: sleeps the
given seconds, then execs the real command — a first start
whose startup sweep delays the port binding."""

import os
import sys
import time

time.sleep(float(sys.argv[1]))
os.execvp(sys.argv[2], sys.argv[2:])
