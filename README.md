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

For local testing, run a small static server in this folder, for example:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.
