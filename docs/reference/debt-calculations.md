# Debt calculation reference

Input is a JSON object with `monthly_budget` and a `debts` array. Each debt needs a unique `name`, `balance`, `apr` (annual percentage, e.g. 20.99), and `minimum` monthly payment. Numbers and numeric strings are accepted. Amounts must be non-negative with at most two decimal places. APR must be between 0 and 100. Positive balances require positive minimums. Missing, null, non-finite, or invalid values are rejected, with errors listed per record; no incomplete portfolio is simulated. An empty debt list is already paid off.

The budget includes all minimum payments plus any extra. `all` (default) compares avalanche, snowball, and custom order. Custom order follows file order; equal priorities also follow file order. Snowball prioritizes the smallest opening balance each month, while avalanche prioritizes the highest APR. Minimums are paid first, then extra money follows the selected priority. Freed payments roll into the same constant budget, including within the payoff month. Payments never exceed the amount owed.

## Estimate assumptions and limitations

- CAD only. Interest is APR divided by 12, applied to opening balances before end-of-month payments, rounded per debt to cents using half-up rounding.
- Fixed rates, fixed minimum amounts capped by the amount owed, no fees or new borrowing. These are simplified estimates, not lender statement reproductions or mortgage amortization calculations.
- Command-line results show months from the first simulated payment cycle, not calendar dates.
- JSON output includes each monthly payment, interest charge, and closing balance; decimal values are strings to preserve cents.
- An insufficient budget stops before an unpaid month. A plan that cannot reduce any debt principal is flagged. Other unfinished plans stop after 1,200 months, without claiming repayment.
- Exit codes: 0 for fully paid-off plans, 1 for unaffordable/non-reducing/unfinished plans, and 2 for invalid input or file errors.
- The dashboard adds one-time extra payments (`extra_payments`: `[{month, amount}]` by plan month) and calendar dates; the command line does not read them yet.
- Rate changes and imports remain future work.


[Run the command-line calculator](../how-to/run-and-check.md#command-line-calculator).
