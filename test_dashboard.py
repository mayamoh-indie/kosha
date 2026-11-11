import json
import threading
import unittest
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer

from api import compare
from dashboard import Handler


class DashboardTests(unittest.TestCase):
    def test_comparison_uses_existing_engine(self):
        results = compare({'debts': [{'name': 'Card', 'balance': '100', 'apr': '12', 'minimum': '10'}], 'monthly_budget': '60'})
        self.assertEqual(len(results), 3)
        self.assertTrue(all(str(result.interest) == '1.41' for result in results))

    def test_extra_payments_payload(self):
        payload = {'debts': [{'name': 'A', 'balance': '100', 'apr': '0', 'minimum': '10'}], 'monthly_budget': '20',
                   'extra_payments': [{'month': 2, 'amount': '25'}, {'month': 2, 'amount': '25'}]}
        self.assertEqual(compare(payload)[0].months, 3)
        for extras in [{}, [{'month': 0, 'amount': '1'}], [{'month': True, 'amount': '1'}], [{'month': 1, 'amount': 'x'}]]:
            with self.subTest(extras=extras), self.assertRaises(ValueError):
                compare({**payload, 'extra_payments': extras})

    def test_invalid_payload(self):
        for payload in [None, {}, {'debts': [None], 'monthly_budget': 10}, {'debts': [None] * 51}]:
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                compare(payload)

    def test_http_contract_and_origin_rejection(self):
        server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            connection = HTTPConnection('127.0.0.1', server.server_port)
            headers = {'Host': '127.0.0.1:8765', 'Content-Type': 'application/json'}
            connection.request('GET', '/', headers=headers)
            response = connection.getresponse()
            self.assertEqual(response.status, 200)
            self.assertIn(b'Payoff progress', response.read())
            pages = [('/planner.html', b'A clearer path'), ('/debts.html', b'debt-list'), ('/strategy.html', b'priorities'),
                     ('/plan.html', b'steps'), ('/track.html', b'upcoming'), ('/store.js', b'kosha-plan'),
                     ('/expenses.html', b'expense-form'), ('/expenses.js', b'kosha-expenses'),
                     ('/salary.html', b'salary-form'), ('/rrsp.html', b'rrsp-form'), ('/api.js', b'pyodide')]
            for path, marker in pages:
                connection.request('GET', path, headers=headers)
                response = connection.getresponse()
                self.assertEqual(response.status, 200)
                self.assertIn(marker, response.read())
            for path in ['/../README.md', '/web/../api.py', '/dashboard.py', '/%2e%2e/api.py']:
                connection.request('GET', path, headers=headers)
                response = connection.getresponse()
                self.assertEqual(response.status, 404, path)
                response.read()
            connection.request('POST', '/calculate', body=json.dumps({'debts': [], 'monthly_budget': 0}), headers=headers)
            response = connection.getresponse()
            self.assertEqual(response.status, 200)
            self.assertEqual(json.loads(response.read())[0]['status'], 'paid_off')
            connection.request('POST', '/calculate', body='{broken', headers=headers)
            response = connection.getresponse()
            self.assertEqual(response.status, 400)
            self.assertIn('error', json.loads(response.read()))
            headers['Origin'] = 'https://example.com'
            connection.request('POST', '/calculate', body='{}', headers=headers)
            response = connection.getresponse()
            self.assertEqual(response.status, 403)
            response.read()
            connection.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join()
