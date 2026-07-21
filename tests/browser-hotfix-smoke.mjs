import { chromium } from 'playwright';

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
