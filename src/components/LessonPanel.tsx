import { useState } from "react";
import type { Lesson } from "../data/lessons";
import { renderText } from "../lib/markdown";
import { conceptColor } from "../data/concepts";
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
  const [showLearn, setShowLearn] = useState(true);
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

      {/* The hero: the one thing to do. */}
      <div className="task">
        <span className="task__label">🎯 Your task</span>
        <div className="task__body">{renderText(lesson.task)}</div>
      </div>

      {/* Supporting teaching material, collapsible. */}
      <button
        className="learn-toggle"
        type="button"
        onClick={() => setShowLearn((s) => !s)}
        aria-expanded={showLearn}
      >
        {showLearn ? "▾" : "▸"} How it works
      </button>

      {showLearn && (
        <div className="learn">
          <div className="key-idea" style={{ borderColor: color }}>
            <span className="key-idea__bulb">💡</span>
            <div className="key-idea__text">{renderText(lesson.keyIdea)}</div>
          </div>
          <ConceptArt concept={lesson.concept} />
          <SyntaxDiagram parts={lesson.syntax} />
        </div>
      )}

      <button className="link" type="button" onClick={() => setShowHint((s) => !s)}>
        {showHint ? "Hide hint" : "Show hint (reveals the answer)"}
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
