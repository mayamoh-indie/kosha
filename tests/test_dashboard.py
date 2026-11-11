import base64
import hashlib
import json
import re
import threading
import unittest
from http.client import HTTPConnection
from http.server import ThreadingHTTPServer

from app.api import compare
from app.dashboard import ROOT, THEME_HASH, Handler


class DashboardTests(unittest.TestCase):
    def test_every_page_lists_navigation_in_the_same_order(self):
        expected = None
        for page in sorted((ROOT / 'web').glob('*.html')):
            html = page.read_text(encoding='utf-8')
            menu = re.search(r'<aside class="sidebar">.*?</aside>', html).group(0)
            sidebar = re.findall(r'<a [^>]*href="([^"]+)"', menu)[1:]  # skip the brand link
            expected = expected or sidebar
            self.assertEqual(sidebar, expected, page.name)
            self.assertIn('<script src="menu.js" defer></script>', html, page.name)  # the phone menu button
        self.assertEqual(expected[0], './')

    def test_debt_pages_link_to_each_other_in_the_same_order(self):
        pages = {}
        for page in sorted((ROOT / 'web').glob('*.html')):
            section = re.search(r'<nav class="subnav".*?</nav>', page.read_text(encoding='utf-8'))
            if section:
                pages[page.name] = re.findall(r'<a href="([^"]+)"( aria-current="page")?', section.group(0))
        order = [href for href, _ in pages['debts.html']]
        self.assertEqual(sorted(order), sorted(pages))  # every debt page is linked, and only those
        for name, links in pages.items():
            self.assertEqual([href for href, _ in links], order, name)
            self.assertEqual([href for href, current in links if current], [name])

    def test_every_page_applies_the_theme_before_it_paints(self):
        for page in sorted((ROOT / 'web').glob('*.html')):
            head = page.read_text(encoding='utf-8').split('</head>')[0]
            self.assertIn('<script src="theme.js" defer></script>', head, page.name)
            bootstrap = re.search(r'<script>(.*?)</script>', head, flags=re.IGNORECASE | re.DOTALL).group(1)
            digest = base64.b64encode(hashlib.sha256(bootstrap.encode()).digest()).decode()
            self.assertEqual(f'sha256-{digest}', THEME_HASH, page.name)
            self.assertLess(head.index('<script>'), head.index('href="style.css"'), page.name)

    def test_every_page_has_its_own_search_description(self):
        descriptions = {}
        for page in [ROOT / 'index.html', *sorted((ROOT / 'web').glob('*.html'))]:
            head = page.read_text(encoding='utf-8').split('</head>')[0]
            match = re.search(r'<meta name="description" content="([^"]{20,160})">', head)
            self.assertIsNotNone(match, page.name)
            descriptions[page] = match.group(1)
        self.assertEqual(len(set(descriptions.values())), len(descriptions))  # no copied descriptions

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
            self.assertIn(THEME_HASH, response.getheader('Content-Security-Policy'))
            self.assertNotIn("'unsafe-inline'", response.getheader('Content-Security-Policy'))
            self.assertIn(b'entry-form', response.read())
            pages = [('/data/sample-debts.json', b'monthly_budget'),
                     ('/planner.html', b'A clearer path'), ('/debts.html', b'Payoff progress'),
                     ('/debt-list.html', b'debt-list'), ('/strategy.html', b'priorities'),
                     ('/finance.js', b'loadFinance'), ('/finance-data.js', b'financeTotals'),
                     ('/savings.html', b'savings-form'), ('/savings-data.js', b'projectSavings'),
                     ('/savings.js', b'renderSavings'), ('/growth.html', b'growth-form'), ('/growth-data.js', b'projectGrowth'),
                     ('/whatif-data.js', b'whatIfBudget'), ('/strategy.js', b'runWhatIf'), ('/theme.js', b'kosha-theme'),
                     ('/menu.js', b'menu-open'),
                     ('/plan.html', b'steps'), ('/track.html', b'upcoming'), ('/store.js', b'kosha-plan'),
                     ('/expenses.html', b'expense-form'), ('/expense-data.js', b'kosha-expenses'),
                     ('/expenses.js', b'makeExpense'),
                     ('/salary.html', b'salary-form'), ('/rrsp.html', b'rrsp-form'), ('/api.js', b'engine-worker.js'),
                     ('/engine-worker.js', b'pyodide')]
            for path, marker in pages:
                connection.request('GET', path, headers=headers)
                response = connection.getresponse()
                self.assertEqual(response.status, 200)
                self.assertIn(marker, response.read())
            for path in ['/../README.md', '/web/../api.py', '/dashboard.py', '/%2e%2e/api.py',
                         '/app/dashboard.py', '/app/api.py', '/data/../app/api.py']:
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
