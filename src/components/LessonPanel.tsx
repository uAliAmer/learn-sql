import { useState } from "react";
import type { Lesson } from "../data/lessons";
import { renderText } from "../lib/markdown";

export type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "pass" }
  | { status: "fail"; message: string };

interface Props {
  lesson: Lesson;
  index: number;
  total: number;
  check: CheckState;
  isDone: boolean;
  onNext?: () => void;
}

export function LessonPanel({ lesson, index, total, check, isDone, onNext }: Props) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="lesson">
      <div className="lesson__head">
        <span className="chip">{lesson.concept}</span>
        <span className="lesson__count">
          Lesson {index + 1} / {total}
        </span>
        {isDone && <span className="lesson__done">✓ done</span>}
      </div>
      <h2>{lesson.title}</h2>
      <div className="lesson__prompt">{renderText(lesson.prompt)}</div>

      <button className="link" type="button" onClick={() => setShowHint((s) => !s)}>
        {showHint ? "Hide hint" : "Show hint"}
      </button>
      {showHint && <pre className="lesson__hint">{lesson.hint}</pre>}

      {check.status === "pass" && (
        <div className="feedback feedback--pass">
          🎉 Correct! That's exactly right.
          {onNext && (
            <button className="btn btn--small" type="button" onClick={onNext}>
              Next lesson →
            </button>
          )}
        </div>
      )}
      {check.status === "fail" && (
        <div className="feedback feedback--fail">❌ Not quite. {check.message}</div>
      )}
      {check.status === "checking" && <div className="feedback">Checking…</div>}
    </div>
  );
}
