import unittest
from decimal import Decimal as D

from tax_tools import FEDERAL, health_premium, progressive, salary_estimate, withdrawal_estimate


class TaxTests(unittest.TestCase):
    def test_withholding_boundaries(self):
        for amount, rate in [('0', '10'), ('5000', '10'), ('5000.01', '20'),
                             ('15000', '20'), ('15000.01', '30')]:
            with self.subTest(amount=amount):
                result = withdrawal_estimate(amount, 'gross')
                self.assertEqual(result.rate_percent, D(rate))
                self.assertEqual(result.gross, result.net + result.withheld)

    def test_target_net_chooses_smallest_valid_gross(self):
        self.assertEqual(withdrawal_estimate('9000', 'net').gross, D('11250'))
        for target in ['0', '.01', '4499.99', '4500', '4500.01', '12000', '12000.01', '100000']:
            with self.subTest(target=target):
                result = withdrawal_estimate(target, 'net')
                self.assertGreaterEqual(result.net, D(target))
                if result.gross:
                    self.assertLess(withdrawal_estimate(result.gross - D('.01'), 'gross').net, D(target))
        self.assertEqual(withdrawal_estimate('4500', 'net').gross, D('5000'))

    def test_cpp_ei_maxima(self):
        result = salary_estimate('85000')
        self.assertEqual(result.cpp, D('4230.45'))
        self.assertEqual(result.cpp2, D('416'))
        self.assertEqual(result.ei, D('1123.07'))
        self.assertEqual(result.taxable_income, D('83873'))
        self.assertEqual(salary_estimate('3500').cpp, 0)
        self.assertEqual(salary_estimate('74600').cpp2, 0)

    def test_federal_bracket_and_health_thresholds(self):
        self.assertEqual(progressive(D('58523'), FEDERAL), D('8193.22'))
        self.assertEqual(progressive(D('58524'), FEDERAL), D('8193.425'))
        for income, expected in [('20000','0'), ('25000','300'), ('38500','450'),
                                 ('48600','600'), ('72600','750'), ('200600','900')]:
            self.assertEqual(health_premium(D(income)), D(expected))

    def test_zero_and_reconciliation(self):
        self.assertEqual(salary_estimate('0').annual_net, 0)
        for salary in ['10000', '30000', '75000', '200000', '300000']:
            result = salary_estimate(salary)
            self.assertEqual(result.gross, result.annual_net + result.federal_tax + result.ontario_tax
                             + result.health_premium + result.cpp + result.cpp2 + result.ei)
            self.assertGreaterEqual(result.annual_net, 0)

    def test_hand_calculated_75000(self):
        # Taxable 74,273 after enhanced CPP 727. Base CPP/EI credits
        # 3,519.45 + 1,123.07. Federal bracket tax 11,421.97 less
        # credits 3,163.3728. Ontario tax 4,586.4555 less 890.39176.
        result = salary_estimate('75000')
        self.assertEqual(result.federal_tax, D('8258.60'))
        self.assertEqual(result.ontario_tax, D('3696.06'))
        self.assertEqual(result.annual_net, D('56925.82'))

    def test_invalid_values(self):
        for amount in [None, True, '-1', 'NaN', '1.001', '10000001']:
            with self.subTest(amount=amount), self.assertRaises(ValueError):
                salary_estimate(amount)
            with self.subTest(amount=amount), self.assertRaises(ValueError):
                withdrawal_estimate(amount, 'gross')
        with self.assertRaises(ValueError):
            withdrawal_estimate('10', 'invalid')
