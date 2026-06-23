import { useRef } from "react";
import { Certificate } from "./Certificate";

interface Props {
  name: string;
  onName: (n: string) => void;
  lessonCount: number;
  sectionCount: number;
  onClose: () => void;
}

export function CertificateModal({ name, onName, lessonCount, sectionCount, onClose }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const display = name.trim() || "SQL Learner";

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__card" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h2>🎓 Course complete!</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <p className="muted">
          You finished all {lessonCount} lessons. Add your name and download your certificate.
        </p>

        <label className="modal__name">
          Name on certificate
          <input
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder="Your name"
            maxLength={40}
            autoFocus
          />
        </label>

        <div className="cert-wrap">
          <Certificate
            ref={svgRef}
            name={display}
            dateStr={dateStr}
            lessonCount={lessonCount}
            sectionCount={sectionCount}
          />
        </div>

        <div className="modal__actions">
          <button
            className="btn btn--primary"
            onClick={() => svgRef.current && downloadPng(svgRef.current, display)}
          >
            ⬇ Download PNG
          </button>
          <button className="btn btn--ghost" onClick={() => window.print()}>
            🖨 Print
          </button>
          <button className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/** Rasterize the certificate SVG to a PNG and trigger a download. */
function downloadPng(svg: SVGSVGElement, name: string) {
  const xml = new XMLSerializer().serializeToString(svg);
  const dataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
  const img = new Image();
  img.onload = () => {
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = 900 * scale;
    canvas.height = 620 * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `learn-sql-certificate-${slug(name)}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  };
  img.src = dataUrl;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "learner";
}
