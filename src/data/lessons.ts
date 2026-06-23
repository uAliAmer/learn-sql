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

export const LESSONS: Lesson[] = [
  {
    id: "select-all",
    title: "Read a whole table",
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
    concept: "SELECT",
    databaseId: "shop",
    keyIdea: "Name the columns you want, in order — and skip the rest.",
    task: "List the `name` and `price` of **every** product.",
    syntax: [
      kw("SELECT"),
      slot("<columns>", "comma-separated list"),
      kw("FROM"),
      slot("<table>"),
    ],
    hint: "Put the column names after SELECT, separated by commas.",
    starterTemplate: "SELECT ${1:___}, ${2:___} FROM products;",
    solutionSql: "SELECT name, price FROM products;",
  },
  {
    id: "where-number",
    title: "Filter rows with WHERE",
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
    id: "order-limit",
    title: "Sort and limit",
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
  {
    id: "count",
    title: "Count rows",
    concept: "Aggregate",
    databaseId: "shop",
    keyIdea: "`count(*)` reports **how many rows** — one number, not a list.",
    task: "Count **how many customers** there are.",
    syntax: [
      kw("SELECT"),
      lit("count(*)", "counts all rows"),
      kw("FROM"),
      slot("<table>"),
    ],
    hint: "SELECT count(*) FROM customers;",
    starterTemplate: "SELECT ${1:___} FROM customers;",
    solutionSql: "SELECT count(*) FROM customers;",
  },
  {
    id: "group-by",
    title: "Group and count",
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
  {
    id: "join",
    title: "Join two tables",
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
    id: "join-aggregate",
    title: "Capstone: revenue per customer",
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
  {
    id: "insert",
    title: "Insert a row",
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
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
