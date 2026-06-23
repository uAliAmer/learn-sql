import CodeMirror from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
}

/** CodeMirror SQL editor. Cmd/Ctrl+Enter runs the query. */
export function SqlEditor({ value, onChange, onRun }: Props) {
  return (
    <div
      className="editor"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          onRun();
        }
      }}
    >
      <CodeMirror
        value={value}
        height="180px"
        theme="dark"
        extensions={[sql({ dialect: PostgreSQL })]}
        onChange={onChange}
        basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
      />
    </div>
  );
}
