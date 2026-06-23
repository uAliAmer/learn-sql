import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { SqlEditor } from "./components/SqlEditor";
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

export default function App() {
  const [view, setView] = useState<View>("lesson");
  const [activeLessonId, setActiveLessonId] = useState<string>(LESSONS[0].id);
  const [playgroundDbId, setPlaygroundDbId] = useState<string>("shop");
  const [done, setDone] = useState<Set<string>>(loadProgress);

  const [sql, setSql] = useState<string>(LESSONS[0].starterSql);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<TableInfo[]>([]);
  const [ready, setReady] = useState(false);
  const [check, setCheck] = useState<CheckState>({ status: "idle" });

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

  // Load / reset the database whenever the active context changes.
  const editorRef = useRef<string>(sql);
  editorRef.current = sql;
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
      setSql(
        view === "lesson"
          ? getLesson(activeLessonId)!.starterSql
          : PLAYGROUND_STARTER[playgroundDbId] ?? "SELECT 1;",
      );
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
      const res = await runQuery(editorRef.current);
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
    const r = await checkAnswer({
      userSql: editorRef.current,
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
        message: "The rows returned don't match what's expected. Compare your result to the task and try again.",
      });
    }
  }, [lesson]);

  const goNext = useCallback(() => {
    const idx = LESSONS.findIndex((l) => l.id === activeLessonId);
    if (idx >= 0 && idx < LESSONS.length - 1) {
      setView("lesson");
      setActiveLessonId(LESSONS[idx + 1].id);
    }
  }, [activeLessonId]);

  const insertSnippet = useCallback((snippet: string) => {
    setSql((s) => (s.endsWith(" ") || s.length === 0 ? s + snippet : s + " " + snippet));
  }, []);

  const resetDb = useCallback(async () => {
    const db = getDatabase(seedId);
    await loadDatabase(db.id, db.seedSql);
    await refreshSchema();
    setResults([]);
    setError(null);
    setCheck({ status: "idle" });
  }, [seedId, refreshSchema]);

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
            <SchemaViewer tables={schema} onPick={insertSnippet} />
          </div>
        </section>

        <section className="panel panel--right">
          <SqlEditor value={sql} onChange={setSql} onRun={run} />
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
