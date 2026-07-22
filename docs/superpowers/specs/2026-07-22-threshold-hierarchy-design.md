# Release C — Threshold Hierarchy Design

**Date:** 2026-07-22
**Status:** Approved direction; awaiting implementation-plan review

## Intent

Make the Workshop’s room thresholds carry the spatial hierarchy. A visitor should understand that a room is changing before any interface, label or interaction explains it.

The result must read as a sophisticated private institution or museum: composed, materially credible and slightly strange. It must not become a game portal system, a neon showcase or a decorative overlay pass.

## Scope

This pass changes the existing doorway/portal language only. It does not add rooms, alter travel destinations, replace art, introduce new gameplay, or increase heavy-room complexity.

### Threshold ranks

| Rank | Use | Treatment |
|---|---|---|
| Quiet | ordinary internal room transitions | Pale mineral or timber reveal; centred plaque; low warm floor/reveal wash. |
| Destination | rooms that receive a visitor as a distinct environment | More legible jamb depth; material-temperature shift; restrained side-light that reveals the room beyond. |
| Major act | Studio, Venue, Thinking Room, Experiment Garden and Hood | The clearest contrast in the hierarchy: deeper shadow around the opening, controlled interior light and a plaque with greater visual authority. No luminous force-field effect. |

## Visual system

### Materials

- **Pale mineral:** quiet institutional continuity and legibility.
- **Smoked wood:** selective depth and warmth at destination thresholds.
- **Aged brass:** plaque edges and limited handles only; never blanket trim.
- Existing room-specific materials remain authoritative once inside the threshold.

### Light

- Light belongs on the reveal, immediate floor and interior volume beyond the door.
- Major-act thresholds may use a stronger interior contrast, but source it from the next room rather than from a floating portal field.
- Avoid white bloom, saturated neon and visible game-like energy surfaces.

### Signage

- Plaques remain centred over openings, with a consistent vertical relationship to lintels.
- Name is primary; subtitle is quiet and functional.
- Plaques do not overlap art, windows, captions or moving door parts.

## Technical approach

1. Audit existing `addPremiumPortalDoor`, Empire-door and room-specific threshold builders.
2. Create a small parameterised threshold treatment layer rather than duplicating geometry per room.
3. Assign rank, material accent and light intensity through existing portal/room metadata.
4. Reduce or hide any portal-field visuals that compete with physical architecture.
5. Preserve existing hitboxes, travel registration, mobile interaction and room lighting ownership.
6. Do not add significant geometry, texture weight or shadow-casting lights to Hood paths without a performance check.

## Acceptance criteria

### Visible

- Threshold rank is perceptible at normal walking distance without UI help.
- The five major acts are clearly stronger than ordinary transitions, without becoming theatrical everywhere.
- Door plaques are readable, centred and unobstructed.
- Art, captions, furniture and windows retain clearance around all altered thresholds.
- The visual language is coherent across Hall, Studio, Thinking Room, Garden, Venue and Hood.

### Functional and technical

- Existing portal destinations and Enter/click interaction remain unchanged.
- No new focus, pointer-lock or mobile-control regressions.
- No missing assets or console errors.
- Desktop and narrow-mobile browser screenshots show coherent framing.
- Heavy rooms, especially Hood, remain within the existing performance envelope.

## Out of scope

- A general relight of every room.
- New artwork, furniture, rooms or menu systems.
- Rewriting the portal/travel architecture.
- Any merge or GitHub Pages deployment.

## Validation

- Focused source-level regression tests for unchanged portal registration and interaction paths.
- Local browser inspection at desktop and narrow-mobile viewports.
- Console-error check and visual review against the acceptance criteria.
- A non-deploying Release C branch update and PR only after Pedro approves the implementation plan.
