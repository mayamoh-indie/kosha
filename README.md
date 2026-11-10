# Kosha

Your Financial Assistant. Canadian personal finance tools for money clarity, budgeting, and debt payoff. Ontario-first, CAD, English.

## Status

First working baseline: a dependency-free Python debt-payoff calculator. The app interface and wider technology choices remain open.

## Run the calculator

Requires Python 3.9 or newer. All sample data is fictional.

```sh
python payoff.py sample-debts.json
python payoff.py sample-debts.json --budget 800 --strategy avalanche
python payoff.py sample-debts.json --json
python -m unittest -v
```

Input is a JSON object with `monthly_budget` and a `debts` array. Each debt needs a unique `name`, `balance`, `apr` (annual percentage, e.g. 20.99), and `minimum` monthly payment. Numbers and numeric strings are accepted. Amounts must be non-negative with at most two decimal places. APR must be between 0 and 100. Positive balances require positive minimums. Missing, null, non-finite, or invalid values are rejected, with errors listed per record; no incomplete portfolio is simulated. An empty debt list is already paid off.

The budget includes all minimum payments plus any extra. `all` (default) compares avalanche, snowball, and custom order. Custom order follows file order; equal priorities also follow file order. Snowball prioritizes the smallest opening balance each month, while avalanche prioritizes the highest APR. Minimums are paid first, then extra money follows the selected priority. Freed payments roll into the same constant budget, including within the payoff month. Payments never exceed the amount owed.

### Estimate assumptions and limitations

- CAD only. Interest is APR divided by 12, applied to opening balances before end-of-month payments, rounded per debt to cents using half-up rounding.
- Fixed rates, fixed minimum amounts capped by the amount owed, no fees or new borrowing. These are simplified estimates, not lender statement reproductions or mortgage amortization calculations.
- Results show months from the first simulated payment cycle, not a calendar payoff date. There is no start-date input yet.
- JSON output includes each monthly payment, interest charge, and closing balance; decimal values are strings to preserve cents.
- An insufficient budget stops before an unpaid month. A plan that cannot reduce any debt principal is flagged. Other unfinished plans stop after 1,200 months, without claiming repayment.
- Exit codes: 0 for fully paid-off plans, 1 for unaffordable/non-reducing/unfinished plans, and 2 for invalid input or file errors.
- One-time payments, rate changes, calendar schedules, imports, and the interface remain future work. The next improvement is an editable dashboard around this tested calculation engine.

## Initial scope

- Track accounts, income, expenses, categories, and transfers.
- Plan budgets, savings goals, bills, and reminders.
- Track debt balances, interest rates, minimum payments, and due dates.
- Compare highest-interest-first, smallest-balance-first, and custom payoff orders using the same total payment budget.
- Model recurring extra payments, one-time payments, and payment rollover.
- Show cash, debt, net worth, and money available after commitments.
- Start with manual entry and reviewable CSV imports and exports.

## First milestone

Build a standalone debt-payoff calculator with sample data, documented assumptions, and focused tests. Show estimated payoff time and interest; flag payments that cannot reduce debt. Then connect it to an editable accounts and bills prototype.

## Build principles

Build useful standalone tools before adding a conversational assistant. Keep calculations deterministic and inspectable. Document interest, timing, rounding, and tie-breaking rules. Treat missing values as unknown. Avoid double-counting transfers and credit-card repayments. Separate forecasts from recorded activity. Report invalid import rows individually.

Use synthetic data for prototypes. Secure accounts and storage are required before handling customer data. Never commit credentials or customer financial records.

## Later phases

Conversational assistant, Canadian bank connections, investment balance tracking (TFSA, RRSP, FHSA), savings calculators, education, life-event checklists, household planning, and advisor booking. Personalized investment recommendations are outside the initial scope.

## Design direction

Calm, mobile-first, and readable. Deep teal #0F3440, mid teal #1A4F61, teal mist #E8F4F7, white, and accent #A8D5E2. Red is reserved for alerts.

## References

- [Toshl](https://toshl.com/) for accounts, budgeting, and money flows.
- [Debt Payoff Planner](https://www.debtpayoffplanner.com/) for repayment scenarios and progress.
- User-supplied Kosha App Brief for Developers.

Build an original Kosha experience; reference branding, code, and assets are not included.
