# Sketch

A touch-first 160×160 drawing board for Wolfpack Extensions APIv1. One tool row: Draw (freehand stroke), Box, Spikes (hazard), Start, Goal, Text, Move (select, drag, resize). Actions: Undo, Delete, Clear and a primary Send to agent. Boxes, stamps and text snap to 8 units; strokes are not snapped (RDP-simplified to at most 48 integer points). A stroke is a `stroke <id> x,y x,y …;` line in the compose block: a solid ground/platform surface unless labelled otherwise. `arrow` shapes in agent boards still load and render but there is no arrow tool.

Send to agent composes a semicolon-delimited `sketch v1` block into the agent prompt when the host terminal is open and copies the same text to the clipboard in the same click; the status says which happened. It never sends; the human sends from the terminal. The 4000-byte counter bounds the block and disables Send; about 10 dense freehand strokes reach it. On phone-width layouts the current host hides its message bar during a live terminal, so paste the copied text into the terminal. Keyboard: focus the canvas, arrows move cursor/selection, Enter applies the Box/Start/Goal/Spikes/Text tool at the cursor (Draw needs touch or pointer), Delete removes selection.

Agent boards use the session-scoped `sketch/board` document. Non-empty local work is never replaced without Load; Keep mine retains its base revision. Local drafts persist in scoped storage. Documents and drafts do not carry into a new session; ask to republish the last board built for this project.

Install an absolute package directory with explicit browser-code trust and optional `--skills pi` consent. No consumer build or runtime dependencies. See `skills/wolfpack-sketch/SKILL.md` for drawing grammar and safe CAS publication.

Development: `bun run typecheck`, `bun run build`, `bun test test`, `bun run check:package`, `bun run check:package-negative`, `bun run pack`. Physical iOS Safari needs manual verification; automated tests use Chromium mobile touch under CSP.
