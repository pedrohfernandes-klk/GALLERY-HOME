# Hall Recesses Spatial Threshold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Hall’s six destination thresholds as quiet recessed bays that reveal their rooms only after a visitor leaves the central axis.

**Architecture:** Extend `addPremiumPortalDoor()` with an explicit `hallRecess` presentation configuration that changes visual geometry only. Extend the existing hologram material with an explicit opacity multiplier so recessed fields can be quiet without a second shader. The portal’s existing `slab`, `doorParts`, `openAxis` and `field` return contract remains unchanged. The Hall’s six door records opt into the configuration; other premium doors retain their current presentation.

**Tech Stack:** Static HTML, inline Three.js ES module, Node’s built-in test runner, Playwright.

## Global Constraints

- Begin from freshly fetched merged `origin/main` at `8ef40ba` or its direct descendant; do not stack on an unmerged visual branch.
- Keep destination registration, portal hitboxes, travel targets, camera targets and sliding-leaf mechanics unchanged.
- The Hall’s runner, central figure and corridor remain the first visual pull from entry.
- From the central axis, no title, coloured perimeter, animated field or luminous floor pad may advertise an individual side room.
- Use wall-matched mineral returns, dark leaves and interior-led light; no global material kit, rank palette, portal glow or game-like marker.
- Retain semantic room labels and existing accessibility behaviour.
- Use TDD. Do not commit disposable screenshots, browser scripts or dependency artefacts.

---

### Task 1: Define the Hall-recess presentation contract

**Files:**
- Modify: `index.html:4099-4144`, `index.html:4207-4335`
- Modify: `tests/workshop-integration.test.mjs`

**Interfaces:**
- Consumes: existing `addPremiumPortalDoor({ x, y, z, width, height, orientation, title, subtitle, accent, dark, ceilingY })` call shape.
- Produces: an optional `hallRecess` object with `{ depth, returnDepth, plaqueInset, fieldOpacity, floorCueOpacity }` numeric properties.
- Preserves: `{ group, slab: hitbox, doorParts: leafGroups, openAxis, field }`.

- [ ] **Step 1: Write the failing source contract test**

Add this test before `known runtime regressions remain removed`:

```js
test('Hall recess doors have a visual-only presentation contract', () => {
  const start = html.indexOf('function addPremiumPortalDoor(');
  const end = html.indexOf('function fallbackTextureWide', start);
  const builder = html.slice(start, end);
  assert.match(builder, /hallRecess\s*=\s*null/);
  assert.match(builder, /const recessDepth\s*=\s*hallRecess\?\.depth/);
  assert.match(builder, /const fieldOpacity\s*=\s*hallRecess\?\.fieldOpacity/);
  assert.match(html, /function makeHologramMaterial\(speed=6\.0, opacity=1\)/);
  assert.match(builder, /return \{group, slab:hitbox, doorParts:leafGroups, openAxis, field\}/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
node --test tests/workshop-integration.test.mjs
```

Expected: FAIL because `hallRecess` and its derived values do not yet exist.

- [ ] **Step 3: Add the optional presentation configuration**

First extend the existing shader/fallback material with one safe opacity multiplier:

```js
function makeHologramMaterial(speed=6.0, opacity=1){
  // existing ShaderMaterial branch
  uniforms: {
    uTime:{value:0}, uSpeed:{value:speed}, uOpacity:{value:opacity},
    uColorA:{value:new THREE.Color(0x61f6ff)}, uColorB:{value:new THREE.Color(0xffd27a)}
  }
  // fragment shader declarations: uniform float uOpacity;
  // fragment alpha: float alpha = ((.18 + bands*.22) * edge) * uOpacity;
  // fallback MeshBasicMaterial opacity: .30 * opacity
}
```

Then extend the builder signature and resolve conservative defaults without changing the normal-door path:

```js
function addPremiumPortalDoor({
  x=0, y=3, z=0, width=4, height=6, orientation='front',
  title='Door', subtitle='', accent=0xcaa869, dark=0x17120d,
  ceilingY=null, hallRecess=null
}) {
  const recessDepth = hallRecess?.depth ?? 0;
  const returnDepth = hallRecess?.returnDepth ?? 0;
  const plaqueInset = hallRecess?.plaqueInset ?? 0;
  const fieldOpacity = hallRecess?.fieldOpacity ?? 1;
  const floorCueOpacity = hallRecess?.floorCueOpacity ?? .28;
```

Use these values only in visual meshes/materials. Do not move `hitbox.position`, alter `hitGeom`, or change the returned object.

- [ ] **Step 4: Run the focused test and whitespace check**

Run:

```bash
node --test tests/workshop-integration.test.mjs && git diff --check
```

Expected: PASS.

- [ ] **Step 5: Commit the contract**

```bash
git add index.html tests/workshop-integration.test.mjs
git commit -m "feat: define Hall recess door presentation"
```

### Task 2: Build a wall-matched recess around the six Hall doors

**Files:**
- Modify: `index.html:4219-4335`
- Modify: `tests/workshop-integration.test.mjs`

**Interfaces:**
- Consumes: `hallRecess.depth`, `hallRecess.returnDepth`, `hallRecess.plaqueInset`, `hallRecess.fieldOpacity` from Task 1.
- Produces: visual wall returns and a recessed visual door group, while retaining the original interaction slab position and return shape.

- [ ] **Step 1: Write the failing geometry contract test**

Add this focused assertion:

```js
test('Hall recess treatment uses wall returns and relocates identification inside the bay', () => {
  const start = html.indexOf('function addPremiumPortalDoor(');
  const end = html.indexOf('function fallbackTextureWide', start);
  const builder = html.slice(start, end);
  assert.match(builder, /const hallWallMat\s*=\s*new THREE\.MeshStandardMaterial/);
  assert.match(builder, /const returnWallA\s*=\s*new THREE\.Mesh/);
  assert.match(builder, /const returnWallB\s*=\s*new THREE\.Mesh/);
  assert.match(builder, /if\(hallRecess\)\s*\{[\s\S]*?signBack\.position/);
  assert.match(builder, /fieldMat\.uniforms\.uOpacity\.value\s*=\s*fieldOpacity/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

```bash
node --test tests/workshop-integration.test.mjs
```

Expected: FAIL because the return meshes and recess-specific plaque position do not exist.

- [ ] **Step 3: Add recess visual geometry, leaving the interaction plane stable**

Use a Hall-compatible `MeshStandardMaterial` such as `{ color: 0xe8e3d8, roughness: .86, metalness: .02 }`. For `orientation:'left'`, build two return walls at the near/far `z` edges of the door, extending from the existing wall toward the Hall by `returnDepth`. Move the **visible** outer/recess/leaves/field group back by `recessDepth`, but leave `hitbox` at its existing coordinates.

Use the following structure, adapting the positions for both `face === 'x'` and `face === 'z'`:

```js
const visualInset = hallRecess ? recessDepth : 0;
const hallWallMat = new THREE.MeshStandardMaterial({
  color: 0xe8e3d8, roughness: .86, metalness: .02
});
if (hallRecess) {
  const returnThickness = .22;
  const returnLength = returnDepth;
  const returnHeight = height + .92;
  const returnWallA = new THREE.Mesh(/* geometry based on face */, hallWallMat);
  const returnWallB = returnWallA.clone();
  // Put these at the two bay edges and keep their faces aligned with the Hall wall.
  group.add(returnWallA, returnWallB);
}
```

Replace the coloured `outer` material with `hallWallMat` only when `hallRecess` is present. Keep `accentMat` for the low-luminance inner handles. Create the field as `makeHologramMaterial((width+height)*.37, fieldOpacity)`. Move the plaque’s visual backing and sign plane by `plaqueInset` into the bay, orienting it toward the lateral approach rather than the entry axis.

- [ ] **Step 4: Run the focused test and verify builder syntax**

```bash
node --test tests/workshop-integration.test.mjs && \
node --check --input-type=module < <(python - <<'PY'
from pathlib import Path
s=Path('index.html').read_text(encoding='utf-8')
start=s.index('<script type="module">')+len('<script type="module">')
end=s.rindex('</script>')
print(s[start:end])
PY
)
```

Expected: PASS.

- [ ] **Step 5: Commit the recess geometry**

```bash
git add index.html tests/workshop-integration.test.mjs
git commit -m "feat: recess Hall destination thresholds"
```

### Task 3: Opt the Hall’s six doors into the recess treatment

**Files:**
- Modify: `index.html:5143-5172`
- Modify: `tests/workshop-integration.test.mjs`

**Interfaces:**
- Consumes: `hallRecess` configuration from Task 1 and geometry from Task 2.
- Produces: six Hall-only configuration objects; all other calls remain unchanged.

- [ ] **Step 1: Write the failing Hall assignment test**

```js
test('every Hall destination door opts into the same quiet recess treatment', () => {
  const hallStart = html.indexOf("// --- All destination doors now live in the warehouse/hall");
  const hallEnd = html.indexOf('// --- HrM signature', hallStart);
  const hall = html.slice(hallStart, hallEnd);
  assert.equal((hall.match(/hallRecess:\s*HALL_RECESS/g) || []).length, 6);
  assert.match(hall, /const HALL_RECESS\s*=\s*Object\.freeze\(\{/);
  assert.doesNotMatch(hall, /new THREE\.CircleGeometry\(1\.42/);
});
```

- [ ] **Step 2: Run the focused test and verify failure**

```bash
node --test tests/workshop-integration.test.mjs
```

Expected: FAIL because the six configuration records do not yet use `HALL_RECESS` and floor cues remain.

- [ ] **Step 3: Apply one shared Hall configuration**

Immediately before `doorZs`, define:

```js
const HALL_RECESS = Object.freeze({
  depth: .78,
  returnDepth: .86,
  plaqueInset: .64,
  fieldOpacity: .06,
  floorCueOpacity: 0
});
```

Add `hallRecess:HALL_RECESS` to each of the six `addPremiumPortalDoor()` calls. Do not add major/destination ranks. Remove the six `CircleGeometry` floor pads rather than leave invisible interactive-looking portal markers. Retain the door data, `registerPortal()` object and all target positions exactly as they are.

- [ ] **Step 4: Run the full automated suite**

```bash
node --test tests/*.test.mjs && git diff --check
```

Expected: all tests pass and no whitespace errors.

- [ ] **Step 5: Commit Hall assignment**

```bash
git add index.html tests/workshop-integration.test.mjs
git commit -m "feat: quiet Hall doorway approach"
```

### Task 4: Add repeatable desktop/mobile visual evidence

**Files:**
- Create: `tests/browser-hall-recesses.mjs`

**Interfaces:**
- Consumes: local static server URL via `WORKSHOP_URL`, defaulting to `http://127.0.0.1:4189/index.html`.
- Produces: no committed assets by default; temporary screenshots under the OS temp directory when `KEEP_THRESHOLD_SCREENSHOTS=1`.

- [ ] **Step 1: Write the browser evidence runner**

Create a Playwright script that:

```js
import { chromium } from 'playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const url = process.env.WORKSHOP_URL ?? 'http://127.0.0.1:4189/index.html';
const keep = process.env.KEEP_THRESHOLD_SCREENSHOTS === '1';
const captureDir = await mkdtemp(join(tmpdir(), 'hermes-hall-recesses-'));
const browser = await chromium.launch({ headless: true });
const pageErrors = [];
try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport });
    page.on('pageerror', error => pageErrors.push(error.message));
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#posterEnter:not([disabled])', { timeout: 30000 });
    await page.locator('#posterEnter').click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: join(captureDir, `entry-${viewport.width}.png`) });
    await page.close();
  }
  if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join('\n')}`);
  console.log(JSON.stringify({ pageErrors, captureDir: keep ? captureDir : 'removed' }));
} finally {
  await browser.close();
  if (!keep) await rm(captureDir, { recursive: true, force: true });
}
```

- [ ] **Step 2: Start the branch-local server and run the browser evidence**

```bash
python -m http.server 4189 --bind 127.0.0.1
WORKSHOP_URL=http://127.0.0.1:4189/index.html node tests/browser-hall-recesses.mjs
```

Expected: zero page errors; temporary captures are removed unless explicitly retained.

- [ ] **Step 3: Review the captures before committing**

Verify both viewports against the five visual acceptance criteria in `docs/superpowers/specs/2026-07-22-hall-recesses-spatial-threshold-design.md`. If a title, coloured frame, animated field or floor marker remains visible from entry, return to Task 2 or 3 and correct it before committing this task.

- [ ] **Step 4: Commit the reusable smoke coverage**

```bash
git add tests/browser-hall-recesses.mjs
git commit -m "test: capture Hall recess threshold evidence"
```

### Task 5: Final verification and review boundary

**Files:**
- Modify only if a concrete failure is discovered in Tasks 1–4.

- [ ] **Step 1: Run the complete verification chain**

```bash
node --test tests/*.test.mjs && \
node --check assets/js/workshop-foundation.js && \
node --check assets/js/workshop-visit.js && \
node --check assets/js/workshop-record.js && \
WORKSHOP_URL=http://127.0.0.1:4189/index.html node tests/browser-hotfix-smoke.mjs && \
WORKSHOP_URL=http://127.0.0.1:4189/index.html node tests/browser-hall-recesses.mjs && \
git diff origin/main...HEAD --check && \
git status --short --untracked-files=all
```

Expected: all Node tests pass, both browser paths report no page errors, no whitespace errors, and only intended tracked changes are present.

- [ ] **Step 2: Inspect desktop and mobile evidence with Pedro**

Do not mark a PR ready, merge, or deploy based on mechanical checks alone. Show Pedro the entry-axis and lateral-approach captures. Distinguish technical verification from aesthetic approval.

- [ ] **Step 3: Push a non-deploying review branch only after visual approval**

```bash
git push -u origin agent/release-c-hall-recesses
```

Do not merge without the separately required five direct yes/no confirmations covering merge authority, content, functional scope, unresolved issues and live deployment authority.

## Plan Self-Review

- **Spec coverage:** Tasks 1–3 cover recess depth, continuous returns, quiet door faces, relocated plaques, suppressed field/floor markers and preserved portal mechanics. Task 4 covers desktop/mobile visual evidence; Task 5 separates technical pass from Pedro’s aesthetic approval and deployment.
- **Placeholder scan:** No placeholders or deferred implementation steps remain.
- **Consistency:** `hallRecess`, `HALL_RECESS`, `fieldOpacity`, `plaqueInset` and the unchanged builder return shape are named consistently across all tasks.
