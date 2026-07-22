# Hall Recesses — Spatial Threshold Design

**Date:** 2026-07-22
**Status:** Proposed design; no scene implementation yet
**Scope:** THE WORKSHOP Hall destination thresholds only

## Decision

The Hall’s six destination rooms must not declare themselves from the entrance. The runner, central figure and blue corridor remain the first encounter. A room becomes legible only after the visitor deliberately moves away from that central axis and reaches its bay.

This supersedes the withdrawn rank/material treatment from Release C. Threshold hierarchy will be produced by **depth, occlusion, approach and interior revelation**, not by coloured frames, glowing fields or category-specific door furniture.

## Observed Hall Composition

The current Hall already has a strong longitudinal composition:

- the runner carries the eye to the central figure and corridor;
- six destination doors form an exposed, evenly spaced line on the left wall;
- their coloured frames, bright handles, animated fields, plaques and floor pads make all destinations readable at entry;
- this turns the side wall into a catalogue of portals and competes with the central axis.

The redesign must strengthen—not decorate—the existing composition.

## Spatial Proposal: Continuous Wall, Recessed Bays

### 1. One wall plane, six concealed openings

The exposed door fronts will no longer sit visually on the Hall wall plane. A continuous, wall-matched colonnade runs along the destination side. Each room sits behind a shallow bay:

- the opening is set back approximately 0.70–0.90 Hall metres from the public wall line;
- side returns form a real reveal, rather than a coloured perimeter frame;
- the bay remains dark from the central runner and reveals its depth only from a lateral approach;
- the existing portal hitboxes, registered destinations, travel targets and door-opening mechanics remain unchanged.

The wall plane and returns use the existing Hall’s off-white/mineral language. They are architecture, not bespoke scenic props.

### 2. Door faces become quiet equipment

Inside each bay, the existing dark double leaves remain. Their visible language is reduced:

- remove the large coloured outer frame;
- keep colour only as a narrow, low-luminance detail on an inner handle or a small internal line;
- keep the portal field behind the leaves but prevent it from reading as a bright screen at distance;
- remove the always-visible luminous floor-pad signal.

A closed door therefore reads as a dark, functional aperture in a deeper wall—neither a neon portal nor a decorative object.

### 3. Identification is discovered laterally

The existing plaque sits above each doorway and is readable from entry. It moves into the bay:

- place a smaller plaque on the inner return or just inside the reveal;
- orient it to be read from the visitor’s approach direction, not down the Hall;
- retain title and subtitle content, but make reading the consequence of approach.

No room gets a special visible rank from the entry point. Their difference lies in what their interior gives back after the threshold.

### 4. Interior light, not doorway glow

Room-specific colour belongs beyond the threshold:

- a faint warm/cool spill may touch the back of a reveal only when the visitor reaches that bay;
- no emissive halo outlines the portal;
- no visible effect competes with the central figure, corridor or runner.

This preserves strangeness while making it architectural: an implication of another room, not a broadcast invitation.

## Required Interaction and Accessibility Behaviour

- Portal registration, collision/hitbox dimensions, destinations, camera targets and sliding leaves must stay stable.
- The rooms remain discoverable by normal movement and existing controls.
- Any proximity cue must be secondary to the physical reveal and must not create a permanent HUD or floor marker.
- Door plaques must retain accessible semantic labelling even when visually moved inside a bay.

## Non-Goals

- No global theme, material kit or rank palette.
- No new game mechanics, collectible prompts, gateway effects or portal glow.
- No changes to room content, travel logic or the central Hall sequence.
- No special early invitation for a selected room.

## Acceptance Criteria

### Desktop and mobile visual review

1. From entry on the central axis, the side-wall rooms read as a quiet sequence of recesses; individual room titles are not legible.
2. The runner, figure and corridor remain the first and strongest visual pull.
3. At a bay, depth, a dark pair of leaves and a laterally readable plaque make the room discoverable without an overt marker.
4. No coloured perimeter, animated field or floor pad makes the doors resemble a portal catalogue.
5. The return walls, plaques and doors do not clip the Hall wall, one another, artwork, controls or the minimap.

### Technical verification

1. Existing portal registration, hitbox and returned builder shape remain stable.
2. Existing automated suite remains green; new focused tests cover the recess/quiet-threshold contract without asserting cosmetic trivia.
3. Syntax, whitespace and desktop/mobile browser smoke checks pass.
4. Visual evidence is reviewed by Pedro before any PR is marked ready for review or merged.
