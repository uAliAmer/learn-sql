import { find, Aggregator, Query, updateOne as mingoUpdateOne } from "mingo";
import { getMongoDataset } from "../data/mongoData";
import { rowKey, type QueryResult } from "./pglite";

// The Mongo "engine": a pure-JS MongoDB query/aggregation layer (mingo) over
// in-memory collections. Faithful to the query language — not a real mongod.
type Doc = Record<string, unknown>;

let collections: Record<string, Doc[]> = {};

function clone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

export function loadMongo(datasetId: string): void {
  collections = clone(getMongoDataset(datasetId).collections);
}

/** A `db.collection` surface: find / aggregate / insertOne / updateOne / deleteOne. */
class Collection {
  constructor(
    private docs: Doc[],
    private all: Record<string, Doc[]>,
  ) {}
  find(criteria: Doc = {}, projection?: Doc) {
    return find(this.docs, criteria, projection);
  }
  aggregate(pipeline: Record<string, unknown>[]) {
    // collectionResolver lets $lookup reach the other collections.
    return new Aggregator(pipeline, {
      collectionResolver: (name: string) => this.all[name] ?? [],
    }).run(this.docs);
  }
  insertOne(doc: Doc) {
    this.docs.push(clone(doc));
    return { acknowledged: true, insertedId: doc._id ?? null };
  }
  updateOne(filter: Doc, update: Doc) {
    return mingoUpdateOne(this.docs, filter, update);
  }
  deleteOne(filter: Doc) {
    const q = new Query(filter);
    const i = this.docs.findIndex((d) => q.test(d));
    if (i >= 0) this.docs.splice(i, 1);
    return { acknowledged: true, deletedCount: i >= 0 ? 1 : 0 };
  }
}

function makeDb(cols: Record<string, Doc[]>): Record<string, Collection> {
  const db: Record<string, Collection> = {};
  for (const [name, docs] of Object.entries(cols)) db[name] = new Collection(docs, cols);
  return db;
}

/** Evaluate a user expression like `db.users.find({ plan: "pro" })`. */
function evalQuery(code: string, db: Record<string, Collection>): Doc[] {
  // eslint-disable-next-line no-new-func
  const fn = new Function("db", `"use strict"; return ( ${code} );`);
  return normalize(fn(db));
}

function normalize(result: unknown): Doc[] {
  if (Array.isArray(result)) return result as Doc[];
  if (result && typeof (result as { all?: unknown }).all === "function") {
    return (result as { all: () => Doc[] }).all();
  }
  if (result && typeof result === "object") return [result as Doc];
  return [];
}

function toQueryResult(rows: Doc[], statement: string): QueryResult {
  const cols = new Set<string>();
  for (const r of rows) for (const k of Object.keys(r)) cols.add(k);
  return { columns: [...cols], rows, statement };
}

/** Run a query against the live working collections (writes mutate them). */
export function runMongo(code: string): QueryResult[] {
  return [toQueryResult(evalQuery(code, makeDb(collections)), code)];
}

/** Grade by comparing the documents the learner's query returns vs the solution. */
export function checkMongo(opts: {
  userCode: string;
  solutionCode: string;
  checkCode?: string;
  orderMatters?: boolean;
}): { pass: boolean; actual: QueryResult | null; expected: QueryResult | null; error?: string } {
  const { userCode, solutionCode, checkCode, orderMatters } = opts;
  try {
    const expected = runOnClone(solutionCode, checkCode);
    const actual = runOnClone(userCode, checkCode);
    return { pass: sameDocs(actual, expected, orderMatters), actual, expected };
  } catch (err) {
    return { pass: false, actual: null, expected: null, error: (err as Error).message };
  }
}

/** Run on a throwaway clone; for write lessons, read back with `checkCode`. */
function runOnClone(code: string, checkCode?: string): QueryResult {
  const db = makeDb(clone(collections));
  if (checkCode) {
    evalQuery(code, db);
    return toQueryResult(evalQuery(checkCode, db), checkCode);
  }
  return toQueryResult(evalQuery(code, db), code);
}

function sameDocs(a: QueryResult, b: QueryResult, orderMatters?: boolean): boolean {
  if (a.rows.length !== b.rows.length) return false;
  const norm = (rows: Doc[]) => {
    const keys = rows.map(rowKey);
    return orderMatters ? keys : keys.sort();
  };
  const an = norm(a.rows);
  const bn = norm(b.rows);
  return an.every((v, i) => v === bn[i]);
}

export interface CollectionInfo {
  name: string;
  columns: { name: string; type: string; isPrimaryKey: boolean }[];
}

/** Collections + their fields, in the same shape the schema viewer expects. */
export function mongoSchema(): CollectionInfo[] {
  return Object.entries(collections).map(([name, docs]) => {
    const keys = new Set<string>();
    for (const d of docs) for (const k of Object.keys(d)) keys.add(k);
    return {
      name,
      columns: [...keys].map((k) => ({ name: k, type: "field", isPrimaryKey: k === "_id" })),
    };
  });
}
