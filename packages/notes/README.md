# Wolfpack Notes extension

Prepared, unpublished APIv1 extension providing a session/installation-scoped local Notes textarea and a Vertical stack terminal recipe. It retains extension ID `notes` and version `0.1.0`.

Notes are saved on every edit to the host-provided extension storage, which is browser local storage scoped to this installation and session (and machine); they never leave the browser and are not synced. If storage cannot be read or written (for example disabled storage, private browsing, or a full quota), the view stays usable and shows a status message; text typed while saves fail stays only in the open editor, and the message clears after the next successful save. The view styles itself from the host theme snapshot (`context.theme`, such as `--text-primary`, `--bg-inset`, `--accent`), with built-in fallbacks.

The bundle contains its own local structural API types and layout helper; it imports no Wolfpack runtime, app state, bridge module, server, broker, filesystem, or authentication API.

Requires a prerelease host with Extensions APIv1. Published `wolfpack-bridge@1.6.24` does not provide APIv1. After publication use only an exact npm package or an absolute unpacked package directory:

```sh
wolfpack extensions install npm:wolfpack-extension-notes@0.1.0 --trust-browser-code
# or: wolfpack extensions install /absolute/path/to/notes --trust-browser-code
```

`.tgz` and URL inputs are not supported direct-install sources. The package is prebuilt and declares no consumer build/install lifecycle scripts.
