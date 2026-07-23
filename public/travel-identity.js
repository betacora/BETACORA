/**
 * BeTacora — Travel Identity carousel (shareable credential slides)
 * Expressive multi-slide export at 1080×1350. Uses only real questionnaire /
 * archetype / itinerary data — never invented social-proof stats.
 */
(function (global) {
  'use strict';

  const W = 1080;
  const H = 1350;

  function getShareOrigin() {
    try {
      if (global.location?.origin && global.location.origin !== 'null') {
        return global.location.origin;
      }
    } catch (_) { /* ignore */ }
    return 'https://www.beta-cora.com';
  }

  function getShareHostLabel() {
    try {
      return new URL(getShareOrigin()).host.replace(/^www\./, '');
    } catch (_) {
      return 'beta-cora.com';
    }
  }

  function formatShareCopy(template, vars) {
    const origin = getShareOrigin();
    const site = getShareHostLabel();
    let out = String(template || '');
    const map = { url: origin, site, ...(vars || {}) };
    out = out.replace(/\{(name|url|site|dest|duration|archetype)\}/g, (_, key) =>
      map[key] != null ? String(map[key]) : ''
    );
    out = out
      .replace(/https?:\/\/(?:www\.)?betacora\.app\/?/gi, origin)
      .replace(/(?:www\.)?betacora\.app/gi, site);
    return out;
  }

  function withShareUrlInText(text, url) {
    const origin = url || getShareOrigin();
    const body = String(text || '').trim();
    if (!body) return origin;
    if (body.includes(origin) || /https?:\/\/\S+/i.test(body)) return body;
    return `${body}\n${origin}`;
  }

  /** Live getters so exports always reflect current host */
  function shareCtaLabel() {
    return getShareHostLabel();
  }
  function sharePageUrl() {
    return getShareOrigin();
  }

  let slideIndex = 0;
  let slides = [];
  let touchStartX = 0;

  function L() {
    const lang =
      (global.LANG && global.LANG.current) ||
      (typeof document !== 'undefined' && document.documentElement.lang) ||
      'es';
    const pack = global.I18N && (global.I18N[lang] || global.I18N.es);
    return pack || {};
  }

  function ti() {
    return L().ui?.travelIdentity || {};
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function uniq(arr) {
    const seen = new Set();
    const out = [];
    arr.forEach((x) => {
      const k = String(x || '').trim();
      if (!k || seen.has(k.toLowerCase())) return;
      seen.add(k.toLowerCase());
      out.push(k);
    });
    return out;
  }

  /** Detect animal keyword from AI free-text for illustration key */
  function detectAnimalKey(animalText) {
    const t = String(animalText || '').toLowerCase();
    const map = [
      ['buho', 'owl'], ['búho', 'owl'], ['owl', 'owl'],
      ['lobo', 'wolf'], ['wolf', 'wolf'],
      ['aguila', 'eagle'], ['águila', 'eagle'], ['eagle', 'eagle'],
      ['zorro', 'fox'], ['fox', 'fox'],
      ['delfin', 'dolphin'], ['delfín', 'dolphin'], ['dolphin', 'dolphin'],
      ['gato', 'cat'], ['cat', 'cat'], ['felino', 'cat'],
      ['ciervo', 'deer'], ['deer', 'deer'],
      ['halcon', 'eagle'], ['halcón', 'eagle'],
      ['leon', 'lion'], ['león', 'lion'], ['lion', 'lion'],
      ['oso', 'bear'], ['bear', 'bear'],
      ['tortuga', 'turtle'], ['turtle', 'turtle'],
      ['ballena', 'whale'], ['whale', 'whale'],
      ['colibri', 'bird'], ['colibrí', 'bird'], ['ave', 'bird'], ['bird', 'bird'],
      ['serpiente', 'snake'], ['snake', 'snake'],
      ['caballo', 'horse'], ['horse', 'horse'],
      ['pulpo', 'octopus'], ['octopus', 'octopus'],
      ['pinguino', 'bird'], ['pingüino', 'bird'],
    ];
    for (const [needle, key] of map) {
      if (t.includes(needle)) return key;
    }
    return 'compass';
  }

  function animalSvg(key) {
    const stroke = '#2D7B7B';
    const fill = '#E8634A';
    const common = `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" aria-hidden="true"`;
    const svgs = {
      owl: `<svg ${common}><circle cx="60" cy="62" r="32" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="48" cy="56" r="8" fill="${fill}"/><circle cx="72" cy="56" r="8" fill="${fill}"/><circle cx="48" cy="56" r="3" fill="#FAF8F4"/><circle cx="72" cy="56" r="3" fill="#FAF8F4"/><path d="M54 72 Q60 80 66 72" fill="none" stroke="${stroke}" stroke-width="2.5"/><path d="M40 38 Q60 22 80 38" fill="none" stroke="${stroke}" stroke-width="3"/></svg>`,
      wolf: `<svg ${common}><path d="M28 78 L40 42 L52 58 L60 36 L68 58 L80 42 L92 78 Z" fill="none" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/><circle cx="48" cy="62" r="3" fill="${fill}"/><circle cx="72" cy="62" r="3" fill="${fill}"/></svg>`,
      eagle: `<svg ${common}><path d="M20 58 Q60 28 100 58 Q60 48 20 58Z" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="60" cy="54" r="8" fill="${fill}"/><path d="M60 62 L60 78" stroke="${stroke}" stroke-width="3"/></svg>`,
      fox: `<svg ${common}><path d="M30 80 L45 40 L60 55 L75 40 L90 80 Z" fill="none" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="62" r="3.5" fill="${fill}"/><circle cx="70" cy="62" r="3.5" fill="${fill}"/><path d="M55 70 Q60 76 65 70" fill="none" stroke="${stroke}" stroke-width="2"/></svg>`,
      dolphin: `<svg ${common}><path d="M22 70 Q40 40 70 48 Q95 54 100 40 Q88 72 62 78 Q40 82 28 70Z" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="78" cy="52" r="3" fill="${fill}"/></svg>`,
      cat: `<svg ${common}><circle cx="60" cy="64" r="28" fill="none" stroke="${stroke}" stroke-width="3"/><path d="M38 48 L42 28 L54 46" fill="none" stroke="${stroke}" stroke-width="3"/><path d="M82 48 L78 28 L66 46" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="50" cy="62" r="3.5" fill="${fill}"/><circle cx="70" cy="62" r="3.5" fill="${fill}"/></svg>`,
      deer: `<svg ${common}><circle cx="60" cy="68" r="24" fill="none" stroke="${stroke}" stroke-width="3"/><path d="M48 48 L42 22 M48 34 L36 28 M72 48 L78 22 M72 34 L84 28" fill="none" stroke="${stroke}" stroke-width="2.5"/><circle cx="52" cy="66" r="3" fill="${fill}"/><circle cx="68" cy="66" r="3" fill="${fill}"/></svg>`,
      lion: `<svg ${common}><circle cx="60" cy="60" r="26" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="60" cy="60" r="36" fill="none" stroke="${fill}" stroke-width="2" stroke-dasharray="4 6"/><circle cx="50" cy="56" r="3.5" fill="${stroke}"/><circle cx="70" cy="56" r="3.5" fill="${stroke}"/></svg>`,
      bear: `<svg ${common}><circle cx="60" cy="64" r="28" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="38" cy="42" r="10" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="82" cy="42" r="10" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="50" cy="62" r="3.5" fill="${fill}"/><circle cx="70" cy="62" r="3.5" fill="${fill}"/></svg>`,
      turtle: `<svg ${common}><ellipse cx="60" cy="62" rx="34" ry="24" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="88" cy="58" r="10" fill="none" stroke="${stroke}" stroke-width="2.5"/><path d="M40 62 L48 50 M52 70 L60 48 M68 70 L76 50" stroke="${fill}" stroke-width="2"/></svg>`,
      whale: `<svg ${common}><path d="M18 68 Q40 40 78 48 Q102 54 108 40 Q96 78 70 84 Q42 88 24 72Z" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="86" cy="54" r="3" fill="${fill}"/></svg>`,
      bird: `<svg ${common}><path d="M30 64 Q60 36 90 64" fill="none" stroke="${stroke}" stroke-width="3"/><path d="M60 64 L60 88" stroke="${stroke}" stroke-width="3"/><circle cx="60" cy="56" r="7" fill="${fill}"/></svg>`,
      snake: `<svg ${common}><path d="M30 40 Q50 20 60 50 Q70 80 90 60 Q100 50 95 45" fill="none" stroke="${stroke}" stroke-width="4" stroke-linecap="round"/><circle cx="32" cy="40" r="4" fill="${fill}"/></svg>`,
      horse: `<svg ${common}><path d="M34 86 L42 50 L58 58 L70 36 L86 48 L78 86Z" fill="none" stroke="${stroke}" stroke-width="3" stroke-linejoin="round"/><circle cx="72" cy="48" r="3" fill="${fill}"/></svg>`,
      octopus: `<svg ${common}><circle cx="60" cy="48" r="22" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="52" cy="46" r="3.5" fill="${fill}"/><circle cx="68" cy="46" r="3.5" fill="${fill}"/><path d="M40 62 Q36 88 30 95 M50 66 Q48 92 46 98 M70 66 Q72 92 74 98 M80 62 Q84 88 90 95 M60 68 Q60 94 60 100" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round"/></svg>`,
      compass: `<svg ${common}><circle cx="60" cy="60" r="34" fill="none" stroke="${stroke}" stroke-width="3"/><circle cx="60" cy="60" r="6" fill="${fill}"/><path d="M60 30 L68 60 L60 90 L52 60 Z" fill="none" stroke="${stroke}" stroke-width="2.5"/><path d="M60 30 L60 42" stroke="${fill}" stroke-width="3"/></svg>`,
    };
    return svgs[key] || svgs.compass;
  }

  function formatSlideDate(dateFrom) {
    const loc = L().ui?.dateLocale || 'es-ES';
    const d = dateFrom ? new Date(dateFrom + 'T12:00:00') : new Date();
    if (Number.isNaN(d.getTime())) return '';
    try {
      return d.toLocaleDateString(loc, { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return d.toISOString().slice(0, 10);
    }
  }

  function daysUntil(dateFrom) {
    if (!dateFrom) return null;
    const target = new Date(dateFrom + 'T12:00:00');
    if (Number.isNaN(target.getTime())) return null;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dest = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const diff = Math.round((dest - today) / 86400000);
    return diff > 0 ? diff : null;
  }

  function traitStatements(answers, copy) {
    const traits = copy.traits || {};
    const out = [];
    const pace = Array.isArray(answers.pace) ? answers.pace[0] : answers.pace;
    if (pace && traits['pace_' + pace]) out.push(traits['pace_' + pace]);

    if (answers.social && traits['social_' + answers.social]) {
      out.push(traits['social_' + answers.social]);
    }

    const budget = answers.budget_r || answers.budget_monthly_r;
    if (budget && traits['budget_' + budget]) out.push(traits['budget_' + budget]);

    if (answers.wake && traits['wake_' + answers.wake] && out.length < 3) {
      out.push(traits['wake_' + answers.wake]);
    }

    const motiv = Array.isArray(answers.motiv) ? answers.motiv : [];
    for (const m of motiv) {
      if (out.length >= 3) break;
      if (traits['motiv_' + m]) out.push(traits['motiv_' + m]);
    }

    const exp = Array.isArray(answers.exp) ? answers.exp : [];
    for (const e of exp) {
      if (out.length >= 3) break;
      if (traits['exp_' + e]) out.push(traits['exp_' + e]);
    }

    if (answers.social_e && traits['social_e_' + answers.social_e] && out.length < 3) {
      out.push(traits['social_e_' + answers.social_e]);
    }

    return uniq(out).slice(0, 3);
  }

  function discoveryPriorities(answers, misionViaje, copy) {
    const p = copy.priorities || {};
    const focusLabels = copy.focus || {};
    const parts = [];

    if (answers.wake === 'alba' || answers.wake === 'manana') {
      if (p.sunrises) parts.push(p.sunrises);
    }
    const exp = Array.isArray(answers.exp) ? answers.exp : [];
    if (exp.includes('local') || exp.includes('nadie')) {
      if (p.authenticity) parts.push(p.authenticity);
    }
    const pace = Array.isArray(answers.pace) ? answers.pace : [];
    if (pace.includes('zero') || pace.includes('slow') || pace.includes('balanced')) {
      if (p.improvisation) parts.push(p.improvisation);
    }

    (misionViaje?.focus || []).forEach((f) => {
      if (focusLabels[f]) parts.push(focusLabels[f]);
    });

    const motiv = Array.isArray(answers.motiv) ? answers.motiv : [];
    const motivLabels = L().motivLabels || {};
    motiv.slice(0, 2).forEach((m) => {
      if (motivLabels[m]) parts.push(motivLabels[m]);
    });

    return uniq(parts).slice(0, 3);
  }

  function joinList(items, copy) {
    const list = items.filter(Boolean);
    if (!list.length) return '';
    if (list.length === 1) return list[0];
    if (list.length === 2) return list[0] + (copy.and || ' y ') + list[1];
    return list.slice(0, -1).join(', ') + (copy.and || ' y ') + list[list.length - 1];
  }

  function getDestinationLabel(helpers) {
    if (helpers?.getDestinationForSave) {
      const d = helpers.getDestinationForSave();
      if (d && !['Sorpresa', 'Surprise', 'Surprise me', 'Viaje nómada'].includes(d)) return d;
    }
    if (helpers?.extractDestinationLabel) {
      const d = helpers.extractDestinationLabel();
      if (d) return d;
    }
    const h2 = document.querySelector('#itinerarySection .bitacora-article h2');
    if (h2) {
      const raw = (h2.textContent || '').replace(/^[\s\S]*?([A-Za-zÁÉÍÓÚÜÑáéíóúüñ].*)/, '$1').trim();
      const cut = raw.split(/\s+[—–|-]\s+/)[0].trim();
      if (cut) return cut.slice(0, 60);
    }
    return '';
  }

  function extractItineraryMoment(copy) {
    const article = document.querySelector('#itinerarySection .bitacora-article');
    if (!article) return null;

    const headings = [...article.querySelectorAll('h3')];
    const dayH = headings.find((h) => /^(d[ií]a|day|jour)\b/i.test((h.textContent || '').trim()));
    if (!dayH) {
      // fallback: first place from map JSON markers text in highlights
      const placeEl = article.querySelector('h3');
      if (!placeEl) return null;
      const title = (placeEl.textContent || '').trim().slice(0, 80);
      const p = placeEl.nextElementSibling;
      const body = p && p.tagName === 'P' ? (p.textContent || '').trim() : '';
      if (!title && !body) return null;
      return { title, body: body.slice(0, 180), timeLabel: copy.momentFallbackTime || '' };
    }

    const title = (dayH.textContent || '').trim();
    let timeLabel = copy.momentFallbackTime || '';
    let body = '';
    let node = dayH.nextElementSibling;
    let guard = 0;
    while (node && guard < 8) {
      guard += 1;
      if (node.tagName === 'H2' || node.tagName === 'H3') break;
      if (node.tagName === 'P') {
        const text = (node.textContent || '').trim();
        if (!text) {
          node = node.nextElementSibling;
          continue;
        }
        const morning = /^(mañana|morning|matin)\s*:/i.exec(text);
        const afternoon = /^(tarde|afternoon|après-midi|apres-midi)\s*:/i.exec(text);
        const night = /^(noche|night|soir)\s*:/i.exec(text);
        if (morning) {
          timeLabel = copy.timeMorning || morning[1];
          body = text.replace(/^(mañana|morning|matin)\s*:\s*/i, '').trim();
          break;
        }
        if (afternoon && !body) {
          timeLabel = copy.timeAfternoon || afternoon[1];
          body = text.replace(/^(tarde|afternoon|après-midi|apres-midi)\s*:\s*/i, '').trim();
        }
        if (night && !body) {
          timeLabel = copy.timeNight || night[1];
          body = text.replace(/^(noche|night|soir)\s*:\s*/i, '').trim();
        }
        if (!body) body = text;
        if (body && (morning || body.length > 40)) break;
      }
      node = node.nextElementSibling;
    }

    if (!body) return null;
    return {
      title: title.slice(0, 90),
      body: body.slice(0, 200),
      timeLabel,
    };
  }

  function buildSlides(profile, ctx) {
    const copy = ti();
    const answers = ctx.answers || {};
    const misionViaje = ctx.misionViaje || {};
    const dest = getDestinationLabel(ctx.helpers) || copy.destFallback || '';
    const dateFrom = answers.dateFrom || document.getElementById('dateFrom')?.value || '';
    const animalText = profile.animal || '';
    const animalKey = detectAnimalKey(animalText);
    const animalShort = animalText
      ? animalText.replace(/^[^:]+:\s*/i, '').trim().slice(0, 160)
      : '';

    const built = [];

    // 1 Impact
    built.push({
      id: 'impact',
      html: `
        <div class="ti-slide ti-impact" data-ti-slide="impact">
          <div class="ti-kicker">${escapeHtml(copy.unlocked || '')}</div>
          <div class="ti-animal" data-animal="${escapeHtml(animalKey)}">${animalSvg(animalKey)}</div>
          <h2 class="ti-archetype">${escapeHtml(profile.type || '—')}</h2>
          ${animalShort ? `<p class="ti-animal-text">${escapeHtml(animalShort)}</p>` : ''}
          <p class="ti-date">${escapeHtml(formatSlideDate(dateFrom || null))}</p>
        </div>`,
    });

    // 2 Validation
    const traits = traitStatements(answers, copy);
    if (traits.length) {
      built.push({
        id: 'validation',
        html: `
          <div class="ti-slide ti-validation" data-ti-slide="validation">
            <div class="ti-kicker">${escapeHtml(copy.validationTitle || '')}</div>
            <ul class="ti-traits">
              ${traits.map((t) => `<li><span class="ti-trait-mark"></span><span>${escapeHtml(t)}</span></li>`).join('')}
            </ul>
          </div>`,
      });
    }

    // 3 Discovery
    const priorities = discoveryPriorities(answers, misionViaje, copy);
    const modifiers = Array.isArray(profile.modifiers) ? profile.modifiers.slice(0, 2) : [];
    if (dest || priorities.length) {
      const lead = priorities.length
        ? (copy.discoveryLead || '{list}').replace('{list}', joinList(priorities, copy))
        : (copy.discoveryLeadFallback || '');
      built.push({
        id: 'discovery',
        html: `
          <div class="ti-slide ti-discovery" data-ti-slide="discovery">
            <div class="ti-kicker">${escapeHtml(copy.discoveryTitle || '')}</div>
            ${dest ? `<h2 class="ti-dest">${escapeHtml(dest)}</h2>` : ''}
            ${lead ? `<p class="ti-lead">${escapeHtml(lead)}</p>` : ''}
            ${modifiers.length ? `<p class="ti-mod">${escapeHtml(modifiers.join(' · '))}</p>` : ''}
          </div>`,
      });
    }

    // 4 Anticipation
    const moment = extractItineraryMoment(copy);
    if (moment) {
      built.push({
        id: 'anticipation',
        html: `
          <div class="ti-slide ti-anticipation" data-ti-slide="anticipation">
            <div class="ti-kicker">${escapeHtml(copy.anticipationTitle || '')}</div>
            ${moment.timeLabel ? `<div class="ti-time">${escapeHtml(moment.timeLabel)}</div>` : ''}
            <h2 class="ti-moment-title">${escapeHtml(moment.title)}</h2>
            <p class="ti-moment-body">${escapeHtml(moment.body)}</p>
          </div>`,
      });
    }

    // 5 Countdown (skip if no future date)
    const n = daysUntil(dateFrom);
    if (n != null && dest) {
      const tpl = n === 1 ? (copy.countdownOne || copy.countdown) : copy.countdown;
      const line = (tpl || '')
        .replace('{n}', String(n))
        .replace('{dest}', dest);
      built.push({
        id: 'countdown',
        html: `
          <div class="ti-slide ti-countdown" data-ti-slide="countdown">
            <div class="ti-kicker">${escapeHtml(copy.countdownTitle || '')}</div>
            <div class="ti-count-num">${escapeHtml(String(n))}</div>
            <p class="ti-count-line">${escapeHtml(line)}</p>
          </div>`,
      });
    }

    // 6 Invitation
    built.push({
      id: 'invite',
      html: `
        <div class="ti-slide ti-invite" data-ti-slide="invite">
          <div class="ti-kicker ti-wordmark" aria-label="BeTacora"><span class="logo-syl-be">Be</span><span class="logo-syl-ta">Ta</span><span class="logo-syl-co">co</span><span class="logo-syl-ra">ra</span></div>
          <h2 class="ti-invite-title">${escapeHtml(copy.inviteTitle || '')}</h2>
          <p class="ti-invite-cta">${escapeHtml(copy.inviteCta || shareCtaLabel())}</p>
          <div class="ti-invite-url">${escapeHtml(formatShareCopy(copy.cta || '{site}'))}</div>
        </div>`,
    });

    return built;
  }

  function updateChrome() {
    const copy = ti();
    const dots = document.getElementById('tiDots');
    const counter = document.getElementById('tiCounter');
    const prev = document.getElementById('tiPrev');
    const next = document.getElementById('tiNext');
    if (dots) {
      dots.innerHTML = slides
        .map((_, i) => `<button type="button" class="ti-dot${i === slideIndex ? ' active' : ''}" data-i="${i}" aria-label="${i + 1}"></button>`)
        .join('');
      dots.querySelectorAll('.ti-dot').forEach((btn) => {
        btn.addEventListener('click', () => goTo(Number(btn.dataset.i)));
      });
    }
    if (counter) {
      counter.textContent = (copy.slideOf || '{n} / {total}')
        .replace('{n}', String(slideIndex + 1))
        .replace('{total}', String(slides.length));
    }
    if (prev) prev.disabled = slideIndex <= 0;
    if (next) next.disabled = slideIndex >= slides.length - 1;
  }

  function goTo(i) {
    if (!slides.length) return;
    slideIndex = Math.max(0, Math.min(slides.length - 1, i));
    const track = document.getElementById('tiTrack');
    if (track) track.style.transform = `translateX(-${slideIndex * 100}%)`;
    updateChrome();
  }

  function bindSwipe(viewport) {
    if (!viewport || viewport.dataset.tiBound) return;
    viewport.dataset.tiBound = '1';
    viewport.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true }
    );
    viewport.addEventListener(
      'touchend',
      (e) => {
        const dx = e.changedTouches[0].screenX - touchStartX;
        if (Math.abs(dx) < 40) return;
        if (dx < 0) goTo(slideIndex + 1);
        else goTo(slideIndex - 1);
      },
      { passive: true }
    );
  }

  function render(profile, ctx) {
    if (!profile) return;
    const wrap = document.getElementById('shareableCard');
    const track = document.getElementById('tiTrack');
    if (!wrap || !track) return;

    const prevMeta = {
      modifiers: profile.modifiers,
      archetypeId: profile.archetypeId,
    };
    // Preserve modifiers from provisional if AI profile wiped them
    if ((!profile.modifiers || !profile.modifiers.length) && global.aiProfile?.modifiers) {
      profile.modifiers = global.aiProfile.modifiers;
    } else if (prevMeta.modifiers) {
      profile.modifiers = prevMeta.modifiers;
    }

    slides = buildSlides(profile, ctx || {});
    slideIndex = 0;
    track.innerHTML = slides.map((s) => `<div class="ti-slide-frame">${s.html}</div>`).join('');
    track.style.transform = 'translateX(0)';
    wrap.classList.add('show');

    const share = document.getElementById('scShare');
    const download = document.getElementById('scDownload');
    const copy = ti();
    if (share) share.textContent = copy.share || L().ui?.shareableCard?.share || 'Compartir';
    if (download) download.textContent = copy.download || L().ui?.shareableCard?.download || 'Descargar';

    const prev = document.getElementById('tiPrev');
    const next = document.getElementById('tiNext');
    if (prev) prev.onclick = () => goTo(slideIndex - 1);
    if (next) next.onclick = () => goTo(slideIndex + 1);
    bindSwipe(document.getElementById('tiViewport'));
    updateChrome();
  }

  function activeSlideEl() {
    return document.querySelectorAll('#tiTrack .ti-slide')[slideIndex] || null;
  }

  async function loadHtml2Canvas() {
    if (typeof global.html2canvas !== 'undefined') return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('html2canvas failed'));
      document.head.appendChild(s);
    });
  }

  function normalizeCanvas(source) {
    if (source.width === W && source.height === H) return source;
    const out = document.createElement('canvas');
    out.width = W;
    out.height = H;
    const ctx = out.getContext('2d');
    ctx.fillStyle = '#FAF8F4';
    ctx.fillRect(0, 0, W, H);
    ctx.drawImage(source, 0, 0, W, H);
    return out;
  }

  async function captureCurrent() {
    const slide = activeSlideEl();
    if (!slide) throw new Error('No slide');
    await loadHtml2Canvas();
    if (document.fonts?.ready) {
      try {
        await document.fonts.ready;
      } catch (_) { /* ignore */ }
    }

    // Offscreen clone at fixed CSS size for crisp 3× export
    const host = document.createElement('div');
    host.style.cssText =
      'position:fixed;left:-10000px;top:0;width:360px;height:450px;overflow:hidden;z-index:-1;';
    const clone = slide.cloneNode(true);
    clone.style.cssText =
      'width:360px;height:450px;border-radius:0;border:none;box-shadow:none;';
    host.appendChild(clone);
    document.body.appendChild(host);
    try {
      const canvas = await global.html2canvas(clone, {
        scale: 3,
        width: 360,
        height: 450,
        backgroundColor: '#FAF8F4',
        useCORS: true,
        allowTaint: true,
        logging: false,
        imageTimeout: 5000,
      });
      return normalizeCanvas(canvas);
    } finally {
      host.remove();
    }
  }

  function triggerDownload(canvas, filename) {
    const link = document.createElement('a');
    link.download = filename || 'betacora-identidad.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function download() {
    const canvas = await captureCurrent();
    const id = slides[slideIndex]?.id || 'slide';
    triggerDownload(canvas, `betacora-identidad-${id}.png`);
    return canvas;
  }

  async function share() {
    const canvas = await captureCurrent();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('blob');
    const id = slides[slideIndex]?.id || 'slide';
    const file = new File([blob], `betacora-identidad-${id}.png`, { type: 'image/png' });
    const name = global.aiProfile?.type || 'BeTacora';
    const origin = sharePageUrl();
    const shareText = withShareUrlInText(
      formatShareCopy(L().ui?.share?.text || '', { name }),
      origin
    );
    const data = { title: L().ui?.share?.title || 'BeTacora', text: shareText };

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ ...data, files: [file], url: origin });
      return;
    }
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ ...data, url: origin });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
    } catch (_) { /* ignore */ }
    triggerDownload(canvas, file.name);
  }

  global.BTTravelIdentity = {
    render,
    goTo,
    captureCurrent,
    download,
    share,
    getSlides: () => slides.slice(),
    getIndex: () => slideIndex,
    getShareOrigin,
    getShareHostLabel,
    get W() { return W; },
    get H() { return H; },
    get CTA() { return shareCtaLabel(); },
    get URL() { return sharePageUrl(); },
  };
})(typeof window !== 'undefined' ? window : globalThis);
