# Sketch

A touch-first 160×160 drawing board for Wolfpack Extensions APIv1. Draw rectangles, hazards, arrows, text, starts and goals. Select, move, resize, delete and undo; snap defaults to 8 units.

Send to agent composes a semicolon-delimited `sketch v1` block; it never sends. The human sends from the terminal. The 4000-byte counter bounds compose; Copy has a selectable fallback. On phone-width layouts the current host hides its message bar during a live terminal, so a composed draft is not visible there; use Copy and paste into the terminal instead. Keyboard: focus the canvas, arrows move cursor/selection, Enter applies the tool, Delete removes selection.

Agent boards use the session-scoped `sketch/board` document. Non-empty local work is never replaced without Load; Keep mine retains its base revision. Local drafts persist in scoped storage. Documents and drafts do not carry into a new session; ask to republish the last board built for this project.

Install an absolute package directory with explicit browser-code trust and optional `--skills pi` consent. No consumer build or runtime dependencies. See `skills/wolfpack-sketch/SKILL.md` for drawing grammar and safe CAS publication.

Development: `bun run typecheck`, `bun run build`, `bun test test`, `bun run check:package`, `bun run check:package-negative`, `bun run pack`. Physical iOS Safari needs manual verification; automated tests use Chromium mobile touch under CSP.
