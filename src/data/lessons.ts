export interface Lesson {
  id: string;
  title: string;
  /** Short concept tag shown as a chip. */
  concept: string;
  databaseId: string;
  /** Task description (rendered as light markdown: **bold**, `code`). */
  prompt: string;
  hint: string;
  starterSql: string;
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

export const LESSONS: Lesson[] = [
  {
    id: "select-all",
    title: "Read a whole table",
    concept: "SELECT",
    databaseId: "shop",
    prompt:
      "`SELECT` reads data. The `*` means *every column*. Show **all columns of every row** in the `products` table.",
    hint: "SELECT * FROM table_name;",
    starterSql: "SELECT * FROM products;",
    solutionSql: "SELECT * FROM products;",
  },
  {
    id: "select-columns",
    title: "Pick specific columns",
    concept: "SELECT",
    databaseId: "shop",
    prompt:
      "Usually you want only some columns. List the `name` and `price` of every product.",
    hint: "Put the column names after SELECT, separated by commas.",
    starterSql: "SELECT ___, ___ FROM products;",
    solutionSql: "SELECT name, price FROM products;",
  },
  {
    id: "where-number",
    title: "Filter rows with WHERE",
    concept: "WHERE",
    databaseId: "shop",
    prompt:
      "`WHERE` keeps only rows that match a condition. Show the `name` and `price` of products that cost **more than 50**.",
    hint: "... WHERE price > 50;",
    starterSql: "SELECT name, price FROM products WHERE ___;",
    solutionSql: "SELECT name, price FROM products WHERE price > 50;",
  },
  {
    id: "where-text",
    title: "Combine conditions",
    concept: "WHERE",
    databaseId: "shop",
    prompt:
      "Conditions combine with `AND` / `OR`. Show the `name` and `price` of products in the **Electronics** category that cost **less than 60**.",
    hint: "Text values go in single quotes: category = 'Electronics'. Join two conditions with AND.",
    starterSql:
      "SELECT name, price FROM products WHERE category = '___' AND ___;",
    solutionSql:
      "SELECT name, price FROM products WHERE category = 'Electronics' AND price < 60;",
  },
  {
    id: "order-limit",
    title: "Sort and limit",
    concept: "ORDER BY",
    databaseId: "shop",
    prompt:
      "`ORDER BY` sorts; `LIMIT` caps the count. Show the `name` and `price` of the **3 most expensive** products, priciest first.",
    hint: "ORDER BY price DESC LIMIT 3. DESC = high → low.",
    starterSql: "SELECT name, price FROM products ORDER BY ___ LIMIT ___;",
    solutionSql: "SELECT name, price FROM products ORDER BY price DESC LIMIT 3;",
    orderMatters: true,
  },
  {
    id: "count",
    title: "Count rows",
    concept: "Aggregate",
    databaseId: "shop",
    prompt:
      "Aggregate functions crunch many rows into one number. Count **how many customers** there are.",
    hint: "SELECT count(*) FROM customers;",
    starterSql: "SELECT ___ FROM customers;",
    solutionSql: "SELECT count(*) FROM customers;",
  },
  {
    id: "group-by",
    title: "Group and count",
    concept: "GROUP BY",
    databaseId: "shop",
    prompt:
      "`GROUP BY` makes one row per group. For each `category`, show the category and **how many products** it has.",
    hint: "SELECT category, count(*) FROM products GROUP BY category;",
    starterSql: "SELECT category, ___ FROM products GROUP BY ___;",
    solutionSql: "SELECT category, count(*) FROM products GROUP BY category;",
  },
  {
    id: "having",
    title: "Filter groups with HAVING",
    concept: "GROUP BY",
    databaseId: "shop",
    prompt:
      "`WHERE` filters rows; `HAVING` filters *groups* after aggregation. Show each `category` and its **total stock** (`sum(stock)`), keeping only categories whose total stock is **over 100**.",
    hint: "GROUP BY category HAVING sum(stock) > 100",
    starterSql:
      "SELECT category, sum(stock) FROM products GROUP BY category HAVING ___;",
    solutionSql:
      "SELECT category, sum(stock) FROM products GROUP BY category HAVING sum(stock) > 100;",
  },
  {
    id: "join",
    title: "Join two tables",
    concept: "JOIN",
    databaseId: "shop",
    prompt:
      "A `JOIN` stitches tables together on a matching column. Show each order's `id` and the **customer's name** who placed it. (`orders.customer_id` matches `customers.id`.)",
    hint: "SELECT o.id, c.name FROM orders o JOIN customers c ON o.customer_id = c.id;",
    starterSql:
      "SELECT o.id, c.name\nFROM orders o\nJOIN customers c ON ___ = ___;",
    solutionSql:
      "SELECT o.id, c.name FROM orders o JOIN customers c ON o.customer_id = c.id;",
  },
  {
    id: "join-aggregate",
    title: "Capstone: revenue per customer",
    concept: "JOIN",
    databaseId: "shop",
    prompt:
      "Bring it together. For every customer who has ordered, show their `name` and **total revenue** — the sum of `quantity * unit_price` across all their order items. Alias it `revenue`.\n\nYou'll join three tables: `customers` → `orders` → `order_items`.",
    hint: "JOIN orders ON orders.customer_id = customers.id, then JOIN order_items ON order_items.order_id = orders.id, then GROUP BY the customer and SUM(quantity * unit_price).",
    starterSql:
      "SELECT c.name, sum(oi.quantity * oi.unit_price) AS revenue\nFROM customers c\nJOIN orders o ON ___\nJOIN order_items oi ON ___\nGROUP BY ___;",
    solutionSql:
      "SELECT c.name, sum(oi.quantity * oi.unit_price) AS revenue FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id GROUP BY c.name;",
  },
  {
    id: "insert",
    title: "Insert a row",
    concept: "Write",
    databaseId: "shop",
    prompt:
      "Time to change data. `INSERT` adds rows. Add a new product: name **Laptop Stand**, category **Home**, price **45.00**, stock **50**.",
    hint: "INSERT INTO products (name, category, price, stock) VALUES ('Laptop Stand', 'Home', 45.00, 50);",
    starterSql:
      "INSERT INTO products (name, category, price, stock)\nVALUES (___);",
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
    prompt:
      "`UPDATE` changes rows that match a `WHERE`. The **Wireless Mouse** is going up in price — set its `price` to **27.00**.",
    hint: "UPDATE products SET price = 27.00 WHERE name = 'Wireless Mouse';  (Don't forget WHERE, or you'd change every row!)",
    starterSql: "UPDATE products SET ___ WHERE ___;",
    solutionSql:
      "UPDATE products SET price = 27.00 WHERE name = 'Wireless Mouse';",
    checkSql: "SELECT name, price FROM products ORDER BY name;",
  },
  {
    id: "delete",
    title: "Delete rows",
    concept: "Write",
    databaseId: "shop",
    prompt:
      "`DELETE` removes rows that match a `WHERE`. Customer **Noor Al-Sayed** closed their account — delete them from `customers`.",
    hint: "DELETE FROM customers WHERE name = 'Noor Al-Sayed';",
    starterSql: "DELETE FROM customers WHERE ___;",
    solutionSql: "DELETE FROM customers WHERE name = 'Noor Al-Sayed';",
    checkSql: "SELECT id, name FROM customers ORDER BY id;",
  },
];

export function getLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}
