# Compass for Power BI developers

The biggest difference stems from Compass having one data model that's the source of truth, rather than a series of datasets. Within this model, we define our tables & columns, the metrics built on these, and access control permissions.

Compass sits on top of a single SQL database and queries are translated to a combination of SQL queries & pre-/post-processing logic in the query engine as required.

If you encounter a concept that you're not sure how to represent in Compass, then speak to our team. We can advise how to achieve this and any workarounds that are available, and can build new functionality into the query engine where required too.

Examples use a wholesale model - orders, order lines, customers, products, regions. Listed in full at the end of this document.

## Quick reference

| Power BI                                                                        | Compass                                                                                                                                                     | Notes                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Measure                                                                         | Metric in `defineMetrics({ ... })`                                                                                                                          | Four types: `query`, `snapshot`, `modify`, `combine`.                                                                                                                                                                               |
| Column-aggregating options like `SUM`, `AVERAGE`, `MIN`, `MAX`, `DISTINCTCOUNT` | `queryMetric(operation, table, column)`, which also supports calculations like `median` and `percentile`                                                    | Unlike in Power BI, Compass requires the core calculations (e.g. summing sales $) to be defined in a base metric for others to build off, rather than inline.                                                                       |
| `COUNTROWS`                                                                     | `countMetric(table)`                                                                                                                                        |                                                                                                                                                                                                                                     |
| `CALCULATE([m], filter1, filter2)`                                              | `modify('m', [filter1, filter2])`                                                                                                                           |                                                                                                                                                                                                                                     |
| `DIVIDE(a, b)`                                                                  | `divide('a', 'b')`                                                                                                                                          |                                                                                                                                                                                                                                     |
| Defining a reusable filters to use in many different measures: unsupported      | Just define filters in your data model file and reference them like `modify('m', [filter1, filter2])`                                                       |                                                                                                                                                                                                                                     |
| Subtract one measure from another                                               | `combine` with `subtract`                                                                                                                                   | Other arithmetic operations are supported too. Note each operation is a separate metric - if there's a case that makes it very clunky then say so, as it's on the roadmap to give better ergonomics for this type of calculation.   |
| `SWITCH` in a measure                                                           | None                                                                                                                                                        |                                                                                                                                                                                                                                     |
| `ALL`, `ALLEXCEPT`, `REMOVEFILTERS`                                             | None                                                                                                                                                        |                                                                                                                                                                                                                                     |
| `SAMEPERIODLASTYEAR`, `PREVIOUSMONTH`                                           | `shift` transform                                                                                                                                           | At query time, not defined in the data model up front.                                                                                                                                                                              |
| Period-over-period difference                                                   | `movement` transform                                                                                                                                        | At query time, not defined in the data model up front. % change is on the roadmap                                                                                                                                                   |
| Running total, `DATESYTD`                                                       | `cumulative` on a query metric                                                                                                                              | Defined at query time as part of the data model. Rolling periods are on the roadmap, and will be supported at query time like the `shift` & `movement` transforms.                                                                  |
| `TOPN`, `RANKX`                                                                 | `topN` on the query                                                                                                                                         | Can optionally group the others into an `Other` group. Supports bottom N as well.                                                                                                                                                   |
| Variables (`VAR`)                                                               | Partial support via defining constants in TypeScript, but they behave differently.                                                                          | DAX is a more complex & powerful query language than Compass has, which isn't only a good thing (makes it harder to optimise performance & reason about the code). Some DAX idioms need to be more carefully translated to Compass. |
| Calculated column                                                               | `sqlExpression` on a column                                                                                                                                 |                                                                                                                                                                                                                                     |
| `SWITCH` or `IF` in a calculated column                                         | `sqlExpression` with a SQL `CASE`                                                                                                                           |                                                                                                                                                                                                                                     |
| Renamed column                                                                  | Name the column what you want to see in the UI, and remap it for database queries with `sqlName` (only used at query time & only internally to the engine). |                                                                                                                                                                                                                                     |
| Format string                                                                   | `formatter` on a column or metric                                                                                                                           | Changes the display only.                                                                                                                                                                                                           |
| Currency data type                                                              | `type: 'number'` and `currencyFormatter(decimalPlaces)`                                                                                                     | Currency is a formatter, not a type.                                                                                                                                                                                                |
| Percentage data type                                                            | `type: 'number'` and `formatPercentage`                                                                                                                     | Store the ratio, i.e. 0-1 rather than 0-100.                                                                                                                                                                                        |
| Star schema in the model                                                        | `defineTables({ ... })`                                                                                                                                     | Maps onto tables that already exist in your database.                                                                                                                                                                               |
| Relationship (many-to-one)                                                      | `relationship('parent_table')` column on the child                                                                                                          | Always many-to-one and directional.                                                                                                                                                                                                 |
| Inactive relationship, `USERELATIONSHIP`                                        | On the roadmap                                                                                                                                              | Every relationship is currently active.                                                                                                                                                                                             |
| Bidirectional cross-filter                                                      | Currently unsupported; further updates are on the roadmap to support parents based on filter criteria on the children.                                      |                                                                                                                                                                                                                                     |
| Many-to-many relationship                                                       | `complexRelationships` entry                                                                                                                                | Partly supported; this is an anti-pattern in Power BI too. Ask us before you use one.                                                                                                                                               |
| Ambiguous join paths: Rejected                                                  | Also rejected                                                                                                                                               | Same as Power BI. Two tables can have one join path only.                                                                                                                                                                           |
| Add a date table and "mark as date table"                                       | Define a `primaryDate` column per table.                                                                                                                    | You don't need to manually define a calendar table & relationships to it.                                                                                                                                                           |
| Display folders, hierarchies                                                    | None                                                                                                                                                        |                                                                                                                                                                                                                                     |
| RLS role with a DAX filter                                                      | RLS group and user entries                                                                                                                                  |                                                                                                                                                                                                                                     |
| Q&A synonyms                                                                    | `synonyms` on a column or metric                                                                                                                            | These are injected directly into the prompt, so you can technically put whatever you want in there, including instructions.                                                                                                         |

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

> **Tip** - filters intersect rather than replacing earlier filters (boolean AND). See _Layering_.

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

> **Tip** - a `combine` metric cannot be a `modify` base. Filter the parts instead, then combine them.

## Cumulative total for life-to-date calculations

```dax
Cumulative Sales =
VAR _maxDate = MAX ( 'Date'[Date] )

CALCULATE (
    [Total Sales],
    FILTER ( ALL ( 'Date' ), 'Date'[Date] <=  _maxDate)
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
- Only `sum` and `count` are supported currently. Other metrics like `average`, `min`, `max` and `median` are on the roadmap; they're doable but will require more handling so we don't e.g. take the average of an average.

## Snapshot metric

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

Snapshot metrics are useful for calculations like headcount if you have a series of snapshots that represent the new state of the system, rather than a dataset that only shows the changes. A naive count on a snapshot table would overcount, giving e.g. the number of employees * the number of snapshots.

Compass aggregates snapshot metrics based on the rows at the most recent date for the data. Queries that return a row per period (e.g. per month) will snapshot based on the most recent date in each period.

## Time intelligence

| DAX                                                          | Compass                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| `CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date]))` | `shift` with the offset `{ amount: -12, unit: 'month' }` |
| `CALCULATE([Total Sales], PREVIOUSMONTH('Date'[Date]))`      | `shift` with the offset `{ amount: -1, unit: 'month' }`  |
| `[Total Sales] - [Total Sales LY]`                           | `movement` with the same offset                          |

Transforms are handled at query time rather than when first building the data model - e.g. you can query sales, sales a year ago, and sales 3 days ago without having to define the latter two metrics in advance.

- **A shifted cumulative gives the previous period's running total**, so its movement is the increase in this period.
- **Shifting a snapshot metric is currently unsupported.**

Result columns take a suffix: `Total sales` shifted by `-1 month` becomes `Total sales_prev_1_month`, and its movement becomes `Total sales_mvmt_prev_1_month`. A metric, its shift and its movement can therefore sit in one result together as each column name is unique. These names are customisable if required, but they must be hard-coded rather than LLM-supplied to ensure we uphold our guarantee that you can tell at a glance what data you're seeing, and can't be provided with hallucinated data in the chat UI.

> **Tip** - the filter window widens to fetch the comparison. Filter to "February and later", ask for last month's value, and Compass will fetch the Jan data for that priod-month column, without bringing it into the other columns where you didn't want it.

## Top N

| DAX                                                          | Compass                                                          |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| `TOPN(10, VALUES(Customers[Customer]), [Total Sales], DESC)` | `topN: { n: 10, dimension: ..., metric: ..., direction: 'top' }` |
| An "Other" row built with `ALLEXCEPT`                        | `others: 'group'`                                                |
| Rank inside a category                                       |                                                                  |

The basic syntax is `topN: { n: 10, dimension: ..., metric: ..., direction: 'top' }`. You can control grouping with `others` (default: `hide`). You can rank inside a category with `partitionBy`, which allows you to distinguish between e.g. "sales by month & category for the top 4 categories by all-time sales" and "sales by month & category for the top 4 categories for each month".

`others: 'hide'` drops the entries that weren't in that top grouping. `others: 'group'` folds them into one "Other" row.

You don't have to select the ranking dimension, so e.g. you can ask for "total sales from the top 3 customers" and get one number.

> **Tip** - `distinctCount` isn't supported for top N ranking currently, and some aggregations like averages and `combine` metrics aren't yet supported for `group: 'others'` specifically..

## Metric options

`formatter`, `synonyms`, `access`, `visibleToLlm` and `schema` are all per-metric.

> **Tip** - `modify` inherits filters only. A derived metric that omits its formatter has none, even when its base has one.

## No equivalent

- **`SWITCH` in a measure.** Most patterns that require this in Power BI are workarounds for an inflexible dev environment, so DAX is the only tool you have here. Compass has a lot more flexibility in the structure around the queries so this typically isn't required. For changing the metric shown in a report via a slicer selection for example, we'd just use a button with custom code to handle this - and this even lets us trivially change dimensions/axes for charts, which is much more difficult (or infeasible) in Power BI.
- **`ALL`, `ALLEXCEPT`, `REMOVEFILTERS`.** `Modify` only adds filters, and doesn't take any away.

# Columns

## Types

Five scalar types: `id`, `text`, `number`, `date` and `boolean`. Also `enum_(options)` and `relationship(table, column)`.

There is no currency, percentage or decimal type; these are handled as formatters.

The type controls:

1. **The permitted operators.** `text` permits `=`, `in`, `notIn` and `like`. `number` and `date` permit the comparison operators. `boolean` permits `=` only.
2. **Date handling.** Compass validates filter values against a `date` column.
3. **Numeric behaviour**, such as which columns Compass can add into a total.

> **Tip** - a column that holds dates as text is a `text` column, not a `date` column. You can cast it to a date column with `sqlExpression` though and then use it as you'd expect.

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

Instead of using `sqlExpression`, you can always define a view in your database instead.

More flexible syntax that covers common cases without needing to drop into raw SQL is on the roadmap.

1. **Write the table name.** Compass inlines the expression into the query directly without modification, so write `order_lines.unit_price`.
2. **Keep it row-level.** The expression cannot contain an aggregation.
3. **Keep it fast.** The database calculates it in every query.

|              | Power BI calculated column                                      | Compass `sqlExpression`                                                      |
| ------------ | --------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Language     | DAX                                                             | The SQL of your database                                                     |
| Calculated   | At refresh, then stored                                         | In each query                                                                |
| Other tables | Yes, with `RELATED` (in `Import` mode only, not `Direct Query`) | The same row only (Compass only runs in the equivalent of direct query mode) |
| Cost         | Model size                                                      | Query time                                                                   |

## Renamed column - `sqlName`

```ts
Customer: { type: 'text', sqlName: 'company_name' },
```

Users and the LLM see the model name (`Customer`), and e.g. `company_name` is only used in queries to the database.

Using both `sqlName` and `sqlExpression` together would never be useful, so we treat this as a mistake and raise an error so it can be corrected.

## `CASE` and `SWITCH`

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

## Enums

For a fixed set of values, you can use the `enum` type. This behaves like a `text` column, except that we send the list of options to the LLM as part of the prompt so it can filter on these directly if users reference values.

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
  formatter: currencyFormatter(2),   // This example formats to 2dp.
},
```

A formatter changes how values are displayed, and doesn't affect calculations.

## Percentage

```ts
'Margin %': {
  type: 'number',
  sqlExpression:
    '(products.unit_price - products.unit_cost) / products.unit_price',
  formatter: formatPercentage,
},
```

> **Tip** - `formatPercentage` multiplies by 100, so store e.g. 0.15 for 15%.

## Filters

We have helper functions available: `eq` (=), `compare` (<, >, <=, >=), `inFilter`, `notIn`, `isNull`, `isNotNull` and `like`.

```ts
const recentOrders = compare('orders', 'Order date', '>=', ago(90, 'day'))
const notCancelled = eq('orders', 'Is cancelled', dynamic(false))
const coreCategories = inFilter('products', 'Category', [
  'Beverages',
  'Produce',
])
```

Use `dynamic` to wrap a hard-coded value.
Use `ago` for a relative date, and you can choose full months (rather than being relative to today) with `ago(1, 'month', { aligned: true })`.

You can save a filter to a variable (as shown above) and reuse it for many metrics, which isn't possible in DAX.

## Dates

A date filter value must be an ISO 8601 string for consistency: `2026-07-01` or `2026-07-01T00:00:00`. Compass rejects everything else, including `01/07/2026`, `July 1, 2026` and `2026-07`.

# Model

## A table declaration

Each table needs `columns`, `access` and `primaryDate`.

A Compass table points at a table or view in your database. There is no import and no refresh: every query hits the database on the fly so it runs based on the latest data available.

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
    // Joins to products.[Product code] instead of `id`
    product_id: relationship('products', 'Product code'),
  },
},
```

Declare a relationship as a column on the child, pointing at the parent. Use the model name of the column, not the `sqlName`.

This is many-to-one, from child to parent. Compass calls this direction "upwards", aligning with common practice for laying out relationship diagrams, that visualise relationships as flowing downwards from dimension tables to fact tables.

- **Every relationship is active.** There is no `USERELATIONSHIP` yet. Support for inactive relationships is on the roadmap.
- **Filters move upwards only.** A filter on a parent table also filters its children. There is no bidirectional filtering.
- **Ambiguous models are rejected**, the same as Power BI. If `a → b`, `b → c` and also `a → c`, the path from `a` to `c` is ambiguous and validation fails.

## Many-to-many

`complexRelationships` takes a join condition you write yourself. This is a partially supported feature currently, and the results can be surprising (similarly to Power BI).

> **Tip** - many:many relationships are an anti-pattern in most cases. Talk to us first, and we can add proper support if you have a case that needs it, or we can advise how to restructure your data to work with normal relationships.

## `primaryDate`

```ts
orders:      { primaryDate: { column: 'Order date' } },   // This table has a date column directly
order_lines: { primaryDate: { parent: 'orders' } },       // Use the parent's date column
products:    { primaryDate: NO_PRIMARY_DATE },            // This table has no date
```

`primaryDate` names the date column for a table, so a query can e.g. group by month and select the correct date column from each data source without requiring user input.

A date column must have the type `date`.

## Row-level security

```ts
const rlsGroups = [
  { id: 'region', name: 'Region', table: 'regions', column: 'id' },
]

const rlsUserEntries = [
  { groupId: 'region', email: 'north.manager@example.com', value: 1 },
]
```

- RLS is always based on the user's email, which we know from the sign in flow.
- Users inherit RLS rules from groups that they're associated with.
- RLS rules stack, so if a user is in several groups then those will all be included filters.
- RLS filters only flow downwards, so e.g. you can't RLS-filter a query about regions based on access to orders, but you can define a filter on regions that will apply to all queries on orders data (a fact table downstream from the regions table).
- RLS filters follow the same reachability rule as query filters, so e.g. an RLS filter on a financial dataset has no effect on queries on H&S data. For a filter that will always be relevant, set `enforced: true` to throw an error if the Compass query engine can't reach that filter table from the data that's being queried.

## Table and metric security

Table and metric `access` can either be open to all users (`{ type: 'all' }`) or locked down with `{ type: 'specified', groups, emails }`. Groups are customisable per Compass deployment. Group memberships can be synced from other platforms and tools, such as Microsoft Entra / Azure AD (see the Bearing team to discuss this).

If a user has access to a metric but not the underlying table, they can't query that metric (safe by default). As a result, typically you can leave metrics with open access and control only the source data tables.

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
// Formatting not shown here; the Compass data model above handles logic + synonyms for chat + formatting, which is a large part of why it takes more lines
Total Sales    = SUM ( 'Order Lines'[line_total] )
Total Cost     = SUM ( 'Order Lines'[line_cost] )
Total Discount = SUM ( 'Order Lines'[discount_amount] )
Gross Profit   = [Total Sales] - [Total Cost] - [Total Discount]
Gross Margin % = DIVIDE ( [Gross Profit], [Total Sales] )
```

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

`Fulfilled orders` builds on `Live orders`, not `Total orders`, and stacks a new filter on top.

The filters here could have been defined inline rather than at the top level, but defining them there makes it trivial to reuse them in other metrics, so it's a good practice to follow.

Synonyms can also be phrases, not just single words.

## Layering & `modify` deep-dive

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

  // Layer 2. Keep the Gold customers (reached through `orders`).
  'Gold discounted sales': modify(
    'Discounted sales',
    [eq('customers', 'Tier', dynamic('Gold'))],
    { formatter: currencyFormatter(0) },
  ),

  // Layer 3. Keep one region, which is another join away.
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

`metricBuilderHelpers(tables)` gives you builders bound to these tables, so a wrong table or column name becomes a type error (a red underline in the editor).

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
