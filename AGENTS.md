# Project Context — IDURAR ERP/CRM

> Shared briefing for any AI coding agent (Claude Code, Codex, Cursor, …) and for humans
> joining the repo. This is the single source of truth — `CLAUDE.md` just points here.
> Auto-loaded each session so context survives between conversations.
> Ask me to revise any section; keep it current or it becomes a liability.
> **Last updated:** 2026-09-21

---

## 1. The goal

**Primary:** build a portfolio of projects that lands the next job opportunity. This
repo is portfolio piece #1 — the base to build on, not the finished product.

**What this implies for how we work:**
- Changes should be *explainable in an interview*. Prefer boring, defensible choices
  over clever ones. If I can't explain why in two sentences, it's the wrong change.
- Commit history is part of the artifact. Small, well-described commits.
- README/docs quality matters as much as the code — a reviewer skims before they read.

**Unfilled — ask before assuming:**
- Target role (frontend / backend / full-stack / product engineer?)
- Target companies or stack (does the portfolio need TypeScript? React Native? Cloud?)
- Timeline
- Whether this fork gets deployed publicly, or stays a local learning base

---

## 2. What this project is

Open-source **ERP/CRM invoicing app** (fork of [idurar-erp-crm](https://github.com/idurar/idurar-erp-crm), v4.1.0),
MERN stack. A single admin manages customers, invoices, payments, and PDF documents.

Despite the "ERP" name: **no** inventory, HR, or accounting ledger. Scope is
invoice-to-payment only.

```
React 18 + Vite + Ant Design 5 + Redux Toolkit   (frontend, :3000)
        │  axios, JWT in Authorization header
Express 4 + Mongoose 8                            (backend,  :8888)
        │
MongoDB 7                                         (docker,  :27017)
```

Two independent npm projects (`backend/`, `frontend/`). No root package.json, no CI, no Docker Compose.

**Entities:** `Client` (customers), `Invoice`, `Payment`. Plus core: `Admin`,
`AdminPassword`, `Setting`, `Upload`.

---

## 3. Two architectural ideas that explain most of the codebase

Understand these and the rest follows.

**① Backend routes are generated from filenames.**
`models/utils/index.js` scans `src/models/appModels/*.js`. Each file becomes an entity with
9 REST routes auto-minted in `routes/appRoutes/appApi.js`
(`create/read/update/delete/search/list/listAll/filter/summary`). A controller folder in
`controllers/appControllers/<name>Controller/` overrides the generic CRUD; otherwise
`createCRUDController` generates it.

*Consequence:* adding `models/appModels/Product.js` gives you a full `/api/product/*` API with
zero other edits. Also: **route strings are not greppable** — they're built at runtime.

**② Frontend screens are config, not code.**
`pages/Customer/index.jsx` is ~40 lines of config handed to `<CrudModule>`; `config.js`
declares fields by type and `DynamicForm` renders the Ant Design controls. Same trade-off:
fast to add screens, awkward when you need something the config language can't express.

**Other conventions worth knowing:**
- **Soft delete everywhere** — `removed: Boolean`, every query filters `{removed: false}`.
- **Uniform response envelope** — `{ success, result, message }`, plus `pagination` on lists.
- **Money never uses floats** — `helpers.js` wraps `currency.js`. `0.1 + 0.2 !== 0.3`.
- **Auth** — JWT, but every issued token is stored in `AdminPassword.loggedSessions[]` and
  checked on each request, so logout actually revokes. Costs a DB round-trip per request.
- **`@/` is an alias for `src/`** in both projects.

---

## 4. Local setup (working as of 2026-09-21)

```bash
docker start idurar-mongo                  # if not running
cd backend  && npm run dev                 # :8888
cd frontend && npm run dev                 # :3000
```
→ http://localhost:3000 · `admin@admin.com` / `admin123`

**Node version is load-bearing.** The app requires **Node 20**; on Node 24+ it crashes at
require time (`SlowBuffer` was removed; `jsonwebtoken → jws → jwa → buffer-equal-constant-time`
still uses it). Handled automatically via `fnm` + `.nvmrc` (`20`) in both project dirs.
System default stays Node 26 everywhere else.

- If `node -v` shows 26 inside the project → stale shell, run `exec zsh`.
- Escape hatch: `PATH="/usr/local/opt/node@20/bin:$PATH" npm run dev`

**Config:** `backend/.env.local` (gitignored, overrides the tracked `.env`) holds
`DATABASE`, `JWT_SECRET`, `NODE_ENV=development`. The tracked `.env` is left untouched
so no secret gets committed.

**Data:** Docker volume `idurar-mongo-data`. Reseed with `npm run reset && npm run setup`.

---

## 5. Changes made to the upstream fork

This clone arrived partially gutted — Quote/Offer/Taxes/PaymentMode were stripped but
references left behind, so neither half would start. Fixed:

| File | Change |
|---|---|
| `backend/src/setup/setup.js`, `reset.js` | Removed requires of deleted `PaymentMode`/`Taxes` models (crashed `npm run setup`) |
| `frontend/src/router/routes.jsx` | Removed 6 routes referencing never-imported components (blank page) |
| `frontend/src/apps/Navigation/NavigationContainer.jsx` | Removed 3 sidebar items pointing at those routes |
| `backend/src/controllers/pdfController/index.js` | Replaced dead `html-pdf`/PhantomJS with **Puppeteer**; added `mkdirSync` for download dirs |
| `backend/package.json` | `html-pdf` out, `puppeteer` in |
| `backend/.nvmrc`, `frontend/.nvmrc` | Pin Node 20 |

Machine-level (outside repo): Homebrew `node@20` + `fnm`, `~/.zshrc` fnm hook
(backup at `~/.zshrc.bak-20260921-155949`), Docker container `idurar-mongo`.

---

## 6. Known gaps / candidate work

Not bugs to fix blindly — these are the honest weak points, and several are good
portfolio material precisely *because* they're real.

- **No tests at all.** Zero. Biggest credibility gap for a portfolio piece.
- **No TypeScript.** Plain JS throughout.
- **Quote feature is half-removed** — `frontend/src/modules/QuoteModule/` is orphaned code;
  no `Quote` model means no `/api/quote/*` exists. Restoring it = write the model, routes appear free.
- **`DashboardModule` is orphaned** — never imported; `/` routes to Invoice instead.
- **Invoice numbering has a race** — `last_invoice_number` is read-then-incremented, not atomic.
- **Single hardcoded role** (`owner`); permissions were deliberately removed upstream.
- **`Payment` schema lacks a `pdf` field** though the controller writes one (silently dropped).
  Harmless — the UI builds URLs from `_id`.
- **`backend/.env` is committed upstream.** We work around it; worth calling out in a README.
- **`openai` is a dependency but never used.**
- No CI, no Docker Compose, no deployment.

---

## 7. Working agreements

- **Ponytail mode is active** — laziest solution that actually works. Reuse before writing,
  stdlib before dependencies, delete before adding. Deliberate shortcuts get a `ponytail:` comment.
- **Explain like I'm learning.** The user is a fresher engineer; when introducing a pattern,
  say *why* it exists and what the trade-off is, not just what to type.
- **Root cause, not symptom.** Read the error, reproduce it, then fix where all callers route through.
- **Verify before claiming done.** Run it, show the output.
- Don't leave background servers running — a stray process on :8888 already caused one
  `EADDRINUSE` false alarm.

---

## 8. Session log

Append one line per significant session. Keeps the "what changed since last time" cheap.

- **2026-09-21** — Repo walkthrough. Fixed 4 breakages blocking startup, replaced html-pdf
  with Puppeteer, set up Node 20 via fnm + Docker Mongo. App runs end-to-end: login,
  CRUD, invoice/payment PDF download all verified. Created this file.
