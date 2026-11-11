# Kosha

Your financial assistant for money clarity, budgeting and debt payoff. Built for Canada, starting with Ontario, in CAD and English.

**[Open Kosha](https://mayamoh-indie.github.io/kosha_wellness/)** · [Start your debt plan](docs/how-to/start-debt-plan.md) · [Plan a yearly bill](docs/how-to/plan-bills.md)

## What you can do

| Feature | How it helps |
| --- | --- |
| **Debt overview** | See balances, APRs, minimum payments, categories and payoff progress in one place. Search and sort debts, with charts by debt or category. |
| **Payoff strategy comparison** | Compare highest-interest-first, smallest-balance-first and your entered order using the same total monthly payment. Explore payoff time, estimated interest and a downloadable CSV payment schedule. |
| **Spending what-if** | Preview how spending less or more each month changes your debt-free date and interest. Apply the preview as your debt budget when ready. |
| **Extra payments and payoff steps** | Add one-time extra payments, choose a monthly payment day and follow a plan that rolls freed payments into remaining debts. |
| **Payment tracking** | View past-due and upcoming debt payments in a calendar and mark them paid. Update balances separately from statements. |
| **Expenses and budgets** | Log expenses by date and category, compare monthly spending and see category budgets against logged expenses. |
| **Home (money overview)** | Record asset accounts, received income and savings goals; view accessible cash and net worth from entered balances. |
| **Yearly and irregular bills** | Earmark money, see a monthly reserve and progress, and flag bills due within 30 days. Confirm payment to start the next yearly cycle. |
| **RRSP growth** | Explore contributions, assumed returns, fees and inflation with a chart and annual table. An optional room check covers the first 12 months or a shorter scenario. |
| **Ontario salary estimate** | Estimate annualized 2026 take-home pay, with income tax, CPP and EI broken out. |
| **RRSP withdrawal estimate** | See withholding and net proceeds, or estimate the smallest gross withdrawal for a target net amount. |

A mobile slide-out menu and light/dark themes are available across the app.

## Your data and the estimates

Kosha is a working prototype with manual entry and fictional sample debts. Saved plans, payments, money-overview entries and expenses stay in this browser's local storage. There is no sign-in, bank connection or cross-device sync. Clearing browser data can remove saved entries. Salary, withdrawal and growth scenarios are not saved.

Forecasts and recorded activity are separate: marking a payment does not update debt balances; earmarked savings do not add assets; paying a planned bill does not log an expense. Net worth needs a saved debt plan; without one, debt is unknown. Bill recurrence currently advances one year per confirmed payment.

All figures are estimates. Debt projections assume fixed rates and minimums, with no new borrowing or fees. RRSP withholding is an advance payment, not final income tax. See the [debt calculation rules](docs/reference/debt-calculations.md) and [Ontario tax assumptions and sources](docs/reference/tax-assumptions.md).

## Guides and project information

- [Start a debt plan and explore a spending change](docs/how-to/start-debt-plan.md)
- [Plan a yearly bill using savings goals](docs/how-to/plan-bills.md)
- [Run locally, use the command line, and run checks](docs/how-to/run-and-check.md)
- [Project folders](docs/how-to/run-and-check.md#folder-map)
- [Product direction, build principles and design references](docs/reference/project-notes.md)

Imports, bank connections, a conversational assistant and household planning remain future work.
