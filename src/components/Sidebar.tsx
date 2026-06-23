import { Fragment } from "react";
import { LESSONS } from "../data/lessons";
import { DATABASES } from "../data/databases";

interface Props {
  view: "lesson" | "playground";
  activeLessonId: string | null;
  playgroundDbId: string;
  done: Set<string>;
  streak: number;
  onSelectLesson: (id: string) => void;
  onOpenPlayground: () => void;
  onSelectPlaygroundDb: (id: string) => void;
  onResetProgress: () => void;
}

export function Sidebar({
  view,
  activeLessonId,
  playgroundDbId,
  done,
  streak,
  onSelectLesson,
  onOpenPlayground,
  onSelectPlaygroundDb,
  onResetProgress,
}: Props) {
  // Per-section completion counts.
  const stats = new Map<string, { total: number; done: number }>();
  for (const l of LESSONS) {
    const s = stats.get(l.section) ?? { total: 0, done: 0 };
    s.total++;
    if (done.has(l.id)) s.done++;
    stats.set(l.section, s);
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand__logo">🐘</span>
        <div>
          <div className="brand__name">Learn SQL</div>
          <div className="brand__sub">real Postgres, in your browser</div>
        </div>
      </div>

      <div className="sidebar__progress">
        <div className="sidebar__progress-row">
          <span>
            {done.size} / {LESSONS.length} lessons
          </span>
          {streak > 0 && <span className="streak">🔥 {streak}-day streak</span>}
        </div>
        <div className="bar">
          <div
            className="bar__fill"
            style={{ width: `${(done.size / LESSONS.length) * 100}%` }}
          />
        </div>
      </div>

      <nav className="lessons-nav">
        {LESSONS.map((l, i) => {
          const active = view === "lesson" && l.id === activeLessonId;
          const showSection = i === 0 || LESSONS[i - 1].section !== l.section;
          const st = stats.get(l.section)!;
          const complete = st.done === st.total;
          return (
            <Fragment key={l.id}>
              {showSection && (
                <div className={`nav-section${complete ? " is-complete" : ""}`}>
                  <span>{l.section}</span>
                  <span className="nav-section__count">
                    {complete ? "✓ done" : `${st.done}/${st.total}`}
                  </span>
                </div>
              )}
              <button
                className={`lesson-link${active ? " is-active" : ""}`}
                onClick={() => onSelectLesson(l.id)}
              >
                <span className={`tick${done.has(l.id) ? " is-done" : ""}`}>
                  {done.has(l.id) ? "✓" : i + 1}
                </span>
                <span className="lesson-link__title">{l.title}</span>
              </button>
            </Fragment>
          );
        })}
      </nav>

      <div className="playground-nav">
        <div className="nav-label">Free play</div>
        <button
          className={`lesson-link${view === "playground" ? " is-active" : ""}`}
          onClick={onOpenPlayground}
        >
          <span className="tick">▶</span>
          <span className="lesson-link__title">Playground</span>
        </button>
        {view === "playground" && (
          <div className="db-picker">
            {DATABASES.map((d) => (
              <label key={d.id} className="db-option">
                <input
                  type="radio"
                  name="pg-db"
                  checked={playgroundDbId === d.id}
                  onChange={() => onSelectPlaygroundDb(d.id)}
                />
                {d.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar__footer">
        <button className="reset-progress" onClick={onResetProgress}>
          Reset progress
        </button>
        <a href="https://github.com/uAliAmer/learn-sql" target="_blank" rel="noreferrer">
          source ↗
        </a>
      </div>
    </aside>
  );
}
