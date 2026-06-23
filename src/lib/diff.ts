import { rowKey, type QueryResult } from "../db/pglite";

export interface RowMark {
  row: Record<string, unknown>;
  /** True if a matching row exists on the other side. */
  matched: boolean;
}

export interface ResultDiff {
  columnsMatch: boolean;
  expectedColumns: string[];
  actualColumns: string[];
  expected: RowMark[];
  actual: RowMark[];
  /** Rows expected but absent from the learner's result. */
  missing: number;
  /** Rows the learner returned that weren't expected. */
  extra: number;
}

/** Compare the reference result with the learner's, row by row. */
export function diffResults(expected: QueryResult, actual: QueryResult): ResultDiff {
  const expKeys = new Set(expected.rows.map(rowKey));
  const actKeys = new Set(actual.rows.map(rowKey));

  const expected_ = expected.rows.map((row) => ({ row, matched: actKeys.has(rowKey(row)) }));
  const actual_ = actual.rows.map((row) => ({ row, matched: expKeys.has(rowKey(row)) }));

  return {
    columnsMatch:
      expected.columns.length === actual.columns.length &&
      expected.columns.every((c, i) => c === actual.columns[i]),
    expectedColumns: expected.columns,
    actualColumns: actual.columns,
    expected: expected_,
    actual: actual_,
    missing: expected_.filter((m) => !m.matched).length,
    extra: actual_.filter((m) => !m.matched).length,
  };
}
