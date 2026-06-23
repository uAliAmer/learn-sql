export type SyntaxRole = "keyword" | "slot" | "literal";

export interface SyntaxPart {
  text: string;
  role: SyntaxRole;
  /** Short caption explaining this piece (shown under the diagram). */
  note?: string;
}

export interface Lesson {
  id: string;
  title: string;
  /** Sidebar grouping header. */
  section: string;
  /** Short concept tag shown as a chip (must match a key in CONCEPTS). */
  concept: string;
  databaseId: string;
  /** One punchy sentence — the "aha" of the lesson (light markdown). */
  keyIdea: string;
  /** The single, explicit instruction — the hero of the lesson. */
  task: string;
  /**
   * The statement *pattern* as labeled building blocks: keywords are literal,
   * `slot`s are `<placeholders>` the learner fills in. Never the real answer.
   */
  syntax: SyntaxPart[];
  hint: string;
  /** Starter shown in the editor. `${n:label}` marks a fill-in-the-blank field. */
  starterTemplate: string;
  /** Reference answer used to grade. */
  solutionSql: string;
  /**
   * For write lessons (INSERT/UPDATE/DELETE): a SELECT run after the script to
   * compare the resulting table state. Omit for read lessons.
   */
  checkSql?: string;
  /** When true, row order is part of the answer (ORDER BY lessons). */
  orderMatters?: boolean;
}

// Builders keep the syntax templates readable.
const kw = (text: string, note?: string): SyntaxPart => ({ text, role: "keyword", note });
const slot = (text: string, note?: string): SyntaxPart => ({ text, role: "slot", note });
const lit = (text: string, note?: string): SyntaxPart => ({ text, role: "literal", note });

const BASICS = "Querying basics";
const AGG = "Aggregating";
const JOINS = "Joining tables";
const FURTHER = "Going further";
const JSON_S = "JSON";
const WRITES = "Changing data";
const INDEXES = "Indexes";
const EXT = "Extensions";

export const LESSONS: Lesson[] = [
  // ----------------------------------------------------------------- Basics
  {
    id: "select-all",
    title: "Read a whole table",
    section: BASICS,
    concept: "SELECT",
    databaseId: "shop",
    keyIdea: "`SELECT *` hands you **every column of every row** — the whole table.",
    task: "Return **every column** of **every row** in the `products` table.",
    syntax: [kw("SELECT"), lit("*", "means: all columns"), kw("FROM"), slot("<table>", "which table to read")],
    hint: "SELECT * FROM table_name;",
    starterTemplate: "SELECT * FROM products;",
    solutionSql: "SELECT * FROM products;",
  },
  {
    id: "select-columns",
    title: "Pick specific columns",
    section: BASICS,
    concept: "SELECT",
    databaseId: "shop",
    keyIdea: "Name the columns you want, in order — and skip the rest.",
    task: "List the `name` and `price` of **every** product.",
    syntax: [kw("SELECT"), slot("<columns>", "comma-separated list"), kw("FROM"), slot("<table>")],
    hint: "Put the column names after SELECT, separated by commas.",
    starterTemplate: "SELECT ${1:___}, ${2:___} FROM products;",
    solutionSql: "SELECT name, price FROM products;",
  },
  {
    id: "where-number",
    title: "Filter rows with WHERE",
    section: BASICS,
    concept: "WHERE",
    databaseId: "shop",
    keyIdea: "`WHERE` is a gate: only rows that **pass the test** come through.",
    task: "List the `name` and `price` of products that cost **more than 50**.",
    syntax: [
      kw("SELECT"),
      slot("<columns>"),
      kw("FROM"),
      slot("<table>"),
      kw("WHERE"),
      slot("<condition>", "a test, e.g. column > value"),
    ],
    hint: "... WHERE price > 50;",
    starterTemplate: "SELECT name, price FROM products WHERE ${1:___};",
    solutionSql: "SELECT name, price FROM products WHERE price > 50;",
  },
  {
    id: "where-text",
    title: "Combine conditions",
    section: BASICS,
    concept: "WHERE",
    databaseId: "shop",
    keyIdea: "Chain tests with `AND` (both true) or `OR` (either true).",
    task: "List the `name` and `price` of **Electronics** products that cost **less than 60**.",
    syntax: [
      kw("SELECT"),
      slot("<columns>"),
      kw("FROM"),
      slot("<table>"),
      kw("WHERE"),
      slot("<condition>", "text values go in 'single quotes'"),
      kw("AND"),
      slot("<condition>", "both tests must hold"),
    ],
    hint: "Text values go in single quotes: category = 'Electronics'. Join two conditions with AND.",
    starterTemplate:
      "SELECT name, price FROM products WHERE ${1:___} AND ${2:___};",
    solutionSql:
      "SELECT name, price FROM products WHERE category = 'Electronics' AND price < 60;",
  },
  {
    id: "distinct",
    title: "Remove duplicates",
    section: BASICS,
    concept: "DISTINCT",
    databaseId: "shop",
    keyIdea: "`DISTINCT` collapses duplicate rows, leaving **one of each**.",
    task: "List each **distinct** product `category` (no repeats).",
    syntax: [kw("SELECT"), kw("DISTINCT"), slot("<column>"), kw("FROM"), slot("<table>")],
    hint: "SELECT DISTINCT category FROM products;",
    starterTemplate: "SELECT DISTINCT ${1:___} FROM products;",
    solutionSql: "SELECT DISTINCT category FROM products;",
  },
  {
    id: "like",
    title: "Match text patterns",
    section: BASICS,
    concept: "Pattern",
    databaseId: "shop",
    keyIdea: "`LIKE` matches a pattern; `%` stands for **any run of characters**.",
    task: "List the `name` of products whose name contains **Desk** (use `LIKE`).",
    syntax: [
      kw("SELECT"),
      slot("<columns>"),
      kw("FROM"),
      slot("<table>"),
      kw("WHERE"),
      slot("<column>"),
      kw("LIKE"),
      slot("'%text%'", "% matches anything around it"),
    ],
    hint: "WHERE name LIKE '%Desk%'  — % means any characters before/after.",
    starterTemplate: "SELECT name FROM products WHERE ${1:___} LIKE ${2:___};",
    solutionSql: "SELECT name FROM products WHERE name LIKE '%Desk%';",
  },
  {
    id: "in",
    title: "Match a list of values",
    section: BASICS,
    concept: "Sets",
    databaseId: "shop",
    keyIdea: "`IN (…)` tests membership in a list — shorthand for many `OR`s.",
    task: "List the `name` and `category` of products in the **Home** or **Stationery** categories, using `IN`.",
    syntax: [
      kw("SELECT"),
      slot("<columns>"),
      kw("FROM"),
      slot("<table>"),
      kw("WHERE"),
      slot("<column>"),
      kw("IN"),
      slot("(<v1>, <v2>)", "the allowed values"),
    ],
    hint: "WHERE category IN ('Home', 'Stationery')",
    starterTemplate: "SELECT name, category FROM products WHERE ${1:___} IN (${2:___});",
    solutionSql:
      "SELECT name, category FROM products WHERE category IN ('Home', 'Stationery');",
  },
  {
    id: "order-limit",
    title: "Sort and limit",
    section: BASICS,
    concept: "ORDER BY",
    databaseId: "shop",
    keyIdea: "`ORDER BY` sorts; `DESC` flips high→low; `LIMIT` takes the top slice.",
    task: "Show the `name` and `price` of the **3 most expensive** products, priciest first.",
    syntax: [
      kw("SELECT"),
      slot("<columns>"),
      kw("FROM"),
      slot("<table>"),
      kw("ORDER BY"),
      slot("<column> [DESC]", "sort key + direction"),
      kw("LIMIT"),
      slot("<n>", "how many rows"),
    ],
    hint: "ORDER BY price DESC LIMIT 3. DESC = high → low.",
    starterTemplate: "SELECT name, price FROM products ORDER BY ${1:___} LIMIT ${2:___};",
    solutionSql: "SELECT name, price FROM products ORDER BY price DESC LIMIT 3;",
    orderMatters: true,
  },

  // ------------------------------------------------------------- Aggregating
  {
    id: "count",
    title: "Count rows",
    section: AGG,
    concept: "Aggregate",
    databaseId: "shop",
    keyIdea: "`count(*)` reports **how many rows** — one number, not a list.",
    task: "Count **how many customers** there are.",
    syntax: [kw("SELECT"), lit("count(*)", "counts all rows"), kw("FROM"), slot("<table>")],
    hint: "SELECT count(*) FROM customers;",
    starterTemplate: "SELECT ${1:___} FROM customers;",
    solutionSql: "SELECT count(*) FROM customers;",
  },
  {
    id: "group-by",
    title: "Group and count",
    section: AGG,
    concept: "GROUP BY",
    databaseId: "shop",
    keyIdea: "`GROUP BY` makes buckets; the aggregate runs **once per bucket**.",
    task: "For each `category`, show the category and **how many products** it has.",
    syntax: [
      kw("SELECT"),
      slot("<column>"),
      lit("count(*)"),
      kw("FROM"),
      slot("<table>"),
      kw("GROUP BY"),
      slot("<column>", "the bucket key"),
    ],
    hint: "SELECT category, count(*) FROM products GROUP BY category;",
    starterTemplate: "SELECT category, ${1:___} FROM products GROUP BY ${2:___};",
    solutionSql: "SELECT category, count(*) FROM products GROUP BY category;",
  },
  {
    id: "having",
    title: "Filter groups with HAVING",
    section: AGG,
    concept: "GROUP BY",
    databaseId: "shop",
    keyIdea: "`HAVING` is `WHERE` for groups — it filters **after** aggregating.",
    task: "Show each `category` and its **total stock** (`sum(stock)`), keeping only categories whose total stock is **over 100**.",
    syntax: [
      kw("SELECT"),
      slot("<column>, <aggregate>"),
      kw("FROM"),
      slot("<table>"),
      kw("GROUP BY"),
      slot("<column>"),
      kw("HAVING"),
      slot("<test on aggregate>", "filters whole groups"),
    ],
    hint: "GROUP BY category HAVING sum(stock) > 100",
    starterTemplate:
      "SELECT category, sum(stock) FROM products GROUP BY category HAVING ${1:___};",
    solutionSql:
      "SELECT category, sum(stock) FROM products GROUP BY category HAVING sum(stock) > 100;",
  },

  // ----------------------------------------------------------- Joining tables
  {
    id: "join",
    title: "Join two tables",
    section: JOINS,
    concept: "JOIN",
    databaseId: "shop",
    keyIdea: "A `JOIN` glues two tables where a column in one **matches** a column in the other.",
    task: "Show each order's `id` and the **name of the customer** who placed it. (`orders.customer_id` matches `customers.id`.)",
    syntax: [
      kw("SELECT"),
      slot("<columns>"),
      kw("FROM"),
      slot("<table a>"),
      kw("JOIN"),
      slot("<table b>"),
      kw("ON"),
      slot("<a.key = b.key>", "the matching columns"),
    ],
    hint: "SELECT o.id, c.name FROM orders o JOIN customers c ON o.customer_id = c.id;",
    starterTemplate:
      "SELECT o.id, c.name\nFROM orders o\nJOIN customers c ON ${1:___} = ${2:___};",
    solutionSql:
      "SELECT o.id, c.name FROM orders o JOIN customers c ON o.customer_id = c.id;",
  },
  {
    id: "left-join",
    title: "Keep unmatched rows (LEFT JOIN)",
    section: JOINS,
    concept: "JOIN",
    databaseId: "shop",
    keyIdea: "`LEFT JOIN` keeps **every left-table row**, filling NULLs where the right side has no match.",
    task: "List every customer's `name` and **how many orders** they've placed — including customers with **zero** orders. Alias the count `orders`.",
    syntax: [
      kw("SELECT"),
      slot("<columns>, count(...)"),
      kw("FROM"),
      slot("<left table>"),
      kw("LEFT JOIN"),
      slot("<right table>"),
      kw("ON"),
      slot("<keys match>"),
      kw("GROUP BY"),
      slot("<column>"),
    ],
    hint: "SELECT c.name, count(o.id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.name;  — count(o.id) is 0 when there are no orders.",
    starterTemplate:
      "SELECT c.name, count(o.id) AS orders\nFROM customers c\nLEFT JOIN orders o ON ${1:___}\nGROUP BY ${2:___};",
    solutionSql:
      "SELECT c.name, count(o.id) AS orders FROM customers c LEFT JOIN orders o ON o.customer_id = c.id GROUP BY c.name;",
  },
  {
    id: "join-aggregate",
    title: "Capstone: revenue per customer",
    section: JOINS,
    concept: "JOIN",
    databaseId: "shop",
    keyIdea: "Real questions **chain joins**, then group + aggregate the result.",
    task: "For every customer who has ordered, show their `name` and **total revenue** — `sum(quantity * unit_price)` across all their order items, aliased `revenue`. Join `customers` → `orders` → `order_items`.",
    syntax: [
      kw("SELECT"),
      slot("<columns>, <aggregate>"),
      kw("FROM"),
      slot("<table 1>"),
      kw("JOIN"),
      slot("<table 2>"),
      kw("ON"),
      slot("<keys match>"),
      kw("JOIN"),
      slot("<table 3>"),
      kw("ON"),
      slot("<keys match>"),
      kw("GROUP BY"),
      slot("<column>", "one row per customer"),
    ],
    hint: "JOIN orders ON orders.customer_id = customers.id, then JOIN order_items ON order_items.order_id = orders.id, then GROUP BY the customer and SUM(quantity * unit_price).",
    starterTemplate:
      "SELECT c.name, sum(oi.quantity * oi.unit_price) AS revenue\nFROM customers c\nJOIN orders o ON ${1:___}\nJOIN order_items oi ON ${2:___}\nGROUP BY ${3:___};",
    solutionSql:
      "SELECT c.name, sum(oi.quantity * oi.unit_price) AS revenue FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id GROUP BY c.name;",
  },

  // ------------------------------------------------------------- Going further
  {
    id: "subquery",
    title: "Subqueries",
    section: FURTHER,
    concept: "Subquery",
    databaseId: "shop",
    keyIdea: "A **subquery** is a query in parentheses whose result feeds the outer query.",
    task: "List the `name` and `price` of products that cost **more than the average** product price.",
    syntax: [
      kw("SELECT"),
      slot("<columns>"),
      kw("FROM"),
      slot("<table>"),
      kw("WHERE"),
      slot("<column> >"),
      slot("( SELECT avg(...) FROM ... )", "runs first, returns one value"),
    ],
    hint: "WHERE price > (SELECT avg(price) FROM products)",
    starterTemplate: "SELECT name, price FROM products WHERE price > (${1:___});",
    solutionSql:
      "SELECT name, price FROM products WHERE price > (SELECT avg(price) FROM products);",
  },
  {
    id: "cte",
    title: "Name a result with WITH (CTE)",
    section: FURTHER,
    concept: "CTE",
    databaseId: "shop",
    keyIdea: "`WITH` names a result up front (a CTE), so the main query can read it like a table.",
    task: "Using a `WITH` clause, compute each `category`'s average price, then list categories whose average is **above 100**. Show `category` and the average (`avg_price`).",
    syntax: [
      kw("WITH"),
      slot("<name>", "names the result"),
      kw("AS"),
      slot("( <query> )", "the inner query"),
      kw("SELECT"),
      slot("<columns>"),
      kw("FROM"),
      slot("<name>", "use it like a table"),
      kw("WHERE"),
      slot("<condition>"),
    ],
    hint: "WITH cat AS (SELECT category, avg(price) AS avg_price FROM products GROUP BY category) SELECT category, avg_price FROM cat WHERE avg_price > 100;",
    starterTemplate:
      "WITH cat AS (\n  ${1:___}\n)\nSELECT category, avg_price FROM cat WHERE ${2:___};",
    solutionSql:
      "WITH cat AS (SELECT category, avg(price) AS avg_price FROM products GROUP BY category) SELECT category, avg_price FROM cat WHERE avg_price > 100;",
  },
  {
    id: "case",
    title: "If/then logic with CASE",
    section: FURTHER,
    concept: "CASE",
    databaseId: "shop",
    keyIdea: "`CASE WHEN … THEN … ELSE … END` adds if/then logic to a column.",
    task: "Show each product's `name` and a price **tier**: under 20 → `cheap`, under 100 → `mid`, otherwise → `pricey`. Alias it `tier`.",
    syntax: [
      kw("SELECT"),
      slot("<column>,"),
      kw("CASE WHEN"),
      slot("<test>"),
      kw("THEN"),
      slot("<value>"),
      lit("…"),
      kw("ELSE"),
      slot("<value>"),
      kw("END"),
      kw("FROM"),
      slot("<table>"),
    ],
    hint: "CASE WHEN price < 20 THEN 'cheap' WHEN price < 100 THEN 'mid' ELSE 'pricey' END AS tier",
    starterTemplate:
      "SELECT name,\n  CASE WHEN ${1:___} THEN 'cheap'\n       WHEN ${2:___} THEN 'mid'\n       ELSE ${3:___} END AS tier\nFROM products;",
    solutionSql:
      "SELECT name, CASE WHEN price < 20 THEN 'cheap' WHEN price < 100 THEN 'mid' ELSE 'pricey' END AS tier FROM products;",
  },

  // ----------------------------------------------------------------------- JSON
  {
    id: "json-get",
    title: "Read a JSON field",
    section: JSON_S,
    concept: "JSON",
    databaseId: "json",
    keyIdea: "`->` gets a JSON field (still JSON); `->>` gets it **as text**.",
    task: "Show each user's `name` and their **city** — the `city` field from the `profile` JSON, as text. Alias it `city`.",
    syntax: [
      kw("SELECT"),
      slot("<column>,"),
      slot("profile ->> '<key>'", "->> returns the value as text"),
      kw("FROM"),
      slot("<table>"),
    ],
    hint: "SELECT name, profile ->> 'city' AS city FROM users;",
    starterTemplate: "SELECT name, ${1:___} AS city FROM users;",
    solutionSql: "SELECT name, profile ->> 'city' AS city FROM users;",
  },
  {
    id: "json-filter",
    title: "Filter on a JSON field",
    section: JSON_S,
    concept: "JSON",
    databaseId: "json",
    keyIdea: "Extract the field first, then compare: `profile ->> 'plan' = 'pro'`.",
    task: "List the `name` of users on the **pro** plan — where `profile`'s `plan` field equals `pro`.",
    syntax: [
      kw("SELECT"),
      slot("<column>"),
      kw("FROM"),
      slot("<table>"),
      kw("WHERE"),
      slot("profile ->> '<key>' = '<value>'", "compare the extracted text"),
    ],
    hint: "WHERE profile ->> 'plan' = 'pro'",
    starterTemplate: "SELECT name FROM users WHERE ${1:___} = 'pro';",
    solutionSql: "SELECT name FROM users WHERE profile ->> 'plan' = 'pro';",
  },
  {
    id: "json-nested",
    title: "Reach into nested JSON",
    section: JSON_S,
    concept: "JSON",
    databaseId: "json",
    keyIdea: "Chain `->` to dig through nested objects, then `->>` for the final text.",
    task: "Show each user's `name` and their **country**, nested at `profile.address.country`. Alias it `country`.",
    syntax: [
      kw("SELECT"),
      slot("<column>,"),
      slot("profile -> '<key>' ->> '<key>'", "dig in with ->, finish with ->>"),
      kw("FROM"),
      slot("<table>"),
    ],
    hint: "profile -> 'address' ->> 'country'   (or  profile #>> '{address,country}')",
    starterTemplate: "SELECT name, ${1:___} AS country FROM users;",
    solutionSql: "SELECT name, profile -> 'address' ->> 'country' AS country FROM users;",
  },
  {
    id: "json-contains",
    title: "Containment with @>",
    section: JSON_S,
    concept: "JSON",
    databaseId: "json",
    keyIdea: "`@>` tests whether a JSON value **contains** a sub-object — and a GIN index can speed it up.",
    task: 'List the `name` of users whose `profile` **contains** `{"plan": "pro"}`, using the `@>` operator.',
    syntax: [
      kw("SELECT"),
      slot("<column>"),
      kw("FROM"),
      slot("<table>"),
      kw("WHERE"),
      slot("profile @> '<json>'", "right side must be contained"),
    ],
    hint: 'WHERE profile @> \'{"plan": "pro"}\'',
    starterTemplate: "SELECT name FROM users WHERE profile @> '${1:___}';",
    solutionSql: 'SELECT name FROM users WHERE profile @> \'{"plan": "pro"}\';',
  },
  {
    id: "json-array",
    title: "Expand a JSON array",
    section: JSON_S,
    concept: "JSON",
    databaseId: "json",
    keyIdea: "`jsonb_array_elements_text(arr)` turns a JSON array into **one row per element**.",
    task: "Each user has a `tags` array in `profile`. List each user's `name` next to **each of their tags** (one row per tag), aliasing the tag `tag`.",
    syntax: [
      kw("SELECT"),
      slot("u.name, t AS tag"),
      kw("FROM"),
      slot("<table> u,"),
      slot("jsonb_array_elements_text(u.profile -> 'tags')", "array → one row each"),
      kw("AS"),
      slot("t"),
    ],
    hint: "SELECT u.name, t AS tag FROM users u, jsonb_array_elements_text(u.profile -> 'tags') AS t;",
    starterTemplate: "SELECT u.name, t AS tag\nFROM users u, ${1:___} AS t;",
    solutionSql:
      "SELECT u.name, t AS tag FROM users u, jsonb_array_elements_text(u.profile -> 'tags') AS t;",
  },
  {
    id: "json-set",
    title: "Update a JSON field",
    section: JSON_S,
    concept: "JSON",
    databaseId: "json",
    keyIdea: "`jsonb_set(doc, path, value)` updates a field; the new value must be valid JSON.",
    task: "Upgrade **Amara Okafor** to the `enterprise` plan: use `jsonb_set` to set `profile`'s `plan` field.",
    syntax: [
      kw("UPDATE"),
      slot("<table>"),
      kw("SET"),
      slot("profile = jsonb_set(profile, '{<key>}', '<json>')", "path in {braces}, value as JSON"),
      kw("WHERE"),
      slot("<condition>"),
    ],
    hint: "UPDATE users SET profile = jsonb_set(profile, '{plan}', '\"enterprise\"') WHERE name = 'Amara Okafor';",
    starterTemplate:
      "UPDATE users SET profile = jsonb_set(profile, '{plan}', ${1:___}) WHERE ${2:___};",
    solutionSql:
      "UPDATE users SET profile = jsonb_set(profile, '{plan}', '\"enterprise\"') WHERE name = 'Amara Okafor';",
    checkSql: "SELECT name, profile ->> 'plan' AS plan FROM users ORDER BY name;",
  },

  // ------------------------------------------------------------- Changing data
  {
    id: "insert",
    title: "Insert a row",
    section: WRITES,
    concept: "Write",
    databaseId: "shop",
    keyIdea: "`INSERT` adds a brand-new row from the values you supply.",
    task: "Add a new product: name **Laptop Stand**, category **Home**, price **45.00**, stock **50**.",
    syntax: [
      kw("INSERT INTO"),
      slot("<table>"),
      slot("(<columns>)", "target columns"),
      kw("VALUES"),
      slot("(<values>)", "in the same order as the columns"),
    ],
    hint: "INSERT INTO products (name, category, price, stock) VALUES ('Laptop Stand', 'Home', 45.00, 50);",
    starterTemplate:
      "INSERT INTO products (name, category, price, stock)\nVALUES (${1:___});",
    solutionSql:
      "INSERT INTO products (name, category, price, stock) VALUES ('Laptop Stand', 'Home', 45.00, 50);",
    checkSql:
      "SELECT name, category, price, stock FROM products WHERE name = 'Laptop Stand';",
  },
  {
    id: "update",
    title: "Update existing rows",
    section: WRITES,
    concept: "Write",
    databaseId: "shop",
    keyIdea: "`UPDATE … SET` changes rows; `WHERE` picks which. **No `WHERE` = every row!**",
    task: "Set the **Wireless Mouse**'s `price` to **27.00**.",
    syntax: [
      kw("UPDATE"),
      slot("<table>"),
      kw("SET"),
      slot("<column = value>", "the change to make"),
      kw("WHERE"),
      slot("<condition>", "which rows — don't forget it!"),
    ],
    hint: "UPDATE products SET price = 27.00 WHERE name = 'Wireless Mouse';  (Don't forget WHERE, or you'd change every row!)",
    starterTemplate: "UPDATE products SET ${1:___} WHERE ${2:___};",
    solutionSql:
      "UPDATE products SET price = 27.00 WHERE name = 'Wireless Mouse';",
    checkSql: "SELECT name, price FROM products ORDER BY name;",
  },
  {
    id: "delete",
    title: "Delete rows",
    section: WRITES,
    concept: "Write",
    databaseId: "shop",
    keyIdea: "`DELETE` removes rows matching `WHERE`. **Always check the `WHERE` first.**",
    task: "Customer **Noor Al-Sayed** closed their account — delete them from `customers`.",
    syntax: [
      kw("DELETE FROM"),
      slot("<table>"),
      kw("WHERE"),
      slot("<condition>", "which rows to remove"),
    ],
    hint: "DELETE FROM customers WHERE name = 'Noor Al-Sayed';",
    starterTemplate: "DELETE FROM customers WHERE ${1:___};",
    solutionSql: "DELETE FROM customers WHERE name = 'Noor Al-Sayed';",
    checkSql: "SELECT id, name FROM customers ORDER BY id;",
  },

  // ------------------------------------------------------------------- Indexes
  {
    id: "btree-index",
    title: "Speed up lookups with an index",
    section: INDEXES,
    concept: "Index",
    databaseId: "big",
    keyIdea: "An **index** lets Postgres jump straight to matching rows instead of scanning the whole table.",
    task: "The `events` table has **5,000 rows**. A lookup by `email` reads them all — try `EXPLAIN SELECT * FROM events WHERE email = 'user500@example.com';` and you'll see **Seq Scan**. Create an index on `email` so Postgres can jump straight to matches.",
    syntax: [
      kw("CREATE INDEX"),
      kw("ON"),
      slot("<table>"),
      slot("(<column>)", "the column to index"),
    ],
    hint: "CREATE INDEX ON events (email);  — then re-run the EXPLAIN: it becomes an Index Scan.",
    starterTemplate: "CREATE INDEX ON events (${1:___});",
    solutionSql: "CREATE INDEX ON events (email);",
    checkSql:
      "SELECT count(*) > 0 AS ok FROM pg_indexes WHERE tablename = 'events' AND indexdef ILIKE '%btree (email)%';",
  },
  {
    id: "bloom-index",
    title: "bloom: index many columns at once",
    section: INDEXES,
    concept: "bloom",
    databaseId: "big",
    keyIdea: "A **bloom** index covers many columns in one — ideal when queries filter **arbitrary combinations** by equality.",
    task: "Users filter `events` by any mix of `country`, `plan`, and `status`. Instead of three separate indexes, create **one `bloom` index** covering all three columns. (Then `EXPLAIN SELECT * FROM events WHERE country = 'US' AND status = 'active';` shows a Bitmap Index Scan.)",
    syntax: [
      kw("CREATE INDEX"),
      kw("ON"),
      slot("<table>"),
      kw("USING bloom"),
      slot("(<col>, <col>, <col>)", "the columns it covers"),
    ],
    hint: "CREATE INDEX ON events USING bloom (country, plan, status);",
    starterTemplate: "CREATE INDEX ON events USING bloom (${1:___});",
    solutionSql: "CREATE INDEX ON events USING bloom (country, plan, status);",
    checkSql:
      "SELECT count(*) > 0 AS ok FROM pg_indexes WHERE tablename = 'events' AND indexdef ILIKE '%using bloom %';",
  },

  // ---------------------------------------------------------------- Extensions
  {
    id: "ext-vector",
    title: "pgvector: similarity search",
    section: EXT,
    concept: "pgvector",
    databaseId: "vec",
    keyIdea: "`<->` measures **distance** between vectors; ordering by it = nearest-neighbour search.",
    task: "Find the **2 documents most similar** to the query embedding `[1, 0, 0]`. Show their `title`, closest first.",
    syntax: [
      kw("SELECT"),
      slot("<columns>"),
      kw("FROM"),
      slot("<table>"),
      kw("ORDER BY"),
      slot("<column> <-> '[…]'", "distance to the query vector"),
      kw("LIMIT"),
      slot("<n>"),
    ],
    hint: "SELECT title FROM documents ORDER BY embedding <-> '[1,0,0]' LIMIT 2;",
    starterTemplate: "SELECT title FROM documents ORDER BY ${1:___} LIMIT ${2:___};",
    solutionSql: "SELECT title FROM documents ORDER BY embedding <-> '[1,0,0]' LIMIT 2;",
    orderMatters: true,
  },
  {
    id: "ext-trgm",
    title: "pg_trgm: fuzzy matching",
    section: EXT,
    concept: "pg_trgm",
    databaseId: "fuzzy",
    keyIdea: "`similarity(a, b)` scores how alike two strings are (0–1) using trigrams.",
    task: "Find the **3 contacts whose `name` is most similar** to `Jonathan`. Show `name`, most similar first.",
    syntax: [
      kw("SELECT"),
      slot("<columns>"),
      kw("FROM"),
      slot("<table>"),
      kw("ORDER BY"),
      slot("similarity(<col>, '<text>')", "higher = more alike"),
      kw("DESC"),
      kw("LIMIT"),
      slot("<n>"),
    ],
    hint: "SELECT name FROM contacts ORDER BY similarity(name, 'Jonathan') DESC LIMIT 3;",
    starterTemplate: "SELECT name FROM contacts ORDER BY ${1:___} DESC LIMIT ${2:___};",
    solutionSql: "SELECT name FROM contacts ORDER BY similarity(name, 'Jonathan') DESC LIMIT 3;",
    orderMatters: true,
  },
  {
    id: "ext-hstore",
    title: "hstore: key/value column",
    section: EXT,
    concept: "hstore",
    databaseId: "kv",
    keyIdea: "`hstore` stores key/value pairs in one column; `->` reads a value by key.",
    task: "For each item in `catalog`, show its `name` and its **color** — the `color` key from `attrs`, aliased `color`.",
    syntax: [
      kw("SELECT"),
      slot("<column>,"),
      slot("attrs -> '<key>'", "reads a value by key"),
      kw("FROM"),
      slot("<table>"),
    ],
    hint: "SELECT name, attrs -> 'color' AS color FROM catalog;",
    starterTemplate: "SELECT name, ${1:___} AS color FROM catalog;",
    solutionSql: "SELECT name, attrs -> 'color' AS color FROM catalog;",
  },
  {
    id: "ext-ltree",
    title: "ltree: hierarchical paths",
    section: EXT,
    concept: "ltree",
    databaseId: "tree",
    keyIdea: "`ltree` paths model hierarchies; `<@` means **is a descendant of**.",
    task: "List the `name` of every category **under** `all.electronics` (its descendants, including itself), using `<@`.",
    syntax: [
      kw("SELECT"),
      slot("<columns>"),
      kw("FROM"),
      slot("<table>"),
      kw("WHERE"),
      slot("path <@ '<ancestor>'", "<@ = is a descendant of"),
    ],
    hint: "SELECT name FROM categories WHERE path <@ 'all.electronics';",
    starterTemplate: "SELECT name FROM categories WHERE ${1:___};",
    solutionSql: "SELECT name FROM categories WHERE path <@ 'all.electronics';",
  },
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
