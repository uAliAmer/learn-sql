import type { TableInfo } from "../db/pglite";

interface Props {
  tables: TableInfo[];
  onPick: (snippet: string) => void;
}

/** Collapsible list of tables + columns. Clicking a table inserts its name. */
export function SchemaViewer({ tables, onPick }: Props) {
  if (tables.length === 0) {
    return <div className="schema schema--empty">Loading schema…</div>;
  }
  return (
    <div className="schema">
      {tables.map((t) => (
        <details key={t.name} open>
          <summary>
            <button
              type="button"
              className="schema__table"
              onClick={() => onPick(t.name)}
              title="Insert table name into the editor"
            >
              {t.name}
            </button>
          </summary>
          <ul>
            {t.columns.map((c) => (
              <li key={c.name}>
                <button
                  type="button"
                  className="schema__col"
                  onClick={() => onPick(c.name)}
                >
                  {c.isPrimaryKey ? "🔑 " : ""}
                  {c.name}
                </button>
                <span className="schema__type">{c.type}</span>
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
