import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { javascript } from "@codemirror/lang-javascript";
import { snippet } from "@codemirror/autocomplete";
import { Compartment, type Extension } from "@codemirror/state";
import type { EditorView } from "@codemirror/view";

export interface SqlEditorHandle {
  /** Replace the whole document. `${n:label}` fields become fill-in slots. */
  load: (template: string) => void;
  /** Insert text at the cursor (used by the schema viewer). */
  insertAtCursor: (text: string) => void;
  /** Feed the schema so the editor can autocomplete names (SQL mode only). */
  setSchema: (schema: Record<string, string[]>) => void;
  /** Current editor contents. */
  getValue: () => string;
}

interface Props {
  /** Editor language: SQL for the Postgres track, JS for the Mongo track. */
  language: "sql" | "javascript";
  onRun: () => void;
  onEdit: () => void;
}

export const SqlEditor = forwardRef<SqlEditorHandle, Props>(function SqlEditor(
  { language, onRun, onEdit },
  ref,
) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const pending = useRef<string | null>(null);
  const langComp = useRef(new Compartment());
  const langRef = useRef(language);
  const schemaRef = useRef<Record<string, string[]>>({});
  langRef.current = language;

  const buildLang = (): Extension =>
    langRef.current === "javascript"
      ? javascript()
      : sql({ dialect: PostgreSQL, schema: schemaRef.current });

  const reconfigure = (view: EditorView) =>
    view.dispatch({ effects: langComp.current.reconfigure(buildLang()) });

  // Swap the language extension when the track changes.
  useEffect(() => {
    const view = cmRef.current?.view;
    if (view) reconfigure(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const applyLoad = (view: EditorView, template: string) => {
    snippet(template)(view, null, 0, view.state.doc.length);
    view.focus();
  };

  useImperativeHandle(ref, () => ({
    load(template) {
      const view = cmRef.current?.view;
      if (view) applyLoad(view, template);
      else pending.current = template;
    },
    insertAtCursor(text) {
      const view = cmRef.current?.view;
      if (!view) return;
      const pos = view.state.selection.main.head;
      const needsSpace = pos > 0 && !/\s/.test(view.state.doc.sliceString(pos - 1, pos));
      const insert = (needsSpace ? " " : "") + text;
      view.dispatch({
        changes: { from: pos, insert },
        selection: { anchor: pos + insert.length },
      });
      view.focus();
    },
    setSchema(schema) {
      schemaRef.current = schema;
      const view = cmRef.current?.view;
      if (view) reconfigure(view);
    },
    getValue() {
      return cmRef.current?.view?.state.doc.toString() ?? "";
    },
  }));

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
        ref={cmRef}
        value=""
        height="180px"
        theme="dark"
        extensions={[langComp.current.of(buildLang())]}
        onChange={() => onEdit()}
        onCreateEditor={(view) => {
          if (pending.current != null) {
            applyLoad(view, pending.current);
            pending.current = null;
          }
        }}
        basicSetup={{ lineNumbers: true, foldGutter: false, highlightActiveLine: true }}
      />
    </div>
  );
});
