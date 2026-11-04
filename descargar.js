// Pegar en la consola de la página de la reunión (Vida y Ministerio u otra). Descarga un .txt con texto + citas (2 niveles).
(async () => {
  const PROF = 2, MAX = 1500;
  const clean = s => (s || '').replace(/\s+/g, ' ').trim();
  const norm = s => clean(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const BLOCK = new Set('P DIV LI UL OL H1 H2 H3 H4 H5 H6 TR SECTION ARTICLE FIGURE FIGCAPTION BLOCKQUOTE TABLE ASIDE HEADER DL DT DD'.split(' '));
  const SKIP = new Set('SCRIPT STYLE NOSCRIPT NAV FOOTER BUTTON SELECT FORM IFRAME TEMPLATE svg IMG VIDEO AUDIO PICTURE'.split(' '));
  const STOP = /^(temas relacionados|puede que también le interese|recomendados|ver también|más información)$/i;
  // ---- Filtros: enlaces que NO son material de estudio ----
  const JUNK_CLASS = /(^|[\s_-])(menu|megamenu|navbar|nav|breadcrumbs?|footer|cookie|donat\w*|languages?|siteSearch|searchBox|share|toolbar|download|audio|video|pubRefs?)([\s_-]|$)/i;
  const NOISE_HREF = /donat|donac|contribu|hub\.jw\.org|\/choose|\/search|\/finder|\/legal|\/privacy|terms|cookie|login|lank=[^&]*video|_VIDEO|\/videos?\/|\/(cantos|canciones|musica|audio|descargas?|descargar)\/|sjjm|\/mediator\/|jw-?broadcasting|tv\.jw\.org|\/biblioteca\/?$|\/indice|\/index\//i;
  const NOISE_TXT = [
    /^[a-z]$/i, /^[+*\s•·]*$/,                                         // marcas de nota (a, b, +)
    /^(párrafos?|párrs?\.?|capítulos?|cap\.?|nota|figura|imagen)\s*\d*(\s*(y|a|al)\s*\d+)?$/i,
    /^(nasa|esa|stsci|aura|hubble|source|fuente|foto|photo|cc by.*|©.*|getty.*|shutterstock.*)$/i, // créditos
    /^canci[oó]n\s*\d+/i, /\bvideo\b|\bgrabaci[oó]n\b|\baudio\b|\bpodcast\b|\bmp[34]\b/i,
    /^(descarg\w*|reproducir|seleccion\w*|compartir|imprimir|copiar|ver más|leer más|ver todo|buscar|iniciar sesión|seleccionar idioma|donaciones?|jw\.org|biblioteca|noticias|inicio|siguiente|anterior|índice|indice)\b/i,
  ];
  const isNoise = (txt, abs, self, nested) => {
    try {
      const u = new URL(abs);
      if (!(u.origin === location.origin || /(^|\.)jw\.org$/i.test(u.hostname))) return true;           // externos
      if (self && u.origin + u.pathname === self && /^#(link|footnote|f\d|note)/i.test(u.hash) && nested) return true; // autorreferencia
    } catch { return true; }
    return NOISE_TXT.some(r => r.test(txt)) || NOISE_HREF.test(abs);
  };
  const tt = h => { try { if (window.trustedTypes) return (window.__tt || (window.__tt = trustedTypes.createPolicy('dl' + Date.now(), { createHTML: x => x }))).createHTML(h); } catch {} return h; };

  let active = 0; const wait = [];
  const acq = async () => { if (active >= 8) await new Promise(r => wait.push(r)); active++; };
  const rel = () => { active--; const w = wait.shift(); if (w) w(); };
  const cache = new Map();
  const getDoc = u => {
    const k = u.origin + u.pathname + u.search;
    if (!cache.has(k)) cache.set(k, (async () => { await acq(); try {
      const raw = await (await fetch(k, { credentials: 'omit' })).text(); let h = raw;
      try { h = (JSON.parse(raw).items || []).map(i => i.content || '').join(' '); } catch {}
      return new DOMParser().parseFromString(tt(h), 'text/html');
    } finally { rel(); } })());
    return cache.get(k);
  };
  const pickRoot = d => {
    const ps = [...d.querySelectorAll('p')].filter(p => !p.closest('nav,footer') && clean(p.textContent));
    const tot = ps.reduce((s, p) => s + p.textContent.length, 0), w = new Map();
    ps.forEach(p => { for (let e = p; e; e = e.parentElement) w.set(e, (w.get(e) || 0) + p.textContent.length); });
    let r = d.body; for (;;) { const n = [...r.children].find(c => (w.get(c) || 0) >= tot * .8); if (!n) break; r = n; } return r;
  };
  const nested = d => d.querySelector('#article') || d.querySelector('article') || d.querySelector('[role=main]') || d.querySelector('main') || pickRoot(d);

  // ---- Recorrido del texto ----
  function parse(nodes, base, o = {}) {
    const items = [], cites = []; let buf = '', cur = [], k = 0, started = !o.startEl, done = false;
    const A = u => { try { return new URL(u, base).href; } catch { return u; } };
    const flush = (pre = '') => {
      let t = clean(buf); if (o.nested) t = t.replace(/[+*]/g, '').replace(/\s+([,.;:!?”)])/g, '$1').replace(/\s{2,}/g, ' ').trim();
      if (/^(español|\/assets\/\S+)$/i.test(t)) t = '';
      if (t || cur.length) items.push({ t: t ? pre + t : '', cites: cur }); buf = ''; cur = [];
    };
    const walk = el => { for (const c of el.childNodes) { if (done) return; visit(c); } };
    function visit(c) {
      if (done) return;
      if (c.nodeType === 3) { if (started) buf += c.textContent; return; }
      if (c.nodeType !== 1) return;
      if (!started) { if (c === o.startEl) started = true; else if (c.contains(o.startEl)) walk(c); return; }
      const tag = c.tagName;
      if (SKIP.has(tag) || c.hidden || c.getAttribute('aria-hidden') === 'true') return;
      if (JUNK_CLASS.test((c.id || '') + ' ' + (typeof c.className === 'string' ? c.className : ''))) return;
      let cs = {}; try { cs = getComputedStyle(c); } catch {}
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (/^H[1-6]$/.test(tag) && STOP.test(clean(c.textContent))) { flush(); done = true; return; }
      if (tag === 'BR') { o.inline ? buf += ' ' : flush(); return; }
      if (o.inline && /^v\d/.test(c.id || '')) buf += ' ';
      const href = tag === 'A' ? c.getAttribute('href') : null;
      if (href && !/^(javascript|mailto|tel):/i.test(href)) {
        const txt = clean(c.textContent), abs = href.startsWith('#') ? base.split('#')[0] + href : A(href);
        if (o.nested && /^\d+$/.test(txt) && c.closest('[id^="v"]')) return;      // números de versículo
        if (!txt || isNoise(txt, abs, o.self, o.nested)) { buf += txt; return; }
        if (!o.plain) {
          const id = o.idp ? `${o.idp}.${++k}` : `${++k}`, ct = { id, txt, href, url: A(href), doc: c.ownerDocument, res: null };
          buf += `${txt} [C${id}]`; cur.push(ct); cites.push(ct); return;
        }
      }
      const blk = BLOCK.has(tag);
      if (blk) o.inline ? buf += ' ' : flush();
      walk(c);
      if (blk) o.inline ? buf += ' ' : flush(/^H[1-4]$/.test(tag) ? '## ' : '');
      if (c === o.endEl) { flush(); done = true; }
    }
    for (const n of nodes) { if (done) break; visit(n); }
    flush(); return { items, cites };
  }

  // ---- Citas ----
  const diag = []; let budget = MAX;
  const book = (b, c, v) => String(b).padStart(2, '0') + String(c).padStart(3, '0') + String(v).padStart(3, '0');
  const top = els => els.filter(e => !els.some(o => o !== e && o.contains(e)));
  function excerpt(d, u) {
    const h = u.hash; let m;
    if ((m = h.match(/v=(\d+):(\d+):(\d+)(?:-(?:(\d+):(\d+):)?(\d+))?/))) {
      const [, b, ch, v1, , ch2, v2] = m, ids = [];
      if (!ch2 || ch2 === ch) for (let i = +v1; i <= +(v2 || v1); i++) ids.push(book(b, ch, i)); else ids.push(book(b, ch, v1), book(b, ch2, v2));
      return { nodes: top([...d.querySelectorAll(ids.map(i => `[id^="v${i}"]`).join(','))]), inline: true };
    }
    if ((m = h.match(/v(\d{7,8})(?:-v?(\d{7,8}))?/))) {
      const a = +m[1], z = +(m[2] || m[1]);
      return { nodes: top([...d.querySelectorAll('[id^="v"]')].filter(e => { const x = e.id.match(/^v(\d{7,8})/); return x && +x[1] >= a && +x[1] <= z; })), inline: true };
    }
    if ((m = h.match(/^#p(\d+)(?:-p(\d+))?/))) { const n = []; for (let i = +m[1]; i <= +(m[2] || m[1]); i++) { const e = d.getElementById('p' + i); if (e) n.push(e); } return { nodes: n }; }
    if (h) { const e = d.getElementById(decodeURIComponent(h.slice(1))); return { nodes: e ? [e] : [] }; }
    return { nodes: [nested(d)] };
  }
  async function resolve(c, depth, chain) {
    if (chain.includes(c.url)) return;
    try {
      let nodes, inline = false;
      if (c.href.startsWith('#')) { const e = c.doc.getElementById(decodeURIComponent(c.href.slice(1))); nodes = e ? [e] : []; }
      else {
        const u = new URL(c.url);
        if (!(u.origin === location.origin || /\/wol\/(b|bc|pc|d)\//.test(u.pathname)) || u.pathname === '/open' || budget-- <= 0) return;
        ({ nodes, inline } = excerpt(await getDoc(u), u));
      }
      if (!nodes.length) { diag.push('sin texto: ' + c.url); return; }
      const q = new URL(c.url), sub = parse(nodes, c.url, { nested: true, inline, idp: c.id, plain: depth >= PROF, self: q.origin + q.pathname });
      if (!sub.items.length) return;
      c.res = sub.items;
      if (depth < PROF) await Promise.all(sub.cites.map(x => resolve(x, depth + 1, chain.concat(c.url))));
    } catch (e) { diag.push(`error ${e.message}: ${c.url}`); }
  }

  // ---- Principal: inicio y fin automáticos ----
  for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo(0, y); await sleep(80); }
  scrollTo(0, 0);
  const all = [...document.body.querySelectorAll('*')], deep = l => l.filter(e => !l.some(o => o !== e && e.contains(o)));
  const startEl = deep(all.filter(e => e.textContent.length < 80 && /^leer en (espanol|español)$/.test(norm(e.textContent))))[0] || null;
  const endEl = deep(all.filter(e => BLOCK.has(e.tagName) && e.textContent.length < 400 && /^palabras de conclusion/.test(norm(e.textContent)))).find(e => !startEl || (startEl.compareDocumentPosition(e) & 4)) || null;
  const main = startEl ? parse([document.body], location.href, { startEl, endEl }) : parse([pickRoot(document)], location.href, { endEl });
  await Promise.all(main.cites.map(c => resolve(c, 0, [])));

  // ---- Salida TXT ----
  const render = (items, ind) => { const pad = ' '.repeat(ind), out = [];
    for (const it of items) {
      if (it.t) out.push(pad + it.t);
      for (const c of it.cites) {
        const head = `${pad}    ↳ [C${c.id}] ${c.txt}:`;
        if (!c.res) out.push(`${head} (${c.url})`);
        else if (c.res.length === 1 && !c.res[0].cites.length) out.push(`${head} ${c.res[0].t}`);
        else { out.push(head, ...render(c.res, ind + 8)); }
      }
    } return out; };
  const txt = main.items.flatMap(it => [...render([it], 0), '']).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }));
  a.download = (clean(document.title).replace(/[\\/:*?"<>|]/g, '').slice(0, 60) || 'reunion') + '.txt';
  document.body.appendChild(a); a.click(); a.remove();
  const n = (l) => l.reduce((s, i) => s + i.cites.reduce((t, c) => t + 1 + (c.res ? n(c.res) : 0), 0), 0);
  const msg = `Listo (${startEl ? 'inicio ok' : 'sin inicio'} / ${endEl ? 'fin ok' : 'sin fin'}): ${n(main.items)} citas.` + (diag.length ? ` ${diag.length} sin texto (consola).` : '');
  console.log(msg, diag.slice(0, 20)); alert(msg);
})();
