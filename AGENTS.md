# AGENTS.md

Static club website (Old Goat Track Club), served **directly from the repo root by GitHub Pages** at `ogtc.net` via `CNAME`. There is no build, bundler output, or deploy workflow: pushing to `main` publishes the files as-is. Vite is only a local dev server.

## Commands

- `npm ci` — install (Node 22; lockfile is committed).
- `npm run dev` — Vite server on `http://localhost:8000` (`--host`).
- `npm run format` — Prettier write over the repo. **This is the only quality gate for now.**
- `docker compose up -d` / `down` — dev container (`ogtc-dev`) + formatter watcher (`ogtc-watch`).
- `docker compose build image-optimizer` then `docker compose run --rm image-optimizer` — compress images in place.

No test, lint, typecheck, or build scripts exist. Do not invent one; CI (`.github/workflows/format-check.yaml`) only runs a Prettier `--check` on PRs to `main`. Reproduce it with `npx prettier --check "**/*.{js,html,yaml,css,json}"`.

## Work tracking

Backlog and status live in GitHub Issues. Run `gh auth status` first.

- Backlog: `gh issue list --label backlog`
- Ideas: `gh issue list --label backlog --label idea`
- In progress: `gh issue list --label in-progress`
- Done: `gh issue list --state closed`

Labels: type `bug`, `feature`, `tech-debt`; state `backlog`, `in-progress`; marker `idea`. Every open issue has exactly one state label. `idea` means not approved and still sits in backlog; remove it when approved. Start work by swapping `backlog` for `in-progress` and running `gh issue develop N --checkout`. PRs use `Fixes #N`; close manually with `--reason completed`.

## Path conventions (easy to break)

- `/index.html` uses **absolute** paths (`/src/styles.css`, `/src/htmx-components/nav.html`).
- Everything in `/src/*.html` uses **relative** paths (`styles.css`, `js/loadSheets.js`, `data/*.csv`).
- Keep this split when adding pages: a new page in `src/` must use relative asset and `hx-get` paths or it will work in Vite but 404 on Pages.

## Page structure

- Pages are hand-written HTML with duplicated `<header>`, `<nav>` placeholder, `<footer>`, and Clicky analytics script. There are 9 pages (`index.html` + 8 in `src/`); header/footer/analytics edits must be applied to every page.
- Navigation is the one shared partial: `src/htmx-components/nav.html`, injected with vendored HTMX (`src/libraries/htmx-2.0.10.min.js`, not an npm package). Edit the partial once; the per-page `<nav hx-get=...>` is just the mount point.
- `src/schedule.html` and `src/results.html` exist but are commented out of the nav and still read local CSVs — treat them as disabled.

## Data sources

- `roster.html` and `records.html` fetch **live from a public Google Sheet** using the gviz CSV endpoint in `src/js/loadSheets.js` (hardcoded `SPREADSHEET_ID`; the sheet must remain "anyone with the link"). Local `src/data/*.csv` files do **not** feed these pages.
  - Tabs: `women_roster`, `men_roster`, `records-{xc,road_trail,outdoor,indoor}`.
  - Roster rows must have exactly 8 columns (name, front photo, hometown, college, events, nickname, PRs, quote); other rows are silently skipped. Photos resolve to `assets/roster-photos/<team>/<filename>`, falling back to `goat-head.png` when the filename cell is blank.
- `src/data/*.csv` is only used by the disabled schedule/results pages.
- The contact form posts directly to a Google Form endpoint with `mode: "no-cors"`; failures are not observable client-side.

## Gotchas

- `docker compose up` runs `npm run format` on the whole repo, and `ogtc-watch` reformats 10 seconds after any save. Starting Docker can dirty your tree or rewrite files under you; the README also warns this can conflict with editor saves.
- Prettier ignores `**/*.md` and `**/*.min.js` via `.prettierignore`; don't hand-format the vendored HTMX file.
- The image optimizer overwrites originals in place (files >500 KB, resized to max 1920 px, JPEG capped at 500 KB) and skips `image-optimizer/` and hidden dirs. Commit or stash first. It is in the `tools` Compose profile, so plain `docker compose up` will not run it. The README's claim that it "does not resize" is stale — the script does.
