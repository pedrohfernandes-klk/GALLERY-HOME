# Release 1: Entry Rite and Chaperone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task.

**Goal:** Replace the central hologram and toy-like Grove statue with a quiet, off-axis HrM relief-bust chaperone and a credible industrial entry rite.

**Architecture:** `buildHall()` loses the central hologram system and receives the industrial threshold/entry composition. The existing Guide dialogue and interaction are retained but renamed and revoiced. The current Grove statue is reduced to landscape-only or removed; the chaperone is built once in the Hall from verified HrM asset textures.

**Constraints:** Preserve all portal travel, keyboard/dialog accessibility and room registry behaviour. Use verified `cadavre-expat*.webp` or `mask-garden-face.webp` assets only. No cartoon face, uniform, badges, orbit rings, particle column, portal glow or NPC animation. Desktop/mobile visual approval is mandatory before PR readiness.

---

### Task 1: Chaperone content and interaction contract

**Files:** `index.html:2910-3021`, `tests/workshop-integration.test.mjs`

- [ ] Write a failing source test requiring `chaperoneGuideChoices`, labels `Show me the way` and `What is this place?`, and no `Grove oracle` / `Hey! What's up?` copy.
- [ ] Implement the two choices: short room orientation and deadpan absurdist institutional replies. Retain `openAccessibleDialog`, Escape, focus restoration and optional fast travel only on the orientation path.
- [ ] Run `node --test tests/workshop-integration.test.mjs`; commit `feat: revoice the Workshop chaperone`.

### Task 2: Replace the central hologram with the industrial entry event

**Files:** `index.html:4656-5352`, `tests/workshop-integration.test.mjs`

- [ ] Write a failing source test asserting the Hall no longer creates `hallHologram`, orbit rings or the `THE ENCIRCLED FIGURE` caption, and does create a named entry-threshold group.
- [ ] Remove the central hologram, emitter, rings, particles, caption and hologram lights. Build a shallow, broad ascent with timber treads, painted-steel uprights and a tall wired-glass internal threshold on the forward axis. Use cool white/cyan-neutral practical lighting only.
- [ ] Keep the runner unobstructed and retain every existing destination door/portal registration.
- [ ] Run focused tests, inline-module syntax check and `git diff --check`; commit `feat: create the Workshop entry rite`.

### Task 3: Build and place the off-axis relief-bust chaperone

**Files:** `index.html:6135-6287`, `index.html:4656-5352`, `tests/workshop-integration.test.mjs`

- [ ] Write a failing contract test requiring a named `buildWorkshopChaperone` helper, `CADAVRE_EXPAT` media reference, `registerInteractable({id:'workshop:chaperone'`, and absence of the old `WTF` decal / medal fragments in the active chaperone.
- [ ] Implement a static relief-bust: broad plinth, weathered plaster/painted-metal surround, inset ovoid black face texture, irregular pale eyes, small recessed red mouth. Place it in an off-axis Hall bay after the entry threshold; do not place it on the runner.
- [ ] Reuse the Guide dialogue through the chaperone registration. The mouth may make one restrained aperture movement on interaction; head/eyes/body remain still.
- [ ] Remove or disable the old Grove figure interaction so only one chaperone exists.
- [ ] Run focused tests and full Node tests; commit `feat: install the Workshop chaperone`.

### Task 4: Browser evidence and GitHub review branch

**Files:** create `tests/browser-entry-chaperone.mjs`

- [ ] Add Playwright coverage at desktop and 390px mobile: enter the world, capture the entry view, assert no page errors, assert the chaperone interaction opens the accessible dialog, and preserve screenshots only when `KEEP_ENTRY_CAPTURES=1`.
- [ ] Review screenshots: central ascent is first read; bust is off-axis; no hologram/rings/cartoon statue visible; UI remains unobstructed.
- [ ] Run full tests, module syntax checks, both browser smoke scripts and `git diff origin/main...HEAD --check`.
- [ ] Push `agent/release-1-entry-chaperone`, create/update a draft PR, and wait for Pedro’s aesthetic approval. Never merge/deploy without the required five confirmations.
