import unittest
import json
import subprocess
import sys
import tempfile
from pathlib import Path
from decimal import Decimal as D

from payoff import Debt, calculate, number, parse_debts


class PayoffTests(unittest.TestCase):
    def test_future_extra_can_rescue_nonreducing_plan(self):
        debt = Debt('Card', D('1000'), D('24'), D('20'))
        result = calculate([debt], D('20'), 'avalanche', lump_sums={2: D('1000')})
        self.assertEqual(result.status, 'paid_off')
        self.assertEqual(result.months, 2)
        self.assertEqual(result.interest, D('40'))

    def test_known_interest_and_last_payment(self):
        result = calculate([Debt('Card', D('100'), D('12'), D('10'))], D('60'), 'avalanche')
        self.assertEqual(result.months, 2)
        self.assertEqual(result.interest, D('1.41'))
        self.assertEqual(result.paid, D('101.41'))
        self.assertEqual(result.schedule[-1].payment, D('41.41'))

    def test_lump_sum_added_once(self):
        debts = [Debt('A', D('100'), D('0'), D('10'))]
        result = calculate(debts, D('20'), 'avalanche', lump_sums={2: D('50')})
        self.assertEqual([p.payment for p in result.schedule], [D('20'), D('70'), D('10')])
        self.assertEqual(result.months, 3)
        self.assertEqual(calculate(debts, D('20'), 'avalanche', lump_sums={}).months, 5)
        with self.assertRaises(ValueError):
            calculate(debts, D('20'), 'avalanche', lump_sums={1: D('-1')})

    def test_zero_interest_and_rollover(self):
        debts = [Debt('A', D('25'), D('0'), D('10')), Debt('B', D('100'), D('0'), D('10'))]
        result = calculate(debts, D('60'), 'custom')
        self.assertEqual([p.payment for p in result.schedule[:2]], [D('25'), D('35')])
        self.assertEqual(result.months, 3)
        self.assertEqual(result.paid, D('125'))

    def test_strategy_priority_and_conservation(self):
        debts = [Debt('Small', D('100'), D('0'), D('10')), Debt('Expensive', D('1000'), D('24'), D('30'))]
        avalanche = calculate(debts, D('150'), 'avalanche')
        snowball = calculate(debts, D('150'), 'snowball')
        self.assertEqual(avalanche.schedule[0].payment, D('10'))
        self.assertEqual(snowball.schedule[0].payment, D('100'))
        self.assertLess(avalanche.interest, snowball.interest)
        for result in (avalanche, snowball):
            self.assertEqual(result.paid, D('1100') + result.interest)
            for month in range(1, result.months + 1):
                self.assertLessEqual(sum(p.payment for p in result.schedule if p.month == month), D('150'))

    def test_unaffordable_and_nonreducing(self):
        debt = Debt('A', D('1000'), D('24'), D('10'))
        self.assertEqual(calculate([debt], D('9'), 'custom').status, 'insufficient_budget')
        self.assertEqual(calculate([debt], D('20'), 'custom').status, 'not_reducing')
        self.assertEqual(calculate([debt], D('21'), 'custom', 1).status, 'limit_reached')

    def test_empty_and_paid_accounts(self):
        self.assertEqual(calculate([], D('0'), 'custom').months, 0)
        debt = Debt('A', D('0'), D('20'), D('0'))
        self.assertEqual(calculate([debt], D('0'), 'custom').status, 'paid_off')

    def test_ties_follow_input_order(self):
        debts = [Debt(name, D('100'), D('0'), D('10')) for name in ['Z', 'A']]
        for strategy in ['avalanche', 'snowball', 'custom']:
            self.assertEqual(calculate(debts, D('50'), strategy).schedule[0].payment, D('40'))

    def test_invalid_records_reported_individually(self):
        records = [None, {'name': 'Bad', 'balance': None},
                   {'name': 'Good', 'balance': '10', 'apr': '0', 'minimum': '1'},
                   {'name': 'good', 'balance': '10', 'apr': '0', 'minimum': '1'}]
        valid, errors = parse_debts(records)
        self.assertEqual(len(valid), 1)
        self.assertEqual(len(errors), 3)

    def test_invalid_numbers(self):
        for value in [None, True, '', 'NaN', 'Infinity', '-1', '1.001']:
            with self.subTest(value=value), self.assertRaises(ValueError):
                number(value, 'amount')

    def test_cli_json_and_malformed_input(self):
        script = Path(__file__).with_name('payoff.py')
        with tempfile.TemporaryDirectory(dir=script.parent) as folder:
            source = Path(folder) / 'input.json'
            source.write_text('{broken', encoding='utf-8')
            bad = subprocess.run([sys.executable, str(script), str(source)], capture_output=True, text=True)
            self.assertEqual(bad.returncode, 2)
            self.assertIn('Error:', bad.stderr)
            self.assertNotIn('Traceback', bad.stderr)
            source.write_text(json.dumps({'monthly_budget': '10', 'debts': []}), encoding='utf-8')
            good = subprocess.run([sys.executable, str(script), str(source), '--json'], capture_output=True, text=True)
            self.assertEqual(good.returncode, 0)
            self.assertEqual(json.loads(good.stdout)[0]['remaining'], '0.00')


if __name__ == '__main__':
    unittest.main()
