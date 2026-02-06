# AGENTS.md

## Repo notes
- Start the static server with `node server.mjs` and open `http://localhost:8080`.
- UI runtime scripts live in `runtime/` and are loaded by `public/index.html`.
- The `/status` endpoint is the source of truth for DNS host + static server health.

## Conventions
- Keep UI copy concise and neon-themed.
- Avoid breaking the `/asx-proxy` allow-list logic.
