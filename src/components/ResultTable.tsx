import type { QueryResult } from "../db/pglite";

interface Props {
  result: QueryResult | null;
  error: string | null;
}

/** Renders a single query result as a table, or an error / status line. */
export function ResultTable({ result, error }: Props) {
  if (error) {
    return (
      <div className="result result--error">
        <strong>Error:</strong> {error}
      </div>
    );
  }
  if (!result) {
    return <div className="result result--empty">Run a query to see results here.</div>;
  }

  // A write statement (INSERT/UPDATE/DELETE) with no returned rows.
  if (result.columns.length === 0) {
    return (
      <div className="result result--ok">
        ✅ Statement ran.{" "}
        {result.affectedRows != null && (
          <span>
            {result.affectedRows} row{result.affectedRows === 1 ? "" : "s"} affected.
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="result result--table">
      <table>
        <thead>
          <tr>
            {result.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, i) => (
            <tr key={i}>
              {result.columns.map((c) => (
                <td key={c}>{formatCell(row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="result__meta">
        {result.rows.length} row{result.rows.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}

export function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "∅";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
