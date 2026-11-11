# Explore savings and investment growth

Open **Savings growth** in Kosha. This is a general scenario calculator, alongside the separate **RRSP growth** tool. It does not change saved accounts, debts or savings goals.

1. Enter your starting balance and the amount you will deposit **each contribution period**.
2. Choose weekly, every two weeks, monthly, quarterly or annual deposits. Every two weeks means 26 deposits per year; it is not twice a month.
3. Choose beginning or end of period. A beginning deposit has one more period of growth than the same end deposit.
4. Enter whole years, a nominal annual return and a compounding frequency. Use your own assumptions; rates are not predictions or recommended investments.
5. Optionally enter annual fees, a tax-drag assumption and inflation. Enable annual contribution increases if future deposits should rise with inflation.
6. Choose **Calculate my growth**. Editing inputs clears the previous result until you calculate again.

Results show the projected balance, starting balance, additional deposits, total invested, growth after assumed fees and tax drag, and the final balance in today's dollars. The chart compares total invested with projected balance. The annual table also shows inflation-adjusted balances. Zero years returns the starting balance with no new deposits.

## Check an example

Start with CAD 1,000, contribute CAD 100 annually at the **end** of each year, grow for two years at 10% nominal return with **annual** compounding, and set fees, tax and inflation to zero. The first year ends at CAD 1,200; the second ends at **CAD 1,420**. Beginning-of-year contributions instead produce **CAD 1,441**.

## Understand the assumptions

The model subtracts the fee assumption from nominal annual return, then reduces a positive result by the tax percentage. It gives no tax credit for losses. For example, 10% return, 2% fees and 25% tax produce a 6% net nominal rate. This shortcut is not a Canadian income-tax, capital-gains, dividend or withdrawal-tax calculation.

With `m` compounding periods and `p` contribution periods per year, growth per contribution period is `(1 + net annual rate / m) ** (m / p) - 1`. Rates in this formula are decimals, such as `0.06` for 6%. Periods are equally spaced; they are not actual payment dates or an institution's interest-crediting schedule.

If enabled, the deposit amount increases once per year starting in year two, rounded to cents. The inflation-adjusted balance divides nominal balance by `(1 + inflation) ** years`. Calculations retain precision until display, so rounded table cells may not add exactly. No contribution-room checks are performed for RRSPs, TFSAs or FHSAs. Scenarios are not saved.

## References

The requested [Fidelity investment growth calculator](https://www.fidelity.ca/en/growthcalculator/) offers contribution-frequency, inflation and tax inputs. The [Dynamic savings calculator](https://dynamic.ca/en/insights-and-tools/tools/calculators/savings.html) offers contribution and compounding frequencies and describes beginning-of-period deposits. Kosha has its own implementation and the explicit model above; it does not reproduce either provider's results or branding.

[Back to features](../../README.md)
