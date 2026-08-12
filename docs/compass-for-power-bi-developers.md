# Compass for Power BI developers

You know star schemas, measures, filter context and DAX. This document maps those ideas onto Compass. It also shows where the map stops working.

Compass is a semantic layer that compiles to SQL. You declare tables, columns and metrics in TypeScript. A query arrives as JSON. Compass compiles it to SQL, runs it, then processes the rows.

There is no in-memory model. There is no filter context that moves along relationships. Most of the differences below come from these two facts.

## Quick reference

| Power BI                                        | Compass                                            | Notes                                                                          |
| ----------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------ |
| Star schema in the model                        | `defineTables({ ... })`                            | Maps onto tables that already exist in your database. Compass creates nothing. |
| Relationship (many-to-one)                      | `relationship('parent_table')` column on the child | Always many-to-one. Always directional. Always active.                         |
| Many-to-many relationship                       | `complexRelationships` entry                       | You write the join condition.                                                  |
| Inactive relationship, `USERELATIONSHIP`        | None                                               | Every relationship is always on.                                               |
| Bidirectional cross-filter                      | None                                               | Filters move from child to parent only.                                        |
| Engine resolves ambiguous paths                 | Compass rejects the model                          | Two tables can have one join path only.                                        |
| Date table, "mark as date table"                | `primaryDate` on each table                        | Each table declares its own date. There is no calendar table.                  |
| Calculated column                               | `sqlExpression` on a column                        | The database calculates it in each query.                                      |
| Renamed column                                  | `sqlName`                                          | The model name stays public. `sqlName` is the physical name.                   |
| Measure                                         | Metric in `defineMetrics({ ... })`                 | Four types: `query`, `snapshot`, `modify`, `combine`.                          |
| `SUM`, `AVERAGE`, `MIN`, `MAX`, `DISTINCTCOUNT` | `queryMetric(operation, table, column)`            | Also `median` and `percentile`.                                                |
| `COUNTROWS`                                     | `countMetric(table)`                               | Compiles to `COUNT(*)`.                                                        |
| `CALCULATE([m], filters)`                       | `modify('m', [filters])`                           | Filters intersect. They do not replace.                                        |
| `DIVIDE(a, b)`                                  | `divide('a', 'b')`                                 |                                                                                |
| Subtract one measure from another               | `combine` with `subtract`                          | Also `add` and `multiply`.                                                     |
| `SWITCH` or `IF` in a calculated column         | `sqlExpression` with a SQL `CASE`                  |                                                                                |
| `SWITCH` in a measure                           | None                                               | The database does the branching.                                               |
| Format string                                   | `formatter` on a column or metric                  | Changes the display only.                                                      |
| Currency data type                              | `type: 'number'` and `currencyFormatter(n)`        | Currency is a formatter, not a type.                                           |
| Percentage data type                            | `type: 'number'` and `formatPercentage`            | Store the ratio, not `0` to `100`.                                             |
| `SAMEPERIODLASTYEAR`, `PREVIOUSMONTH`           | `shift` transform                                  | The query applies it, not the metric.                                          |
| Period-over-period difference                   | `movement` transform                               | Runs two queries and subtracts.                                                |
| Running total, `DATESYTD`                       | `cumulative` on a query metric                     | Compass adds the totals after SQL.                                             |
| `LASTNONBLANK` semi-additive measure            | `type: 'snapshot'` metric                          | For point-in-time rows.                                                        |
| `TOPN`, `RANKX`                                 | `topN` on the query                                | Includes an "Other" group.                                                     |
| `ALL`, `ALLEXCEPT`, `REMOVEFILTERS`             | None                                               | There is no filter context to remove.                                          |
| Variables (`VAR`)                               | A TypeScript `const`                               | The model is TypeScript.                                                       |
| RLS role with a DAX filter                      | RLS group and user entries                         | Matches a value. It does not evaluate an expression.                           |
| Display folders, hierarchies                    | None                                               |                                                                                |
| Q&A synonyms                                    | `synonyms` on a column or metric                   | An LLM reads the model, so these change the results.                           |

The sections below give more detail on these rows.

## Example model

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

`metricBuilderHelpers(tables)` gives you builders for these tables. A wrong table or column name becomes a type error.

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

Use these builders. The package does not export the versions without types, so this is the supported method.

## 1. Table modelling

### A table declaration

Each table needs three keys: `columns`, `access` and `primaryDate`.

There is no import step and no storage mode. A Compass table points at a table or view in your database. Compass copies nothing and refreshes nothing. Each query reads the source database.

Model changes are therefore immediate. But your database controls the speed. Compass cannot make a slow query fast.

### Relationships

Declare a relationship as a column on the child table. It points at the parent.

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

This is many-to-one, from child to parent. Compass calls this direction "upwards".

The second argument is the column on the **parent** table. It defaults to `id`. Give it when the child points at a natural key instead of the primary key. Use the model name of the column, not the `sqlName`.

Three rules are different from Power BI.

**Every relationship is active.** There is no inactive relationship and no `USERELATIONSHIP`.

**Filters move upwards only.** A filter on a parent table also filters its children. You cannot turn on bidirectional filtering.

**Two tables can have one join path only.** If `a → b`, `b → c` and also `a → c`, then the path from `a` to `c` is ambiguous. Compass rejects the model. Power BI makes one relationship inactive instead. The relationship graph must have no cycles.

### Role-playing dimensions

An `orders` table with an order date and a ship date is a common Power BI pattern. You join it to one date dimension twice. Compass has no equivalent, because it has no inactive relationships.

Use two date columns on the fact table instead:

```ts
orders: {
  columns: {
    'Order date': { type: 'date', sqlName: 'ordered_at' },
    'Shipped date': { type: 'date', sqlName: 'shipped_at' },
  },
},
```

The query then selects the column it needs.

### Many-to-many

Use `complexRelationships` for a true many-to-many. You supply the join condition. This relationship is symmetric, not directional.

Use it only when necessary. Foreign keys give you the directional rules, and complex relationships do not.

### There is no shared date table

`primaryDate` tells Compass which column is the date for a table. A query can then group all tables by month without naming a column for each one.

There are three forms:

```ts
orders:      { primaryDate: { column: 'Order date' } },   // This table has a date
order_lines: { primaryDate: { parent: 'orders' } },       // Use the parent's date
products:    { primaryDate: NO_PRIMARY_DATE },            // This table has no date
```

Delegation moves upwards and can continue through more than one table. The table must have a relationship column that points at the parent it names. The final column must have the type `date`.

This is not a date dimension. There is no calendar table, so there are no calendar attributes. Add fiscal periods or day names as columns or expressions.

### Compass selects the join root for each metric

This is the largest difference in this document.

Power BI evaluates a measure against one model. Compass compiles **one SQL query for each metric**. It selects the `FROM` table for that query as follows:

- The root is the aggregation table of the metric.
- Compass adds a `LEFT JOIN` for each other table in the query. Fact rows with a null foreign key stay in the result. An order with no customer still counts.
- If the query has no aggregation, Compass uses the most granular table. This is the table that reaches all the other tables upwards.

Therefore one question with two metrics from two fact tables compiles to two SQL queries. The two queries have different root tables. Compass merges the results on the shared group keys.

This has three results:

- Two metrics on different fact tables do not multiply each other's rows. You do not need bridge tables.
- A calculation across two fact tables must be a `combine` metric. It cannot be one aggregation over a joined result.
- Each metric costs one query. Five metrics on a dashboard tile are five queries.

### Compass drops filters that cannot reach the metric

Compass selects a different root table for each metric. A query filter is therefore not always relevant.

Compass applies a query filter only if its table is already in the joins for that metric, or is a parent of one of those tables. If not, **Compass removes the filter without a message**.

This is intentional. If a query has two unrelated metrics and one filter, then the filter is correct for one metric only.

Examine this first when a number looks wrong. Compass never removes the filters in a metric definition. It removes query filters only.

Row-level security has an `enforced` option. Compass then throws an error instead of removing the filter. Use it when a filter is a security rule.

### Differences in the two models

Power BI has these, and Compass does not: calculated tables, hierarchies, inactive relationships, bidirectional filters, aggregation tables, incremental refresh, calculation groups and field parameters.

Compass has these, and Power BI does not:

- `synonyms` on tables, columns and metrics. An LLM reads the model to answer questions, so these words change the results.
- `access` on each table, and on metrics. It controls who can query each item.
- `visibleToLlm: false`. Your code can query the item, but the LLM does not see it.
- `schema`. A Zod schema for a column or metric. It gives typed rows to code that calls Compass directly.

Names are important. The LLM uses your names to understand a question. `Customer` and `Order date` are good names. `dim_cust_v2` is not. A better name is the least expensive way to make the answers more accurate.

## 2. Column types

### The types

There are five scalar types: `id`, `text`, `number`, `date` and `boolean`. There are also `enum_(options)` and `relationship(table, column)`.

There is no currency type, no percentage type and no decimal type.

The type is not a storage instruction. It controls three things:

1. **The permitted operators.** A `text` column permits `=`, `in`, `notIn` and `like`. A `number` or `date` column permits the comparison operators. A `boolean` column permits `=` only.
2. **Date handling.** Compass casts the filter parameter of a `date` column to a timestamp. It also checks the value first.
3. **Numeric behaviour.** For example, which columns Compass can add into a total.

A column that holds dates as text is a `text` column. If you declare it as a `date`, the database cannot compare it and the query fails.

### Currency is a number with a formatter

```ts
'Unit price': {
  type: 'number',
  sqlName: 'unit_price',
  formatter: currencyFormatter(2),   // The argument is the number of decimal places
},
```

```dax
-- Power BI equivalent
Unit Price = SUM('Order Lines'[unit_price])
    Format string: "$#,##0.00"
```

Use `currencyFormatter(0)` for large values and `currencyFormatter(2)` for line amounts.

A formatter changes the display only. It does not change a value. It does not appear in the SQL. It does not change a comparison or an aggregation.

There are two problems to know:

- **The currency is always USD in the `en-US` locale.** Only the decimal places are configurable. For a different currency, write your own formatter. A formatter is an object with a `format(value, options)` method.
- **A `modify` metric does not inherit the formatter of its base.** The section on modifiers gives more detail.

### Percentages

```ts
'Margin %': {
  type: 'number',
  sqlExpression:
    '(products.unit_price - products.unit_cost) / products.unit_price',
  formatter: formatPercentage,
},
```

`formatPercentage` multiplies the value by 100 and shows one decimal place. **Store the ratio, not the percentage.** A column that holds `15` for "15%" shows `1500.0%`.

Use the same formatter for a ratio metric:

```ts
'Gross margin %': divide('Gross profit', 'Total sales', {
  formatter: formatPercentage,
}),
```

The other formatters are `numberFormatter()` and `formatDays`. Note that `numberFormatter` is a function that makes a formatter, so you must call it. `numberFormatter` and `currencyFormatter` accept `{ compact: true }` to shorten large values.

### `sqlName` and `sqlExpression`

You can use one of these, but not both. The types prevent both.

**`sqlName` renames a column.** Users and the LLM see the model name. Compass uses the `sqlName` in the SQL.

```ts
Customer: { type: 'text', sqlName: 'company_name' },
```

**`sqlExpression` calculates a value.** This is equivalent to a Power BI calculated column.

```ts
'Line total': {
  type: 'number',
  sqlExpression: 'order_lines.unit_price * order_lines.quantity',
  formatter: currencyFormatter(2),
},
```

Obey three rules for `sqlExpression`:

1. **Write the table name.** Compass puts the expression into the SQL without a change. Write `order_lines.unit_price`, not `unit_price`.
2. **Use a row-level expression.** Compass puts the expression everywhere the column occurs. This includes aggregations and the `WHERE` clause. The expression cannot contain an aggregation.
3. **Keep it fast.** The database calculates the expression in each query. Compass does not store the result.

The differences from a Power BI calculated column are:

|              | Power BI calculated column | Compass `sqlExpression`  |
| ------------ | -------------------------- | ------------------------ |
| Language     | DAX                        | The SQL of your database |
| Calculated   | At refresh, then stored    | In each query            |
| Other tables | Yes, with `RELATED`        | The same row only        |
| Cost         | Model size                 | Query time               |

### CASE and SWITCH

There are two methods. Neither one is part of a metric.

**For row-level branching, use a SQL `CASE` in a `sqlExpression`.**

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

```dax
-- Power BI equivalent, as a calculated column
Discount Rate =
SWITCH (
    Customers[Tier],
    "Gold", 0.15,
    "Silver", 0.10,
    0
)
```

**For a fixed set of values, use an enum.** The LLM then knows the permitted values and does not guess.

```ts
Tier: enum_(['Bronze', 'Silver', 'Gold'], { sqlName: 'tier' }),
```

**A metric cannot contain branching.** A DAX measure can return different expressions for different selections, for example with `HASONEVALUE`. Compass has no equivalent. A metric is a declaration, not an expression. Write more than one metric and let the query select one.

## 3. Cumulative and snapshot

Both types answer "what is the value at this time". They do it in opposite ways. The wrong type gives a number that looks correct but is wrong.

**Use `cumulative` for rows you can add together, when you want a running total.** Examples are ledger entries, cash movements and units shipped. The value for March includes all months up to March.

**Use `snapshot` when each row is already a state at one time.** Examples are stock on hand, headcount and open tickets. If you add these rows across months, the total is much too large.

Use this test. Add two adjacent periods together. If the result has a meaning, use `cumulative`. If it does not, use `snapshot`.

### Cumulative

Add a `cumulative` key to a query metric. Name the date to accumulate along.

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

```dax
-- Power BI equivalent
Cumulative Sales =
CALCULATE (
    [Total Sales],
    FILTER ( ALL ( 'Date' ), 'Date'[Date] <= MAX ( 'Date'[Date] ) )
)
```

The date column can be on the aggregation table or on a parent table that Compass can reach upwards. In this example, `orders` is a parent of `order_lines`.

Compass runs a cumulative metric in two steps:

1. SQL aggregates each period in the usual way. There is no window function.
2. Compass then adds the running total to the result rows.

The second step has three important behaviours.

**Compass fills the gaps.** It writes a row for each group and each date in the result. A customer who buys in January and April has a value in February and March. The value stays at the January total.

**Only `sum` and `count` are permitted.** A cumulative `average`, `min`, `max` or `median` throws an error, because Compass cannot combine those results correctly.

**Compass applies a lower date limit after it adds the totals.** A filter for "March and later" does not go into the SQL. Compass applies it to the rows instead. The March total therefore still includes January and February. A filter for one exact date becomes `<=` in the SQL, then Compass keeps the one row.

In Power BI you use `ALL` to leave the filter context and rebuild the total. Compass keeps the total for you and moves the filter to a later step.

**Top N uses the last value.** The score is the running total of the most recent period. If Compass added the running totals together, the result would be much too large.

### Snapshot

A snapshot metric is a different metric type. It needs an operation and a date column.

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

```dax
-- Power BI equivalent
Units On Hand =
CALCULATE (
    SUM ( Inventory[units_on_hand] ),
    LASTNONBLANK ( 'Date'[Date], CALCULATE ( COUNTROWS ( Inventory ) ) )
)
```

The rule is simple. Aggregate the rows at the **most recent date in each period** only. Compass joins to a derived table that finds the maximum date. It then removes the rows from earlier dates.

The two conditions are different:

**With a period group**, the derived table finds the maximum date in each period. February shows the last observation in February. If your data has one row for each item each month, the result looks the same as a normal sum. This makes the behaviour easy to misunderstand.

**With no date at all**, the derived table finds one maximum date for all the data. The metric shows the aggregation at that date. Without this rule, "units on hand" would add together all the snapshots.

You must give the `operation`. There is no default value, because the correct operation is a modelling decision. Use `sum` across products, but `max` or `average` for a value that is already aggregated.

### How the three types behave

|                        | Query metric             | Cumulative                       | Snapshot                             |
| ---------------------- | ------------------------ | -------------------------------- | ------------------------------------ |
| No date in the query   | Aggregates all rows      | The total of all periods         | Aggregates the most recent date only |
| One period             | That period only         | All periods up to it             | The most recent date in the period   |
| Permitted operations   | All                      | `sum` and `count` only           | All, but you must give one           |
| Adds into a total row  | If `sum` or `count`      | No                               | Only `sum`, and only with no date    |
| Top N score            | Depends on the operation | The last value                   | The last value                       |
| `shift` and `movement` | Yes                      | Yes, as running totals           | **No. It throws an error**           |
| Periods with no rows   | Absent                   | Present, with the previous total | Absent                               |

Compass throws an error for a shifted snapshot. It does not give a wrong answer. The result of "most recent date in each period" with "move the date axis" is ambiguous.

## 4. Modifiers and layers

Read this section carefully. `modify` looks the same as `CALCULATE`, but one difference causes wrong numbers.

### The difference

```ts
'Gold sales': modify('Total sales', [eq('customers', 'Tier', dynamic('Gold'))]),
```

```dax
Gold Sales = CALCULATE ( [Total Sales], Customers[Tier] = "Gold" )
```

These two agree. They stop agreeing when you add a second layer.

In DAX, a filter in `CALCULATE` **replaces** the filter context for that column. If you write `CALCULATE([Gold Sales], Customers[Tier] = "Silver")`, the new filter replaces the Gold filter. The result is Silver sales.

In Compass, `modify` **adds** the filter. Compass collects the filters from all the layers into one list and joins them with `AND`. This is the same as `KEEPFILTERS` on each DAX filter.

The Compass equivalent therefore gives `Tier = 'Gold' AND Tier = 'Silver'`. The result is zero rows. Compass gives no error and no warning.

**A layer can only make the result smaller.** You cannot make it larger. There is no `ALL` or `REMOVEFILTERS`. To get "Silver and not Gold", start again from a metric above both of them.

### An example with four layers

Each layer adds one filter. The filters use three tables.

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

### How Compass combines the layers

Compass does not calculate the layers one at a time. It follows the `base` chain to the bottom. It then collects all the filters into one list.

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

Compass compiles this to one query. It adds the joins for the tables in the filters.

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

There are four results.

**The order of the layers does not matter.** All the filters go into one `AND` list. In DAX, the order decides which `CALCULATE` wins.

**There are no intermediate values.** Compass does not calculate layer 2 and then filter it. It runs the bottom metric one time with all the filters. A metric with five layers costs one query.

**A filter can use any table above the aggregation table.** Layer 3 filters `regions`, which is three joins from `order_lines`. Compass adds the joins. You never write a `from` or a `join`.

**Two layers on the same column give zero rows.** This is the main risk. In DAX the second filter replaces the first, and you get a number that looks correct. In Compass you get zero, and nothing tells you why.

### `modify` inherits the filters only

Each layer in the example above repeats its `formatter`. This is necessary.

The `formatter`, `synonyms`, `schema` and `access` belong to one metric. A `modify` metric with no formatter has no formatter, even if its base has one. The value then has no format. Only `base` and `filters` continue down the chain.

Write the formatter on each metric. Developers forget this more than anything else.

### Metrics you cannot modify

**You cannot use a `combine` metric as a base.** Compass throws an error. Move the filters into the two parts and build the ratio from the new metrics.

```ts
// Wrong. This throws an error.
'Gold margin %': modify('Gross margin %', [eq('customers', 'Tier', dynamic('Gold'))]),

// Correct. Filter the two parts, then divide.
'Gold gross profit': modify('Gross profit', [eq('customers', 'Tier', dynamic('Gold'))]),
'Gold sales': modify('Total sales', [eq('customers', 'Tier', dynamic('Gold'))]),
'Gold margin %': divide('Gold gross profit', 'Gold sales', {
  formatter: formatPercentage,
}),
```

**A metric cannot refer to itself**, directly or through other metrics.

### Metric filters and query filters

The two types behave differently:

|                    | Filter in a `modify` | Filter in the query             |
| ------------------ | -------------------- | ------------------------------- |
| Compass applies it | Always               | Only if it can reach the metric |
| If it cannot reach | Not applicable       | Compass removes it              |
| Joined with        | `AND`                | `AND`                           |

The filters in a metric are part of its definition. Compass never removes them.

### The filter builders

`metricBuilderHelpers(tables)` gives you `eq`, `compare`, `inFilter`, `notIn`, `isNull`, `isNotNull` and `like`.

Put the comparison value in a wrapper. Use `dynamic(value)` for a fixed value. Use `ago(n, unit)` for a relative date.

`ago(30, 'day')` is 30 days before now. `ago(1, 'month', { aligned: true })` starts at the first day of this month, so the period is a full calendar month.

```ts
const recentOrders = compare('orders', 'Order date', '>=', ago(90, 'day'))
const notCancelled = eq('orders', 'Is cancelled', dynamic(false))
const coreCategories = inFilter('products', 'Category', [
  'Beverages',
  'Produce',
])
```

The model is TypeScript. Put a shared filter in a `const` and use it in more than one metric. This replaces the DAX `VAR`.

## 5. Syntax comparison

### Metric definitions

| Task             | DAX                                                  | Compass                                                             |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| Sum              | `Total Sales = SUM('Order Lines'[line_total])`       | `queryMetric('sum', 'order_lines', 'Line total')`                   |
| Count rows       | `Order Count = COUNTROWS(Orders)`                    | `countMetric('orders')`                                             |
| Distinct count   | `Customers = DISTINCTCOUNT(Orders[customer_id])`     | `queryMetric('distinctCount', 'orders', 'customer_id')`             |
| Average          | `Avg Line = AVERAGE('Order Lines'[line_total])`      | `queryMetric('average', 'order_lines', 'Line total')`               |
| Median           | `Median Line = MEDIAN('Order Lines'[line_total])`    | `queryMetric('median', 'order_lines', 'Line total')`                |
| 95th percentile  | `PERCENTILE.INC(..., 0.95)`                          | `percentileMetric(0.95, 'order_lines', 'Line total')`               |
| Filtered measure | `CALCULATE([Total Sales], Customers[Tier] = "Gold")` | `modify('Total sales', [eq('customers', 'Tier', dynamic('Gold'))])` |
| Ratio            | `DIVIDE([Gross Profit], [Total Sales])`              | `divide('Gross profit', 'Total sales')`                             |
| Difference       | `Gross Profit = [Total Sales] - [Total Cost]`        | `combine` with `subtract`                                           |

A `combine` metric:

```ts
'Gross profit': {
  type: 'combine',
  operation: 'subtract',
  left: 'Total sales',
  right: 'Total cost',
  formatter: currencyFormatter(0),
},
```

The `operation` is `add`, `subtract` or `multiply`, which use `left` and `right`. It can also be `divide`, which uses `numerator` and `denominator`. The `divide(...)` builder is a short form for the last one.

Compass calculates a combine metric in TypeScript after the SQL for each part returns. This is why a combine metric can use two different fact tables. It is also why you cannot use one as a `modify` base.

### Time intelligence

Compass metrics have no time intelligence functions. A transform in the query does this work. You therefore define `Total sales` one time. You do not also define `Total Sales LY`.

| DAX                                                          | Compass                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------- |
| `CALCULATE([Total Sales], SAMEPERIODLASTYEAR('Date'[Date]))` | `shift` with the offset `{ amount: -12, unit: 'month' }` |
| `CALCULATE([Total Sales], PREVIOUSMONTH('Date'[Date]))`      | `shift` with the offset `{ amount: -1, unit: 'month' }`  |
| `[Total Sales] - [Total Sales LY]`                           | `movement` with the same offset                          |

There are two operations. `shift(x, offset)` gives the value from a different period. `movement(x, offset)` gives the change from that period. A negative amount looks backwards in time.

Five points are different from DAX:

- **Use a transform with a date.** With a period group, each period compares to the offset period. With a date filter only, one value compares to one earlier period.
- **Compass makes the filter window larger.** If you filter to "February and later" and ask for the value of the previous month, Compass reads January. It moves the window. It does not move the rows it already has.
- **`movement` runs two queries** and subtracts one from the other.
- **A shifted cumulative metric gives the running total of the previous period.** The movement of a cumulative metric is therefore the increase in this period.
- **You cannot shift a snapshot metric.** It throws an error.

Compass names the result column from the metric and the offset. A `Total sales` metric shifted by `-1 month` becomes `Total sales_prev_1_month`. Its movement becomes `Total sales_mvmt_prev_1_month`. A metric, its shift and its movement can therefore be in one result together.

### Top N

| DAX                                                          | Compass                                                          |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| `TOPN(10, VALUES(Customers[Customer]), [Total Sales], DESC)` | `topN: { n: 10, dimension: ..., metric: ..., direction: 'top' }` |
| An "Other" row built with `ALLEXCEPT`                        | `others: 'group'`                                                |
| Rank inside a category                                       | `partitionBy`                                                    |

`others: 'hide'` removes the other rows. `others: 'group'` puts them into one "Other" row. The totals for each period stay correct.

The ranked dimension does not need to be in the select. If you ask for "total sales from the top 3 customers", Compass adds the dimension, ranks the rows, then groups them again.

**The score is not always a sum.** Compass cannot rank some metrics. It rejects `distinctCount`, because the sum of the distinct counts of each group is too large, and the correct value needs the source rows. Compass does not support an average or a `combine` metric as a rank metric yet. The "Other" row for these metrics is null, not a wrong number.

### Dates and relative periods

A date filter value must be an ISO 8601 string. Use `2026-07-01` or `2026-07-01T00:00:00`. Compass rejects all other formats, such as `01/07/2026`, `July 1, 2026` and `2026-07`.

This rule prevents wrong answers. Postgres reads `01/07/2026` as 7 January with its default settings. It gives a wrong result and no error.

Use `ago(n, unit)` for a relative period. Do not calculate a date yourself. Add `{ aligned: true }` for full calendar periods.

### Row-level security

Power BI RLS is a role with a DAX filter expression. Compass RLS is a group with a table and a column, and a value for each user.

```ts
const rlsGroups = [
  { id: 'region', name: 'Region', table: 'regions', column: 'id' },
]

const rlsUserEntries = [
  { groupId: 'region', email: 'north.manager@example.com', value: 1 },
]
```

Two differences are important:

- **Compass matches a value. It does not evaluate an expression.** There is no equivalent of a DAX predicate and no `USERNAME()` function.
- **RLS filters obey the same reachability rule as query filters.** Compass removes them if they cannot reach the metric. Set `enforced: true` to throw an error instead. Use `enforced` only if RLS covers every table those users can query. If it does not, their other queries throw errors.

Table and metric `access` is the larger control. Use `{ type: 'all' }` or `{ type: 'specified', groups, emails }`. The group names are a fixed list: `admin`, `manager` and `staff`.

## 6. Worked examples

### A margin calculation

Build the calculation one metric at a time. You can query each metric on its own. This is better than one DAX measure with many `CALCULATE` calls inside it.

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

A combine metric can use another combine metric. `Gross profit` therefore uses `Gross profit before discount`. Give each step a name. A user can then ask about profit before the discount, and you do not write another metric.

### A rate from two filtered metrics

In DAX you write `CALCULATE` two times for this.

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

`Fulfilled orders` uses `Live orders` as its base, not `Total orders`. Layers only make a result smaller. The top number can therefore never include a cancelled order that the bottom number excludes. The rate cannot be more than 100%. If both metrics used `Total orders`, you must keep the two filter lists correct yourself.

The `synonyms` value here is a sentence, not one word. Synonyms can be phrases. A short description of a rate helps the LLM to select the correct metric.

### When a number looks wrong

Examine these in order:

1. **Do two layers filter the same column?** The filters give zero rows. Examine all the layers, not the top one only.
2. **Does the value have no format?** The metric has no `formatter`. Formatters do not move down the chain.
3. **Did Compass ignore a query filter?** The filter cannot reach the aggregation table of that metric, so Compass removed it.
4. **Is a percentage 100 times too large?** `formatPercentage` needs a ratio.
5. **Is a stock or headcount value too large?** Use a `snapshot` metric, not a query metric.
6. **Does a running total start at the wrong value?** This is correct behaviour. Compass keeps the total from before the date filter.
7. **Is a total row empty?** Compass cannot calculate a total for some operations, so it gives null instead of a wrong number.

## Common mistakes

- **There is no filter context.** There is no `ALL`, `ALLEXCEPT` or `REMOVEFILTERS`. Filters only intersect.
- **`modify` is `CALCULATE` with `KEEPFILTERS` on each filter.** Layers make the result smaller. They never replace a filter.
- **Formatters, synonyms and schemas do not move down a `modify` chain.**
- **Each metric is one SQL query.** More metrics on the screen means more queries.
- **Compass cannot add some metrics into a total.** Averages, medians and distinct counts give null in a total row or an "Other" row.
- **Compass can remove a query filter without a message.** It never removes the filters in a metric.
- **You cannot shift a snapshot metric.** A cumulative metric permits `sum` and `count` only. Both give an error.
- **Names change the results.** An LLM reads your model. Good names and synonyms are a requirement.
