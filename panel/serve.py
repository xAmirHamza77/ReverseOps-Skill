#!/usr/bin/env python3
"""ReverseOps panel server — static files + local API.

    python3 panel/serve.py [port]        # default 8377

Endpoints:
    GET  /                       static panel (panel/ directory)
    GET  /api/ping               {"ok": true, "repo": "..."} — used by the UI to
                                 detect server features (terminal, report bodies)
    GET  /api/report?file=<path> raw markdown of a report/findings file inside the repo
    POST /api/exec               {"cmd": "...", "mode": "shell"}   → {code, stdout, stderr, elapsed}
                                 {"cmd": "...", "mode": "claude"}  → wraps `claude -p "<cmd>"`

SECURITY: binds to 127.0.0.1 only. Every POST /api/exec runs a real command with
this user's privileges on this machine — that is the entire point of the terminal
bridge. Do not rebind to 0.0.0.0, do not expose the port, close the server when
the engagement box is shared.
"""
import json
import http.server
import os
import shlex
import subprocess
import sys
import time
import urllib.parse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 and sys.argv[1].isdigit() else 8377
PANEL_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(PANEL_DIR)
EXEC_TIMEOUT = 120
CLAUDE_TIMEOUT = 300
MAX_OUT = 400 * 1024  # 400 KiB per stream


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=PANEL_DIR, **kw)

    # ---------------------------------------------------------------- helpers
    def _json(self, obj, code=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _safe_repo_path(self, rel):
        rel = (rel or "").strip().lstrip("/")
        full = os.path.normpath(os.path.join(REPO_ROOT, rel))
        if not full.startswith(REPO_ROOT + os.sep) or ".." in rel.split("/"):
            return None
        return full

    def log_message(self, fmt, *args):  # quieter, but keep exec/file reads visible
        if "/api/" in (args[0] if args else ""):
            sys.stderr.write("[panel] %s\n" % (fmt % args))

    # ---------------------------------------------------------------- GET
    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path == "/api/ping":
            return self._json({"ok": True, "repo": REPO_ROOT, "panel": os.path.basename(PANEL_DIR)})
        if path == "/api/report":
            qs = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            full = self._safe_repo_path((qs.get("file") or [""])[0])
            if not full or not os.path.isfile(full):
                return self._json({"error": "not found or outside repo"}, 404)
            with open(full, "r", encoding="utf-8-sig", errors="replace") as fh:
                return self._json({"file": os.path.relpath(full, REPO_ROOT), "content": fh.read(MAX_OUT)})
        return super().do_GET()

    # ---------------------------------------------------------------- POST
    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        if path != "/api/exec":
            return self._json({"error": "unknown endpoint"}, 404)
        try:
            length = min(int(self.headers.get("Content-Length", 0)), 64 * 1024)
            payload = json.loads(self.rfile.read(length) or b"{}")
        except Exception as exc:  # noqa: BLE001
            return self._json({"error": "bad json: %s" % exc}, 400)

        cmd = str(payload.get("cmd", "")).strip()
        mode = payload.get("mode", "shell")
        if not cmd:
            return self._json({"error": "empty command"}, 400)

        sys.stderr.write("[panel exec][%s] %s\n" % (time.strftime("%H:%M:%S"), cmd[:200]))
        t0 = time.time()
        try:
            if mode == "claude":
                argv = ["claude", "-p", cmd, "--output-format", "text"]
                proc = subprocess.run(argv, cwd=REPO_ROOT, capture_output=True,
                                      text=True, timeout=CLAUDE_TIMEOUT)
            else:
                proc = subprocess.run(cmd, shell=True, cwd=REPO_ROOT, capture_output=True,
                                      text=True, timeout=EXEC_TIMEOUT,
                                      executable=os.environ.get("SHELL", "/bin/sh"))
            return self._json({
                "code": proc.returncode,
                "stdout": proc.stdout[-MAX_OUT:],
                "stderr": proc.stderr[-MAX_OUT:],
                "elapsed": round(time.time() - t0, 2),
                "cwd": REPO_ROOT,
            })
        except subprocess.TimeoutExpired:
            return self._json({"code": 124, "stdout": "", "stderr": "timeout (%ss)" % EXEC_TIMEOUT,
                               "elapsed": round(time.time() - t0, 2)})
        except FileNotFoundError as exc:
            return self._json({"code": 127, "stdout": "", "stderr": str(exc),
                               "elapsed": round(time.time() - t0, 2)})


def main():
    os.chdir(PANEL_DIR)
    print("ReverseOps panel  ->  http://127.0.0.1:%d/" % PORT)
    print("repo root         ->  %s" % REPO_ROOT)
    print("WARNING: POST /api/exec runs real shell commands (localhost only). Ctrl+C to stop.")
    http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
