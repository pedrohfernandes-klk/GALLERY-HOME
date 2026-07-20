# The Workshop

Static GitHub Pages deployment pack.

## Deploy

1. Upload the contents of this folder to the root of a GitHub repository.
2. In **Settings → Pages**, select **Deploy from a branch**.
3. Choose the branch containing these files and the repository root.

No build command is required. Keep the `assets` folder beside `index.html`.

The package includes all locally supplied and generated image assets. Internet
access is still required for the Three.js CDN and for external YouTube/web
projection sources. The museum itself is a static site and needs no server-side
code.

This release adds the Hood warehouse district, a four-mezzanine industrial
hall, 600 m² basement, apartment tower, five-level private penthouse, animated
dual lift system and a 160 × 120 m formal garden.

## Immersive web optimisation

Use `docs/IMMERSIVE_WEB_OPTIMIZATION_BLUEPRINT.md` as the working checklist for
future passes. In short:

- Keep Three.js/WebGL for the spatial museum, but move heavy decorative UI work
  out of the render loop where possible.
- Treat navigation as a story path, not only a room list.
- Use `svh` for panel height constraints on mobile; avoid `dvh` on the 3D
  canvas because browser chrome changes can trigger layout churn.
- Prefer external, compressed assets over returning to a large embedded
  single-file build.
- Validate transitions and hotspots for pragmatic reliability before adding
  spectacle.

For local testing, run a small static server in this folder, for example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.
