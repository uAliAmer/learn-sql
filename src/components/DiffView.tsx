import type { QueryResult } from "../db/pglite";
import { diffResults, type RowMark } from "../lib/diff";
import { formatCell } from "./ResultTable";

interface Props {
  expected: QueryResult;
  actual: QueryResult;
}

/** Side-by-side comparison of the reference result and the learner's. */
export function DiffView({ expected, actual }: Props) {
  const d = diffResults(expected, actual);
  return (
    <div className="diff">
      {!d.columnsMatch && (
        <div className="diff__note">
          Columns differ — expected <code>{d.expectedColumns.join(", ") || "—"}</code>, you
          returned <code>{d.actualColumns.join(", ") || "—"}</code>.
        </div>
      )}
      <div className="diff__grid">
        <section className="diff__side">
          <header className="diff__h">
            Expected
            {d.missing > 0 && <span className="diff__tag diff__tag--missing">{d.missing} missing</span>}
          </header>
          <MiniTable columns={expected.columns} marks={d.expected} badClass="row--missing" />
        </section>
        <section className="diff__side">
          <header className="diff__h">
            Your result
            {d.extra > 0 && <span className="diff__tag diff__tag--extra">{d.extra} unexpected</span>}
          </header>
          <MiniTable columns={actual.columns} marks={d.actual} badClass="row--extra" />
        </section>
      </div>
      <div className="diff__legend">
        <span className="swatch swatch--missing" /> in expected, not yours
        <span className="swatch swatch--extra" /> in yours, not expected
      </div>
    </div>
  );
}

function MiniTable({
  columns,
  marks,
  badClass,
}: {
  columns: string[];
  marks: RowMark[];
  badClass: string;
}) {
  if (marks.length === 0) return <div className="diff__empty">(no rows)</div>;
  return (
    <div className="diff__tablewrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {marks.map((m, i) => (
            <tr key={i} className={m.matched ? "" : badClass}>
              {columns.map((c) => (
                <td key={c}>{formatCell(m.row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
