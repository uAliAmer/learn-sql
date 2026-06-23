# 🐘 Learn SQL

**▶ Live demo: https://learn-sql-101.pages.dev**

An interactive web app for learning SQL against a **real Postgres database that
runs entirely in your browser** — no server, no signup, nothing to install.

Each visitor gets their own isolated database powered by
[PGlite](https://pglite.dev) (Postgres compiled to WebAssembly). Run real
queries, see real results, and watch `INSERT` / `UPDATE` / `DELETE` actually
change the data.

## Features

- **32 guided lessons** in 8 sections — from `SELECT *` through joins,
  subqueries, CTEs and `CASE`, **JSON/JSONB** (`->`, `->>`, `@>`, array
  expansion, `jsonb_set`), **indexes** (B-tree + bloom, on a 5,000-row table so
  `EXPLAIN` flips from Seq Scan to Index Scan), plus real **Postgres
  extensions** (pgvector similarity search, pg_trgm fuzzy matching, hstore,
  ltree) — all with automatic answer checking.
- **Playground mode** — free-form SQL against eight sample databases (an online
  shop, a city library, JSON profiles, a 5k-row events table, and four extension demos).
- **Live schema viewer** — click a table or column to drop it into the editor.
- **Progress saved** locally (localStorage), so your checkmarks persist.
- **Real Postgres dialect** — `serial`, `numeric`, `JOIN`, `HAVING`, etc.

## Tech

- React + Vite + TypeScript
- [PGlite](https://pglite.dev) — Postgres in WASM, client-side
- CodeMirror 6 (SQL mode)
- Hosted on Cloudflare Pages

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build & deploy (Cloudflare Pages)

```bash
npm run build      # → ./dist
npm run deploy     # wrangler pages deploy ./dist
```

The app is 100% static — PGlite executes all SQL in the browser, so there is no
backend or database to provision.
