# THE WORKSHOP — Release A Experience Baseline

Date: 21 July 2026
Branch point: `origin/main` at `ba008e4`
Local URL: `http://127.0.0.1:8765/?selftest=release-a-baseline`

## Scope

Release A concerns only the first ninety seconds: entry, first movement, first targeting/interaction, and the Rooms orientation surface. This baseline does not reassess every room or claim production-network performance.

## Entry screen

Observed at a desktop viewport:

- The hierarchy is elegant and restrained: HrM mark, large title, short institutional subtitle, one ENTER control.
- Legibility is strong and the screen is uncluttered.
- The screen says how to begin but not how to inhabit the museum after entry.
- There is no movement, looking, interaction or Rooms guidance before the 3D world appears.

Release A should preserve the composition and avoid adding a tutorial card or key list.

## First room

Observed after ENTER:

- The Hall has a clear central axis and a strong focal object.
- Persistent controls are concise, but their relationship to movement and in-world use is not taught contextually.
- Existing interaction prompts appear only after the visitor has already aimed successfully.
- A first-time visitor can enter without knowing that Enter/click uses the faced object.

## Rooms and Visitor Passport

Observed immediately after entry:

- Current location is explicit: `WORKSHOP / MAIN GALLERY`.
- Five narrative beats are legible in the revised 3+2 layout.
- Threshold is stamped automatically on entry; Passport reads `1 of 5 acts stamped`.
- Current and stamped state are both visible but not clearly differentiated as separate ideas.
- Untouched beats are listed, but the panel does not explain which kind of action would continue the visit.
- The generic introduction explains structure rather than offering situational guidance.
- The panel is visually dense below the Passport because the room grid begins immediately.

## Local runtime evidence

Measured on the baseline local run:

- Entry ready: approximately **0.54 s** after initialization started.
- All deferred districts ready: approximately **2.16 s**.
- Deferred districts built: 10/10.
- Runtime build failures: 0.
- Browser self-tests: **869/869 passed**.
- Resource Timing entries at full readiness: 85 in this run.

These localhost figures are diagnostic only; they are not production transfer or device benchmarks.

## Release A acceptance targets

1. Preserve the entry screen's visual restraint.
2. After entry, show one short contextual line rather than a tutorial overlay.
3. Stop movement help after movement is detected.
4. Offer interaction help only after a visitor has targeted something without using it.
5. Mention Rooms only after it becomes contextually useful.
6. In Rooms, distinguish current, stamped and next states.
7. Add one sentence that names the current narrative beat and the next meaningful action.
8. Keep all five beat names legible at desktop and narrow-mobile widths.
9. Add no permanent HUD or world-space quest marker.
