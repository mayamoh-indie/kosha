import json
import threading
import unittest
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer

from dashboard import Handler, compare


class DashboardTests(unittest.TestCase):
    def test_comparison_uses_existing_engine(self):
        results = compare({'debts': [{'name': 'Card', 'balance': '100', 'apr': '12', 'minimum': '10'}], 'monthly_budget': '60'})
        self.assertEqual(len(results), 3)
        self.assertTrue(all(str(result.interest) == '1.41' for result in results))

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
            self.assertIn(b'A clearer path', response.read())
            for path, form in [('/salary', b'salary-form'), ('/rrsp', b'rrsp-form')]:
                connection.request('GET', path, headers=headers)
                response = connection.getresponse()
                self.assertEqual(response.status, 200)
                self.assertIn(form, response.read())
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
