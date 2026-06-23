import { useState } from "react";
import type { Lesson } from "../data/lessons";
import { renderText } from "../lib/markdown";
import { conceptColor, conceptTagline } from "../data/concepts";
import { ConceptArt } from "./ConceptArt";
import { SyntaxDiagram } from "./SyntaxDiagram";

export type CheckState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "pass" }
  | { status: "fail"; message: string };

interface Props {
  lesson: Lesson;
  index: number;
  total: number;
  completedCount: number;
  check: CheckState;
  isDone: boolean;
  onNext?: () => void;
}

export function LessonPanel({
  lesson,
  index,
  total,
  completedCount,
  check,
  isDone,
  onNext,
}: Props) {
  const [showHint, setShowHint] = useState(false);
  const color = conceptColor(lesson.concept);
  const remaining = Math.max(0, total - completedCount);

  return (
    <div className="lesson">
      <div className="lesson__head">
        <span className="chip" style={{ backgroundColor: color }}>
          {lesson.concept}
        </span>
        <span className="lesson__count">
          Lesson {index + 1} / {total}
        </span>
        {isDone ? (
          <span className="lesson__done">✓ done</span>
        ) : (
          <span className="lesson__remain">{remaining} to go</span>
        )}
      </div>

      <h2>{lesson.title}</h2>
      <div className="concept-tag" style={{ color }}>
        {conceptTagline(lesson.concept)}
      </div>

      <div className="key-idea" style={{ borderColor: color }}>
        <span className="key-idea__bulb">💡</span>
        <div className="key-idea__text">{renderText(lesson.keyIdea)}</div>
      </div>

      <ConceptArt concept={lesson.concept} />

      <div className="lesson__prompt">{renderText(lesson.prompt)}</div>

      <SyntaxDiagram parts={lesson.syntax} />

      <button className="link" type="button" onClick={() => setShowHint((s) => !s)}>
        {showHint ? "Hide hint" : "Show hint"}
      </button>
      {showHint && <pre className="lesson__hint">{lesson.hint}</pre>}

      {check.status === "pass" && (
        <div className="feedback feedback--pass">
          <span>{praise(completedCount, total)}</span>
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

function praise(completedCount: number, total: number): string {
  if (completedCount >= total) {
    return `🏆 That's all ${total} lessons — you can really SQL now!`;
  }
  const msgs = [
    "🎉 Nailed it!",
    "🔥 Correct — keep the streak going!",
    "✅ Spot on!",
    "💪 Exactly right!",
    "🌟 Beautiful query!",
  ];
  return msgs[completedCount % msgs.length];
}
