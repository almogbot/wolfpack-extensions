# Release checklist

- [ ] Confirm each `0.1.0` package is still prepared/unpublished; this repository has no publish workflow or credentials.
- [ ] Run root typecheck/build/test/package/negative/pack gates from this repository, then inspect each actual archive and SHA-512 receipt.
- [ ] Confirm package allowlists: Changes/Notes ship only package metadata, README, LICENSE and `dist/ui.js`; Agent Context additionally ships its schema and skill/reference files.
- [ ] Verify the selected host explicitly implements Extensions APIv1. `wolfpack-bridge@1.6.24` is not compatible.
- [ ] Use only exact future `npm:package@version` commands or an absolute unpacked package directory for current installations; do not represent archives or URLs as direct install sources.
- [ ] Independently verify the Agent Context schema/skill and scoped revision/CAS behavior against the approved APIv1 host before any human-authorized publication.
