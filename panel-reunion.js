// Panel: pegar en la consola de la página de la reunión. Descarga SOLO un .html (texto + citas + imágenes).
(() => {
  const PID = '__ext_panel';
  document.getElementById(PID)?.remove();
  const saved = (() => { try { return JSON.parse(localStorage.getItem(PID) || '{}'); } catch { return {}; } })();
  const panel = document.createElement('div');
  panel.id = PID;
  panel.style.cssText = 'position:fixed;top:12px;right:12px;width:340px;z-index:2147483647;background:#fff;color:#222;border:1px solid #888;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.35);font:14px/1.4 system-ui,sans-serif;padding:12px';
  const mk = (tag, st, props, kids) => { const e = document.createElement(tag); if (st) e.style.cssText = st; Object.assign(e, props || {}); (kids || []).forEach(k => e.append(k)); return e; };
  const lab = t => mk('label', '', { textContent: t });
  const ta = (id, rows, ph) => mk('textarea', 'width:100%;box-sizing:border-box;margin:2px 0 8px;display:block', { id: PID + '_' + id, rows, placeholder: ph || '' });
  const sel = (id, opts) => mk('select', 'width:100%', { id: PID + '_' + id }, opts.map(o => mk('option', '', { value: o[0], textContent: o[1] })));
  const row = (a, b) => mk('div', 'display:flex;gap:8px;margin-bottom:8px', {}, [a, b]);
  const col = (t, s) => mk('label', 'flex:1', {}, [t, mk('br'), s]);
  panel.append(
    mk('div', 'display:flex;justify-content:space-between;align-items:center;margin-bottom:8px', {}, [
      mk('b', '', { textContent: 'Descargar reunión (HTML)' }),
      mk('button', 'border:0;background:none;font-size:18px;cursor:pointer', { id: PID + '_x', textContent: '✕' })]),
    lab('Texto de INICIO (empieza después)'), ta('i', 2),
    lab('Texto de FIN (termina en este bloque)'), ta('f', 2),
    row(col('Niveles de citas', sel('p', [['1', '1: texto → cita'], ['2', '2: + citas dentro'], ['3', '3: + citas de esas']])),
        col('Citas dentro de citas', sel('v', [['paren', 'Solo entre ( )'], ['todas', 'Todas'], ['ninguna', 'Ninguna']]))),
    lab('Excluir citas extra (una por línea, texto o regex)'), ta('ex', 2, 'ej: ^Apéndice'),
    mk('label', 'display:block;margin-bottom:8px', {}, [mk('input', '', { type: 'checkbox', id: PID + '_nr', checked: true }), ' Omitir canciones, videos, créditos y pies de nota']),
    mk('button', 'width:100%;padding:8px;border:0;border-radius:6px;background:#2a6ebb;color:#fff;font-weight:bold;cursor:pointer', { id: PID + '_go', textContent: 'Iniciar' }),
    mk('div', 'margin-top:8px;font-size:12px;color:#555;white-space:pre-wrap;max-height:120px;overflow:auto', { id: PID + '_s' }));
  (document.body || document.documentElement).appendChild(panel);
  const $ = id => document.getElementById(PID + '_' + id);
  $('i').value = saved.inicio || 'Leer en español';
  $('f').value = saved.fin || 'Palabras de conclusión';
  $('p').value = saved.niv || '2'; $('v').value = ['paren','todas','ninguna'].includes(saved.vers) ? saved.vers : 'paren';
  $('ex').value = saved.excl || ''; $('nr').checked = saved.nr !== false;
  $('x').onclick = () => panel.remove();
  const say = m => { $('s').textContent = m; console.log(m); };
  $('go').onclick = async () => {
    const cfg = { inicio: $('i').value.trim(), fin: $('f').value.trim(), niv: $('p').value, vers: $('v').value, excl: $('ex').value, nr: $('nr').checked };
    try { localStorage.setItem(PID, JSON.stringify(cfg)); } catch {}
    $('go').disabled = true; $('go').textContent = 'Trabajando…';
    try { await run(cfg); } catch (e) { say('Error: ' + e.message); console.error(e); }
    $('go').disabled = false; $('go').textContent = 'Iniciar';
  };

  async function run(cfg) {
    const PROF = +cfg.niv - 1, MAX = 1500;
    const clean = s => (s || '').replace(/\s+/g, ' ').trim();
    const norm = s => clean(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const IMG_RE = /\.(jpe?g|png|webp|gif)(\?|#|$)/i, BAD_IMG = /icon|sprite|logo|placeholder|blank/i;
    const BLOCK = new Set('P DIV LI UL OL H1 H2 H3 H4 H5 H6 TR SECTION ARTICLE FIGURE FIGCAPTION BLOCKQUOTE TABLE ASIDE HEADER DL DT DD'.split(' '));
    const SKIP = new Set('SCRIPT STYLE NOSCRIPT NAV FOOTER BUTTON SELECT FORM IFRAME TEMPLATE svg AUDIO'.split(' '));
    const STOP = /^(temas relacionados|puede que también le interese|recomendados|ver también|más información)$/i;

    // ---------- FILTROS: lo que NO es material de estudio ----------
    const JUNK_CLASS = /(^|[\s_-])(menu|megamenu|navbar|nav|breadcrumbs?|footer|cookie|donat\w*|languages?|siteSearch|searchBox|share|toolbar|audioPlayer|download)([\s_-]|$)/i;
    const NOISE_HREF = /donat|donac|contribu|hub\.jw\.org|\/choose|\/search|\/finder|\/legal|\/privacy|terms|cookie|login|lank=[^&]*video|_VIDEO|\/videos?\/|\/(cantos|canciones|musica|audio|descargas?)\/|sjjm|\/mediator\/|tv\.jw\.org|jw-?broadcasting/i;
    const NOISE_TXT = [
      /^[+*\s•·]*$/, /^(párrafos?|párrs?\.?|capítulos?|cap\.?|nota|figura|imagen)\s*\d*(\s*(y|a|al)\s*\d+)?$/i,
      /^(nasa|esa|stsci|aura|hubble|source|fuente|foto|photo|cc by.*|©.*|getty.*|shutterstock.*)$/i,
      /^canci[oó]n\s*\d+/i, /\bvideo\b|\bgrabaci[oó]n\b|\baudio\b|\bpodcast\b|\bmp[34]\b/i,
      /^(descarg\w*|reproducir|seleccion\w*|compartir|imprimir|copiar|ver más|leer más|ver todo|buscar|iniciar sesión|seleccionar idioma|donaciones?|jw\.org|biblioteca|noticias|inicio|siguiente|anterior|índice|indice)\b/i,
    ];
    const LINE_JUNK = /^(español|\/assets\/\S+|reproducir en|descarga|descargar|seleccione una grabaci\w+|imagen [a-z]|.*licensed under.*|based on .*imagery|nasa, esa.*)$/i;
    const toRe = l => { const m = l.match(/^\/(.+)\/([a-z]*)$/); try { return m ? new RegExp(m[1], m[2] || 'i') : new RegExp(l, 'i'); } catch { return new RegExp(l.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); } };
    const EXTRA = (cfg.excl || '').split('\n').map(l => l.trim()).filter(Boolean).map(toRe);
    const omitted = [];
    function isNoise(txt, abs, self, nested, el) {
      let why = null, drop = false;
      try {
        const u = new URL(abs);
        if (!(u.origin === location.origin || /(^|\.)jw\.org$/i.test(u.hostname))) why = 'enlace externo';
        else if (nested && self && u.origin + u.pathname === self && /^#(link|footnote|f\d|note)/i.test(u.hash)) { why = 'autorreferencia'; drop = clean(el.parentElement && el.parentElement.textContent) === txt; }
      } catch { why = 'enlace inválido'; }
      if (!why && cfg.nr) {
        if (/^[a-z]$/i.test(txt)) { why = 'nota al pie'; drop = true; }
        else if (NOISE_TXT.some(r => r.test(txt))) why = 'texto irrelevante';
        else if (NOISE_HREF.test(abs)) why = 'canción/video/menú';
      }
      if (!why && EXTRA.some(r => r.test(txt) || r.test(abs))) why = 'exclusión manual';
      if (why) omitted.push(`${why}: ${txt} → ${abs}`);
      return why ? { drop } : null;
    }

    let active = 0; const waiters = [];
    const acquire = async () => { if (active >= 8) await new Promise(r => waiters.push(r)); active++; };
    const release = () => { active--; const w = waiters.shift(); if (w) w(); };
    const tt = h => { try { if (window.trustedTypes) return (window.__extTT || (window.__extTT = trustedTypes.createPolicy('ext-' + Date.now(), { createHTML: x => x }))).createHTML(h); } catch {} return h; };
    function pickRoot(doc) {
      const ps = [...doc.querySelectorAll('p')].filter(p => !p.closest('nav,footer,[role=navigation]') && !p.closest('#' + PID) && clean(p.textContent));
      const total = ps.reduce((s, p) => s + p.textContent.length, 0), w = new Map();
      ps.forEach(p => { for (let e = p; e; e = e.parentElement) w.set(e, (w.get(e) || 0) + p.textContent.length); });
      let r = doc.body; for (;;) { const nx = [...r.children].find(c => (w.get(c) || 0) >= total * 0.8); if (!nx) break; r = nx; } return r;
    }
    const pickNested = d => d.querySelector('#article') || d.querySelector('article') || d.querySelector('[role=main]') || d.querySelector('main') || pickRoot(d);

    say('Cargando contenido de la página…');
    for (let y = 0; y < document.documentElement.scrollHeight; y += 700) { scrollTo(0, y); await sleep(100); }
    scrollTo(0, 0);

    // ---------- Marcadores ----------
    const all = [...document.body.querySelectorAll('*')].filter(e => !e.closest('#' + PID));
    const deepest = l => l.filter(e => !l.some(o => o !== e && e.contains(o)));
    const nI = norm(cfg.inicio), nF = norm(cfg.fin);
    let startEl = null, endEl = null;
    if (nI) for (const t of [e => e.textContent.length < Math.max(80, nI.length * 2) && norm(e.textContent) === nI, e => e.textContent.length < 400 && norm(e.textContent).startsWith(nI), e => e.textContent.length < 400 && norm(e.textContent).includes(nI)]) { startEl = deepest(all.filter(t))[0] || null; if (startEl) break; }
    if (nF) {
      const after = e => !startEl || (startEl.compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING);
      for (const t of [e => BLOCK.has(e.tagName) && e.textContent.length < 400 && norm(e.textContent).startsWith(nF), e => BLOCK.has(e.tagName) && e.textContent.length < 400 && norm(e.textContent).includes(nF)]) { endEl = deepest(all.filter(t)).find(after) || null; if (endEl) break; }
    }
    say('Inicio: ' + (startEl ? 'encontrado' : 'NO encontrado') + ' | Fin: ' + (endEl ? 'encontrado' : 'NO encontrado'));

    // ---------- Recorrido: texto, citas e imágenes en orden ----------
    const rank = nm => /xl/i.test(nm) ? 0 : /lg/i.test(nm) ? 1 : /md/i.test(nm) ? 2 : 3;
    const lazyAttr = el => [...el.attributes].filter(a => /^data-/i.test(a.name) && IMG_RE.test(a.value)).sort((a, b) => rank(a.name) - rank(b.name)).map(a => a.value)[0];
    const lastSrcset = s => { const p = (s || '').split(',').map(x => x.trim().split(/\s+/)[0]).filter(Boolean); return p[p.length - 1]; };
    const keyOf = s => s.split('?')[0].replace(/_(xs|sm|md|lg|xl)(\.\w+)$/i, '$2');
    // Nombre legible del archivo de la imagen (fallback cuando no hay alt/title)
    const nameFromSrc = src => {
      try {
        let name = decodeURIComponent((src || '').split(/[?#]/)[0].split('/').pop() || '');
        name = name.replace(/\.(jpe?g|png|webp|gif)$/i, '')
                   .replace(/_(xs|sm|md|lg|xl)$/i, '')
                   .replace(/[-_+]+/g, ' ')
                   .replace(/\s+/g, ' ')
                   .trim();
        if (!name || /^(img|image|photo|picture|media|asset|icon|logo|sprite|blank|placeholder|\d+)$/i.test(name)) return '';
        return name;
      } catch { return ''; }
    };
    // Recoger texto descriptivo de atributos de un elemento
    const attrsDesc = el => {
      if (!el || !el.getAttribute) return [];
      const out = [];
      const keys = ['alt', 'title', 'aria-label', 'aria-description', 'data-alt', 'data-title',
        'data-caption', 'data-description', 'data-img-caption', 'data-img-alt', 'data-label',
        'data-name', 'data-desc', 'longdesc'];
      for (const k of keys) {
        const v = clean(el.getAttribute(k) || (k === 'alt' ? el.alt : '') || (k === 'title' ? el.title : ''));
        if (v) out.push(v);
      }
      // Cualquier data-* que parezca descripción (texto largo, no URL)
      try {
        for (const a of el.attributes) {
          if (/^data-/i.test(a.name) && a.value && a.value.length > 15 && a.value.length < 400
              && !/^https?:\/\//i.test(a.value) && !IMG_RE.test(a.value) && !/^\d+$/.test(a.value)) {
            const v = clean(a.value);
            if (v && !LINE_JUNK.test(v)) out.push(v);
          }
        }
      } catch {}
      // aria-labelledby / aria-describedby
      for (const ref of ['aria-labelledby', 'aria-describedby']) {
        const ids = (el.getAttribute(ref) || '').split(/\s+/).filter(Boolean);
        for (const id of ids) {
          const refEl = (el.ownerDocument || document).getElementById(id);
          if (refEl) {
            const t = clean(refEl.textContent);
            if (t && t.length < 400) out.push(t);
          }
        }
      }
      return out;
    };
    // Mejor descripción posible de la imagen
    const imgDesc = (el, src, extra) => {
      const candidates = [];
      if (extra) { const t = clean(extra); if (t) candidates.push(t); }
      if (el) {
        candidates.push(...attrsDesc(el));
        // Subir 1-3 niveles: a veces el alt/aria está en el contenedor (picture, figure, div)
        let p = el.parentElement;
        for (let i = 0; i < 3 && p; i++, p = p.parentElement) {
          candidates.push(...attrsDesc(p));
          // figcaption dentro del contenedor
          const cap = p.querySelector && p.querySelector('figcaption, .caption, [class*="caption"], [class*="credit"]');
          if (cap) {
            const t = clean(cap.textContent);
            if (t && t.length > 2 && t.length < 400) candidates.push(t);
          }
        }
        // Hermano siguiente o anterior con texto de leyenda
        for (const sib of [el.nextElementSibling, el.previousElementSibling]) {
          if (sib && /^(FIGCAPTION|P|SPAN|DIV|SMALL|FIG|LABEL)$/i.test(sib.tagName)
              && (sib.textContent || '').length > 5 && (sib.textContent || '').length < 250) {
            const t = clean(sib.textContent);
            if (t && !LINE_JUNK.test(t)) candidates.push(t);
          }
        }
      }
      // Filtrar basura y elegir la más descriptiva (más larga, pero no absurda)
      const uniq = [...new Set(candidates.filter(t => t && t.length > 2 && !LINE_JUNK.test(t)
        && !/^(reproducir|descargar|compartir|ver más|leer más)$/i.test(t)))];
      let best = uniq.sort((a, b) => b.length - a.length)[0] || '';
      if (!best) best = nameFromSrc(src);
      return best || 'sin descripción';
    };

    function parse(nodes, base, o = {}) {
      const items = [], allC = [], seen = new Set();
      let buf = '', cites = [], k = 0, started = !o.startEl, done = false;
      const A = u => { try { return new URL(u, base).href; } catch { return u; } };
      const flush = (prefix = '') => {
        let t = clean(buf);
        if (o.nested) t = t.replace(/[+*]/g, '').replace(/\s+([,.;:!?”)])/g, '$1').replace(/\s{2,}/g, ' ').trim();
        if (LINE_JUNK.test(t)) t = '';
        if (t || cites.length) items.push({ t: t ? prefix + t : '', cites });
        buf = ''; cites = [];
      };
      const addImage = (src, desc) => {
        if (!src) return; src = A(src); const key = keyOf(src); if (seen.has(key)) return;
        seen.add(key); flush(); items.push({ img: { src, desc: desc || 'sin descripción' }, t: '', cites: [] });
      };
      const handleImg = im => {
        const src = lazyAttr(im) || lastSrcset(im.srcset) || im.currentSrc || im.src || '', w = im.naturalWidth || im.width || 0;
        if (src && !BAD_IMG.test(src) && (w === 0 || w >= 60)) addImage(src, imgDesc(im, src));
      };
      const walk = el => { for (const c of el.childNodes) { if (done) return; visit(c); } };
      function visit(c) {
        if (done) return;
        if (c.nodeType === 3) { if (started) buf += c.textContent; return; }
        if (c.nodeType !== 1 || c.id === PID) return;
        if (!started) { if (c === o.startEl) started = true; else if (c.contains(o.startEl)) walk(c); return; }
        const tag = c.tagName;
        if (SKIP.has(tag) || c.hidden || c.getAttribute('aria-hidden') === 'true' || (c.style && c.style.display === 'none')) return;
        if (JUNK_CLASS.test((c.id || '') + ' ' + (typeof c.className === 'string' ? c.className : ''))) return;
        let cs = {}; try { cs = getComputedStyle(c); } catch {}
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        if (/^H[1-6]$/.test(tag) && STOP.test(clean(c.textContent)) && (o.nested || !startEl)) { flush(); done = true; return; }
        if (tag === 'BR') { o.inline ? buf += ' ' : flush(); return; }
        if (tag === 'IMG') { handleImg(c); return; }
        if (tag === 'VIDEO' && c.poster) { addImage(c.poster, imgDesc(c, c.poster, 'póster de video')); return; }
        const ds = lazyAttr(c);
        if (ds && !BAD_IMG.test(ds)) addImage(ds, imgDesc(c, ds));
        const bg = cs.backgroundImage;
        if (bg && bg.startsWith('url(') && c.offsetWidth >= 60 && c.offsetHeight >= 60) {
          const bgSrc = bg.slice(4, -1).replace(/["']/g, '');
          addImage(bgSrc, imgDesc(c, bgSrc));
        }
        if (o.inline && /^v\d/.test(c.id || '')) buf += ' ';
        const href = tag === 'A' ? c.getAttribute('href') : null;
        if (href && !/^(javascript|mailto|tel):/i.test(href)) {
          if (IMG_RE.test(href)) {
            // Preferir alt del <img> interno si existe
            const nestedImg = c.querySelector('img');
            addImage(href, imgDesc(nestedImg || c, href, c.textContent));
            return;
          }
          const txt = clean(c.textContent), abs = href.startsWith('#') ? base.split('#')[0] + href : A(href);
          if (o.nested && /^\d+$/.test(txt) && c.closest('[id^="v"]')) return;
          if (!txt) return;
          const n = isNoise(txt, abs, o.self, o.nested, c);
          if (n) { if (!n.drop) buf += txt; return; }
          if (o.nested && !o.plain) {   // dentro de una cita: solo cuentan los enlaces entre paréntesis
            const par = buf.split('(').length > buf.split(')').length || txt.startsWith('(');
            if (cfg.vers === 'ninguna' || (cfg.vers === 'paren' && !par)) { omitted.push(`cita fuera de paréntesis: ${txt}`); buf += txt; return; }
          }
          if (!o.plain) {
            const id = o.idp ? `${o.idp}.${++k}` : `${++k}`, cite = { id, txt, href, url: A(href), doc: c.ownerDocument, res: null };
            buf += `${txt} [C${id}]`; cites.push(cite); allC.push(cite);
            c.querySelectorAll('img').forEach(handleImg); return;
          }
        }
        const blk = BLOCK.has(tag);
        if (blk) o.inline ? buf += ' ' : flush();
        walk(c);
        if (blk) o.inline ? buf += ' ' : flush(/^H[1-4]$/.test(tag) ? '## ' : '');
        if (c === o.endEl) { flush(); done = true; }
      }
      for (const n of nodes) { if (done) break; visit(n); }
      flush(); return { items, cites: allC };
    }

    // ---------- Citas ----------
    const cache = new Map(), diag = []; let budget = MAX, opened = 0;
    const book = (b, c, v) => String(b).padStart(2, '0') + String(c).padStart(3, '0') + String(v).padStart(3, '0');
    const top = els => els.filter(e => !els.some(o => o !== e && o.contains(e)));
    const getDoc = u => {
      const k = u.origin + u.pathname + u.search;
      if (!cache.has(k)) cache.set(k, (async () => { await acquire(); try {
        const raw = await (await fetch(k, { credentials: 'omit' })).text(); let h = raw;
        try { h = (JSON.parse(raw).items || []).map(i => i.content || '').join(' '); } catch {}
        return new DOMParser().parseFromString(tt(h), 'text/html');
      } finally { release(); } })());
      return cache.get(k);
    };
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
      return { nodes: [pickNested(d)] };
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
          if (++opened % 10 === 0) say(`Abriendo citas… ${opened} páginas`);
        }
        if (!nodes.length) { diag.push('sin texto: ' + c.url); return; }
        const q = new URL(c.url), sub = parse(nodes, c.url, { nested: true, inline, idp: c.id, plain: depth >= PROF, self: q.origin + q.pathname });
        if (!sub.items.length) { diag.push('vacía: ' + c.url); return; }
        c.res = sub.items;
        if (depth < PROF) await Promise.all(sub.cites.map(x => resolve(x, depth + 1, chain.concat(c.url))));
      } catch (e) { diag.push(`error ${e.message}: ${c.url}`); }
    }

    say('Leyendo texto principal…');
    let main = startEl ? parse([document.body], location.href, { startEl, endEl }) : null;
    if (!main || !main.items.length) { say('No encontré el INICIO; uso toda la zona del artículo.'); main = parse([pickRoot(document)], location.href, { endEl }); }
    say(`Texto leído (${main.cites.length} citas). Abriendo citas…`);
    await Promise.all(main.cites.map(c => resolve(c, 0, [])));

    // ---------- HTML con imágenes ----------
    const stats = { cites: 0, ok: 0, imgs: 0, list: [] };
    (function count(items) { for (const it of items) { if (it.img) { stats.imgs++; stats.list.push(it.img); if (it.img.desc && it.img.desc !== 'sin descripción') stats.withDesc = (stats.withDesc || 0) + 1; } for (const c of it.cites) { stats.cites++; if (c.res) { stats.ok++; count(c.res); } } } })(main.items);
    say(`Incrustando ${stats.imgs} imágenes (${stats.withDesc || 0} con descripción)…`);
    if (stats.list.length) console.log('Descripciones de imágenes:', stats.list.map((im, i) => `[${i + 1}] ${im.desc}`));
    let i = 0, embedded = 0;
    await Promise.all(Array.from({ length: 4 }, async () => { while (i < stats.list.length) { const im = stats.list[i++]; try {
      const b = await (await fetch(im.src)).blob();
      im.data = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(b); }); embedded++;
    } catch { im.data = im.src; } } }));
    const renderHtml = (items, ctr) => { let h = '';
      for (const it of items) {
        if (it.img) h += `<figure><img src="${esc(it.img.data || it.img.src)}"><figcaption>[IMAGEN ${++ctr.n}] ${esc(it.img.desc)}</figcaption></figure>`;
        else if (it.t.startsWith('## ')) h += `<h2>${esc(it.t.slice(3))}</h2>`;
        else if (it.t) h += `<p>${esc(it.t)}</p>`;
        for (const c of it.cites) h += `<div class="c"><b>[C${c.id}] ${esc(c.txt)}</b> ` + (c.res ? renderHtml(c.res, ctr) : `<a href="${esc(c.url)}">${esc(c.url)}</a>`) + '</div>';
      } return h; };
    const css = 'body{font:16px/1.6 Georgia,serif;max-width:800px;margin:2rem auto;padding:0 1rem;color:#222}h2{border-bottom:1px solid #ccc;margin-top:2rem}figure{margin:1rem 0}img{max-width:100%;border-radius:6px}figcaption{font-size:.85rem;color:#666}.c{margin:.4rem 0 1rem 1rem;padding:.4rem .8rem;border-left:3px solid #2a6ebb;background:#f3f7fc;font-size:.92rem}.c .c{background:#e8eff8;border-color:#7aa7d9}.c .c .c{background:#dde7f4}.c b{color:#2a6ebb}.c p{margin:.3rem 0}';
    const base = clean(document.title).replace(/[\\/:*?"<>|]/g, '').slice(0, 60) || 'reunion';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(base)}</title><style>${css}</style></head><body>${renderHtml(main.items, { n: 0 })}</body></html>`], { type: 'text/html;charset=utf-8' }));
    a.download = base + '.html'; document.body.appendChild(a); a.click(); a.remove();
    say(`Listo: ${stats.cites} citas (${stats.ok} con texto), ${stats.imgs} imágenes (${stats.withDesc || 0} con descripción, ${embedded} incrustadas)\nOmitidas por filtro: ${omitted.length} (ver consola)` + (diag.length ? `\nSin texto: ${diag.length} (ver consola)` : ''));
    if (omitted.length) console.log('Citas omitidas:\n' + omitted.join('\n'));
    if (diag.length) console.log('Citas sin texto:', diag.slice(0, 20));
  }
})();
