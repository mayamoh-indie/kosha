"""Request handling shared by the local server and the in-browser (Pyodide) build."""

import json
from dataclasses import asdict
from decimal import Decimal

from payoff import Result, calculate, number, parse_debts
from tax_tools import tax_request


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


def respond(path: str, body: str) -> tuple[int, str]:
    """Answer /calculate, /salary, or /rrsp with a status code and JSON text."""
    try:
        payload: object = json.loads(body, parse_float=Decimal)
        output = ([asdict(result) for result in compare(payload)] if path == '/calculate'
                  else asdict(tax_request(payload, path[1:])))
    except ValueError as exc:
        return 400, json.dumps({'error': str(exc)})
    return 200, json.dumps(output, default=str)
