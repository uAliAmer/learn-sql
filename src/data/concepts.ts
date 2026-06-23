// Visual + thematic metadata for each lesson concept. Drives the colored
// chip, the concept illustration, and the accent used in the syntax diagram.
export interface ConceptMeta {
  /** Accent color (hex). */
  color: string;
  /** One-line "what this family of queries is about". */
  tagline: string;
}

export const CONCEPTS: Record<string, ConceptMeta> = {
  SELECT: { color: "#58a6ff", tagline: "Read data out of a table." },
  WHERE: { color: "#d29922", tagline: "Keep only the rows that match." },
  "ORDER BY": { color: "#a371f7", tagline: "Sort the rows, then cap how many." },
  Aggregate: { color: "#3fb950", tagline: "Crunch many rows into one number." },
  "GROUP BY": { color: "#db61a2", tagline: "Bucket rows, summarize each bucket." },
  JOIN: { color: "#f0883e", tagline: "Stitch tables together on a shared key." },
  Write: { color: "#ff7b72", tagline: "Add, change, or remove rows." },
};

export function conceptColor(concept: string): string {
  return CONCEPTS[concept]?.color ?? "#58a6ff";
}

export function conceptTagline(concept: string): string {
  return CONCEPTS[concept]?.tagline ?? "";
}
