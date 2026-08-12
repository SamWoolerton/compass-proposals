# Compass for Power BI developers

Compass is a semantic layer that compiles to SQL. You declare tables, columns and metrics in TypeScript, and a query arrives as JSON for Compass to compile and run.

There is no in-memory model and no filter context. Most of the differences below follow from that.

Examples use a wholesale model - orders, order lines, customers, products, regions. Listed in full at the end of this document.

## Quick reference

| Power BI                                        | Compass                                            | Notes                                                                        |
| ----------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Measure                                         | Metric in `defineMetrics({ ... })`                 | Four types: `query`, `snapshot`, `modify`, `combine`.                        |
| `SUM`, `AVERAGE`, `MIN`, `MAX`, `DISTINCTCOUNT` | `queryMetric(operation, table, column)`            | Also `median` and `percentile`.                                              |
| `COUNTROWS`                                     | `countMetric(table)`                               |                                                                              |
| `CALCULATE([m], filters)`                       | `modify('m', [filters])`                           | Filters intersect. They do not replace.                                      |
| `DIVIDE(a, b)`                                  | `divide('a', 'b')`                                 |                                                                              |
| Subtract one measure from another               | `combine` with `subtract`                          | Also `add` and `multiply`.                                                   |
| `SWITCH` in a measure                           | None                                               |                                                                              |
| `ALL`, `ALLEXCEPT`, `REMOVEFILTERS`             | None                                               |                                                                              |
| `SAMEPERIODLASTYEAR`, `PREVIOUSMONTH`           | `shift` transform                                  | The query applies it, not the metric.                                        |
| Period-over-period difference                   | `movement` transform                               |                                                                              |
| Running total, `DATESYTD`                       | `cumulative` on a query metric                     |                                                                              |
| `LASTNONBLANK` semi-additive measure            | `type: 'snapshot'` metric                          |                                                                              |
| `TOPN`, `RANKX`                                 | `topN` on the query                                | Includes an "Other" group.                                                   |
| Variables (`VAR`)                               | A TypeScript `const`                               |                                                                              |
| Calculated column                               | `sqlExpression` on a column                        |                                                                              |
| `SWITCH` or `IF` in a calculated column         | `sqlExpression` with a SQL `CASE`                  |                                                                              |
| Renamed column                                  | `sqlName`                                          | The model name stays public. `sqlName` is the physical name.                 |
| Format string                                   | `formatter` on a column or metric                  | Changes the display only.                                                    |
| Currency data type                              | `type: 'number'` and `currencyFormatter(n)`        | Currency is a formatter, not a type.                                         |
| Percentage data type                            | `type: 'number'` and `formatPercentage`            | Store the ratio, not `0` to `100`.                                           |
| Star schema in the model                        | `defineTables({ ... })`                            | Maps onto tables that already exist in your database.                        |
| Relationship (many-to-one)                      | `relationship('parent_table')` column on the child | Always many-to-one and directional.                                          |
| Inactive relationship, `USERELATIONSHIP`        | On the roadmap                                     | Every relationship is currently active.                                      |
| Bidirectional cross-filter                      | None                                               | Filters move from child to parent only.                                      |
| Many-to-many relationship                       | `complexRelationships` entry                       | Partly supported. An antipattern in Power BI too. Ask us before you use one. |
| Ambiguous join paths                            | Rejected                                           | Same as Power BI. Two tables can have one join path only.                    |
| Date table, "mark as date table"                | `primaryDate` on each table                        | There is no calendar table.                                                  |
| Display folders, hierarchies                    | None                                               |                                                                              |
| RLS role with a DAX filter                      | RLS group and user entries                         | Matches a value. It does not evaluate an expression.                         |
| Q&A synonyms                                    | `synonyms` on a column or metric                   | An LLM reads the model, so these change the results.                         |

---

# Metrics

## Aggregations

| Task            | DAX                                  | Compass                                                 |
| --------------- | ------------------------------------ | ------------------------------------------------------- |
| Sum             | `SUM('Order Lines'[line_total])`     | `queryMetric('sum', 'order_lines', 'Line total')`       |
| Count rows      | `COUNTROWS(Orders)`                  | `countMetric('orders')`                                 |
| Distinct count  | `DISTINCTCOUNT(Orders[customer_id])` | `queryMetric('distinctCount', 'orders', 'customer_id')` |
| Average         | `AVERAGE('Order Lines'[line_total])` | `queryMetric('average', 'order_lines', 'Line total')`   |
| Median          | `MEDIAN('Order Lines'[line_total])`  | `queryMetric('median', 'order_lines', 'Line total')`    |
| 95th percentile | `PERCENTILE.INC(..., 0.95)`          | `percentileMetric(0.95, 'order_lines', 'Line total')`   |

```ts
'Total sales': queryMetric('sum', 'order_lines', 'Line total', {
  formatter: currencyFormatter(0),
  synonyms: ['revenue', 'turnover'],
}),
```

## Filtered measure - `CALCULATE`

```dax
Gold Sales = CALCULATE ( [Total Sales], Customers[Tier] = "Gold" )
```

```ts
'Gold sales': modify('Total sales', [eq('customers', 'Tier', dynamic('Gold'))]),
```

> **Trap** - filters intersect, they never replace. Two layers filtering the same column give zero rows, with no error. See _Layering_.

## Ratio - `DIVIDE`

```dax
Gross Margin % = DIVIDE ( [Gross Profit], [Total Sales] )
```

```ts
'Gross margin %': divide('Gross profit', 'Total sales', {
  formatter: formatPercentage,
}),
```

## Difference between measures

```dax
Gross Profit = [Total Sales] - [Total Cost]
```

```ts
'Gross profit': {
  type: 'combine',
  operation: 'subtract',
  left: 'Total sales',
  right: 'Total cost',
  formatter: currencyFormatter(0),
},
```

`add`, `subtract` and `multiply` use `left` and `right`. `divide` uses `numerator` and `denominator`, and the `divide(...)` builder is shorthand for it.

A combine metric can span two fact tables.

> **Trap** - a `combine` metric cannot be a `modify` base. Filter the parts instead, then combine them.

## Running total - `DATESYTD`

```dax
Cumulative Sales =
CALCULATE (
    [Total Sales],
    FILTER ( ALL ( 'Date' ), 'Date'[Date] <= MAX ( 'Date'[Date] ) )
)
```

```ts
'Cumulative sales': {
  type: 'query',
  operation: 'sum',
  table: 'order_lines',
  column: 'Line total',
  cumulative: { dateTable: 'orders', dateColumn: 'Order date' },
  formatter: currencyFormatter(0),
},
```

- The date column can sit on the aggregation table or on a parent.
- Only `sum` and `count` are permitted. `average`, `min`, `max` and `median` throw.
- Periods with no rows still appear, carrying the previous total forward.
- Top N scores on the last value, not the sum of the running totals.

> **Trap** - a lower date limit does not cut the baseline. Filter to "March and later" and the March total still includes January and February. In Power BI you reach for `ALL` to rebuild that total.

## Semi-additive measure - `LASTNONBLANK`

```dax
Units On Hand =
CALCULATE (
    SUM ( Inventory[units_on_hand] ),
    LASTNONBLANK ( 'Date'[Date], CALCULATE ( COUNTROWS ( Inventory ) ) )
)
```

```ts
'Units on hand': {
  type: 'snapshot',
  operation: 'sum',
  table: 'inventory_snapshots',
  column: 'Units on hand',
  dateColumn: 'Snapshot date',
  formatter: numberFormatter(),
},
```

Compass aggregates the rows at the most recent date in each period only. With no date in the query at all, it aggregates at a single maximum date across the data.

`operation` is required. Use `sum` across products, or `max` or `average` for a value that is already aggregated.

> **Trap** - grouped by month with one row per item per month, this looks identical to a plain sum. The behaviour only shows itself when the date grouping comes off. See _Cumulative or snapshot_.

## Time intelligence

| DAX                                                          | Compass                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| `CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date]))` | `shift` with the offset `{ amount: -12, unit: 'month' }` |
| `CALCULATE([Total Sales], PREVIOUSMONTH('Date'[Date]))`      | `shift` with the offset `{ amount: -1, unit: 'month' }`  |
| `[Total Sales] - [Total Sales LY]`                           | `movement` with the same offset                          |

Transforms live on the query, not the metric, so you define `Total sales` once and never a `Total Sales LY`. A negative amount looks backwards.

- **Pair a transform with a date.** With a period group, each period compares to the offset period. With a date filter only, one value compares to one earlier period.
- **A shifted cumulative gives the previous period's running total**, so its movement is the increase in this period.
- **You cannot shift a snapshot metric.** It throws.

Result columns take a suffix: `Total sales` shifted by `-1 month` becomes `Total sales_prev_1_month`, and its movement becomes `Total sales_mvmt_prev_1_month`. A metric, its shift and its movement can therefore sit in one result together.

> **Trap** - the filter window widens to fetch the comparison. Filter to "February and later", ask for last month's value, and Compass still reads January.

## Top N - `TOPN`, `RANKX`

| DAX                                                          | Compass                                                          |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| `TOPN(10, VALUES(Customers[Customer]), [Total Sales], DESC)` | `topN: { n: 10, dimension: ..., metric: ..., direction: 'top' }` |
| An "Other" row built with `ALLEXCEPT`                        | `others: 'group'`                                                |
| Rank inside a category                                       | `partitionBy`                                                    |

`others: 'hide'` drops the rest. `others: 'group'` folds them into one "Other" row, and the per-period totals stay correct.

The ranked dimension does not need to be in the select, so you can ask for "total sales from the top 3 customers" and get one number.

> **Trap** - `distinctCount` is rejected as a ranking metric, because per-group distinct counts cannot be combined. Averages and `combine` metrics are not supported yet either, and their "Other" row comes back null.

## Metric options

`formatter`, `synonyms`, `access`, `visibleToLlm` and `schema` are all per-metric.

> **Trap** - `modify` inherits filters only. A derived metric that omits its formatter has none, even when its base has one. Repeat it on every layer.

## No equivalent

- **`SWITCH` in a measure.** No metric can return different expressions for different selections. Write separate metrics and let the query choose.
- **`ALL`, `ALLEXCEPT`, `REMOVEFILTERS`.** There is no filter context to clear, and a layer can only narrow.
- **A metric referring to itself**, directly or through other metrics.

---

# Columns

## Types

Five scalar types: `id`, `text`, `number`, `date` and `boolean`. Also `enum_(options)` and `relationship(table, column)`.

There is no currency, percentage or decimal type. The type controls:

1. **The permitted operators.** `text` permits `=`, `in`, `notIn` and `like`. `number` and `date` permit the comparison operators. `boolean` permits `=` only.
2. **Date handling.** Compass validates filter values against a `date` column.
3. **Numeric behaviour**, such as which columns Compass can add into a total.

> **Trap** - a column that holds dates as text is a `text` column. Declare it as a `date` and the query fails.

## Calculated column - `sqlExpression`

```dax
Line Total = 'Order Lines'[unit_price] * 'Order Lines'[quantity]
```

```ts
'Line total': {
  type: 'number',
  sqlExpression: 'order_lines.unit_price * order_lines.quantity',
  formatter: currencyFormatter(2),
},
```

1. **Write the table name.** Compass inlines the expression unchanged, so write `order_lines.unit_price`.
2. **Keep it row-level.** The expression cannot contain an aggregation.
3. **Keep it fast.** The database calculates it in every query.

|              | Power BI calculated column | Compass `sqlExpression`  |
| ------------ | -------------------------- | ------------------------ |
| Language     | DAX                        | The SQL of your database |
| Calculated   | At refresh, then stored    | In each query            |
| Other tables | Yes, with `RELATED`        | The same row only        |
| Cost         | Model size                 | Query time               |

## Renamed column - `sqlName`

```ts
Customer: { type: 'text', sqlName: 'company_name' },
```

Users and the LLM see the model name. Use `sqlName` or `sqlExpression`, never both - the types reject it.

## CASE and SWITCH

```dax
Discount Rate =
SWITCH (
    Customers[Tier],
    "Gold", 0.15,
    "Silver", 0.10,
    0
)
```

```ts
'Discount rate': {
  type: 'number',
  sqlExpression: `CASE customers.tier
    WHEN 'Gold' THEN 0.15
    WHEN 'Silver' THEN 0.10
    ELSE 0 END`,
  formatter: formatPercentage,
},
```

For a fixed set of values, use an enum instead, so the LLM knows the permitted values:

```ts
Tier: enum_(['Bronze', 'Silver', 'Gold'], { sqlName: 'tier' }),
```

## Currency

```dax
Format string: "$#,##0.00"
```

```ts
'Unit price': {
  type: 'number',
  sqlName: 'unit_price',
  formatter: currencyFormatter(2),   // The argument is the number of decimal places
},
```

A formatter changes the display only. It never reaches the SQL, a comparison or an aggregation.

> **Trap** - the currency is always USD in the `en-US` locale. Only the decimal places are configurable. For another currency, write your own formatter - an object with a `format(value, options)` method.

## Percentage

```ts
'Margin %': {
  type: 'number',
  sqlExpression:
    '(products.unit_price - products.unit_cost) / products.unit_price',
  formatter: formatPercentage,
},
```

The other formatters are `numberFormatter()` and `formatDays`. `numberFormatter` builds a formatter, so call it. Both it and `currencyFormatter` accept `{ compact: true }` to shorten large values.

> **Trap** - `formatPercentage` multiplies by 100. Store the ratio. A column holding `15` for "15%" shows `1500.0%`.

## Filters

`metricBuilderHelpers(tables)` gives you `eq`, `compare`, `inFilter`, `notIn`, `isNull`, `isNotNull` and `like`.

```ts
const recentOrders = compare('orders', 'Order date', '>=', ago(90, 'day'))
const notCancelled = eq('orders', 'Is cancelled', dynamic(false))
const coreCategories = inFilter('products', 'Category', [
  'Beverages',
  'Produce',
])
```

Wrap the comparison value: `dynamic(value)` for a fixed value, `ago(n, unit)` for a relative date. `ago(1, 'month', { aligned: true })` starts at the first day of this month, giving a full calendar month.

Put a shared filter in a `const` and reuse it. This replaces the DAX `VAR`.

## Dates

A date filter value must be an ISO 8601 string: `2026-07-01` or `2026-07-01T00:00:00`. Compass rejects everything else, including `01/07/2026`, `July 1, 2026` and `2026-07`.

Postgres reads `01/07/2026` as 7 January by default, so accepting it would return a wrong answer with no error.

---

# Model

## A table declaration

Each table needs `columns`, `access` and `primaryDate`.

A Compass table points at a table or view in your database. There is no import and no refresh, so each query reads the source database.

## Relationships

```ts
customers: {
  columns: {
    // Joins to regions.id, because `id` is the default
    region_id: relationship('regions'),
  },
},
order_lines: {
  columns: {
    order_id: relationship('orders'),
    // Joins to the `Product code` column of products instead of `id`
    product_id: relationship('products', 'Product code'),
  },
},
```

Declare a relationship as a column on the child, pointing at the parent. The second argument is the column on the **parent** table. It defaults to `id`. Use the model name of the column, not the `sqlName`.

This is many-to-one, from child to parent. Compass calls this direction "upwards".

- **Every relationship is active.** There is no `USERELATIONSHIP` yet. Inactive relationships are on the roadmap.
- **Filters move upwards only.** A filter on a parent table also filters its children. There is no bidirectional filtering.
- **Ambiguous models are rejected**, the same as Power BI. If `a → b`, `b → c` and also `a → c`, the path from `a` to `c` is ambiguous and validation fails.

## Role-playing dimensions

Power BI joins `orders` to one date dimension twice, then activates the second relationship per measure. Use two date columns on the fact table instead, and let the query pick one.

```ts
orders: {
  columns: {
    'Order date': { type: 'date', sqlName: 'ordered_at' },
    'Shipped date': { type: 'date', sqlName: 'shipped_at' },
  },
},
```

## Many-to-many

`complexRelationships` takes a join condition you write yourself. Support is partial, and the results surprise people in the same cases they do in Power BI.

> **Trap** - treat it as an antipattern. Talk to us first, and we can add proper support if you have a case that needs it.

## Date table - `primaryDate`

```ts
orders:      { primaryDate: { column: 'Order date' } },   // This table has a date
order_lines: { primaryDate: { parent: 'orders' } },       // Use the parent's date
products:    { primaryDate: NO_PRIMARY_DATE },            // This table has no date
```

`primaryDate` names the date column for a table, so a query can group everything by month without naming a column for each table. Delegation moves upwards through more than one table if it needs to, and the final column must have the type `date`.

There is no calendar table, so there are no calendar attributes. Add fiscal periods or day names as columns or expressions.

## Row-level security

```ts
const rlsGroups = [
  { id: 'region', name: 'Region', table: 'regions', column: 'id' },
]

const rlsUserEntries = [
  { groupId: 'region', email: 'north.manager@example.com', value: 1 },
]
```

- **Compass matches a value rather than evaluating an expression.** There is no DAX predicate and no `USERNAME()`.
- **RLS filters follow the same reachability rule as query filters**, so Compass drops them where they cannot reach a metric. Set `enforced: true` to throw instead.

Table and metric `access` is the coarser control: `{ type: 'all' }` or `{ type: 'specified', groups, emails }`. The group names are a fixed list of `admin`, `manager` and `staff`.

> **Trap** - only set `enforced` when RLS covers every table those users can query, or their other queries start throwing.

## What each side is missing

Power BI has, and Compass does not: calculated tables, hierarchies, bidirectional filters, aggregation tables, incremental refresh, calculation groups and field parameters.

Compass has, and Power BI does not:

- `synonyms` on tables, columns and metrics. An LLM reads the model to answer questions, so these words change the results.
- `access` on tables and metrics, controlling who can query each item.
- `visibleToLlm: false`. Your code can query the item, but the LLM does not see it.
- `schema`. A Zod schema that gives typed rows to code calling Compass directly.

The LLM uses your names to understand a question. `Customer` and `Order date` work. `dim_cust_v2` does not.

---

# Concepts

The four places the mental model breaks.

## Layering

In DAX, a filter in `CALCULATE` **replaces** the filter context for that column. `CALCULATE([Gold Sales], Customers[Tier] = "Silver")` gives Silver sales.

In Compass, `modify` **adds** the filter. Every layer's filters join with `AND`, like `KEEPFILTERS` on each DAX filter. The same pair gives `Tier = 'Gold' AND Tier = 'Silver'`, which is zero rows, with no error and no warning.

A layer can only make the result smaller. There is no `ALL` or `REMOVEFILTERS`, so build "Silver" from a metric above both, not from the Gold metric.

Four layers, spanning three tables:

```ts
export const metrics = defineMetrics({
  // Layer 0. All the layers below use this metric.
  'Total sales': queryMetric('sum', 'order_lines', 'Line total', {
    formatter: currencyFormatter(0),
    synonyms: ['revenue', 'turnover'],
  }),

  // Layer 1. Keep the lines that have a discount.
  'Discounted sales': modify(
    'Total sales',
    [compare('order_lines', 'Discount', '>', dynamic(0))],
    { formatter: currencyFormatter(0) },
  ),

  // Layer 2. Keep the Gold customers. Compass reaches `customers` through `orders`.
  'Gold discounted sales': modify(
    'Discounted sales',
    [eq('customers', 'Tier', dynamic('Gold'))],
    { formatter: currencyFormatter(0) },
  ),

  // Layer 3. Keep one region. This table is two joins higher.
  'Gold discounted sales, North': modify(
    'Gold discounted sales',
    [eq('regions', 'Region', dynamic('North'))],
    { formatter: currencyFormatter(0) },
  ),
})
```

Compass follows the `base` chain to the bottom and collects every filter into one list:

```
'Gold discounted sales, North'
  → base: 'Gold discounted sales'
      → base: 'Discounted sales'
          → base: 'Total sales'   ← The bottom: sum of order_lines."Line total"

The result is one metric:
  operation: sum
  table:     order_lines
  column:    Line total
  filters:   [ Discount > 0,
               customers.Tier = 'Gold',
               regions.Region = 'North' ]
```

```sql
SELECT SUM(order_lines.unit_price * order_lines.quantity) AS "Gold discounted sales, North"
FROM order_lines
LEFT JOIN orders    ON order_lines.order_id = orders.id
LEFT JOIN customers ON orders.customer_id   = customers.id
LEFT JOIN regions   ON customers.region_id  = regions.id
WHERE order_lines.discount_amount > ?
  AND customers.tier = ?
  AND regions.name = ?
```

- **The order of the layers does not matter.** In DAX, the order decides which `CALCULATE` wins.
- **A filter can use any table above the aggregation table.** Layer 3 filters `regions`, three joins away, and Compass adds the joins.
- **Two layers on the same column give zero rows.** In DAX the second filter replaces the first and you get a plausible number. Here you get zero, and nothing says why.

## Cumulative or snapshot

Add two adjacent periods together. If the result means something, you want `cumulative`. If it does not, you want `snapshot`.

**`cumulative`** suits rows you can add up and want a running total of: ledger entries, cash movements, units shipped.

**`snapshot`** suits rows that are already a state at one time: stock on hand, headcount, open tickets. Adding these across months gives a total far too large.

|                        | Query metric             | Cumulative                       | Snapshot                             |
| ---------------------- | ------------------------ | -------------------------------- | ------------------------------------ |
| No date in the query   | Aggregates all rows      | The total of all periods         | Aggregates the most recent date only |
| One period             | That period only         | All periods up to it             | The most recent date in the period   |
| Permitted operations   | All                      | `sum` and `count` only           | All, but you must give one           |
| Adds into a total row  | If `sum` or `count`      | No                               | Only `sum`, and only with no date    |
| Top N score            | Depends on the operation | The last value                   | The last value                       |
| `shift` and `movement` | Yes                      | Yes, as running totals           | **No. It throws an error**           |
| Periods with no rows   | Absent                   | Present, with the previous total | Absent                               |

## One root table per metric

Power BI evaluates a measure against one model. Compass builds the SQL for each metric separately:

- The `FROM` table is the aggregation table of the metric.
- Every other table in the query joins onto it with a `LEFT JOIN`. An order with no customer still counts.

Two consequences:

- Metrics on different fact tables do not multiply each other's rows. You do not need bridge tables.
- A calculation across two fact tables must be a `combine` metric, not one aggregation over a joined result.

## Dropped filters

A query filter applies only if its table is already in the joins for that metric, or is a parent of one of them. Otherwise **Compass removes it without a message**.

Compass never removes the filters inside a metric definition. Row-level security can set `enforced` to throw instead of dropping.

---

# Worked examples

## A margin calculation

```ts
export const metrics = defineMetrics({
  'Total sales': queryMetric('sum', 'order_lines', 'Line total', {
    formatter: currencyFormatter(0),
    synonyms: ['revenue', 'turnover'],
  }),
  'Total cost': queryMetric('sum', 'order_lines', 'Line cost', {
    formatter: currencyFormatter(0),
    synonyms: ['COGS', 'cost of goods sold'],
  }),
  'Total discount': queryMetric('sum', 'order_lines', 'Discount', {
    formatter: currencyFormatter(0),
  }),
  'Gross profit before discount': {
    type: 'combine',
    operation: 'subtract',
    left: 'Total sales',
    right: 'Total cost',
    formatter: currencyFormatter(0),
  },
  'Gross profit': {
    type: 'combine',
    operation: 'subtract',
    left: 'Gross profit before discount',
    right: 'Total discount',
    formatter: currencyFormatter(0),
  },
  'Gross margin %': divide('Gross profit', 'Total sales', {
    formatter: formatPercentage,
  }),
})
```

```dax
Total Sales    = SUM ( 'Order Lines'[line_total] )
Total Cost     = SUM ( 'Order Lines'[line_cost] )
Total Discount = SUM ( 'Order Lines'[discount_amount] )
Gross Profit   = [Total Sales] - [Total Cost] - [Total Discount]
Gross Margin % = DIVIDE ( [Gross Profit], [Total Sales] )
```

A combine metric can build on another, so `Gross profit` uses `Gross profit before discount`. Naming each step also lets a user ask about profit before the discount.

## A rate from two filtered metrics

```ts
const isFulfilled = eq('orders', 'Is fulfilled', dynamic(true))
const notCancelled = eq('orders', 'Is cancelled', dynamic(false))

export const metrics = defineMetrics({
  'Total orders': countMetric('orders'),
  'Live orders': modify('Total orders', [notCancelled]),
  'Fulfilled orders': modify('Live orders', [isFulfilled]),
  'Fulfilment rate': divide('Fulfilled orders', 'Live orders', {
    formatter: formatPercentage,
    synonyms: ['the proportion of live orders that were fulfilled'],
  }),
})
```

`Fulfilled orders` builds on `Live orders`, not `Total orders`. Because layers only narrow, the numerator can never include a cancelled order the denominator excludes, so the rate cannot exceed 100%.

Synonyms can be phrases, not just single words.

## When a number looks wrong

1. **Two layers filtering the same column?** That gives zero rows. Check the whole chain.
2. **Value unformatted?** The metric has no `formatter`. They do not inherit.
3. **Query filter ignored?** It could not reach that metric's aggregation table.
4. **Percentage 100 times too large?** `formatPercentage` needs a ratio.
5. **Stock or headcount far too large?** Use a `snapshot` metric.
6. **Running total starting too high?** Expected. A lower date limit does not cut the baseline.
7. **Total row empty?** Averages, medians and distinct counts cannot be re-derived, so Compass gives null rather than a wrong number.

---

# The example model

```ts
import {
  NO_PRIMARY_DATE,
  currencyFormatter,
  defineTables,
  enum_,
  formatPercentage,
  metricBuilderHelpers,
  numberFormatter,
  relationship,
} from '@bearing-agency/compass'
import type {
  Access,
  ComplexRelationship,
  SqlDialect,
} from '@bearing-agency/compass'

export const dialect: SqlDialect = 'postgres'

const open: Access = { type: 'all' }

export const tables = defineTables({
  regions: {
    access: open,
    primaryDate: NO_PRIMARY_DATE,
    columns: {
      id: { type: 'id' },
      Region: { type: 'text', sqlName: 'name' },
    },
  },
  customers: {
    access: open,
    primaryDate: NO_PRIMARY_DATE,
    columns: {
      id: { type: 'id' },
      region_id: relationship('regions'),
      Customer: {
        type: 'text',
        sqlName: 'company_name',
        synonyms: ['client', 'account'],
      },
      Tier: enum_(['Bronze', 'Silver', 'Gold'], { sqlName: 'tier' }),
    },
  },
  products: {
    access: open,
    primaryDate: NO_PRIMARY_DATE,
    columns: {
      id: { type: 'id' },
      'Product code': { type: 'id', sqlName: 'product_code' },
      Product: { type: 'text', sqlName: 'name', synonyms: ['item', 'SKU'] },
      Category: { type: 'text', sqlName: 'category' },
      'Unit cost': {
        type: 'number',
        sqlName: 'unit_cost',
        formatter: currencyFormatter(2),
      },
    },
  },
  orders: {
    access: open,
    primaryDate: { column: 'Order date' },
    columns: {
      id: { type: 'id' },
      customer_id: relationship('customers'),
      'Order date': { type: 'date', sqlName: 'ordered_at' },
      'Is cancelled': { type: 'boolean', sqlName: 'is_cancelled' },
    },
  },
  order_lines: {
    access: open,
    primaryDate: { parent: 'orders' },
    columns: {
      id: { type: 'id' },
      order_id: relationship('orders'),
      product_id: relationship('products'),
      Quantity: { type: 'number', sqlName: 'quantity' },
      'Unit price': {
        type: 'number',
        sqlName: 'unit_price',
        formatter: currencyFormatter(2),
      },
      Discount: {
        type: 'number',
        sqlName: 'discount_amount',
        formatter: currencyFormatter(2),
      },
    },
  },
  inventory_snapshots: {
    access: open,
    primaryDate: { column: 'Snapshot date' },
    columns: {
      id: { type: 'id' },
      product_id: relationship('products'),
      'Snapshot date': { type: 'date', sqlName: 'captured_on' },
      'Units on hand': { type: 'number', sqlName: 'units_on_hand' },
    },
  },
})

export const complexRelationships = [] satisfies ComplexRelationship[]
```

`metricBuilderHelpers(tables)` gives you builders bound to these tables, so a wrong table or column name becomes a type error.

```ts
const {
  compare,
  eq,
  inFilter,
  queryMetric,
  countMetric,
  modify,
  divide,
  defineMetrics,
} = metricBuilderHelpers(tables)
```
