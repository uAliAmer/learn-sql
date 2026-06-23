export interface SampleDatabase {
  id: string;
  name: string;
  description: string;
  /** Full DDL + seed data, run after the schema is reset. */
  seedSql: string;
}

// ---------------------------------------------------------------------------
// Shop — the main teaching database used by the lessons.
// ---------------------------------------------------------------------------
const SHOP_SEED = `
CREATE TABLE customers (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  country     text NOT NULL,
  created_at  date NOT NULL
);

CREATE TABLE products (
  id        serial PRIMARY KEY,
  name      text NOT NULL,
  category  text NOT NULL,
  price     numeric(10,2) NOT NULL,
  stock     integer NOT NULL
);

CREATE TABLE orders (
  id           serial PRIMARY KEY,
  customer_id  integer NOT NULL REFERENCES customers(id),
  status       text NOT NULL,
  created_at   date NOT NULL
);

CREATE TABLE order_items (
  id          serial PRIMARY KEY,
  order_id    integer NOT NULL REFERENCES orders(id),
  product_id  integer NOT NULL REFERENCES products(id),
  quantity    integer NOT NULL,
  unit_price  numeric(10,2) NOT NULL
);

INSERT INTO customers (name, country, created_at) VALUES
  ('Amara Okafor',    'Nigeria',     '2024-01-12'),
  ('Liam Murphy',     'Ireland',     '2024-02-03'),
  ('Sofia Rossi',     'Italy',       '2024-02-21'),
  ('Kenji Tanaka',    'Japan',       '2024-03-15'),
  ('Noor Al-Sayed',   'Egypt',       '2024-04-02'),
  ('Emma Johnson',    'USA',         '2024-04-18'),
  ('Mateo García',    'Spain',       '2024-05-09'),
  ('Priya Sharma',    'India',       '2024-06-01');

INSERT INTO products (name, category, price, stock) VALUES
  ('Mechanical Keyboard', 'Electronics', 89.99,  40),
  ('Wireless Mouse',      'Electronics', 24.50,  120),
  ('27in Monitor',        'Electronics', 219.00, 18),
  ('USB-C Hub',           'Electronics', 39.95,  60),
  ('Desk Lamp',           'Home',        32.00,  75),
  ('Ergonomic Chair',     'Home',        249.99, 12),
  ('Notebook A5',         'Stationery',  6.50,   500),
  ('Gel Pen (pack of 5)', 'Stationery',  4.25,   800),
  ('Standing Desk',       'Home',        389.00, 7),
  ('Webcam 1080p',        'Electronics', 54.00,  33);

INSERT INTO orders (customer_id, status, created_at) VALUES
  (1, 'shipped',   '2024-05-01'),
  (1, 'shipped',   '2024-06-10'),
  (2, 'pending',   '2024-06-12'),
  (3, 'cancelled', '2024-05-20'),
  (3, 'shipped',   '2024-06-15'),
  (4, 'shipped',   '2024-06-18'),
  (6, 'pending',   '2024-06-20'),
  (7, 'shipped',   '2024-06-21'),
  (8, 'shipped',   '2024-06-22');

INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
  (1, 1, 1, 89.99),
  (1, 2, 2, 24.50),
  (2, 3, 1, 219.00),
  (3, 7, 10, 6.50),
  (4, 6, 1, 249.99),
  (5, 4, 3, 39.95),
  (5, 10, 1, 54.00),
  (6, 1, 1, 89.99),
  (6, 5, 2, 32.00),
  (7, 9, 1, 389.00),
  (8, 2, 1, 24.50),
  (8, 8, 4, 4.25),
  (9, 3, 2, 219.00);
`;

// ---------------------------------------------------------------------------
// Library — a second database for free exploration in the Playground.
// ---------------------------------------------------------------------------
const LIBRARY_SEED = `
CREATE TABLE authors (
  id      serial PRIMARY KEY,
  name    text NOT NULL,
  country text NOT NULL
);

CREATE TABLE books (
  id         serial PRIMARY KEY,
  title      text NOT NULL,
  author_id  integer NOT NULL REFERENCES authors(id),
  genre      text NOT NULL,
  year       integer NOT NULL,
  copies     integer NOT NULL
);

CREATE TABLE members (
  id          serial PRIMARY KEY,
  name        text NOT NULL,
  joined      date NOT NULL
);

CREATE TABLE loans (
  id          serial PRIMARY KEY,
  book_id     integer NOT NULL REFERENCES books(id),
  member_id   integer NOT NULL REFERENCES members(id),
  loaned_on   date NOT NULL,
  returned_on date
);

INSERT INTO authors (name, country) VALUES
  ('Chinua Achebe',        'Nigeria'),
  ('Haruki Murakami',      'Japan'),
  ('Ursula K. Le Guin',    'USA'),
  ('Gabriel García Márquez','Colombia'),
  ('Octavia E. Butler',    'USA');

INSERT INTO books (title, author_id, genre, year, copies) VALUES
  ('Things Fall Apart',            1, 'Fiction',     1958, 4),
  ('Kafka on the Shore',           2, 'Fiction',     2002, 3),
  ('Norwegian Wood',               2, 'Fiction',     1987, 2),
  ('The Left Hand of Darkness',    3, 'Sci-Fi',      1969, 5),
  ('A Wizard of Earthsea',         3, 'Fantasy',     1968, 6),
  ('One Hundred Years of Solitude',4, 'Fiction',     1967, 3),
  ('Kindred',                      5, 'Sci-Fi',      1979, 4),
  ('Parable of the Sower',         5, 'Sci-Fi',      1993, 2);

INSERT INTO members (name, joined) VALUES
  ('Dao Nguyen',   '2023-09-01'),
  ('Tomas Berg',   '2023-11-20'),
  ('Aisha Bello',  '2024-01-15'),
  ('Wei Chen',     '2024-03-30');

INSERT INTO loans (book_id, member_id, loaned_on, returned_on) VALUES
  (1, 1, '2024-05-02', '2024-05-20'),
  (4, 1, '2024-06-01', NULL),
  (2, 2, '2024-05-15', '2024-06-02'),
  (5, 3, '2024-06-10', NULL),
  (7, 4, '2024-06-12', NULL),
  (6, 2, '2024-04-20', '2024-05-10');
`;

// ---------------------------------------------------------------------------
// Extension demo databases. Each `CREATE EXTENSION`s a Postgres extension that
// PGlite bundles, so the lessons run for real in the browser.
// ---------------------------------------------------------------------------
const VEC_SEED = `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE documents (
  id         serial PRIMARY KEY,
  title      text NOT NULL,
  topic      text NOT NULL,
  embedding  vector(3)
);

INSERT INTO documents (title, topic, embedding) VALUES
  ('Intro to Postgres',    'databases', '[0.92, 0.10, 0.05]'),
  ('Vector search guide',  'databases', '[0.80, 0.20, 0.12]'),
  ('Cooking pasta',        'food',      '[0.05, 0.90, 0.08]'),
  ('Italian recipes',      'food',      '[0.12, 0.82, 0.18]'),
  ('Hiking the Alps',      'outdoors',  '[0.08, 0.12, 0.90]'),
  ('Mountain guide',       'outdoors',  '[0.18, 0.05, 0.82]');
`;

const FUZZY_SEED = `
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

CREATE TABLE contacts (
  id    serial PRIMARY KEY,
  name  text NOT NULL
);

INSERT INTO contacts (name) VALUES
  ('Jonathan Drake'),
  ('Jonathon Drik'),
  ('Nathan Drake'),
  ('Jon Snow'),
  ('Maria Lopez'),
  ('Mariah Lopes');
`;

const KV_SEED = `
CREATE EXTENSION IF NOT EXISTS hstore;

CREATE TABLE catalog (
  id     serial PRIMARY KEY,
  name   text NOT NULL,
  attrs  hstore
);

INSERT INTO catalog (name, attrs) VALUES
  ('T-Shirt', 'color=>blue,  size=>M'),
  ('Hoodie',  'color=>black, size=>L'),
  ('Cap',     'color=>red,   size=>OneSize'),
  ('Socks',   'color=>white, size=>M');
`;

const TREE_SEED = `
CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE categories (
  id    serial PRIMARY KEY,
  name  text NOT NULL,
  path  ltree NOT NULL
);

INSERT INTO categories (name, path) VALUES
  ('All',         'all'),
  ('Electronics', 'all.electronics'),
  ('Phones',      'all.electronics.phones'),
  ('Laptops',     'all.electronics.laptops'),
  ('Home',        'all.home'),
  ('Kitchen',     'all.home.kitchen');
`;

// A deliberately large table (5,000 rows) so indexes make a visible
// difference in EXPLAIN: Seq Scan without one, Index Scan with one.
const BIG_SEED = `
CREATE EXTENSION IF NOT EXISTS bloom;

CREATE TABLE events (
  id          serial PRIMARY KEY,
  email       text NOT NULL,
  country     text NOT NULL,
  plan        text NOT NULL,
  status      text NOT NULL,
  created_at  date NOT NULL
);

INSERT INTO events (email, country, plan, status, created_at)
SELECT
  'user' || g || '@example.com',
  (ARRAY['US','UK','NG','JP','BR','IN'])[1 + (g % 6)],
  (ARRAY['free','pro','team','enterprise'])[1 + (g % 4)],
  (ARRAY['active','trial','churned'])[1 + (g % 3)],
  DATE '2024-01-01' + (g % 365)
FROM generate_series(1, 5000) AS g;
`;

// Users with a JSONB `profile` column — for the JSON section.
const JSON_SEED = `
CREATE TABLE users (
  id       serial PRIMARY KEY,
  name     text NOT NULL,
  profile  jsonb NOT NULL
);

INSERT INTO users (name, profile) VALUES
  ('Amara Okafor',  '{"age":31,"city":"Lagos","plan":"pro","tags":["mobile","beta"],"address":{"country":"NG","zip":"100001"}}'),
  ('Liam Murphy',   '{"age":27,"city":"Dublin","plan":"free","tags":["web"],"address":{"country":"IE","zip":"D02"}}'),
  ('Sofia Rossi',   '{"age":35,"city":"Milan","plan":"pro","tags":["web","beta"],"address":{"country":"IT","zip":"20121"}}'),
  ('Kenji Tanaka',  '{"age":42,"city":"Tokyo","plan":"enterprise","tags":["mobile"],"address":{"country":"JP","zip":"100-0001"}}'),
  ('Noor Al-Sayed', '{"age":29,"city":"Cairo","plan":"free","tags":[],"address":{"country":"EG","zip":"11511"}}');
`;

export const DATABASES: SampleDatabase[] = [
  {
    id: "shop",
    name: "Online Shop",
    description:
      "A small e-commerce store: customers, products, orders and the items in each order.",
    seedSql: SHOP_SEED,
  },
  {
    id: "library",
    name: "City Library",
    description: "Authors, books, members and loan history for a public library.",
    seedSql: LIBRARY_SEED,
  },
  {
    id: "vec",
    name: "Vector Search",
    description: "Documents with 3-D embeddings — for pgvector similarity search.",
    seedSql: VEC_SEED,
  },
  {
    id: "fuzzy",
    name: "Fuzzy Contacts",
    description: "A contact list with near-duplicate names — for pg_trgm fuzzy matching.",
    seedSql: FUZZY_SEED,
  },
  {
    id: "kv",
    name: "Key/Value Catalog",
    description: "Products with an hstore column of attributes (color, size).",
    seedSql: KV_SEED,
  },
  {
    id: "tree",
    name: "Category Tree",
    description: "A category hierarchy stored as ltree paths.",
    seedSql: TREE_SEED,
  },
  {
    id: "big",
    name: "Events (5k rows)",
    description: "A large events table — for seeing how indexes avoid scanning everything.",
    seedSql: BIG_SEED,
  },
  {
    id: "json",
    name: "JSON Profiles",
    description: "Users with a JSONB profile column (city, plan, tags, nested address).",
    seedSql: JSON_SEED,
  },
];

export function getDatabase(id: string): SampleDatabase {
  const db = DATABASES.find((d) => d.id === id);
  if (!db) throw new Error(`Unknown database: ${id}`);
  return db;
}
