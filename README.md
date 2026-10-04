# Wolfpack Extensions

Independent, prebuilt Wolfpack extension packages. This repository is separate from the Wolfpack framework: it contains product widgets, not framework source.

## Packages

- `wolfpack-extension-changes@0.1.0` (`changes`): read-only local Git status.
- `wolfpack-extension-agent-context@0.1.0` (`agent-context`): scoped agent-authored context, schema, and optional Pi skill.
- `wolfpack-extension-notes@0.1.0` (`notes`): scoped local notes and a vertical-stack recipe.

All packages target the prerelease Extensions APIv1. `wolfpack-bridge@1.6.24` published to npm does **not** provide APIv1; these packages are prepared but unpublished and are not compatible with it.

## Install after publication

Only exact npm coordinates and absolute package directories are currently supported by Wolfpack:

```sh
wolfpack extensions install npm:wolfpack-extension-changes@0.1.0 --trust-browser-code
wolfpack extensions install npm:wolfpack-extension-agent-context@0.1.0 --trust-browser-code --skills pi
wolfpack extensions install /absolute/path/to/wolfpack-extension-notes --trust-browser-code
```

Do not claim `.tgz` paths or URLs are direct install sources. Archives are release-review artifacts; unpack an archive to an absolute directory before a local install. No package runs a consumer build or install lifecycle script.

## Development

The repository has no Wolfpack checkout or runtime dependency. With Bun and Node 22+, install its pinned tools at this root, then run `bun run typecheck`, `bun run build`, `bun test`, `bun run check:package`, `bun run check:package-negative`, and `bun run pack`. Package checks fresh-build and pack actual npm archives with tight allowlists. Optional host compatibility/install verification is deliberately a release-review step against an explicitly supplied APIv1 host, not normal development or publication: `WOLFPACK_EXTENSION_HOST_ROOT=/absolute/api-v1-host bun run verify:host-compat` then `... bun run verify:host-install`. The install proof uses only absolute unpacked package directories in an owned temporary HOME.

See `RELEASE.md` for the no-publication checklist and extraction/coverage record.
