import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { SqlEditor, type SqlEditorHandle } from "./components/SqlEditor";
import { ResultTable } from "./components/ResultTable";
import { SchemaViewer } from "./components/SchemaViewer";
import { LessonPanel, type CheckState } from "./components/LessonPanel";
import { LESSONS, getLesson } from "./data/lessons";
import { getDatabase } from "./data/databases";
import {
  loadDatabase,
  runQuery,
  checkAnswer,
  getSchema,
  type QueryResult,
  type TableInfo,
} from "./db/pglite";

type View = "lesson" | "playground";

const PLAYGROUND_STARTER: Record<string, string> = {
  shop: "-- Free play. Write any SQL and press Run (Ctrl/Cmd + Enter).\nSELECT * FROM products;",
  library: "-- Free play. Write any SQL and press Run (Ctrl/Cmd + Enter).\nSELECT * FROM books;",
};

function templateFor(view: View, lessonId: string, playgroundDbId: string): string {
  if (view === "lesson") return getLesson(lessonId)!.starterTemplate;
  return PLAYGROUND_STARTER[playgroundDbId] ?? "SELECT 1;";
}

export default function App() {
  const [view, setView] = useState<View>("lesson");
  const [activeLessonId, setActiveLessonId] = useState<string>(LESSONS[0].id);
  const [playgroundDbId, setPlaygroundDbId] = useState<string>("shop");
  const [done, setDone] = useState<Set<string>>(loadProgress);

  const [results, setResults] = useState<QueryResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<TableInfo[]>([]);
  const [ready, setReady] = useState(false);
  const [check, setCheck] = useState<CheckState>({ status: "idle" });

  const editorRef = useRef<SqlEditorHandle>(null);

  const lesson = view === "lesson" ? getLesson(activeLessonId) : undefined;
  const seedId = view === "lesson" ? lesson!.databaseId : playgroundDbId;
  const contextKey = view === "lesson" ? `lesson:${activeLessonId}` : `pg:${playgroundDbId}`;

  // Persist progress.
  useEffect(() => {
    try {
      localStorage.setItem("learn-sql:progress:v1", JSON.stringify([...done]));
    } catch {
      /* best-effort */
    }
  }, [done]);

  // Load / reset the database + editor whenever the active context changes.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setResults([]);
    setError(null);
    setCheck({ status: "idle" });
    (async () => {
      const db = getDatabase(seedId);
      await loadDatabase(db.id, db.seedSql);
      const tables = await getSchema();
      if (cancelled) return;
      setSchema(tables);
      editorRef.current?.load(templateFor(view, activeLessonId, playgroundDbId));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey]);

  const refreshSchema = useCallback(async () => {
    setSchema(await getSchema());
  }, []);

  const run = useCallback(async () => {
    setCheck({ status: "idle" });
    try {
      const res = await runQuery(editorRef.current?.getValue() ?? "");
      setResults(res);
      setError(null);
      await refreshSchema(); // writes may change the data/schema
    } catch (err) {
      setError((err as Error).message);
      setResults([]);
    }
  }, [refreshSchema]);

  const grade = useCallback(async () => {
    if (!lesson) return;
    setCheck({ status: "checking" });
    // For write/index lessons, grade from a clean seed so a prior manual Run
    // (e.g. creating the index to inspect EXPLAIN) can't taint the result.
    if (lesson.checkSql) {
      const db = getDatabase(lesson.databaseId);
      await loadDatabase(db.id, db.seedSql);
      await refreshSchema();
    }
    const r = await checkAnswer({
      userSql: editorRef.current?.getValue() ?? "",
      solutionSql: lesson.solutionSql,
      checkSql: lesson.checkSql,
      orderMatters: lesson.orderMatters,
    });
    if (r.actual) setResults([r.actual]);
    if (r.error) {
      setError(r.error);
      setCheck({ status: "fail", message: "Your SQL raised an error — see below." });
      return;
    }
    setError(null);
    if (r.pass) {
      setCheck({ status: "pass" });
      setDone((prev) => new Set(prev).add(lesson.id));
    } else {
      setCheck({
        status: "fail",
        message:
          "The rows returned don't match what's expected. Compare your result to the task and try again.",
      });
    }
  }, [lesson, refreshSchema]);

  const goNext = useCallback(() => {
    const idx = LESSONS.findIndex((l) => l.id === activeLessonId);
    if (idx >= 0 && idx < LESSONS.length - 1) {
      setView("lesson");
      setActiveLessonId(LESSONS[idx + 1].id);
    }
  }, [activeLessonId]);

  const resetDb = useCallback(async () => {
    const db = getDatabase(seedId);
    await loadDatabase(db.id, db.seedSql);
    await refreshSchema();
    editorRef.current?.load(templateFor(view, activeLessonId, playgroundDbId));
    setResults([]);
    setError(null);
    setCheck({ status: "idle" });
  }, [seedId, view, activeLessonId, playgroundDbId, refreshSchema]);

  const lessonIndex = LESSONS.findIndex((l) => l.id === activeLessonId);
  const activeDb = getDatabase(seedId);

  return (
    <div className="app">
      <Sidebar
        view={view}
        activeLessonId={activeLessonId}
        playgroundDbId={playgroundDbId}
        done={done}
        onSelectLesson={(id) => {
          setView("lesson");
          setActiveLessonId(id);
        }}
        onOpenPlayground={() => setView("playground")}
        onSelectPlaygroundDb={setPlaygroundDbId}
      />

      <main className="main">
        <section className="panel panel--left">
          {view === "lesson" && lesson ? (
            <LessonPanel
              lesson={lesson}
              index={lessonIndex}
              total={LESSONS.length}
              completedCount={done.size}
              check={check}
              isDone={done.has(lesson.id)}
              onNext={lessonIndex < LESSONS.length - 1 ? goNext : undefined}
            />
          ) : (
            <div className="lesson">
              <span className="chip">Playground</span>
              <h2>{activeDb.name}</h2>
              <p className="lesson__prompt">{activeDb.description}</p>
              <p className="muted">
                No grading here — run anything you like. Use the schema on the right, and
                hit <strong>Reset data</strong> to restore the sample rows.
              </p>
            </div>
          )}

          <div className="schema-wrap">
            <div className="nav-label">Schema · {activeDb.name}</div>
            <SchemaViewer tables={schema} onPick={(s) => editorRef.current?.insertAtCursor(s)} />
          </div>
        </section>

        <section className="panel panel--right">
          <SqlEditor
            ref={editorRef}
            onRun={run}
            onEdit={() => setCheck((c) => (c.status === "idle" ? c : { status: "idle" }))}
          />
          <div className="toolbar">
            <button className="btn btn--primary" onClick={run} disabled={!ready}>
              ▶ Run <kbd>⌘↵</kbd>
            </button>
            {view === "lesson" && (
              <button className="btn btn--check" onClick={grade} disabled={!ready}>
                ✓ Check answer
              </button>
            )}
            <button className="btn btn--ghost" onClick={resetDb} disabled={!ready}>
              ↺ Reset data
            </button>
          </div>

          <div className="results">
            {results.length === 0 ? (
              <ResultTable result={null} error={error} />
            ) : (
              results.map((r, i) => <ResultTable key={i} result={r} error={null} />)
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function loadProgress(): Set<string> {
  try {
    const raw = localStorage.getItem("learn-sql:progress:v1");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}
