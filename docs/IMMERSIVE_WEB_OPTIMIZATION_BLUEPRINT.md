# Immersive Web Optimisation Blueprint

This project remains a static Three.js museum on GitHub Pages. The goal is not
to restart in a different framework; it is to make the current architecture more
legible, faster, and easier to evolve.

## Architecture

- Keep Three.js/WebGL for the spatial world, camera, rooms, projection walls and
  in-world geometry.
- Use ordinary DOM/CSS for panels, overlays, navigation and creative tools.
- Consider CSS Houdini only for procedural decorative UI where browser support
  and fallback behaviour are acceptable. Do not make the core museum depend on
  Houdini.
- Avoid returning to a massive embedded single HTML file. External compressed
  assets are the correct GitHub Pages shape.

## Narrative Wayfinding

The navigator should behave like a progress map, not only a teleport menu. The
current high-level path is:

1. Threshold: Workshop Hall.
2. Search: Tunnel, Thinking Room, MANY MAPS, Laboratory and Spark Tools.
3. Projection: Venue, Studio, Garden and Sunset Lounge.
4. Outside: Grove.
5. Return: Headquarters.

Future room additions should be assigned to one of these beats unless there is
a strong reason to add a new beat.

## Performance Rules

- Target a stable 60 FPS feel before adding more scenery.
- Keep large images external, compressed and reused.
- Remove dead animation loops and zero-iteration remnants during cleanup passes.
- Prefer `transform` and `opacity` for animated UI.
- Use passive event listeners when the handler does not call `preventDefault`.
- Use `svh` for mobile panel height constraints. Avoid `dvh` for the 3D canvas.

## Accessibility Rules

- Keep `prefers-reduced-motion` respected across camera transitions, decorative
  animation and UI transitions.
- Make scrollable panels keyboard reachable when they become dense.
- Keep DOM order aligned with visible narrative order.
- Make hotspot labels and door plaques readable before adding new interactions.

## UX Evaluation Checklist

- Can a first-time visitor identify where they are within ten seconds?
- Can they see the next meaningful destination without opening every panel?
- Do projection and room transitions complete reliably?
- Are hotspots visually distinct from decorative props?
- Are mobile panels reachable without trapping movement controls?
- Is the route still understandable when motion is reduced?

## Asset Roadmap

- Audit the largest images in `assets/` before adding more large files.
- Replace any placeholder or redundant image variants with a single selected
  version.
- For future 3D objects, prefer low-poly or retopologised assets with relightable
  textures. Avoid raw photogrammetry meshes unless they are aggressively
  simplified first.
