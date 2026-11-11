"""Ontario 2026 annualized payroll estimates and ordinary RRSP withholding.

Source links and exclusions are recorded in docs/reference/tax-assumptions.md.
"""

from dataclasses import dataclass
from decimal import Decimal, ROUND_CEILING, ROUND_HALF_UP
from typing import Union

from .payoff import CENT, ZERO, number

D = Decimal
FEDERAL = [(D('58523'), D('.14')), (D('117045'), D('.205')),
           (D('181440'), D('.26')), (D('258482'), D('.29')), (D('Infinity'), D('.33'))]
ONTARIO = [(D('53891'), D('.0505')), (D('107785'), D('.0915')),
           (D('150000'), D('.1116')), (D('220000'), D('.1216')), (D('Infinity'), D('.1316'))]


def cents(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def progressive(income: Decimal, brackets: list[tuple[Decimal, Decimal]]) -> Decimal:
    tax, floor = ZERO, ZERO
    for ceiling, rate in brackets:
        tax += max(ZERO, min(income, ceiling) - floor) * rate
        floor = ceiling
        if income <= ceiling:
            break
    return tax


def health_premium(income: Decimal) -> Decimal:
    if income <= 20000:
        return ZERO
    for ceiling, floor, base, rate, maximum in [
        (36000, 20000, 0, '.06', 300), (48000, 36000, 300, '.06', 450),
        (72000, 48000, 450, '.25', 600), (200000, 72000, 600, '.25', 750),
        (D('Infinity'), 200000, 750, '.25', 900),
    ]:
        if income <= ceiling:
            return min(D(maximum), D(base) + (income - floor) * D(rate))
    return ZERO


@dataclass(frozen=True)
class SalaryEstimate:
    gross: Decimal
    taxable_income: Decimal
    federal_tax: Decimal
    ontario_tax: Decimal
    health_premium: Decimal
    cpp: Decimal
    cpp2: Decimal
    ei: Decimal
    annual_net: Decimal
    monthly_net: Decimal
    biweekly_net: Decimal
    weekly_net: Decimal


def salary_estimate(gross: object) -> SalaryEstimate:
    salary = number(gross, 'Annual gross salary')
    if salary > 10000000:
        raise ValueError('Salary must not exceed CAD 10 million.')
    contributory = max(ZERO, min(salary, D('74600')) - D('3500'))
    base_cpp = cents(contributory * D('.0495'))
    enhanced_cpp = cents(contributory * D('.01'))
    cpp2 = cents(max(ZERO, min(salary, D('85000')) - D('74600')) * D('.04'))
    cpp = base_cpp + enhanced_cpp
    ei = cents(min(salary, D('68900')) * D('.0163'))
    taxable = max(ZERO, salary - enhanced_cpp - cpp2)
    phaseout = min(D(1), max(ZERO, (taxable - D('181440')) / D('77042')))
    bpa = D('16452') - D('1623') * phaseout
    federal = cents(max(ZERO, progressive(taxable, FEDERAL) - D('.14') * (
        bpa + base_cpp + ei + min(salary, D('1501')))))
    provincial = max(ZERO, progressive(taxable, ONTARIO) - D('.0505') * (D('12989') + base_cpp + ei))
    surtax = max(ZERO, provincial - D('5818')) * D('.20') + max(ZERO, provincial - D('7446')) * D('.36')
    provincial += surtax
    reduction = min(provincial, max(ZERO, D('600') - provincial))
    provincial = cents(provincial - reduction)
    health = cents(health_premium(taxable))
    net = salary - federal - provincial - health - cpp - cpp2 - ei
    return SalaryEstimate(salary, taxable, federal, provincial, health, cpp, cpp2, ei,
                          net, cents(net / 12), cents(net / 26), cents(net / 52))


@dataclass(frozen=True)
class WithdrawalEstimate:
    gross: Decimal
    rate_percent: Decimal
    withheld: Decimal
    net: Decimal
    mode: str


def withdrawal_estimate(amount: object, mode: str) -> WithdrawalEstimate:
    value = number(amount, 'Withdrawal amount')
    if value > 10000000:
        raise ValueError('Withdrawal amount must not exceed CAD 10 million.')
    if mode not in ('gross', 'net'):
        raise ValueError('Choose gross or net mode.')
    gross = value
    if mode == 'net':
        # Net proceeds drop at withholding thresholds. Solve each tier separately,
        # then choose the smallest valid gross that meets the target.
        candidates: list[Decimal] = []
        for lower, upper, rate in [(ZERO, D('5000'), D('.10')),
                                   (D('5000.01'), D('15000'), D('.20')),
                                   (D('15000.01'), D('Infinity'), D('.30'))]:
            candidate = max(lower, (value / (1 - rate)).quantize(CENT, rounding=ROUND_CEILING))
            # Half-up withholding can make one cent less sufficient.
            if candidate - CENT >= lower and candidate - CENT - cents((candidate - CENT) * rate) >= value:
                candidate -= CENT
            if candidate <= upper and candidate - cents(candidate * rate) >= value:
                candidates.append(candidate)
        gross = min(candidates)
    rate = D('.10') if gross <= 5000 else D('.20') if gross <= 15000 else D('.30')
    withheld = cents(gross * rate)
    return WithdrawalEstimate(gross, rate * 100, withheld, gross - withheld, mode)


def tax_request(payload: object, tool: str) -> Union[SalaryEstimate, WithdrawalEstimate]:
    if not isinstance(payload, dict):
        raise ValueError('Expected a JSON object.')
    if tool == 'salary':
        return salary_estimate(payload.get('salary'))
    if tool != 'rrsp':
        raise ValueError('Unknown calculator.')
    mode = payload.get('mode')
    if not isinstance(mode, str):
        raise ValueError('Choose gross or net mode.')
    return withdrawal_estimate(payload.get('amount'), mode)
