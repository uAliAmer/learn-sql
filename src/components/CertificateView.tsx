import { useRef } from "react";
import { Certificate } from "./Certificate";
import { downloadCertificatePng } from "../lib/certificate";

interface Props {
  doneCount: number;
  total: number;
  sectionCount: number;
  name: string;
  locked: boolean;
  onClaim: () => void;
}

export function CertificateView({ doneCount, total, sectionCount, name, locked, onClaim }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const complete = doneCount >= total;
  const remaining = Math.max(0, total - doneCount);
  const pct = Math.round((doneCount / total) * 100);
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const display = locked ? name.trim() || "SQL Learner" : "Your Name Here";

  return (
    <section className="cert-view">
      <h2>Certificate of Completion</h2>
      <p className="muted">
        {complete
          ? "🎉 You've completed every lesson — claim your certificate below."
          : `Finish all ${total} lessons to unlock your certificate.`}
      </p>

      <div className="cert-progress">
        <div className="bar">
          <div className="bar__fill" style={{ width: `${pct}%` }} />
        </div>
        <span>
          {doneCount}/{total} lessons{!complete && ` · ${remaining} to go`}
        </span>
      </div>

      <div className={`cert-stage${complete ? "" : " is-locked"}`}>
        <Certificate
          ref={svgRef}
          name={display}
          dateStr={dateStr}
          lessonCount={total}
          sectionCount={sectionCount}
        />
        {!complete && (
          <div className="cert-overlay">
            <div className="cert-overlay__lock">🔒</div>
            <div>
              {remaining} lesson{remaining === 1 ? "" : "s"} to go
            </div>
          </div>
        )}
      </div>

      <div className="cert-view__actions">
        {!complete && <span className="muted">Keep going — your certificate is waiting.</span>}
        {complete && !locked && (
          <button className="btn btn--primary" onClick={onClaim}>
            ✓ Add your name
          </button>
        )}
        {complete && locked && (
          <>
            <button
              className="btn btn--primary"
              onClick={() => svgRef.current && downloadCertificatePng(svgRef.current, display)}
            >
              ⬇ Download PNG
            </button>
            <button className="btn btn--ghost" onClick={() => window.print()}>
              🖨 Print
            </button>
          </>
        )}
      </div>
    </section>
  );
}
