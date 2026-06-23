import { forwardRef, useImperativeHandle, useRef } from "react";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { sql, PostgreSQL } from "@codemirror/lang-sql";
import { snippet } from "@codemirror/autocomplete";
import type { EditorView } from "@codemirror/view";

export interface SqlEditorHandle {
  /**
   * Replace the whole document with `template`. If the template contains
   * `${...}` fields they become fill-in-the-blank slots: the first is selected
   * so typing replaces it, and Tab jumps to the next.
   */
  load: (template: string) => void;
  /** Insert text at the cursor (used by the schema viewer). */
  insertAtCursor: (text: string) => void;
  /** Current editor contents. */
  getValue: () => string;
}

interface Props {
  onRun: () => void;
  /** Fired on any user edit (so the host can clear stale pass/fail state). */
  onEdit: () => void;
}

export const SqlEditor = forwardRef<SqlEditorHandle, Props>(function SqlEditor(
  { onRun, onEdit },
  ref,
) {
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  // A template requested before the view existed; applied on create.
  const pending = useRef<string | null>(null);

  const applyLoad = (view: EditorView, template: string) => {
    // `snippet()` parses ${} fields and selects the first; plain text just
    // gets inserted with the cursor at the end. Replacing [0, len] clears first.
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
        extensions={[sql({ dialect: PostgreSQL })]}
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
