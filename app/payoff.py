"""Deterministic monthly debt-payoff estimates. All amounts are CAD."""

import argparse
import json
from dataclasses import asdict, dataclass
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from pathlib import Path
from typing import Optional

CENT = Decimal('0.01')
ZERO = Decimal('0.00')


@dataclass(frozen=True)
class Debt:
    name: str
    balance: Decimal
    apr: Decimal
    minimum: Decimal


@dataclass(frozen=True)
class Payment:
    month: int
    debt: str
    interest: Decimal
    payment: Decimal
    balance: Decimal


@dataclass(frozen=True)
class Result:
    strategy: str
    status: str
    months: int
    interest: Decimal
    paid: Decimal
    remaining: Decimal
    schedule: list[Payment]
    message: str


def number(value: object, label: str, money: bool = True) -> Decimal:
    if isinstance(value, bool) or not isinstance(value, (str, int, float, Decimal)):
        raise ValueError(f'{label} must be a non-negative number')
    try:
        result = Decimal(str(value).strip())
    except InvalidOperation as exc:
        raise ValueError(f'{label} must be a non-negative number') from exc
    if not result.is_finite() or result < 0 or result > Decimal('1000000000000'):
        raise ValueError(f'{label} must be finite and between 0 and 1 trillion')
    if money and result != result.quantize(CENT):
        raise ValueError(f'{label} must have at most two decimal places')
    return result.quantize(CENT) if money else result


def parse_debts(records: object) -> tuple[list[Debt], list[str]]:
    if not isinstance(records, list):
        raise ValueError('debts must be a JSON array')
    debts: list[Debt] = []
    errors: list[str] = []
    names: set[str] = set()
    for index, record in enumerate(records, 1):
        try:
            if not isinstance(record, dict):
                raise ValueError('expected an object')
            name = record.get('name')
            if not isinstance(name, str) or not name.strip():
                raise ValueError('name is required')
            name = name.strip()
            if name.casefold() in names:
                raise ValueError(f'duplicate name: {name}')
            debt = Debt(name, number(record.get('balance'), 'balance'),
                        number(record.get('apr'), 'apr', False),
                        number(record.get('minimum'), 'minimum'))
            if debt.apr > 100:
                raise ValueError('apr must be between 0 and 100 percent')
            if debt.balance > 0 and debt.minimum == 0:
                raise ValueError('a positive balance requires a positive minimum')
            debts.append(debt)
            names.add(name.casefold())
        except ValueError as exc:
            errors.append(f'Record {index}: {exc}')
    return debts, errors


def calculate(debts: list[Debt], budget: Decimal, strategy: str,
              max_months: int = 1200, lump_sums: Optional[dict[int, Decimal]] = None) -> Result:
    """Custom order follows input order; other ties also follow input order.

    lump_sums maps a plan month to a one-time amount added to that month's budget.
    """
    if strategy not in ('avalanche', 'snowball', 'custom'):
        raise ValueError('unknown strategy')
    budget = number(budget, 'budget')
    if isinstance(max_months, bool) or not isinstance(max_months, int) or max_months < 1:
        raise ValueError('max_months must be a positive integer')
    lump_sums = {month: number(amount, f'extra payment for month {month}')
                 for month, amount in (lump_sums or {}).items()}
    # Validate direct callers as strictly as file input.
    debts, errors = parse_debts([asdict(debt) for debt in debts])
    if errors:
        raise ValueError('; '.join(errors))
    balances = [debt.balance for debt in debts]
    schedule: list[Payment] = []
    interest_total = ZERO
    paid_total = ZERO

    def result(status: str, months: int, message: str) -> Result:
        return Result(strategy, status, months, interest_total, paid_total,
                      sum(balances, ZERO), schedule, message)

    for month in range(1, max_months + 1):
        if not any(balances):
            return result('paid_off', month - 1, 'All debts repaid.')
        previous = sum(balances, ZERO)
        interest = [(balance * debt.apr / Decimal(1200)).quantize(
            CENT, rounding=ROUND_HALF_UP) for balance, debt in zip(balances, debts)]
        owed = [balance + charge for balance, charge in zip(balances, interest)]
        payments = [min(debt.minimum, balance) for debt, balance in zip(debts, owed)]
        if sum(payments, ZERO) > budget:
            return result('insufficient_budget', month - 1,
                          'Monthly budget cannot cover all required payments.')
        extra = budget + lump_sums.get(month, ZERO) - sum(payments, ZERO)
        order = list(range(len(debts)))
        if strategy == 'avalanche':
            order.sort(key=lambda i: -debts[i].apr)
        elif strategy == 'snowball':
            order.sort(key=lambda i: balances[i])
        for i in order:
            allocation = min(extra, owed[i] - payments[i])
            payments[i] += allocation
            extra -= allocation
        balances = [balance - payment for balance, payment in zip(owed, payments)]
        for i, debt in enumerate(debts):
            if owed[i]:
                schedule.append(Payment(month, debt.name, interest[i], payments[i], balances[i]))
        interest_total += sum(interest, ZERO)
        paid_total += sum(payments, ZERO)
        if not any(balances):
            return result('paid_off', month, 'All debts repaid.')
        # A future one-time payment may still make this plan recover.
        if sum(balances, ZERO) >= previous and all(
                payment <= charge for payment, charge in zip(payments, interest)) and not any(
                month < future <= max_months and amount > ZERO for future, amount in lump_sums.items()):
            return result('not_reducing', month, 'Payments do not reduce any debt principal.')
    return result('limit_reached', max_months, 'Not paid off within the simulation limit.')


class Arguments(argparse.Namespace):
    input: Path
    budget: Optional[str]
    strategy: str
    json: bool


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input', type=Path, help='JSON file containing debts and monthly_budget')
    parser.add_argument('--budget', help='Override total monthly payment budget')
    parser.add_argument('--strategy', choices=['all', 'avalanche', 'snowball', 'custom'], default='all')
    parser.add_argument('--json', action='store_true', help='Include full monthly schedules as JSON')
    args = parser.parse_args(namespace=Arguments())
    try:
        data: object = json.loads(args.input.read_text(encoding='utf-8-sig'), parse_float=Decimal)
        if not isinstance(data, dict):
            raise ValueError('input must be a JSON object')
        debts, errors = parse_debts(data.get('debts'))
        if errors:
            # Never present a partial portfolio as a complete payoff estimate.
            raise ValueError('\n'.join(errors))
        budget = number(args.budget if args.budget is not None else data.get('monthly_budget'), 'monthly_budget')
        strategies = ['avalanche', 'snowball', 'custom'] if args.strategy == 'all' else [args.strategy]
        results = [calculate(debts, budget, strategy) for strategy in strategies]
    except (OSError, UnicodeError, ValueError) as exc:
        parser.exit(2, f'Error: {exc}\n')
    if args.json:
        print(json.dumps([asdict(result) for result in results], default=str, indent=2))
    else:
        print(f'Monthly budget: CAD {budget:,.2f} (includes minimums)')
        for result in results:
            duration = f'{result.months} months' if result.status == 'paid_off' else 'payoff unavailable'
            print(f'{result.strategy}: {duration}; interest CAD {result.interest:,.2f}; '
                  f'remaining CAD {result.remaining:,.2f}; {result.status}')
            print(f'  {result.message}')
    return 0 if all(result.status == 'paid_off' for result in results) else 1


if __name__ == '__main__':
    raise SystemExit(main())
