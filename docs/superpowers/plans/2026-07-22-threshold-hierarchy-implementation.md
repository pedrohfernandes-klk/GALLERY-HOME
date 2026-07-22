# Release C Threshold Hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give THE WORKSHOP’s existing room thresholds a clear quiet/destination/major-act hierarchy through restrained materials, reveal-led light and consistent signage without changing travel behaviour.

**Architecture:** Keep the current portal/travel architecture intact. Add a small treatment resolver adjacent to `addPremiumPortalDoor()` in `index.html`; it returns only material/light parameters and doorway-owned parts. The premium-door builder consumes an optional rank and room identifier, while selected existing portal call-sites opt into `quiet`, `destination` or `major` treatment.

**Tech Stack:** Three.js in `index.html`; Node built-in test runner; existing Playwright smoke probe for local browser checks.

## Global Constraints

- Do not add rooms, artwork, furniture, menus, gameplay or new navigation paths.
- Do not alter portal hitboxes, `registerPortal()` inputs, destinations, travel timing, pointer lock or mobile controls.
- Use pale mineral, smoked wood and aged brass sparingly; no saturated neon, white bloom or visible force-field effect.
- Major ranks apply only to Studio, Venue, Thinking Room, Experiment Garden and Hood.
- Plaques remain centred, readable and clear of art, captions, windows, furniture and moving door parts.
- Do not add significant geometry, texture weight or shadow-casting lights in Hood without a measured performance check.
- Commit only intended source/test/documentation; never stage `.hermes/` or unrelated local plans.

---

## File structure

| Path | Responsibility |
|---|---|
| `index.html` | Existing Three.js portal builder, portal call-sites and the new threshold-treatment resolver. |
| `tests/workshop-integration.test.mjs` | Source-level contracts for rank definitions, premium-door support and unchanged portal behaviour. |
| `tests/browser-threshold-smoke.mjs` | Headless visual/runtime smoke check at desktop and narrow mobile widths, including console-error capture and screenshot artefacts in OS temp storage only. |

---

### Task 1: Define and test the threshold-treatment contract

**Files:**
- Modify: `tests/workshop-integration.test.mjs`
- Modify: `index.html:4207` (immediately before `addPremiumPortalDoor()`)

**Interfaces:**
- Produces: `THRESHOLD_TREATMENTS`, keyed by `quiet`, `destination`, and `major`.
- Produces: `resolveThresholdTreatment(rank)` returning the safe default `THRESHOLD_TREATMENTS.quiet` for unrecognised ranks.
- Consumes: no new dependencies; uses Three.js only inside the existing builder.

- [ ] **Step 1: Add the failing contract test**

Add this test before `known runtime regressions remain removed`:

```js
test('premium thresholds expose a restrained three-rank architectural hierarchy', () => {
  assert.match(html, /const THRESHOLD_TREATMENTS\s*=\s*Object\.freeze\(/);
  assert.match(html, /quiet:\s*Object\.freeze\(/);
  assert.match(html, /destination:\s*Object\.freeze\(/);
  assert.match(html, /major:\s*Object\.freeze\(/);
  assert.match(html, /function resolveThresholdTreatment\(rank='quiet'\)/);
  assert.match(html, /return THRESHOLD_TREATMENTS\[rank\] \|\| THRESHOLD_TREATMENTS\.quiet/);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
node --test tests/workshop-integration.test.mjs
```

Expected: failure in `premium thresholds expose a restrained three-rank architectural hierarchy` because the resolver is absent.

- [ ] **Step 3: Add immutable rank data and fallback resolver**

Immediately before `function addPremiumPortalDoor(...)`, add:

```js
const THRESHOLD_TREATMENTS = Object.freeze({
  quiet: Object.freeze({
    revealColor: 0xd9d0bd,
    trimColor: 0x4a4034,
    plaqueColor: 0xb28b52,
    revealDepth: 0.18,
    interiorLight: 0.38,
    fieldOpacity: 0.025
  }),
  destination: Object.freeze({
    revealColor: 0xcabda5,
    trimColor: 0x322b24,
    plaqueColor: 0xb58b4d,
    revealDepth: 0.28,
    interiorLight: 0.60,
    fieldOpacity: 0.018
  }),
  major: Object.freeze({
    revealColor: 0xbeb097,
    trimColor: 0x211c17,
    plaqueColor: 0xc19a5a,
    revealDepth: 0.38,
    interiorLight: 0.86,
    fieldOpacity: 0.010
  })
});
function resolveThresholdTreatment(rank='quiet'){
  return THRESHOLD_TREATMENTS[rank] || THRESHOLD_TREATMENTS.quiet;
}
```

- [ ] **Step 4: Run the focused test and confirm it passes**

Run:

```bash
node --test tests/workshop-integration.test.mjs
```

Expected: all integration tests pass.

- [ ] **Step 5: Commit the contract**

```bash
git add index.html tests/workshop-integration.test.mjs
git commit -m "feat: define ranked threshold treatments"
```

---

### Task 2: Make the shared premium-door builder consume the rank

**Files:**
- Modify: `index.html:4207-4340` (`addPremiumPortalDoor`)
- Modify: `tests/workshop-integration.test.mjs`

**Interfaces:**
- Consumes: `resolveThresholdTreatment(rank)` from Task 1.
- Extends: `addPremiumPortalDoor({ ..., ceilingY=null, thresholdRank='quiet', room=null })`.
- Produces: the existing return shape `{ group, slab, doorParts, openAxis, field }`, unchanged.

- [ ] **Step 1: Add the failing builder-compatibility test**

Add:

```js
test('premium portal doors use ranked architecture without changing portal return data', () => {
  const start = html.indexOf('function addPremiumPortalDoor(');
  const end = html.indexOf('\nfunction ', start + 1);
  const builder = html.slice(start, end);
  assert.match(builder, /thresholdRank='quiet',room=null/);
  assert.match(builder, /const treatment=resolveThresholdTreatment\(thresholdRank\)/);
  assert.match(builder, /opacity:treatment\.fieldOpacity/);
  assert.match(builder, /return \{group,slab:hitbox,doorParts,openAxis,field\}/);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
node --test tests/workshop-integration.test.mjs
```

Expected: failure because `addPremiumPortalDoor` has no rank input.

- [ ] **Step 3: Extend `addPremiumPortalDoor` minimally**

Change its parameter list to:

```js
function addPremiumPortalDoor({
  x=0,y=3,z=0,width=4,height=6,orientation='front',title='Door',subtitle='',
  accent=0xcaa869,dark=0x17120d,ceilingY=null,thresholdRank='quiet',room=null
}){
  const treatment=resolveThresholdTreatment(thresholdRank);
```

Within the existing builder:

```js
const revealMat = new THREE.MeshStandardMaterial({
  color:treatment.revealColor, roughness:.74, metalness:.04
});
const trimMat = new THREE.MeshStandardMaterial({
  color:treatment.trimColor, roughness:.56, metalness:.14
});
const plaqueMat = new THREE.MeshStandardMaterial({
  color:treatment.plaqueColor, roughness:.44, metalness:.38
});
const glowMat = new THREE.MeshBasicMaterial({
  color:0xfff0c7, transparent:true, opacity:treatment.fieldOpacity,
  blending:THREE.AdditiveBlending, depthWrite:false
});
```

Use `revealMat`, `trimMat` and `plaqueMat` for the existing corresponding reveal, jamb and plaque-edge meshes. Keep all hitbox creation, `doorParts` construction, opening axes and return data identical. If the builder creates its existing doorway light, register it only when `room` is supplied and set its intensity to `treatment.interiorLight`.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run:

```bash
node --test tests/workshop-integration.test.mjs
```

Expected: all integration tests pass.

- [ ] **Step 5: Commit the builder change**

```bash
git add index.html tests/workshop-integration.test.mjs
git commit -m "feat: apply ranked materials to premium thresholds"
```

---

### Task 3: Assign ranks to real room thresholds

**Files:**
- Modify: `index.html:4807-11086` (existing `addPremiumPortalDoor` call-sites)
- Modify: `tests/workshop-integration.test.mjs`

**Interfaces:**
- Consumes: `addPremiumPortalDoor({ thresholdRank, room, ... })` from Task 2.
- Produces: explicit architectural intent at call-sites, with no new portal registration schema.

- [ ] **Step 1: Add the failing rank-assignment test**

Add:

```js
test('major Workshop acts declare major threshold treatment at their existing doors', () => {
  for (const title of ['The Studio', 'The Venue', 'Thinking Room', 'Experiment Garden', 'THE RESERVE']) {
    const titleAt = html.indexOf(`title:'${title}'`);
    assert.ok(titleAt > -1, `${title} premium door exists`);
    const call = html.slice(Math.max(0, titleAt - 260), titleAt + 420);
    assert.match(call, /thresholdRank:'major'/, `${title} has major threshold rank`);
  }
  assert.match(html, /thresholdRank:'destination'/, 'secondary destinations have a dedicated rank');
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
node --test tests/workshop-integration.test.mjs
```

Expected: failure because existing call-sites do not declare ranks.

- [ ] **Step 3: Add ranks and room ownership to existing calls**

At the existing premium-door calls for the four Hall major acts and Hood’s existing `THE RESERVE` threshold, add the current room owner and rank:

```js
thresholdRank:'major', room:'studio'
thresholdRank:'major', room:'theatre'
thresholdRank:'major', room:'thinking'
thresholdRank:'major', room:'maze'
thresholdRank:'major', room:'hood'
```

Use `thresholdRank:'destination'` only for coherent secondary arrival doors such as Grove, MANY MAPS, Laboratory and Tunnel. Leave all other premium doors at the safe default `quiet`. Do not change `registerPortal()` calls, targets, labels or slide axes.

- [ ] **Step 4: Run the full automated suite**

Run:

```bash
node --test tests/*.test.mjs
git diff --check
```

Expected: all tests pass and `git diff --check` returns no output.

- [ ] **Step 5: Commit rank assignments**

```bash
git add index.html tests/workshop-integration.test.mjs
git commit -m "feat: rank workshop room thresholds"
```

---

### Task 4: Run visual and runtime acceptance checks

**Files:**
- Create: `tests/browser-threshold-smoke.mjs`
- Modify: `tests/workshop-integration.test.mjs` only if a browser-discovered invariant needs a source-level regression guard.

**Interfaces:**
- Consumes: the local static server and the existing `playwright` local verification dependency.
- Produces: temporary desktop/mobile screenshots outside the repository and a console-error failure if the changed scene throws.

- [ ] **Step 1: Write the failing browser smoke probe**

Create `tests/browser-threshold-smoke.mjs` with this executable contract:

```js
import { chromium } from 'playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const browser = await chromium.launch({headless:true});
const errors=[];
const keepScreenshots=process.env.KEEP_THRESHOLD_SCREENSHOTS==='1';
const out=await mkdtemp(join(tmpdir(),'workshop-threshold-'));
try{
  for (const viewport of [{width:1440,height:900,name:'desktop'}, {width:390,height:844,name:'mobile'}]) {
    const page=await browser.newPage({viewport});
    page.on('pageerror', error=>errors.push(`${viewport.name}: ${error.message}`));
    await page.goto('http://127.0.0.1:4187/index.html',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.getElementById('posterEnter')?.disabled===false,null,{timeout:30000});
    await page.screenshot({path:join(out,`${viewport.name}.png`)});
    await page.close();
  }
  if(errors.length) throw new Error(errors.join('\n'));
  console.log(`threshold screenshots checked in ${out}`);
} finally {
  await browser.close();
  if(keepScreenshots) console.log(`screenshots retained at ${out}`);
  else await rm(out,{recursive:true,force:true});
}
```

- [ ] **Step 2: Run the browser probe before the visual change and record the baseline result**

Start the repository server from the exact directory:

```bash
cd /c/Users/Utilizador/THE-WORKSHOP && python -m http.server 4187 --bind 127.0.0.1
```

In another terminal:

```bash
node tests/browser-threshold-smoke.mjs
```

Expected: desktop and mobile capture complete with no browser page errors.

- [ ] **Step 3: Run the same probe after Tasks 1–3**

Run:

```bash
node tests/browser-threshold-smoke.mjs
```

Run the review capture with `KEEP_THRESHOLD_SCREENSHOTS=1 node tests/browser-threshold-smoke.mjs`, inspect the printed temporary directory, then delete that directory after inspection. Run the default command again before commit so no screenshots remain.

- [ ] **Step 4: Perform the visual checklist in the browser**

At 1440×900 and 390×844, inspect Hall, Studio, Venue, Thinking Room, Garden and Hood. Confirm:

```text
[ ] The threshold is readable before its interface prompt is needed.
[ ] Major acts are stronger than ordinary transitions, but not luminous portals.
[ ] Plaques remain centred and unobstructed.
[ ] Doorway light describes the reveal/floor/next room, not a floating field.
[ ] No artworks, captions, windows or furniture overlap changed thresholds.
[ ] Hood does not show visibly increased scene weight or console errors.
```

- [ ] **Step 5: Final verification and commit**

Run:

```bash
node --test tests/*.test.mjs
node --check assets/js/workshop-foundation.js
node --check assets/js/workshop-visit.js
node --check assets/js/workshop-record.js
git diff --check
git status --short --untracked-files=all
```

Expected: automated tests pass, syntax checks pass, no whitespace errors, and only intended files are staged.

Commit:

```bash
git add index.html tests/workshop-integration.test.mjs tests/browser-threshold-smoke.mjs
git commit -m "test: verify threshold hierarchy rendering"
```

---

## Spec coverage self-review

- **Hierarchy:** Tasks 1 and 3 establish quiet, destination and major-act ranks.
- **Materials and light:** Task 2 applies the approved mineral/wood/brass treatment and interior-led light controls.
- **Signage and physical clearance:** Task 2 preserves the shared plaque/door construction; Task 4 verifies alignment and clearance in the browser.
- **Functional preservation:** Tasks 2 and 3 retain portal return shape and registration; Tasks 3 and 4 test the unchanged travel surface.
- **Performance and mobile:** Global constraints and Task 4 explicitly check Hood and narrow mobile without adding texture/geometry scope.
- **Deployment boundary:** No merge or Pages deployment is included.
