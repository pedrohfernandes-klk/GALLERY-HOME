# Remove Entry Chaperone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the plain Hall entrance by completely removing the entry chaperone and rite.

**Architecture:** Delete the self-contained `buildWorkshopChaperone` builder and the self-contained entry-threshold construction block in `buildHall`. Protect the result with an integration test that scopes removal to those runtime seams, leaving genuine HrM cataloguing and artwork intact.

**Tech Stack:** Three.js inline module, Node test runner, static HTML.

## Global Constraints

- Preserve actual HrM artworks, signatures, catalogues and provenance elsewhere.
- Do not add a replacement object, new architecture or new media-capture behaviour.
- Keep existing navigation, Rooms, projection and Garden Study capture working.
- Render desktop and narrow mobile entrance views before any commit.

---

### Task 1: Lock the removal boundary with a failing regression test

**Files:**
- Modify: `tests/workshop-integration.test.mjs:156-188`
- Test: `tests/workshop-integration.test.mjs`

**Interfaces:**
- Consumes: `index.html` source loaded as `html` by the existing integration test.
- Produces: a source-level guard against reintroducing `buildWorkshopChaperone`, the entry-threshold group or chaperone interaction records.

- [ ] **Step 1: Add the failing test after the Hall recess-door test**

```js
test('Hall entry remains a plain threshold without a chaperone apparatus', () => {
  assert.doesNotMatch(html, /function buildWorkshopChaperone\(/);
  assert.doesNotMatch(html, /workshop-chaperone/);
  assert.doesNotMatch(html, /workshop:chaperone/);
  assert.doesNotMatch(html, /workshop-entry-threshold/);
  assert.doesNotMatch(html, /Entry rite and off-axis Workshop chaperone/);
  assert.match(html, /const floor = new THREE\.Mesh\(/,
    'the ordinary Hall floor remains the arrival surface');
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `node --test tests/workshop-integration.test.mjs`

Expected: failure from `function buildWorkshopChaperone(` while the existing Release 1 code remains.

### Task 2: Remove the chaperone and entry rite

**Files:**
- Modify: `index.html:4659-4678`
- Modify: `index.html:5284-5306`
- Test: `tests/workshop-integration.test.mjs`

**Interfaces:**
- Consumes: the negative removal guard from Task 1.
- Produces: plain `buildHall()` geometry with no entry-specific group, mesh, light, interactable or chaperone builder.

- [ ] **Step 1: Delete the complete dedicated builder**

Delete exactly the block beginning:

```js
function buildWorkshopChaperone({x,z}){
```

and ending with its matching closing brace immediately before `function buildHall(){`.

- [ ] **Step 2: Delete the complete dedicated entry block**

Delete exactly the block beginning:

```js
  // ===== Entry rite and off-axis Workshop chaperone =====
  {
```

and ending with the matching brace after `buildWorkshopChaperone({x:-5.55,z:cz-2.72});`.

- [ ] **Step 3: Run the focused test and confirm pass**

Run: `node --test tests/workshop-integration.test.mjs`

Expected: pass, including `Hall entry remains a plain threshold without a chaperone apparatus`.

### Task 3: Render and verify the restored threshold

**Files:**
- Modify: none
- Test: `tests/*.test.mjs`

**Interfaces:**
- Consumes: the removal implementation from Task 2.
- Produces: browser evidence that entry opens to the unblocked Hall at desktop and narrow mobile widths.

- [ ] **Step 1: Serve the branch locally**

Run: `python -m http.server 4192 --bind 127.0.0.1`

Expected: a local static server serving this branch.

- [ ] **Step 2: Inspect desktop entry**

Open `http://127.0.0.1:4192/`, enter the Workshop and capture the initial Hall view. Confirm no face panel, gate, stairs/ramp or entry-rite geometry remains.

- [ ] **Step 3: Inspect narrow mobile entry**

Set a narrow mobile viewport, reload, enter and capture the initial Hall view. Confirm the navigation remains reachable and the threshold is not obstructed.

- [ ] **Step 4: Exercise retained interactions**

Use `ROOMS`, `PROJECTION`, keyboard movement and `P` capture. Confirm each works and inspect the browser console for page errors.

- [ ] **Step 5: Run release verification before commit**

Run:

```bash
node --test tests/*.test.mjs
python - <<'PY'
from pathlib import Path
import tempfile, subprocess, os
s=Path('index.html').read_text(encoding='utf-8'); a=s.index('<script type="module">')+len('<script type="module">'); b=s.rindex('</script>')
f=tempfile.NamedTemporaryFile(suffix='.mjs',delete=False,mode='w',encoding='utf-8'); f.write(s[a:b]); f.close()
r=subprocess.run(['node','--check',f.name],capture_output=True,text=True); os.unlink(f.name); print(r.stdout+r.stderr); raise SystemExit(r.returncode)
PY
git diff --check
```

Expected: all tests pass, module syntax parses, diff hygiene is clean.

- [ ] **Step 6: Commit the implementation only after visual approval**

```bash
git add index.html tests/workshop-integration.test.mjs
git commit -m "fix: remove entry chaperone apparatus"
```
