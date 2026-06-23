import { conceptColor } from "../data/concepts";

interface Props {
  concept: string;
}

const NEUTRAL = "#2d333b";
const ROW = "#1c2230";
const MUTED = "#8b949e";

/** A small schematic illustration of what each concept does. */
export function ConceptArt({ concept }: Props) {
  const c = conceptColor(concept);
  const inner = render(concept, c);
  if (!inner) return null; // concepts without an illustration just render nothing
  return (
    <figure className="concept-art">
      <svg viewBox="0 0 300 140" role="img" aria-label={`${concept} illustration`}>
        {inner}
      </svg>
      {CAPTIONS[concept] && <figcaption>{CAPTIONS[concept]}</figcaption>}
    </figure>
  );
}

const CAPTIONS: Record<string, string> = {
  SELECT: "Choose which columns come back.",
  WHERE: "Rows that fail the test are dropped.",
  "ORDER BY": "Sort the rows, then keep the top few.",
  Aggregate: "Many rows collapse into a single value.",
  "GROUP BY": "Rows fall into buckets; each bucket → one row.",
  JOIN: "Matching keys link rows across two tables.",
  Write: "Insert, update, or delete actual rows.",
  Index: "An index skips the full scan, straight to the rows.",
  JSON: "-> reads a field; ->> returns it as text.",
  pgvector: "Nearest vectors to the query point.",
};

function render(concept: string, c: string) {
  switch (concept) {
    case "SELECT":
      return (
        <>
          {[0, 1, 2].map((col) =>
            [0, 1, 2, 3].map((row) => (
              <rect
                key={`${col}-${row}`}
                x={40 + col * 75}
                y={20 + row * 26}
                width={66}
                height={20}
                rx={4}
                fill={col === 1 ? c : ROW}
                stroke={NEUTRAL}
                opacity={col === 1 ? 1 : 0.55}
              />
            )),
          )}
          <text x={73} y={132} fill={MUTED} fontSize="11" textAnchor="middle">
            id
          </text>
          <text x={148} y={132} fill={c} fontSize="11" textAnchor="middle" fontWeight="700">
            name ✓
          </text>
          <text x={223} y={132} fill={MUTED} fontSize="11" textAnchor="middle">
            price
          </text>
        </>
      );

    case "WHERE":
      return (
        <>
          {[
            { y: 10, pass: true },
            { y: 36, pass: false },
            { y: 62, pass: true },
            { y: 88, pass: false },
            { y: 114, pass: true },
          ].map((r, i) => (
            <g key={i} opacity={r.pass ? 1 : 0.4}>
              <rect x={30} y={r.y} width={150} height={20} rx={4} fill={r.pass ? c : ROW} stroke={NEUTRAL} />
              <text x={210} y={r.y + 15} fill={r.pass ? c : MUTED} fontSize="14" fontWeight="700">
                {r.pass ? "✓ keep" : "✕ drop"}
              </text>
            </g>
          ))}
        </>
      );

    case "ORDER BY":
      return (
        <>
          {[120, 96, 74, 52, 34, 20].map((h, i) => (
            <rect
              key={i}
              x={28 + i * 44}
              y={130 - h}
              width={32}
              height={h}
              rx={4}
              fill={i < 3 ? c : ROW}
              stroke={NEUTRAL}
              opacity={i < 3 ? 1 : 0.5}
            />
          ))}
          <text x={72} y={14} fill={c} fontSize="11" fontWeight="700" textAnchor="middle">
            LIMIT 3
          </text>
        </>
      );

    case "Aggregate":
      return (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={24} y={16 + i * 22} width={90} height={16} rx={3} fill={ROW} stroke={NEUTRAL} />
          ))}
          <text x={150} y={75} fill={MUTED} fontSize="22">
            →
          </text>
          <rect x={186} y={48} width={90} height={44} rx={8} fill={c} />
          <text x={231} y={76} fill="#0d1117" fontSize="20" fontWeight="800" textAnchor="middle">
            Σ = 8
          </text>
        </>
      );

    case "GROUP BY":
      return (
        <>
          {[
            { x: 20, label: "A", n: 3 },
            { x: 115, label: "B", n: 2 },
            { x: 210, label: "C", n: 4 },
          ].map((g) => (
            <g key={g.label}>
              <rect x={g.x} y={18} width={70} height={88} rx={8} fill="none" stroke={c} strokeDasharray="4 3" />
              {Array.from({ length: g.n }).map((_, i) => (
                <circle key={i} cx={g.x + 20 + (i % 2) * 28} cy={36 + Math.floor(i / 2) * 26} r={9} fill={c} />
              ))}
              <text x={g.x + 35} y={124} fill={MUTED} fontSize="12" textAnchor="middle">
                {g.label} → {g.n}
              </text>
            </g>
          ))}
        </>
      );

    case "JOIN":
      return (
        <>
          {[0, 1, 2].map((i) => (
            <rect key={`l${i}`} x={18} y={24 + i * 30} width={96} height={22} rx={4} fill={ROW} stroke={NEUTRAL} />
          ))}
          {[0, 1, 2].map((i) => (
            <rect key={`r${i}`} x={186} y={24 + i * 30} width={96} height={22} rx={4} fill={ROW} stroke={NEUTRAL} />
          ))}
          <line x1={114} y1={35} x2={186} y2={65} stroke={c} strokeWidth={2.5} />
          <line x1={114} y1={65} x2={186} y2={35} stroke={c} strokeWidth={2.5} />
          <line x1={114} y1={95} x2={186} y2={95} stroke={c} strokeWidth={2.5} />
          <circle cx={114} cy={35} r={4} fill={c} />
          <circle cx={186} cy={65} r={4} fill={c} />
          <text x={150} y={128} fill={c} fontSize="11" fontWeight="700" textAnchor="middle">
            ON a.id = b.a_id
          </text>
        </>
      );

    case "Write":
      return (
        <>
          {[
            { y: 16, icon: "+", label: "INSERT", col: c },
            { y: 56, icon: "✎", label: "UPDATE", col: c },
            { y: 96, icon: "🗑", label: "DELETE", col: c },
          ].map((r, i) => (
            <g key={i}>
              <rect x={30} y={r.y} width={170} height={28} rx={5} fill={ROW} stroke={NEUTRAL} />
              <circle cx={48} cy={r.y + 14} r={11} fill={r.col} />
              <text x={48} y={r.y + 19} fill="#0d1117" fontSize="14" fontWeight="800" textAnchor="middle">
                {r.icon}
              </text>
              <text x={224} y={r.y + 19} fill={MUTED} fontSize="12" fontWeight="700">
                {r.label}
              </text>
            </g>
          ))}
        </>
      );

    case "JSON":
      return (
        <>
          <rect x={20} y={22} width={150} height={96} rx={8} fill={ROW} stroke={NEUTRAL} />
          <text x={32} y={48} fill={MUTED} fontSize="12" fontFamily="ui-monospace, monospace">
            "name": …
          </text>
          <rect x={26} y={58} width={138} height={20} rx={4} fill={c} opacity={0.18} />
          <text x={32} y={72} fill={c} fontSize="12" fontFamily="ui-monospace, monospace" fontWeight="700">
            "city": "Cairo"
          </text>
          <text x={32} y={98} fill={MUTED} fontSize="12" fontFamily="ui-monospace, monospace">
            "plan": "pro"
          </text>
          <line x1={170} y1={68} x2={206} y2={68} stroke={c} strokeWidth={2.5} />
          <polygon points="206,64 206,72 213,68" fill={c} />
          <rect x={218} y={56} width={64} height={24} rx={6} fill={c} />
          <text x={250} y={72} fill="#0d1117" fontSize="12" fontWeight="800" textAnchor="middle">
            Cairo
          </text>
        </>
      );

    case "Index": {
      const match = 3;
      const rows = [0, 1, 2, 3, 4, 5];
      const y = (r: number) => 35 + r * 15;
      return (
        <>
          <text x={73} y={18} fill={MUTED} fontSize="11" textAnchor="middle">
            Seq Scan
          </text>
          <text x={227} y={18} fill={c} fontSize="11" textAnchor="middle" fontWeight="700">
            Index
          </text>
          {rows.map((r) => (
            <g key={`l${r}`}>
              <rect x={38} y={30 + r * 15} width={72} height={11} rx={3} fill={ROW} stroke={NEUTRAL} opacity={0.7} />
              <circle cx={28} cy={y(r)} r={2.5} fill={MUTED} />
            </g>
          ))}
          <text x={73} y={132} fill={MUTED} fontSize="10" textAnchor="middle">
            checks every row
          </text>
          {rows.map((r) => (
            <rect
              key={`r${r}`}
              x={192}
              y={30 + r * 15}
              width={72}
              height={11}
              rx={3}
              fill={r === match ? c : ROW}
              stroke={NEUTRAL}
              opacity={r === match ? 1 : 0.55}
            />
          ))}
          <line x1={150} y1={y(match)} x2={188} y2={y(match)} stroke={c} strokeWidth={2.5} />
          <polygon
            points={`188,${y(match) - 4} 188,${y(match) + 4} 195,${y(match)}`}
            fill={c}
          />
          <text x={227} y={132} fill={c} fontSize="10" textAnchor="middle">
            jumps to match
          </text>
        </>
      );
    }

    case "pgvector": {
      const q = { x: 62, y: 80 };
      const pts = [
        { x: 96, y: 62, near: true },
        { x: 122, y: 98, near: true },
        { x: 200, y: 40, near: false },
        { x: 240, y: 92, near: false },
        { x: 176, y: 112, near: false },
        { x: 262, y: 54, near: false },
      ];
      return (
        <>
          {pts.map((p, i) => (
            <g key={i}>
              {p.near && (
                <line
                  x1={q.x}
                  y1={q.y}
                  x2={p.x}
                  y2={p.y}
                  stroke={c}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                />
              )}
              <circle
                cx={p.x}
                cy={p.y}
                r={8}
                fill={p.near ? c : ROW}
                stroke={NEUTRAL}
                opacity={p.near ? 1 : 0.6}
              />
            </g>
          ))}
          <circle cx={q.x} cy={q.y} r={11} fill="none" stroke={c} strokeWidth={2.5} />
          <circle cx={q.x} cy={q.y} r={4} fill={c} />
          <text x={q.x} y={q.y - 18} fill={c} fontSize="11" fontWeight="700" textAnchor="middle">
            query
          </text>
        </>
      );
    }

    default:
      return null;
  }
}
