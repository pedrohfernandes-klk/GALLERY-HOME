# Remove Entry Chaperone — Design

**Status:** approved for planning

## Intent
Restore the Workshop entrance to the plain pre-chaperone Hall threshold. The arrival should be spatially legible without a host, mascot, gate, ritual or replacement focal object.

## Removal boundary
Remove the complete entry-chaperone intervention introduced in Release 1:

- the HrM face panel and its source-art treatment at entry;
- the black gate / turnstile frame and added stair-ramp assembly;
- entry-rite construction, dialogue, hints, interaction targets and runtime state;
- related accessible labels, trigger copy, event records and tests;
- unused chaperone-specific assets or constants when they have no other verified purpose.

Do **not** remove HrM attribution, signatures, catalogue metadata or verified artworks elsewhere in the Workshop.

## Result
The initial view returns to the pre-chaperone Hall geometry: an unobstructed central axis and existing room threshold logic, with no replacement object. Existing navigation, Rooms, projection and Garden Study capture continue to work.

## Verification
Before commit:

1. confirm no chaperone/entry-rite runtime references remain;
2. render desktop and narrow-mobile entry views from the removal branch;
3. verify normal entry, Rooms, keyboard navigation and Garden Study capture;
4. run the project tests, inline module syntax check and diff hygiene check;
5. inspect the browser console.

## Non-goals
This release does not redesign the Hall, add new architecture, change room portals, or implement the global photo/video instrument. Those are separate decisions.
