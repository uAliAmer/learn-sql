import type { SyntaxPart } from "../data/lessons";

interface Props {
  parts: SyntaxPart[];
}

/**
 * "Anatomy of the query": renders the statement as labeled building blocks,
 * with a note under each meaningful piece. Slots the learner fills (`fill`)
 * are drawn as dashed placeholders so the diagram teaches shape, not answer.
 */
export function SyntaxDiagram({ parts }: Props) {
  const notes = parts.filter((p) => p.note);
  return (
    <div className="syntax">
      <div className="syntax__label">Anatomy</div>
      <div className="syntax__line">
        {parts.map((p, i) => (
          <span key={i} className={`tok tok--${p.role}`}>
            {p.text}
          </span>
        ))}
      </div>
      {notes.length > 0 && (
        <ul className="syntax__notes">
          {notes.map((p, i) => (
            <li key={i}>
              <span className={`tok tok--${p.role} tok--mini`}>{p.text}</span>
              <span className="syntax__note">{p.note}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
