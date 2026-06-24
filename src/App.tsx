import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "./components/Sidebar";
import { SqlEditor, type SqlEditorHandle } from "./components/SqlEditor";
import { ResultTable } from "./components/ResultTable";
import { DocumentView } from "./components/DocumentView";
import { DiffView } from "./components/DiffView";
import { CertificateView } from "./components/CertificateView";
import { NameModal } from "./components/NameModal";
import { ConfirmModal } from "./components/ConfirmModal";
import { SchemaViewer } from "./components/SchemaViewer";
import { LessonPanel, type CheckState } from "./components/LessonPanel";
import { LESSONS, getLesson, lessonTrack, type Track } from "./data/lessons";
import { getDatabase } from "./data/databases";
import { getMongoDataset } from "./data/mongoData";
import { currentStreak, bumpStreak } from "./lib/streak";
import {
  loadDatabase,
  runQuery,
  checkAnswer,
  getSchema,
  type QueryResult,
  type TableInfo,
} from "./db/pglite";
import { loadMongo, runMongo, checkMongo, mongoSchema } from "./db/mongo";

type View = "lesson" | "playground" | "certificate";

const PLAYGROUND_STARTER: Record<string, string> = {
  shop: "-- Free play. Write any SQL and press Run (Ctrl/Cmd + Enter).\nSELECT * FROM products;",
  library: "-- Free play. Write any SQL and press Run (Ctrl/Cmd + Enter).\nSELECT * FROM books;",
};

function templateFor(view: View, lessonId: string, playgroundDbId: string, track: Track): string {
  if (view === "lesson") return getLesson(lessonId)!.starterTemplate;
  if (track === "mongo") return "// Free play. Run any Mongo query (Ctrl/Cmd + Enter).\ndb.users.find({})";
  return PLAYGROUND_STARTER[playgroundDbId] ?? "SELECT * FROM information_schema.tables;";
}

const SECTION_COUNT = new Set(LESSONS.map((l) => l.section)).size;

export default function App() {
  const [view, setView] = useState<View>("lesson");
  const [track, setTrack] = useState<Track>("sql");
  const [activeLessonId, setActiveLessonId] = useState<string>(LESSONS[0].id);
  const [playgroundDbId, setPlaygroundDbId] = useState<string>("shop");
  const [done, setDone] = useState<Set<string>>(loadProgress);
  const [streak, setStreak] = useState<number>(currentStreak);
  const [userName, setUserName] = useState<string>(loadName);
  const [nameLocked, setNameLocked] = useState<boolean>(loadNameLocked);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [results, setResults] = useState<QueryResult[]>([]);
  const [comparison, setComparison] = useState<{ expected: QueryResult; actual: QueryResult } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [schema, setSchema] = useState<TableInfo[]>([]);
  const [ready, setReady] = useState(false);
  const [check, setCheck] = useState<CheckState>({ status: "idle" });

  const editorRef = useRef<SqlEditorHandle>(null);

  const lesson = view === "lesson" ? getLesson(activeLessonId) : undefined;
  const activeTrack: Track = lesson ? lessonTrack(lesson) : track; // playground follows the sidebar track
  const seedId =
    view === "lesson" ? lesson!.databaseId : activeTrack === "mongo" ? "store" : playgroundDbId;
  const contextKey =
    view === "certificate"
      ? "certificate"
      : view === "lesson"
        ? `lesson:${activeLessonId}`
        : `pg:${playgroundDbId}`;

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

  useEffect(() => {
    try {
      localStorage.setItem("learn-sql:progress:v1", JSON.stringify([...done]));
    } catch {
      /* best-effort */
    }
  }, [done]);

  const applySchema = useCallback((tables: TableInfo[]) => {
    setSchema(tables);
    editorRef.current?.setSchema(
      Object.fromEntries(tables.map((t) => [t.name, t.columns.map((c) => c.name)])),
    );
  }, []);

  const refreshSchema = useCallback(async () => {
    applySchema(await getSchema());
  }, [applySchema]);

  // Load / reset the active database + editor whenever the context changes.
  useEffect(() => {
    if (view === "certificate") {
      setReady(true);
      return;
    }
    let cancelled = false;
    setReady(false);
    setResults([]);
    setComparison(null);
    setError(null);
    setCheck({ status: "idle" });
    (async () => {
      if (activeTrack === "mongo") {
        loadMongo(seedId);
        if (cancelled) return;
        applySchema(mongoSchema());
      } else {
        const db = getDatabase(seedId);
        await loadDatabase(db.id, db.seedSql);
        const tables = await getSchema();
        if (cancelled) return;
        applySchema(tables);
      }
      editorRef.current?.load(templateFor(view, activeLessonId, playgroundDbId, activeTrack));
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
      if (activeTrack === "mongo") {
        setResults(runMongo(editorRef.current?.getValue() ?? ""));
        setError(null);
      } else {
        setResults(await runQuery(editorRef.current?.getValue() ?? ""));
        setError(null);
        await refreshSchema();
      }
    } catch (err) {
      setError((err as Error).message);
      setResults([]);
    }
  }, [activeTrack, refreshSchema]);

  const grade = useCallback(async () => {
    if (!lesson) return;
    setCheck({ status: "checking" });
    const userQuery = editorRef.current?.getValue() ?? "";
    let r: { pass: boolean; actual: QueryResult | null; expected: QueryResult | null; error?: string };
    if (activeTrack === "mongo") {
      // Reseed before grading writes so a prior manual Run can't taint it.
      if (lesson.checkSql) loadMongo(lesson.databaseId);
      r = checkMongo({
        userCode: userQuery,
        solutionCode: lesson.solutionSql,
        checkCode: lesson.checkSql,
        orderMatters: lesson.orderMatters,
      });
    } else {
      if (lesson.checkSql) {
        const db = getDatabase(lesson.databaseId);
        await loadDatabase(db.id, db.seedSql);
        await refreshSchema();
      }
      r = await checkAnswer({
        userSql: userQuery,
        solutionSql: lesson.solutionSql,
        checkSql: lesson.checkSql,
        orderMatters: lesson.orderMatters,
      });
    }

    if (r.error) {
      setError(r.error);
      setResults([]);
      setComparison(null);
      setCheck({ status: "fail", message: "Your query raised an error — see below." });
      return;
    }
    setError(null);
    if (r.pass) {
      setComparison(null);
      setResults(r.actual ? [r.actual] : []);
      setCheck({ status: "pass" });
      const finishedAll = !done.has(lesson.id) && done.size + 1 >= LESSONS.length;
      setDone((prev) => new Set(prev).add(lesson.id));
      setStreak(bumpStreak());
      if (finishedAll) setView("certificate");
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
  }, [lesson, activeTrack, refreshSchema, done]);

  const goNext = useCallback(() => {
    const idx = LESSONS.findIndex((l) => l.id === activeLessonId);
    if (idx >= 0 && idx < LESSONS.length - 1) {
      const next = LESSONS[idx + 1];
      setView("lesson");
      setTrack(lessonTrack(next));
      setActiveLessonId(next.id);
    }
  }, [activeLessonId]);

  const resetDb = useCallback(async () => {
    if (activeTrack === "mongo") {
      loadMongo(seedId);
      applySchema(mongoSchema());
    } else {
      const db = getDatabase(seedId);
      await loadDatabase(db.id, db.seedSql);
      await refreshSchema();
    }
    editorRef.current?.load(templateFor(view, activeLessonId, playgroundDbId, activeTrack));
    setResults([]);
    setComparison(null);
    setError(null);
    setCheck({ status: "idle" });
  }, [seedId, view, activeTrack, activeLessonId, playgroundDbId, applySchema, refreshSchema]);

  const resetAll = useCallback(() => {
    setDone(new Set());
    setUserName("");
    setNameLocked(false);
    try {
      localStorage.removeItem("learn-sql:progress:v1");
      localStorage.removeItem("learn-sql:name:v1");
      localStorage.removeItem("learn-sql:name-locked:v1");
    } catch {
      /* best-effort */
    }
    setShowResetConfirm(false);
  }, []);

  const selectTrack = useCallback((t: Track) => {
    setTrack(t);
    const first = LESSONS.find((l) => lessonTrack(l) === t);
    if (first) {
      setView("lesson");
      setActiveLessonId(first.id);
    }
  }, []);

  const lessonIndex = LESSONS.findIndex((l) => l.id === activeLessonId);
  const dbName =
    view === "certificate"
      ? ""
      : activeTrack === "mongo"
        ? getMongoDataset(seedId).name
        : getDatabase(seedId).name;

  return (
    <div className="app">
      <Sidebar
        view={view}
        track={track}
        activeLessonId={activeLessonId}
        playgroundDbId={playgroundDbId}
        done={done}
        streak={streak}
        allComplete={done.size === LESSONS.length}
        onSelectTrack={selectTrack}
        onSelectLesson={(id) => {
          setView("lesson");
          setActiveLessonId(id);
        }}
        onOpenPlayground={() => setView("playground")}
        onOpenCertificate={() => setView("certificate")}
        onSelectPlaygroundDb={setPlaygroundDbId}
        onResetProgress={() => setShowResetConfirm(true)}
      />

      {view === "certificate" ? (
        <main className="main main--single">
          <CertificateView
            doneCount={done.size}
            total={LESSONS.length}
            sectionCount={SECTION_COUNT}
            name={userName}
            locked={nameLocked}
            onClaim={() => setShowNameModal(true)}
          />
        </main>
      ) : (
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
                <h2>{dbName}</h2>
                <p className="muted">
                  No grading here — run anything you like. Use the schema on the right, and
                  hit <strong>Reset data</strong> to restore the sample rows.
                </p>
              </div>
            )}

            <div className="schema-wrap">
              <div className="nav-label">
                {activeTrack === "mongo" ? "Collections" : "Schema"} · {dbName}
              </div>
              <SchemaViewer tables={schema} onPick={(s) => editorRef.current?.insertAtCursor(s)} />
            </div>
          </section>

          <section className="panel panel--right">
            <SqlEditor
              ref={editorRef}
              language={activeTrack === "mongo" ? "javascript" : "sql"}
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
              ) : activeTrack === "mongo" ? (
                <DocumentView result={results[0] ?? null} error={error} />
              ) : results.length === 0 ? (
                <ResultTable result={null} error={error} />
              ) : (
                results.map((r, i) => <ResultTable key={i} result={r} error={null} />)
              )}
            </div>
          </section>
        </main>
      )}

      {showNameModal && (
        <NameModal
          initial={userName}
          onSubmit={(n) => {
            confirmName(n);
            setShowNameModal(false);
          }}
          onClose={() => setShowNameModal(false)}
        />
      )}

      {showResetConfirm && (
        <ConfirmModal
          title="Reset everything?"
          message={
            <>
              This clears all your lesson progress and the name on your certificate.
              <br />
              This can't be undone.
            </>
          }
          confirmLabel="Reset everything"
          onConfirm={resetAll}
          onClose={() => setShowResetConfirm(false)}
        />
      )}
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
