import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const OUT = process.argv[2] || 'tmp/mobile-audit-375/before';
fs.mkdirSync(OUT, { recursive: true });

const MOCK_ITINERARY = `
<script type="application/json" id="bt-profile">
{"type":"El Arqueólogo del Tiempo","essence":"Viajas para tocar la historia con las manos.","quote":"Cada ruina es una carta abierta al pasado.","animal":"Un zorro curioso que olfatea senderos antiguos.","superpower":"Leer el paisaje como un libro","stats":[{"label":"Motivación","value":"Cultura"},{"label":"Energía","value":"Media"},{"label":"Ritmo","value":"Explorador"}]}
</script>
<script type="application/json" id="bt-places">
[{"name":"Museo del Prado","lat":40.4138,"lng":-3.6921,"day":1},{"name":"Retiro","lat":40.4153,"lng":-3.6844,"day":1},{"name":"Mercado de San Miguel","lat":40.4155,"lng":-3.7087,"day":2},{"name":"Plaza Mayor","lat":40.4155,"lng":-3.7074,"day":2}]
</script>
<h2>Día 1 — Arte y jardines</h2>
<p>Empieza en el <strong>Museo del Prado</strong> con un recorrido de 2 horas centrado en Velázquez.</p>
<div class="info-row"><span class="label">Horario</span><span class="value">10:00–20:00</span></div>
<div class="price-row"><span class="label">Entrada</span><span class="value">€15 · reserva online</span></div>
<ul>
<li><strong>Mañana:</strong> Prado — salas de pintura española</li>
<li><strong>Tarde:</strong> Paseo por el Retiro hasta el Estanque Grande</li>
</ul>
<h2>Día 2 — Sabores del centro</h2>
<p>Mercado de San Miguel y Plaza Mayor: tapa hopping sin prisas.</p>
<div class="info-row"><span class="label">Alojamiento sugerido</span><span class="value">Boutique cerca de Ópera · zona céntrica peatonal</span></div>
<div class="price-row"><span class="label">Presupuesto día</span><span class="value">€80–120 por persona (comida + entradas)</span></div>
`;

function overflowReport(page) {
  return page.evaluate(() => {
    const docW = document.documentElement.clientWidth;
    const offenders = [];
    const all = document.body.querySelectorAll('*');
    for (const el of all) {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      const style = getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'sticky') {
        // still check horizontal overflow of fixed headers
      }
      if (r.right > docW + 1 || r.left < -1) {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const cls = el.className && typeof el.className === 'string'
          ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.')
          : '';
        offenders.push({
          sel: `${tag}${id}${cls}`.slice(0, 120),
          left: Math.round(r.left),
          right: Math.round(r.right),
          width: Math.round(r.width),
          text: (el.innerText || '').slice(0, 60).replace(/\s+/g, ' '),
        });
      }
    }
    // dedupe by sel+right
    const seen = new Set();
    const uniq = [];
    for (const o of offenders) {
      const k = o.sel + '|' + o.right;
      if (seen.has(k)) continue;
      seen.add(k);
      uniq.push(o);
    }
    return {
      clientWidth: docW,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      overflows: document.documentElement.scrollWidth > docW + 1,
      offenders: uniq.slice(0, 40),
    };
  });
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function main() {
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  const report = { base: BASE, out: OUT, screens: {} };

  // --- Landing header (Install + langs) ---
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);
  // Force Install visible if hidden (standalone check may hide it)
  await page.evaluate(() => {
    // Find header right cluster
    const header = document.querySelector('header');
    if (!header) return;
    // Inject fake install if missing for layout test
    if (!header.querySelector('button') || ![...header.querySelectorAll('button')].some(b => /instalar|install/i.test(b.textContent||''))) {
      const wrap = header.querySelector('div.flex.items-center') || header.lastElementChild;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'auditFakeInstall';
      btn.textContent = 'Instalar app';
      btn.className = 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] border-0 bg-[#E8634A] text-white font-medium text-[0.72rem] tracking-wide whitespace-nowrap';
      if (wrap) wrap.insertBefore(btn, wrap.firstChild);
    }
  });
  report.screens.landing_header = await overflowReport(page);
  await shot(page, '01-landing-header');

  // --- Auth header ---
  await page.goto(`${BASE}/auth`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const header = document.querySelector('header');
    if (!header) return;
    if (![...header.querySelectorAll('button')].some(b => /instalar|install/i.test(b.textContent||''))) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'auditFakeInstall';
      btn.textContent = 'Instalar app';
      btn.className = 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] border-0 bg-[#E8634A] text-white font-medium text-[0.72rem] tracking-wide whitespace-nowrap';
      header.appendChild(btn);
    }
  });
  report.screens.auth_header = await overflowReport(page);
  await shot(page, '02-auth-header');

  // --- Questionnaire ---
  await page.goto(`${BASE}/questionnaire.html`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1000);
  report.screens.q_header = await overflowReport(page);
  await shot(page, '03-questionnaire-header');

  // Accommodation section
  await page.evaluate(() => {
    const el = document.querySelector('[data-q="accom"]');
    el?.closest('.qblock')?.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(300);
  report.screens.accommodation = await overflowReport(page);
  await shot(page, '04-accommodation');

  // Museum follow-up
  await page.evaluate(() => {
    const museos = document.querySelector('[data-q="cultura"][data-v="museos"]');
    if (museos && !museos.classList.contains('sel')) museos.click();
    const panel = document.getElementById('museumTypePanel');
    if (panel) panel.classList.add('show');
    panel?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(300);
  report.screens.museum_followup = await overflowReport(page);
  await shot(page, '05-museum-followup');

  // Activity this-trip follow-up (non-sport keys)
  await page.evaluate(() => {
    ['yoga','safari','cocina_c','nightlife'].forEach((v) => {
      const b = document.querySelector(`[data-q="act"][data-v="${v}"]`);
      if (b && !b.classList.contains('sel')) b.click();
    });
    const panel = document.getElementById('activityThisTripPanel');
    panel?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(400);
  report.screens.activity_followup = await overflowReport(page);
  report.activityPanelKids = await page.evaluate(() => document.getElementById('activityThisTripPanel')?.children?.length || 0);
  await shot(page, '06-activity-followup');

  // Budget + currency ranges
  await page.evaluate(() => {
    document.getElementById('budgetBlock')?.scrollIntoView({ block: 'start' });
    if (typeof setCurrency === 'function') setCurrency('MXN', { touched: true });
    else {
      const sel = document.getElementById('currencySelect');
      if (sel) { sel.value = 'MXN'; sel.dispatchEvent(new Event('change')); }
      if (typeof updateBudgetRangeLabels === 'function') updateBudgetRangeLabels();
      else if (typeof updateCurrency === 'function') updateCurrency(true);
    }
  });
  await page.waitForTimeout(300);
  report.screens.budget = await overflowReport(page);
  report.budgetRanges = await page.evaluate(() =>
    [...document.querySelectorAll('#budgetOptsTotal .opt')].map((b) => ({
      tier: b.dataset.v,
      text: (b.innerText || '').replace(/\s+/g, ' ').trim(),
      hasRange: !!b.querySelector('small'),
    }))
  );
  await shot(page, '07-budget-currency');

  // Inject itinerary result with map + post-trip
  await page.evaluate((html) => {
    // Show profile card shell
    const pc = document.getElementById('profileCard');
    if (pc) pc.classList.add('show');
    if (typeof renderItineraryHtml === 'function') {
      renderItineraryHtml(html);
    }
    // Open post-trip form
    setTimeout(() => {
      document.getElementById('postTripOpen')?.click();
    }, 100);
  }, MOCK_ITINERARY);
  await page.waitForTimeout(1500);

  // Scroll to map
  await page.evaluate(() => {
    document.getElementById('btItineraryMap')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(500);
  report.screens.itinerary_map = await overflowReport(page);
  await shot(page, '08-itinerary-map');

  // Scroll to article + price rows
  await page.evaluate(() => {
    document.querySelector('.bitacora-article')?.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(300);
  report.screens.itinerary_article = await overflowReport(page);
  await shot(page, '09-itinerary-article');

  // Post-trip
  await page.evaluate(() => {
    document.getElementById('postTripBlock')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(300);
  report.screens.post_trip = await overflowReport(page);
  await shot(page, '10-post-trip');

  // Profile share button area
  await page.evaluate(() => {
    document.getElementById('profileCard')?.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(300);
  report.screens.profile_share = await overflowReport(page);
  await shot(page, '11-profile-share');

  // Shareable card
  await page.evaluate(() => {
    document.getElementById('shareableCard')?.scrollIntoView({ block: 'start' });
  });
  await page.waitForTimeout(300);
  report.screens.shareable = await overflowReport(page);
  await shot(page, '12-shareable-card');

  // Trip share card if shown
  await page.evaluate(() => {
    const t = document.getElementById('tripShareCard');
    if (t) {
      t.classList.add('show');
      t.scrollIntoView({ block: 'start' });
    }
  });
  await page.waitForTimeout(300);
  report.screens.trip_share = await overflowReport(page);
  await shot(page, '13-trip-share');

  // Header measurements for crowding
  report.headerMetrics = await page.evaluate(() => {
    const header = document.querySelector('.header, header');
    if (!header) return null;
    const hr = header.getBoundingClientRect();
    const children = [...header.children].map((c) => {
      const r = c.getBoundingClientRect();
      return { text: (c.innerText||'').slice(0,40), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width) };
    });
    return { headerW: Math.round(hr.width), headerH: Math.round(hr.height), children, overflowX: header.scrollWidth > header.clientWidth + 1 };
  });

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    out: OUT,
    summary: Object.fromEntries(
      Object.entries(report.screens).map(([k, v]) => [k, { overflows: v.overflows, scrollWidth: v.scrollWidth, offenders: v.offenders.length, top: v.offenders.slice(0,5) }])
    ),
    headerMetrics: report.headerMetrics,
  }, null, 2));

  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
