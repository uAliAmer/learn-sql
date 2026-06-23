import { LESSONS } from "../data/lessons";
import { DATABASES } from "../data/databases";

interface Props {
  view: "lesson" | "playground";
  activeLessonId: string | null;
  playgroundDbId: string;
  done: Set<string>;
  onSelectLesson: (id: string) => void;
  onOpenPlayground: () => void;
  onSelectPlaygroundDb: (id: string) => void;
}

export function Sidebar({
  view,
  activeLessonId,
  playgroundDbId,
  done,
  onSelectLesson,
  onOpenPlayground,
  onSelectPlaygroundDb,
}: Props) {
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
        {done.size} / {LESSONS.length} lessons complete
        <div className="bar">
          <div
            className="bar__fill"
            style={{ width: `${(done.size / LESSONS.length) * 100}%` }}
          />
        </div>
      </div>

      <nav className="lessons-nav">
        <div className="nav-label">Lessons</div>
        {LESSONS.map((l, i) => {
          const active = view === "lesson" && l.id === activeLessonId;
          return (
            <button
              key={l.id}
              className={`lesson-link${active ? " is-active" : ""}`}
              onClick={() => onSelectLesson(l.id)}
            >
              <span className={`tick${done.has(l.id) ? " is-done" : ""}`}>
                {done.has(l.id) ? "✓" : i + 1}
              </span>
              <span className="lesson-link__title">{l.title}</span>
            </button>
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

      <a
        className="sidebar__footer"
        href="https://github.com/uAliAmer/learn-sql"
        target="_blank"
        rel="noreferrer"
      >
        source on GitHub ↗
      </a>
    </aside>
  );
}
