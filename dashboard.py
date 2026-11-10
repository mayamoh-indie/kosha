"""Local-only Kosha dashboard. Run python dashboard.py, then open localhost:8765."""

import json
from dataclasses import asdict
from decimal import Decimal
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from payoff import Result, calculate, number, parse_debts
from tax_tools import tax_request

ROOT = Path(__file__).parent
ADDRESS = '127.0.0.1'
PORT = 8765


def compare(payload: object) -> list[Result]:
    if not isinstance(payload, dict):
        raise ValueError('Expected an object containing debts and monthly_budget.')
    records = payload.get('debts')
    if not isinstance(records, list) or len(records) > 50:
        raise ValueError('Provide a list of at most 50 debts.')
    debts, errors = parse_debts(records)
    if errors:
        raise ValueError('\n'.join(errors))
    budget = number(payload.get('monthly_budget'), 'Monthly budget')
    return [calculate(debts, budget, strategy) for strategy in ('avalanche', 'snowball', 'custom')]


class Handler(BaseHTTPRequestHandler):
    def respond(self, status: int, body: bytes, content_type: str) -> None:
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; frame-ancestors 'none'")
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
        files = {'/': ('index.html', 'text/html; charset=utf-8'),
                 '/app.js': ('app.js', 'text/javascript; charset=utf-8'),
                 '/style.css': ('style.css', 'text/css; charset=utf-8'),
                 '/tools': ('tools.html', 'text/html; charset=utf-8'),
                 '/tools.js': ('tools.js', 'text/javascript; charset=utf-8')}
        if self.path == '/sample':
            self.respond(200, (ROOT / 'sample-debts.json').read_bytes(), 'application/json')
        elif self.path in files:
            name, kind = files[self.path]
            self.respond(200, (ROOT / 'web' / name).read_bytes(), kind)
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
            payload: object = json.loads(self.rfile.read(length), parse_float=Decimal)
            output = ([asdict(result) for result in compare(payload)] if self.path == '/calculate'
                      else asdict(tax_request(payload, self.path[1:])))
        except (ValueError, UnicodeError) as exc:
            self.respond(400, json.dumps({'error': str(exc)}).encode(), 'application/json')
            return
        body = json.dumps(output, default=str).encode()
        self.respond(200, body, 'application/json')


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
