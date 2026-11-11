# Project notes

The [README](../../README.md) lists current features. The scope and phases below describe product direction, not a promise that every feature exists.

## Product direction (includes unimplemented work)

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
