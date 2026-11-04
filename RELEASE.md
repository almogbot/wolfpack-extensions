# Release checklist

- [ ] Confirm the exact target package/version is unpublished before attempting a new release. Changes `0.1.0` and Agent Context `0.1.0` are already published; Agent Context `0.1.1` is the pending release and Notes `0.1.0` remains unpublished. This repository has no publish workflow or checked-in credentials.
- [ ] Run root typecheck/build/test/package/negative/pack gates from this repository, then inspect each actual archive and SHA-512 receipt.
- [ ] Confirm package allowlists: Changes/Notes ship only package metadata, README, LICENSE and `dist/ui.js`; Agent Context additionally ships its schema-v3, skill/reference files, `dist/pi.js`, the Claude plugin manifest/hooks, `dist/claude.mjs` and `THIRD_PARTY_NOTICES.md`; the Pi companion imports only Node builtins and the declared Pi-provided peers, the Claude server only Node builtins (bundled SDK listed exactly in the notices).
- [ ] Verify the selected host explicitly implements Extensions APIv1. `wolfpack-bridge@1.6.24` is not compatible.
- [ ] Use exact `npm:package@version` commands for published versions, or an absolute unpacked package directory; do not represent archives or URLs as direct install sources.
- [ ] Before publishing Agent Context, independently verify its schema/skill and scoped revision/CAS behavior against the approved APIv1 host. Run `verify:pi-agent-context` with `WOLFPACK_PI_PACKAGE_ROOT` (tested Pi 1.4.0), `verify:host-agent-context-publisher` with both peer/host paths, `verify:claude-agent-context` with the host path, and `claude plugin validate` on the package and repository root (tested Claude Code 2.1.316). The scripted fixtures prove lifecycle wiring, meaningful-change deduplication and failure recovery, not universal production-model obedience or live hook loading.
- [ ] For Agent Context schema upgrades (v2→v3), finish replacement verification first, then have the authorized deployment owner purge **only** `agent-context` and install the built replacement. Old host documents are intentionally discarded; do not migrate or delete browser-local drafts/unrelated extension data. Install the same directory separately with `pi install` and, for Claude Code, through the repository's local marketplace; `--skills pi` only installs skill text. Verify activation in a new session or user-requested idle reload, never a forced active-agent reload. Ordinary same-schema patch releases do not require purging documents or reloading active sessions.

## Prepared Agent Context 0.1.1

Agent-decided meaningful updates replace mandatory per-request/final-reply refreshes in Pi and Claude. Identical valid snapshots retain their original provenance/time through CAS checks; failure/restoration invalidation and independent activity remain. Claude recovery ordering has deterministic failed/denied regression coverage and independent review approval.

- No schema migration or new dependency versions relative to published Agent Context 0.1.0. No Changes-extension implementation or release is included in this branch.
- Reviewed archive integrity: `sha512-cMpx09cUMyAZeYd2Al620oo6ZaIuIxAjyVFdyCJDcSQ6xkbvrPCmUOtnyh59PAx9QszfjDLSVAj91SUpb3btOA==`; all 12 shipped files match the independently rebuilt source.
- Isolated main-based candidate root build/package/negative/pack and tool-script types pass. Full repository suite: 142 pass, 15 Stage failures, 1 skipped AJV cross-check, 4 cascading errors. All 15 Stage failures and the Stage/Sketch nullable-listener type errors reproduce at baseline `28ae9ed575c411299c52221a6f21820da0b05cc4` with the same cached dependencies and tools. These are not repaired by this release. Agent Context has 77 passing tests after the correction.
- Selected Pi 1.4.0 peer and isolated Pi lifecycle gates pass; the corrected npm-packed Claude server/shipped-hook/public-CLI integration passes. Native plugin validation passes. These checks use scripted events, not live provider calls or physical-device coverage.
- Checks reuse existing cached dependency layouts, not a new frozen-lock installation. The isolated main-based branch produces the identical reviewed archive. Publication and deployment remain separate gates. No active session should be force-reloaded.

## Published Agent Context 0.1.0

Published to the public npm registry as `latest` on 2026-11-02. Only Agent Context was published; Changes, Notes, Sketch and Stage were not released. No merge or additional live installation was performed as part of publication.

- Package: `wolfpack-extension-agent-context@0.1.0`
- Source: `28ae9ed575c411299c52221a6f21820da0b05cc4` on `almogdepaz/wolfpack-extensions`, branch `fix/changes-diff-linenumbers`. Includes the schema-v3 focus panel, Pi companion, Claude Code plugin/local marketplace, and explicit separate-install onboarding. Do not assume the repository's default branch contains this release's marketplace; use this source revision.
- Archive SHA256: `a9e9498193e3117dd58ec0fbb4b0e0a926cd357cb243fe33e9a71d76fbd13cf2`
- npm integrity: `sha512-KwBgsGgno+gD0Powx4A4CE5uAePS4BZAd1ZW7cx5D2SpytHejqctz3n0eGSGHskmdLe3qpPJJNXh817jfrFWSw==` (shasum `6e1bbaa0df8751f1ebf1de26d372fa2f9862a7f6`). All 12 shipped files match the source and validated artifact.
- Agent Context browser tests: 13 passing tests/118 assertions, including explicit installation commands at 220px. Package types, positive/negative packaging gates, canonical build, exact archive inspection and strict Claude plugin/marketplace validation passed. The official MCP client/shipped-hook/public-CLI isolated integration passed against Wolfpack `12b9beed2c6243d599ecce28b7cf424961439625`; an earlier outer 90-second timeout was retained as an interrupted check, not a pass.
- Root build/package/negative/pack gates passed. Root types retain the pre-existing stage/sketch nullable-listener errors. Full suite: 136 passed, 1 skipped, 15 unchanged Stage failures and 5 cascading errors; no Agent Context failure. Checks used the disposable dependency mirror with only the established unrelated lock normalization; exact-root frozen installation remains baseline-broken. No repository dependencies were installed or unrelated failures repaired.
- Before release, native Pi 1.4.0 and Claude Code 2.1.316/Opus 5.5 demonstrated automatic publication, user-action clearing and browser rendering. Native Claude manual denial, bounded missed refresh/recovery, corrected startup, `/clear` and in-session `/resume` were checked; manual compaction completed with state preserved. Auto-classifier denial, transient startup-bind recovery, adversarial batch schedules, launch-time resume/fork and physical-device/Safari behavior are not separately live-proven. The final onboarding-only UI change was browser-tested, not redeployed; Pi/Claude runtime bundles are unchanged from native smoke.
- npm initially accepted publication for asynchronous processing; the immediate registry lookup returned E404. A later public lookup verified version/`latest`/integrity, and the public downloaded archive is byte-identical to the tested artifact.
- Installing the Wolfpack panel does **not** install its agent integration. Follow the separate Claude plugin or Pi companion steps in the package README, then start a new session in Wolfpack. Publication does not authorize purging existing documents or reloading active agents.

## Published Changes 0.1.0

Published to the public npm registry as `latest` on 2026-10-04. Only Changes was published; no live extension installation was performed.

- Package: `wolfpack-extension-changes@0.1.0`
- Source: `2dd36f9d44475344a3fc609397172c00b1b41e18`, with only the obsolete Changes README publication banner removed.
- Archive SHA256: `c351f840d5ff01e838d872af056a0732c39d16d8b92a6db633166e0839f45e1c`
- npm integrity: `sha512-v/9aab3TTr7jB0Tm2NLgoPxNmTxJ9kuBNBlFQYwRBQPEO+1QLUm58tizZJ5RPZl42bFwND5WiTp/Cvxa6ugzpA==`
- Fresh root checks: 19 passing tests, offline portability, build/types/package/negative/pack gates. The Notes negative fixture required an owned package-local link to the hoisted pinned tools; its initial missing-TypeScript failure was retained, not treated as a pass.
- Independent Changes checks on the publishing host: 4 passing tests plus package and negative controls.
- Strict APIv1 host-types and isolated exact-archive install proof used Wolfpack `06d4251d2dd3b2702fce3f9e1bd9b97229133871`.
- Public registry metadata, `latest`, integrity and downloaded archive bytes were independently verified against the exact tested artifact.
