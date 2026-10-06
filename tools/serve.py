#!/usr/bin/env python3
"""Static server for the prototype that never caches.

Why this exists
---------------
`python -m http.server` sends `Last-Modified` and no `Cache-Control`. When a
response carries no explicit freshness, browsers are allowed to invent one
(RFC 9111 4.2.2, "heuristic freshness"); Chrome uses 10% of the document's age
at fetch time. So a stylesheet that happened to be a month old when you first
loaded the page earns roughly a three-day window in which Chrome will reuse it
WITHOUT revalidating — no request, no 304, no way to tell from the terminal.

Because index.html is usually edited more recently than styles.css, the two
files end up with very different windows, and you get the worst possible
failure mode for a prototype: today's markup rendered against last week's CSS.
It looks precisely like a layout bug, and no amount of reading the layout code
will find it.

`Cache-Control: no-store` removes the guesswork. The cost is re-downloading a
few hundred KB on each reload from localhost, which is free.

Usage
-----
    python3 tools/serve.py            # http://localhost:5184
    python3 tools/serve.py 8080       # some other port

It always serves the project folder (the parent of tools/), whatever the
current directory is. The path is re-resolved on every request, so renaming
or moving the folder while the server runs does not turn everything into 404s.
"""

import functools
import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5184
HERE = os.path.dirname(os.path.abspath(__file__))


def project_root():
    # Resolved per request from this file's live location, not cached at
    # startup, so a folder rename under a running server is harmless.
    try:
        return os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    except OSError:
        return os.path.dirname(HERE)


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=project_root(), **kwargs)

    def end_headers(self):
        # no-store is the strong one: do not write it to disk at all. The other
        # two are for intermediaries and for older browsers that predate it.
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def send_response(self, *args, **kwargs):
        # SimpleHTTPRequestHandler also emits Last-Modified, which is what
        # feeds the heuristic. no-store already wins, but dropping the hint
        # keeps the response honest.
        super().send_response(*args, **kwargs)

    def log_message(self, fmt, *args):
        # Quieter than the default: one line per request, no client address.
        sys.stderr.write("%s\n" % (fmt % args))


class ReusableServer(socketserver.TCPServer):
    # Without this, restarting after Ctrl-C fails with "Address already in use"
    # for as long as the socket sits in TIME_WAIT.
    allow_reuse_address = True


if __name__ == '__main__':
    os.chdir(project_root())
    with ReusableServer(('', PORT), NoCacheHandler) as httpd:
        print('serving %s' % project_root())
        print('  http://localhost:%d/                        (test wrapper, A/B/C swap)' % PORT)
        print('  http://localhost:%d/insights.html?variant=a (one variant, no wrapper)' % PORT)
        print('  no-store: edits are always picked up on reload')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nstopped')
