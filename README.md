# ASX Holo Browser

ASX Holo Browser is a holographic-style tab explorer that runs from a lightweight static server. It renders a neon UI for stored tabs, supports previewing pages in canvas/iframe, and exposes a `/status` endpoint that reports DNS hosting details.

## Features
- Holographic card rail for tabs, with likes, pins, comments, bookmarks.
- Preview panel that opens pages in canvas or iframe.
- Static server with `/status` health check and DNS host reporting.
- Optional proxy endpoint (`/asx-proxy`) with allow-listed domains.

## Quick start
```bash
npm install
node server.mjs
```

Open `http://localhost:8080` in your browser.

## DNS hosting
Set environment variables to advertise your DNS host and control domain allow-listing:

```bash
export ASX_DNS_HOST="holo.example.com"
export ASX_ALLOWED_DOMAINS="example.com,wikipedia.org"
node server.mjs
```

The UI will display the DNS host and static server status using `/status`.

## Project structure
- `public/` static HTML/CSS for the Holo UI shell.
- `runtime/` client-side runtime scripts.
- `server.mjs` Express server for static assets and proxy.

## Development notes
- Update `runtime/asx.holo.ui.js` for UI/runtime changes.
- The proxy is restricted to allow-listed domains in `ASX_ALLOWED_DOMAINS`.
