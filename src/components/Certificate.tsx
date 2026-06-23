import { forwardRef } from "react";

interface Props {
  name: string;
  dateStr: string;
  lessonCount: number;
  sectionCount: number;
}

/**
 * The certificate, drawn as a self-contained SVG (no external fonts/images) so
 * it can be rasterized to PNG on a canvas without tainting it.
 */
export const Certificate = forwardRef<SVGSVGElement, Props>(function Certificate(
  { name, dateStr, lessonCount, sectionCount },
  ref,
) {
  const nameSize = name.length > 22 ? 30 : name.length > 16 ? 38 : 46;
  return (
    <svg
      ref={ref}
      className="cert"
      width={900}
      height={620}
      viewBox="0 0 900 620"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x={0} y={0} width={900} height={620} fill="#0d1117" />
      <rect x={24} y={24} width={852} height={572} rx={16} fill="none" stroke="#e3b341" strokeWidth={3} />
      <rect x={38} y={38} width={824} height={544} rx={12} fill="none" stroke="#2d333b" strokeWidth={1} />

      <text x={450} y={106} fill="#e3b341" fontSize={20} fontWeight={700} letterSpacing={6} textAnchor="middle" fontFamily="system-ui, sans-serif">
        LEARN SQL
      </text>
      <text x={450} y={176} fill="#e6edf3" fontSize={46} fontWeight={800} textAnchor="middle" fontFamily="system-ui, sans-serif">
        Certificate of Completion
      </text>
      <line x1={345} y1={202} x2={555} y2={202} stroke="#e3b341" strokeWidth={2} />

      <text x={450} y={256} fill="#8b949e" fontSize={18} textAnchor="middle" fontFamily="system-ui, sans-serif">
        This certifies that
      </text>
      <text x={450} y={318} fill="#58a6ff" fontSize={nameSize} fontWeight={800} textAnchor="middle" fontFamily="system-ui, sans-serif">
        {name}
      </text>
      <line x1={250} y1={338} x2={650} y2={338} stroke="#2d333b" strokeWidth={1} />

      <text x={450} y={386} fill="#cdd9e5" fontSize={18} textAnchor="middle" fontFamily="system-ui, sans-serif">
        has completed all {lessonCount} lessons across {sectionCount} sections of the Learn SQL
      </text>
      <text x={450} y={414} fill="#cdd9e5" fontSize={18} textAnchor="middle" fontFamily="system-ui, sans-serif">
        course — from SELECT and JOINs to JSON, indexes, and Postgres extensions.
      </text>

      {/* Date */}
      <text x={235} y={492} fill="#8b949e" fontSize={12} letterSpacing={2} textAnchor="middle" fontFamily="system-ui, sans-serif">
        COMPLETED
      </text>
      <text x={235} y={514} fill="#e6edf3" fontSize={16} textAnchor="middle" fontFamily="system-ui, sans-serif">
        {dateStr}
      </text>

      {/* Seal */}
      <circle cx={690} cy={500} r={44} fill="none" stroke="#e3b341" strokeWidth={3} />
      <circle cx={690} cy={500} r={34} fill="none" stroke="#e3b341" strokeWidth={1} />
      <text x={690} y={496} fill="#e3b341" fontSize={19} fontWeight={800} textAnchor="middle" fontFamily="system-ui, sans-serif">
        SQL
      </text>
      <text x={690} y={514} fill="#8b949e" fontSize={9} letterSpacing={2} textAnchor="middle" fontFamily="system-ui, sans-serif">
        CERTIFIED
      </text>

      <text x={450} y={566} fill="#6e7681" fontSize={13} textAnchor="middle" fontFamily="system-ui, sans-serif">
        learn-sql-101.pages.dev
      </text>
    </svg>
  );
});
