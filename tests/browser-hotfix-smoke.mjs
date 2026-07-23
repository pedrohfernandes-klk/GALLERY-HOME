import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize } from 'node:path';

// The test used to assume something was already serving the project on 4187.
// Nothing started it, so the run failed before reaching a single assertion.
// It now serves the repository itself and shuts down afterwards, so
// `npm run test:browser` is a complete, self-contained command.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TYPES = { '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
  '.css':'text/css', '.json':'application/json', '.webp':'image/webp', '.png':'image/png',
  '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.mp4':'video/mp4', '.webm':'video/webm' };

const server = createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^(\.\.[/\\])+/, '');
    const file = join(ROOT, path === '/' ? 'index.html' : path);
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }          // no path escapes
    const ext = file.slice(file.lastIndexOf('.'));
    res.writeHead(200, { 'content-type': TYPES[ext] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(4187, '127.0.0.1', resolve));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const pageErrors = [];
page.on('pageerror', error => pageErrors.push(error.message));
await page.goto('http://127.0.0.1:4187/index.html', { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.getElementById('posterEnter')?.disabled === false, null, { timeout: 30000 });
// Research Desk: this formerly triggered recursive synchronisation on panel open/input.
await page.evaluate(() => document.getElementById('researchPanel')?.classList.add('open'));
await page.locator('#researchQuery').fill('museum accessibility');
const researchOpenHref = await page.locator('#researchOpenLink').getAttribute('href');
if (!researchOpenHref?.includes('duckduckgo.com/?q=museum%20accessibility')) throw new Error(`Unexpected Research URL: ${researchOpenHref}`);
await page.keyboard.press('Escape');
await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());

// A remains a movement key; O owns the Archive shortcut. Focused controls own Enter.
await page.keyboard.press('o');
if (!await page.locator('#archivePanel').evaluate(el => el.classList.contains('open'))) throw new Error('O did not open Archive');
await page.locator('#archiveCloseBtn').focus();
await page.keyboard.press('Enter');
if (await page.locator('#archivePanel').evaluate(el => el.classList.contains('open'))) throw new Error('Enter did not activate the focused Archive close control');
if (await page.locator('#playOverlay').evaluate(el => el.classList.contains('show'))) throw new Error('Enter on Archive control leaked into world interaction');
await page.keyboard.press('Escape');
await page.keyboard.press('a');
if (await page.locator('#archivePanel').evaluate(el => el.classList.contains('open'))) throw new Error('A still opens Archive');

if (pageErrors.length) throw new Error(`Page errors: ${pageErrors.join('\n')}`);
console.log(JSON.stringify({ researchOpenHref, pageErrors }, null, 2));
await browser.close();
await new Promise(resolve => server.close(resolve));
