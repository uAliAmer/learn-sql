// Smoke test: run every lesson's reference SQL against a real PGlite Postgres
// to prove the seeds + solutions actually execute and return sensible rows.
// Run: node --experimental-strip-types scripts/smoke.ts
import { PGlite } from "@electric-sql/pglite";
import { DATABASES, getDatabase } from "../src/data/databases.ts";
import { LESSONS } from "../src/data/lessons.ts";

let failures = 0;
const fail = (msg: string) => {
  failures++;
  console.error("  ✗ " + msg);
};

const db = await PGlite.create();

async function loadSeed(seedId: string) {
  const d = getDatabase(seedId);
  await db.exec("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; SET search_path TO public;");
  await db.exec(d.seedSql);
}

// 1. Every sample DB seed must load cleanly.
for (const d of DATABASES) {
  try {
    await loadSeed(d.id);
    console.log(`✓ seed loads: ${d.name}`);
  } catch (e) {
    fail(`seed ${d.id} failed to load: ${(e as Error).message}`);
  }
}

// 2. Every lesson's solution (and checkSql) must run without error.
for (const lesson of LESSONS) {
  await loadSeed(lesson.databaseId);
  try {
    if (lesson.checkSql) {
      // Write lesson: run the mutation, then the verification query.
      await db.exec(lesson.solutionSql);
      const r = await db.query(lesson.checkSql);
      if (r.rows.length === 0) fail(`${lesson.id}: checkSql returned 0 rows`);
    } else {
      const r = await db.query(lesson.solutionSql);
      if (r.rows.length === 0) fail(`${lesson.id}: solution returned 0 rows`);
    }
    console.log(`✓ lesson runs: ${lesson.id}`);
  } catch (e) {
    fail(`${lesson.id}: ${(e as Error).message}`);
  }
}

// 3. Spot-check a couple of known answers.
await loadSeed("shop");
const count = await db.query<{ count: number }>("SELECT count(*)::int AS count FROM customers");
if (Number(count.rows[0].count) !== 8) fail(`expected 8 customers, got ${count.rows[0].count}`);

const rev = await db.query<{ name: string; revenue: number }>(
  "SELECT c.name, sum(oi.quantity * oi.unit_price) AS revenue FROM customers c JOIN orders o ON o.customer_id = c.id JOIN order_items oi ON oi.order_id = o.id GROUP BY c.name",
);
if (rev.rows.length === 0) fail("revenue capstone returned no rows");
console.log(`✓ capstone revenue rows: ${rev.rows.length}`);

await db.close();
if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nAll smoke checks passed.");
