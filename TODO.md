# Roadmap

## Phase 1 — Core runtime stabilization
- [x] Add static server with `/status` endpoint.
- [x] Wire DNS hosting status into the Holo UI.
- [ ] Add unit tests for proxy allow-listing logic.

## Phase 2 — Hosting + DNS enhancements
- [ ] Add UI controls to set a preferred DNS host override.
- [ ] Persist DNS host selection in local storage.
- [ ] Expose structured logs for DNS routing events.

## Phase 3 — Holo browsing upgrades
- [ ] Add snapshot thumbnails for tab cards.
- [ ] Add multi-profile tab storage.
- [ ] Implement offline-first cache for previews.

## Phase 4 — Ops + deployment
- [ ] Add Dockerfile for production hosting.
- [ ] Provide deploy guide for Fly.io/Render.
- [ ] Add health checks to CI pipeline.
