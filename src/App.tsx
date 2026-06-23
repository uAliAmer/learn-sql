import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { SqlEditor, type SqlEditorHandle } from "./components/SqlEditor";
import { ResultTable } from "./components/ResultTable";
import { DiffView } from "./components/DiffView";
import { CertificateModal } from "./components/CertificateModal";
import { NameModal } from "./components/NameModal";
import { SchemaViewer } from "./components/SchemaViewer";
import { LessonPanel, type CheckState } from "./components/LessonPanel";
import { LESSONS, getLesson } from "./data/lessons";
import { getDatabase } from "./data/databases";
import { currentStreak, bumpStreak } from "./lib/streak";
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
  return PLAYGROUND_STARTER[playgroundDbId] ?? "SELECT * FROM information_schema.tables;";
}

const SECTION_COUNT = new Set(LESSONS.map((l) => l.section)).size;

export default function App() {
  const [view, setView] = useState<View>("lesson");
  const [activeLessonId, setActiveLessonId] = useState<string>(LESSONS[0].id);
  const [playgroundDbId, setPlaygroundDbId] = useState<string>("shop");
  const [done, setDone] = useState<Set<string>>(loadProgress);
  const [streak, setStreak] = useState<number>(currentStreak);
  const [showCert, setShowCert] = useState(false);
  const [userName, setUserName] = useState<string>(loadName);
  const [nameLocked, setNameLocked] = useState<boolean>(loadNameLocked);

  // Confirm + lock the name in one step, so it can't be re-issued to someone
  // else. Called from the dedicated name modal.
  const confirmName = useCallback((n: string) => {
    setUserName(n);
    setNameLocked(true);
    try {
      localStorage.setItem("learn-sql:name:v1", n);
      localStorage.setItem("learn-sql:name-locked:v1", "1");
    } catch {
      /* best-effort */
    }
  }, []);

  const [results, setResults] = useState<QueryResult[]>([]);
  const [comparison, setComparison] = useState<{ expected: QueryResult; actual: QueryResult } | null>(null);
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

  // Push the schema both to the viewer and to the editor's autocomplete.
  const applySchema = useCallback((tables: TableInfo[]) => {
    setSchema(tables);
    editorRef.current?.setSchema(
      Object.fromEntries(tables.map((t) => [t.name, t.columns.map((c) => c.name)])),
    );
  }, []);

  const refreshSchema = useCallback(async () => {
    applySchema(await getSchema());
  }, [applySchema]);

  // Load / reset the database + editor whenever the active context changes.
  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setResults([]);
    setComparison(null);
    setError(null);
    setCheck({ status: "idle" });
    (async () => {
      const db = getDatabase(seedId);
      await loadDatabase(db.id, db.seedSql);
      const tables = await getSchema();
      if (cancelled) return;
      applySchema(tables);
      editorRef.current?.load(templateFor(view, activeLessonId, playgroundDbId));
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey]);

  const run = useCallback(async () => {
    setCheck({ status: "idle" });
    setComparison(null);
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
    if (r.error) {
      setError(r.error);
      setResults([]);
      setComparison(null);
      setCheck({ status: "fail", message: "Your SQL raised an error — see below." });
      return;
    }
    setError(null);
    if (r.pass) {
      setComparison(null);
      setResults(r.actual ? [r.actual] : []);
      setCheck({ status: "pass" });
      // If this completes the final lesson, celebrate with the certificate.
      if (!done.has(lesson.id) && done.size + 1 >= LESSONS.length) {
        setShowCert(true);
      }
      setDone((prev) => new Set(prev).add(lesson.id));
      setStreak(bumpStreak());
    } else {
      setResults([]);
      setComparison(r.expected && r.actual ? { expected: r.expected, actual: r.actual } : null);
      setCheck({
        status: "fail",
        message:
          r.expected && r.actual
            ? "Compare the expected rows with yours below."
            : "The result doesn't match what's expected. Try again.",
      });
    }
  }, [lesson, refreshSchema, done]);

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
    setComparison(null);
    setError(null);
    setCheck({ status: "idle" });
  }, [seedId, view, activeLessonId, playgroundDbId, refreshSchema]);

  const resetProgress = useCallback(() => {
    setDone(new Set());
    try {
      localStorage.removeItem("learn-sql:progress:v1");
    } catch {
      /* best-effort */
    }
  }, []);

  const lessonIndex = LESSONS.findIndex((l) => l.id === activeLessonId);
  const activeDb = getDatabase(seedId);

  return (
    <div className="app">
      <Sidebar
        view={view}
        activeLessonId={activeLessonId}
        playgroundDbId={playgroundDbId}
        done={done}
        streak={streak}
        allComplete={done.size === LESSONS.length}
        onSelectLesson={(id) => {
          setView("lesson");
          setActiveLessonId(id);
        }}
        onOpenPlayground={() => setView("playground")}
        onSelectPlaygroundDb={setPlaygroundDbId}
        onResetProgress={resetProgress}
        onShowCertificate={() => setShowCert(true)}
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
            {comparison ? (
              <DiffView expected={comparison.expected} actual={comparison.actual} />
            ) : results.length === 0 ? (
              <ResultTable result={null} error={error} />
            ) : (
              results.map((r, i) => <ResultTable key={i} result={r} error={null} />)
            )}
          </div>
        </section>
      </main>

      {showCert &&
        (nameLocked ? (
          <CertificateModal
            name={userName}
            lessonCount={LESSONS.length}
            sectionCount={SECTION_COUNT}
            onClose={() => setShowCert(false)}
          />
        ) : (
          <NameModal
            initial={userName}
            onSubmit={confirmName}
            onClose={() => setShowCert(false)}
          />
        ))}
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

function loadName(): string {
  try {
    return localStorage.getItem("learn-sql:name:v1") ?? "";
  } catch {
    return "";
  }
}

function loadNameLocked(): boolean {
  try {
    return localStorage.getItem("learn-sql:name-locked:v1") === "1";
  } catch {
    return false;
  }
}
