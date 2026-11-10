# Ontario salary and RRSP estimates

Verified November 10, 2026. This prototype is limited to Ontario and CAD.

## Salary

2026 annualized payroll estimate for a full-year employee aged 18–64, one employer, all salary pensionable and insurable, basic personal credits only. Federal and Ontario progressive brackets are applied without rounding the bracket constants. Base CPP and EI receive non-refundable credits; enhanced CPP and CPP2 reduce taxable income. The federal basic personal amount phases down between the fourth and fifth federal bracket thresholds. Ontario surtax, basic tax reduction, and health premium are included. Monetary totals use half-up rounding to cents.

Monthly, biweekly, and weekly figures divide annual net by 12, 26, and 52. They are averages, not exact paycheques. RRSP deductions, pension contributions, other income, taxable benefits, dependants, and filing-time credits such as LIFT are excluded. This is not a complete annual tax-return calculator; eligible credits could reduce final tax. No contribution-room or tax-advice recommendations are made.

Sources:
- [CRA 2026 Ontario payroll tables](https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4032-payroll-deductions-tables/t4032on-jan/t4032on-january-general-information.html)
- [CRA July 2026 payroll update](https://www.canada.ca/en/revenue-agency/services/forms-publications/payroll/t4127-payroll-deductions-formulas/t4127-jul/t4127-jul-payroll-deductions-formulas.html) reports no Ontario changes.
- [Ontario LIFT eligibility and calculation](https://www.ontario.ca/page/low-income-workers-tax-credit), excluded from this payroll estimate.

## RRSP withdrawal

Ordinary taxable withdrawals for Ontario residents. Apply the relevant withholding percentage to the whole gross withdrawal. Gross-to-net deducts withholding, rounded half-up to cents. Net-to-gross solves each tier separately, choosing the smallest gross amount in cents producing at least the target. This avoids assuming proceeds increase monotonically across withholding thresholds.

No institution fees, Quebec/non-resident rules, spousal attribution, RRIF minimums, HBP, or LLP. Final income tax is not calculated. Instalments from one request may be combined by the institution for withholding.

Sources:
- [CRA withholding rates](https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/rrsps-related-plans/making-withdrawals/tax-rates-on-withdrawals.html)
- [CRA RRSP/RRIF frequently asked questions](https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/registered-retirement-savings-plans-registered-retirement-income-funds-rrsps-rrifs/registered-retirement-savings-plans-registered-retirement-income-funds-rrsps-rrifs.html)

Experience references: [Salary After Tax](https://salaryaftertax.com/ca/salary-calculator) and [RRSP withholding calculator](https://rrspwhtaxcalc.lovable.app/). Tax rules come from government sources, not these reference applications.
