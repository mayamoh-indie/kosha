"""Local-only Kosha dashboard. Run python dashboard.py, then open localhost:8765."""

import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from api import respond

ROOT = Path(__file__).parent
ADDRESS = '127.0.0.1'
PORT = 8765
PAGES = ['index.html', 'debts.html', 'planner.html', 'strategy.html', 'plan.html', 'track.html', 'expenses.html',
         'salary.html', 'rrsp.html', 'style.css', 'api.js', 'categories.js', 'store.js', 'home.js',
         'debts.js', 'app.js', 'strategy.js', 'plan.js', 'track.js', 'tools.js', 'expense-data.js', 'expenses.js',
         'finance.html', 'finance.js', 'finance-data.js', 'growth.html', 'growth.js', 'growth-data.js',
         'whatif-data.js', 'theme.js', 'menu.js']
TYPES = {'html': 'text/html; charset=utf-8', 'css': 'text/css; charset=utf-8',
         'js': 'text/javascript; charset=utf-8'}
# Fixed allowlist of servable files: request paths only select an entry, never build a path.
FILES = {f'/{name}': (ROOT / 'web' / name, TYPES[name.rsplit('.', 1)[1]]) for name in PAGES}
FILES['/'] = FILES['/index.html']
FILES['/sample-debts.json'] = (ROOT / 'sample-debts.json', 'application/json')


class Handler(BaseHTTPRequestHandler):
    def respond(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy',
                         "default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'")
        self.end_headers()
        self.wfile.write(body)

    def allowed(self) -> bool:
        hosts = {f'localhost:{PORT}', f'{ADDRESS}:{PORT}'}
        origin = self.headers.get('Origin')
        return self.headers.get('Host') in hosts and (
            origin is None or origin in {f'http://{host}' for host in hosts})

    def do_GET(self) -> None:
        if not self.allowed():
            self.respond(403, b'Forbidden', 'text/plain')
            return
        file = FILES.get(self.path)
        if file:
            self.respond(200, file[0].read_bytes(), file[1])
        else:
            self.respond(404, b'Not found', 'text/plain')

    def do_POST(self) -> None:
        if not self.allowed():
            self.respond(403, b'Forbidden', 'text/plain')
            return
        if self.path not in ('/calculate', '/salary', '/rrsp'):
            self.respond(404, b'Not found', 'text/plain')
            return
        try:
            length = int(self.headers.get('Content-Length', '0'))
            if not 0 < length <= 65536:
                raise ValueError('Request must contain between 1 and 65,536 bytes.')
            if self.headers.get('Content-Type') != 'application/json':
                raise ValueError('Send JSON input.')
            status, body = respond(self.path, self.rfile.read(length).decode())
        except (ValueError, UnicodeError) as exc:
            status, body = 400, json.dumps({'error': str(exc)})
        self.respond(status, body.encode(), 'application/json')


def main() -> None:
    server = ThreadingHTTPServer((ADDRESS, PORT), Handler)
    print(f'Kosha dashboard: http://{ADDRESS}:{PORT}', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
