import { forwardRef } from "react";

interface Props {
  name: string;
  dateStr: string;
  lessonCount: number;
  sectionCount: number;
}

// Light "paper" certificate — navy + gold on white, prints and rasterizes clean.
const PAPER = "#ffffff";
const NAVY = "#12305a";
const GOLD = "#c2962c";
const BLUE = "#1f6feb";
const GRAY = "#6b7280";
const DARK = "#1f2937";
const FAINT = "#d1d5db";

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
      <rect x={0} y={0} width={900} height={620} fill={PAPER} />
      <rect x={24} y={24} width={852} height={572} rx={10} fill="none" stroke={NAVY} strokeWidth={3} />
      <rect x={36} y={36} width={828} height={548} rx={6} fill="none" stroke={GOLD} strokeWidth={1.5} />

      <text x={450} y={106} fill={GOLD} fontSize={20} fontWeight={700} letterSpacing={6} textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
        LEARN SQL
      </text>
      <text x={450} y={176} fill={NAVY} fontSize={46} fontWeight={800} textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
        Certificate of Completion
      </text>
      <line x1={345} y1={202} x2={555} y2={202} stroke={GOLD} strokeWidth={2} />

      <text x={450} y={256} fill={GRAY} fontSize={18} textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif" fontStyle="italic">
        This certifies that
      </text>
      <text x={450} y={318} fill={BLUE} fontSize={nameSize} fontWeight={800} textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
        {name}
      </text>
      <line x1={250} y1={338} x2={650} y2={338} stroke={FAINT} strokeWidth={1} />

      <text x={450} y={386} fill={DARK} fontSize={18} textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
        has completed all {lessonCount} lessons across {sectionCount} sections of the Learn SQL
      </text>
      <text x={450} y={414} fill={DARK} fontSize={18} textAnchor="middle" fontFamily="Georgia, 'Times New Roman', serif">
        course — from SELECT and JOINs to JSON, indexes, and Postgres extensions.
      </text>

      {/* Date */}
      <text x={235} y={492} fill={GRAY} fontSize={12} letterSpacing={2} textAnchor="middle" fontFamily="Georgia, serif">
        COMPLETED
      </text>
      <text x={235} y={514} fill={NAVY} fontSize={16} textAnchor="middle" fontFamily="Georgia, serif">
        {dateStr}
      </text>
      <line x1={150} y1={528} x2={320} y2={528} stroke={FAINT} strokeWidth={1} />

      {/* Seal */}
      <circle cx={690} cy={498} r={46} fill="none" stroke={GOLD} strokeWidth={3} />
      <circle cx={690} cy={498} r={36} fill="none" stroke={GOLD} strokeWidth={1} />
      <text x={690} y={494} fill={NAVY} fontSize={19} fontWeight={800} textAnchor="middle" fontFamily="Georgia, serif">
        SQL
      </text>
      <text x={690} y={512} fill={GOLD} fontSize={9} letterSpacing={2} textAnchor="middle" fontFamily="Georgia, serif">
        CERTIFIED
      </text>

      <text x={450} y={566} fill={GRAY} fontSize={13} textAnchor="middle" fontFamily="Georgia, serif">
        learn-sql-101.pages.dev
      </text>
    </svg>
  );
});
