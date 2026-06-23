import type { QueryResult } from "../db/pglite";

interface Props {
  result: QueryResult | null;
  error: string | null;
}

/** Renders Mongo query output as a list of JSON documents. */
export function DocumentView({ result, error }: Props) {
  if (error) {
    return (
      <div className="result result--error">
        <strong>Error:</strong> {error}
      </div>
    );
  }
  if (!result) {
    return <div className="result result--empty">Run a query to see documents here.</div>;
  }
  if (result.rows.length === 0) {
    return <div className="result result--ok">No documents matched.</div>;
  }
  return (
    <div className="docview">
      {result.rows.map((doc, i) => (
        <pre key={i} className="docview__doc">
          {JSON.stringify(doc, null, 2)}
        </pre>
      ))}
      <div className="result__meta">
        {result.rows.length} document{result.rows.length === 1 ? "" : "s"}
      </div>
    </div>
  );
}
