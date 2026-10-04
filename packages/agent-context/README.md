# Wolfpack Agent Context extension

Prepared, unpublished APIv1 extension for an exact session-scoped agent-authored context document. It retains extension ID `agent-context`, document `context` schema version 1, and the optional `wolfpack-agent-context` Pi skill. Revisions are host-owned compare-and-swap revisions; this UI never infers a scope or publishes data.

The browser bundle is self-contained. `src/api.ts` is local erased structural API documentation, not a `wolfpack-bridge` runtime dependency. Styles and behavior ship with this package.

## Compatibility and install

Requires a prerelease Wolfpack host implementing Extensions APIv1. Published `wolfpack-bridge@1.6.24` lacks APIv1. After publication, install only with an exact npm coordinate or an absolute unpacked package directory:

```sh
wolfpack extensions install npm:wolfpack-extension-agent-context@0.1.0 --trust-browser-code --skills pi
# or: wolfpack extensions install /absolute/path/to/agent-context --trust-browser-code --skills pi
```

`.tgz` and URL sources are not supported direct-install inputs. This package is prepared but not published; the npm command is future-facing. Installation does not run a build or lifecycle script.

The skill uses public `session current-context`, `extension-data read`, and CAS `extension-data publish` commands. It refuses guessed scopes and preserves document/schema compatibility. See its bundled reference for the bounded format.
