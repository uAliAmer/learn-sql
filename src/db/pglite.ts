import { PGlite } from "@electric-sql/pglite";
import type { Transaction } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { fuzzystrmatch } from "@electric-sql/pglite/contrib/fuzzystrmatch";
import { hstore } from "@electric-sql/pglite/contrib/hstore";
import { ltree } from "@electric-sql/pglite/contrib/ltree";
import { bloom } from "@electric-sql/pglite/contrib/bloom";

// A single in-browser Postgres instance, shared across the app.
// Each visitor gets their own isolated database — nothing leaves the tab.
// Extensions are registered here; seeds opt in with `CREATE EXTENSION`.
let dbPromise: Promise<PGlite> | null = null;
let loadedSeedId: string | null = null;

export function getDb(): Promise<PGlite> {
  if (!dbPromise) {
    dbPromise = PGlite.create({
      extensions: { vector, pg_trgm, fuzzystrmatch, hstore, ltree, bloom },
    });
  }
  return dbPromise;
}

export interface QueryResult {
  /** Column names in select order. */
  columns: string[];
  /** Row objects keyed by column name. */
  rows: Record<string, unknown>[];
  /** Rows touched by INSERT/UPDATE/DELETE (undefined for plain SELECT). */
  affectedRows?: number;
  /** The statement this result came from (for multi-statement scripts). */
  statement: string;
}

/** Drop everything and load a sample database's seed SQL from scratch. */
export async function loadDatabase(seedId: string, seedSql: string): Promise<void> {
  const db = await getDb();
  await db.exec(
    "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; SET search_path TO public;",
  );
  await db.exec(seedSql);
  loadedSeedId = seedId;
}

export function currentSeedId(): string | null {
  return loadedSeedId;
}

/** Run one or more statements against the live DB. Throws on SQL error. */
export async function runQuery(sql: string): Promise<QueryResult[]> {
  const db = await getDb();
  const results = await db.exec(sql);
  return results.map((r, i) => ({
    columns: r.fields.map((f) => f.name),
    rows: r.rows as Record<string, unknown>[],
    affectedRows: r.affectedRows,
    statement: splitStatements(sql)[i] ?? sql,
  }));
}

/** Marker error used to force a transaction rollback after we read results. */
class Rollback extends Error {}

/** Run `fn` inside a transaction that is always rolled back. */
async function inRollback<T>(fn: (tx: Transaction) => Promise<T>): Promise<T> {
  const db = await getDb();
  let captured: T | undefined;
  try {
    await db.transaction(async (tx) => {
      captured = await fn(tx);
      throw new Rollback();
    });
  } catch (err) {
    if (!(err instanceof Rollback)) throw err;
  }
  return captured as T;
}

/**
 * Validate an answer without touching the live database.
 * Runs both the learner's SQL and the reference solution inside throwaway
 * transactions, then compares result sets.
 *
 * - Read lessons: compare the rows each query returns.
 * - Write lessons: run each script, then run `checkSql` and compare what the
 *   table looks like afterwards.
 */
export async function checkAnswer(opts: {
  userSql: string;
  solutionSql: string;
  checkSql?: string;
  orderMatters?: boolean;
}): Promise<{ pass: boolean; actual: QueryResult | null; expected: QueryResult | null; error?: string }> {
  const { userSql, solutionSql, checkSql, orderMatters } = opts;
  try {
    const expected = await inRollback((tx) => runInTx(tx, solutionSql, checkSql));
    const actual = await inRollback((tx) => runInTx(tx, userSql, checkSql));
    return { pass: sameResult(actual, expected, orderMatters), actual, expected };
  } catch (err) {
    return { pass: false, actual: null, expected: null, error: (err as Error).message };
  }
}

async function runInTx(
  tx: Transaction,
  sql: string,
  checkSql?: string,
): Promise<QueryResult> {
  if (checkSql) {
    await tx.exec(sql);
    const r = await tx.query(checkSql);
    return toResult(r, checkSql);
  }
  // For read lessons, only the last statement's output is graded.
  const parts = splitStatements(sql);
  let last = await tx.query(parts[0] ?? sql);
  for (let i = 1; i < parts.length; i++) last = await tx.query(parts[i]);
  return toResult(last, parts[parts.length - 1] ?? sql);
}

function toResult(
  r: { rows: unknown[]; fields: { name: string }[] },
  statement: string,
): QueryResult {
  return {
    columns: r.fields.map((f) => f.name),
    rows: r.rows as Record<string, unknown>[],
    statement,
  };
}

/** Naive `;` splitter — good enough for lesson-sized scripts. */
function splitStatements(sql: string): string[] {
  return sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function sameResult(a: QueryResult, b: QueryResult, orderMatters?: boolean): boolean {
  if (a.rows.length !== b.rows.length) return false;
  const norm = (rows: Record<string, unknown>[]) => {
    const asStrings = rows.map((row) => stableStringify(row));
    return orderMatters ? asStrings : asStrings.sort();
  };
  const an = norm(a.rows);
  const bn = norm(b.rows);
  return an.every((v, i) => v === bn[i]);
}

function stableStringify(row: Record<string, unknown>): string {
  const keys = Object.keys(row).sort();
  return JSON.stringify(keys.map((k) => [k, normalizeValue(row[k])]));
}

function normalizeValue(v: unknown): unknown {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "number") return Math.round(v * 1e6) / 1e6;
  return v;
}

export interface ColumnInfo {
  name: string;
  type: string;
  isPrimaryKey: boolean;
}
export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

/** Introspect the public schema for the schema viewer. */
export async function getSchema(): Promise<TableInfo[]> {
  const db = await getDb();
  const cols = await db.query<{
    table_name: string;
    column_name: string;
    data_type: string;
  }>(
    `SELECT table_name, column_name, data_type
       FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position`,
  );
  const pks = await db.query<{ table_name: string; column_name: string }>(
    `SELECT tc.table_name, kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'`,
  );
  const pkSet = new Set(pks.rows.map((r) => `${r.table_name}.${r.column_name}`));
  const tables = new Map<string, TableInfo>();
  for (const c of cols.rows) {
    if (!tables.has(c.table_name)) tables.set(c.table_name, { name: c.table_name, columns: [] });
    tables.get(c.table_name)!.columns.push({
      name: c.column_name,
      type: c.data_type,
      isPrimaryKey: pkSet.has(`${c.table_name}.${c.column_name}`),
    });
  }
  return [...tables.values()];
}
