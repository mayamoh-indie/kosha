"""Request handling shared by the local server and the in-browser (Pyodide) build."""

import json
from dataclasses import asdict
from decimal import Decimal

from .payoff import Result, calculate, number, parse_debts
from .tax_tools import tax_request


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
    lumps = lump_sums(payload.get('extra_payments', []))
    return [calculate(debts, budget, strategy, lump_sums=lumps)
            for strategy in ('avalanche', 'snowball', 'custom')]


def lump_sums(records: object) -> dict[int, Decimal]:
    """One-time extra payments as [{month, amount}]; amounts in the same month add up."""
    if not isinstance(records, list) or len(records) > 120:
        raise ValueError('Provide at most 120 one-time extra payments.')
    totals: dict[int, Decimal] = {}
    for record in records:
        month = record.get('month') if isinstance(record, dict) else None
        if isinstance(month, bool) or not isinstance(month, int) or not 1 <= month <= 1200:
            raise ValueError('Each extra payment needs a plan month from 1 to 1200.')
        totals[month] = totals.get(month, Decimal(0)) + number(record.get('amount'), 'Extra payment')
    return totals


def respond(path: str, body: str) -> tuple[int, str]:
    """Answer /calculate, /salary, or /rrsp with a status code and JSON text."""
    try:
        payload: object = json.loads(body, parse_float=Decimal)
        output = ([asdict(result) for result in compare(payload)] if path == '/calculate'
                  else asdict(tax_request(payload, path[1:])))
    except ValueError as exc:
        return 400, json.dumps({'error': str(exc)})
    return 200, json.dumps(output, default=str)
