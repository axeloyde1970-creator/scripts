(function () {
  'use strict';

  if (window.PanelManager) {
    console.warn('PanelManager ya está cargado.');
    return;
  }

  var VERSION = 'v2.0';
  var LOGO_IMG_SRC =
    'https://media.base44.com/images/public/6a74e6769a6a0e9289b3f60a/2daa69177_file_0000000035c0820e85da145bf27cd11f.png';

  // CSS global del panel (una sola inyección)
  var pmStyle = document.createElement('style');
  pmStyle.id = 'pm-styles';
  pmStyle.textContent =
    '#pm-master-panel{' +
      'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:2147483647;' +
      'width:min(360px,calc(100vw - 20px));max-height:calc(100vh - 24px);' +
      'background:rgba(10,10,11,.82);color:#e7e7ea;' +
      "font:13px/1.4 'Inter',system-ui,-apple-system,Segoe UI,Roboto,sans-serif;" +
      'border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:0;' +
      'box-shadow:0 10px 40px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.02) inset;' +
      'backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);user-select:none;' +
      'touch-action:none;overflow:hidden;' +
      'animation:pm-open .18s ease-out;' +
    '}' +
    '#pm-master-panel.pm-minimizing{animation:pm-close .18s ease-in forwards;}' +
    '@keyframes pm-open{from{opacity:0;transform:translateX(-50%) scale(.96);}to{opacity:1;transform:translateX(-50%) scale(1);}}' +
    '@keyframes pm-close{from{opacity:1;transform:translateX(-50%) scale(1);}to{opacity:0;transform:translateX(-50%) scale(.94);}}' +
    '#pm-header{' +
      'display:flex;align-items:center;gap:8px;' +
      'padding:6px 10px;cursor:grab;background:rgba(255,255,255,.03);' +
      'border-bottom:1px solid rgba(255,255,255,.06);' +
    '}' +
    '#pm-header:active{cursor:grabbing;}' +
    '#pm-logo-wrap{width:26px;height:26px;display:flex;align-items:center;justify-content:center;' +
      'border-radius:7px;overflow:hidden;flex-shrink:0;box-shadow:0 0 8px rgba(76,201,240,.15);}' +
    '#pm-logo-wrap img{width:22px;height:22px;display:block;border-radius:5px;}' +
    '#pm-title{font-weight:600;font-size:13.5px;letter-spacing:-.02em;color:#f4f4f6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '#pm-status{display:flex;align-items:center;gap:5px;margin-left:auto;font-size:10px;font-weight:600;' +
      'letter-spacing:.06em;color:#4cc9f0;text-transform:uppercase;}' +
    '#pm-status .dot{width:7px;height:7px;border-radius:50%;background:#4cc9f0;' +
      'box-shadow:0 0 6px 1px rgba(76,201,240,.65);}' +
    '#pm-min-btn{' +
      'width:24px;height:24px;display:flex;align-items:center;justify-content:center;' +
      'background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:6px;' +
      'color:#b8b8c0;font-size:14px;line-height:1;cursor:pointer;transition:150ms ease;' +
      'flex-shrink:0;' +
    '}' +
    '#pm-min-btn:hover{background:rgba(76,201,240,.12);border-color:rgba(76,201,240,.35);color:#4cc9f0;}' +
    '#pm-min-btn:active{transform:scale(.92);}' +
    '#pm-min-btn:focus-visible{outline:2px solid rgba(76,201,240,.5);outline-offset:1px;}' +
    '#pm-body{padding:8px 10px 6px;display:flex;flex-direction:column;gap:6px;max-height:calc(100vh - 80px);overflow-y:auto;}' +
    '#pm-body::-webkit-scrollbar{width:6px;}' +
    '#pm-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.08);border-radius:3px;}' +
    '.pm-section{font-size:9.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;' +
      'color:#6b6b75;padding:8px 2px 2px;}' +
    '.pm-sep{height:1px;background:rgba(255,255,255,.06);margin:2px 0;}' +
    '.pm-row{display:flex;align-items:center;gap:8px;min-height:42px;padding:6px 8px;' +
      'border-radius:9px;transition:background 150ms ease;}' +
    '.pm-row:hover{background:rgba(255,255,255,.035);}' +
    '.pm-row .ico{font-size:14px;flex-shrink:0;}' +
    '.pm-row .name{flex:1;font-size:12.5px;font-weight:500;color:#d4d4dc;' +
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}' +
    '.pm-switch{position:relative;width:34px;height:20px;flex-shrink:0;}' +
    '.pm-switch input{position:absolute;opacity:0;width:100%;height:100%;margin:0;cursor:pointer;z-index:2;}' +
    '.pm-switch .track{position:absolute;inset:0;background:rgba(255,255,255,.1);' +
      'border:1px solid rgba(255,255,255,.06);border-radius:11px;transition:180ms ease;}' +
    '.pm-switch .thumb{position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;' +
      'background:#9a9aa3;transition:180ms ease;}' +
    '.pm-switch input:checked ~ .track{background:rgba(76,201,240,.22);border-color:rgba(76,201,240,.45);}' +
    '.pm-switch input:checked ~ .thumb{left:16px;background:#4cc9f0;box-shadow:0 0 6px rgba(76,201,240,.6);}' +
    '.pm-switch input:active ~ .thumb{transform:scale(.9);}' +
    '#pm-footer{padding:6px 10px 8px;border-top:1px solid rgba(255,255,255,.06);' +
      'font-size:10px;font-weight:500;color:#6b6b75;letter-spacing:.04em;text-align:center;}' +
    '#pm-footer b{color:#7d7d88;font-weight:600;}' +
    '#pm-mini{' +
      'position:fixed;top:12px;right:14px;z-index:2147483647;width:48px;height:48px;' +
      'border-radius:12px;background:rgba(10,10,11,.85);border:1px solid rgba(255,255,255,.1);' +
      'box-shadow:0 8px 24px rgba(0,0,0,.5),0 0 0 1px rgba(255,255,255,.02) inset,' +
      '0 0 14px rgba(76,201,240,.18);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);' +
      'display:flex;align-items:center;justify-content:center;cursor:grab;touch-action:none;' +
      'animation:pm-open .18s ease-out;' +
    '}' +
    '#pm-mini:active{cursor:grabbing;}' +
    '#pm-mini img{width:30px;height:30px;border-radius:7px;display:block;}' +
    '#pm-mini .mini-dot{position:absolute;top:4px;right:4px;width:8px;height:8px;border-radius:50%;' +
      'background:#4cc9f0;box-shadow:0 0 6px 1px rgba(76,201,240,.7);}' +
    '@media (max-width:420px){#pm-master-panel{font-size:12.5px;}}';
  document.head.appendChild(pmStyle);

  function moduleRow(id, icon, name) {
    return '<label class="pm-row">' +
      '<span class="ico">' + icon + '</span>' +
      '<span class="name">' + name + '</span>' +
      '<span class="pm-switch"><input type="checkbox" id="' + id + '"><span class="track"></span><span class="thumb"></span></span>' +
    '</label>';
  }

  // ============================================================
  // PANEL MAESTRO FLOTANTE Y ARRASTRABLE
  // ============================================================

  var masterPanel = document.createElement('div');
  masterPanel.id = 'pm-master-panel';
  masterPanel.innerHTML =
    '<div id="pm-header">' +
    '<span id="pm-logo-wrap"><img src="' + LOGO_IMG_SRC + '" id="pm-logo"></span>' +
    '<span id="pm-title">Panel Manager</span>' +
    '<span id="pm-status"><span class="dot"></span>Active</span>' +
    '<button id="pm-min-btn" title="Minimizar">–</button>' +
    '</div>' +
    '<div id="pm-body">' +
    '<div class="pm-section">Tools</div>' +
    moduleRow('pm-cb-barwatcher', '📊', 'Auto Barras') +
    moduleRow('pm-cb-autopenales', '⚽', 'Auto Penales') +
    moduleRow('pm-cb-esquivar', '🏃', 'Esquivar Defensas') +
    moduleRow('pm-cb-pelotafranja', '🎯', 'Bot Pelota-Franja') +
    '<div class="pm-sep"></div>' +
    '<div class="pm-section">Games</div>' +
    moduleRow('pm-cb-simonspy', '🎯', 'Simon Spy v3') +
    moduleRow('pm-cb-4enraya', '🔵', '4 en Raya') +
    moduleRow('pm-cb-memogrid', '🧠', 'Memo Grid') +
    '</div>' +
    '<div id="pm-footer">Kernel Corp. · <b>' + VERSION + '</b></div>';

  var miniBtn = document.createElement('div');
  miniBtn.id = 'pm-mini';
  miniBtn.style.display = 'none';
  miniBtn.innerHTML = '<img src="' + LOGO_IMG_SRC + '"><span class="mini-dot"></span>';

  document.body.appendChild(masterPanel);
  document.body.appendChild(miniBtn);

  var pmHeader = masterPanel.querySelector('#pm-header');
  var pmBody = masterPanel.querySelector('#pm-body');
  var pmToggleMin = masterPanel.querySelector('#pm-min-btn');
  var pmLogo = masterPanel.querySelector('#pm-logo');
  var cbBarWatcher = masterPanel.querySelector('#pm-cb-barwatcher');
  var cbAutoPenales = masterPanel.querySelector('#pm-cb-autopenales');
  var cbSimonSpy = masterPanel.querySelector('#pm-cb-simonspy');
  var cbEsquivar = masterPanel.querySelector('#pm-cb-esquivar');
  var cb4EnRaya = masterPanel.querySelector('#pm-cb-4enraya');
  var cbPelotaFranja = masterPanel.querySelector('#pm-cb-pelotafranja');
  var cbMemoGrid = masterPanel.querySelector('#pm-cb-memogrid');

  var minimized = false;
  function applyMin() {
    if (minimized) {
      masterPanel.classList.add('pm-minimizing');
      setTimeout(function () {
        masterPanel.style.display = 'none';
        masterPanel.classList.remove('pm-minimizing');
        miniBtn.style.display = 'flex';
      }, 170);
    } else {
      miniBtn.style.display = 'none';
      masterPanel.style.display = '';
      // re-dispara animación de apertura
      masterPanel.style.animation = 'none';
      void masterPanel.offsetWidth;
      masterPanel.style.animation = '';
    }
  }
  function toggleMin() {
    minimized = !minimized;
    applyMin();
  }
  pmToggleMin.addEventListener('click', function (ev) {
    ev.stopPropagation();
    toggleMin();
  });
  miniBtn.addEventListener('click', function () {
    if (minimized) toggleMin();
  });

  // Arrastre del panel maestro + mini
  (function makeDraggable(el, handle) {
    var dragging = false, offsetX = 0, offsetY = 0;
    function start(clientX, clientY) {
      dragging = true;
      var rect = el.getBoundingClientRect();
      offsetX = clientX - rect.left;
      offsetY = clientY - rect.top;
      // el ancla centrado del panel vive en translateX(-50%); al arrastrar pasamos a ancla top/left
      el.style.left = rect.left + 'px';
      el.style.top = rect.top + 'px';
      el.style.transform = 'none';
    }
    function move(clientX, clientY) {
      if (!dragging) return;
      el.style.left = (clientX - offsetX) + 'px';
      el.style.top = (clientY - offsetY) + 'px';
    }
    function end() { dragging = false; }
    handle.addEventListener('mousedown', function (ev) { start(ev.clientX, ev.clientY); });
    document.addEventListener('mousemove', function (ev) { if (dragging) move(ev.clientX, ev.clientY); });
    document.addEventListener('mouseup', end);
    handle.addEventListener('touchstart', function (ev) {
      var t = ev.touches[0]; start(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchmove', function (ev) {
      if (!dragging) return;
      var t = ev.touches[0]; move(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchend', end);
  })(masterPanel, pmHeader);

  (function makeMiniDraggable() {
    var dragging = false, moved = false, offsetX = 0, offsetY = 0;
    function start(clientX, clientY) { dragging = true; moved = false;
      var rect = miniBtn.getBoundingClientRect(); offsetX = clientX - rect.left; offsetY = clientY - rect.top; }
    function move(clientX, clientY) {
      if (!dragging) return; moved = true;
      miniBtn.style.left = (clientX - offsetX) + 'px';
      miniBtn.style.top = (clientY - offsetY) + 'px';
      miniBtn.style.right = 'auto';
    }
    function end() {
      dragging = false;
      // si no hubo movimiento real, restaurar como clic
      setTimeout(function () { moved = false; }, 50);
    }
    miniBtn.addEventListener('mousedown', function (ev) { start(ev.clientX, ev.clientY); ev.stopPropagation(); });
    document.addEventListener('mousemove', function (ev) { if (dragging) move(ev.clientX, ev.clientY); });
    document.addEventListener('mouseup', end);
    miniBtn.addEventListener('touchstart', function (ev) {
      var t = ev.touches[0]; start(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchmove', function (ev) {
      if (!dragging) return;
      var t = ev.touches[0]; move(t.clientX, t.clientY); ev.preventDefault();
    }, { passive: false });
    document.addEventListener('touchend', end);
    // clic real sólo si no se arrastró
    miniBtn.addEventListener('click', function (ev) {
      if (moved) { ev.stopPropagation(); ev.preventDefault(); return; }
      if (minimized) toggleMin();
    });
  })();

  // ============================================================
  // MÓDULO 1: AUTO BARRAS
  // ============================================================

  var modulesBarWatcher = (function () {
    var started = false;
    var timer = null;
    var inside = false;

    function findZone1() {
      return Array.from(document.querySelectorAll('div')).find(function (el) {
        return typeof el.className === 'string' &&
          el.className.includes('border-accent-lime') &&
          el.className.includes('bg-accent-lime');
      });
    }
    function findBar1(container) {
      return Array.from(container.children).find(function (el) {
        return typeof el.className === 'string' && el.className.includes('bg-sky-300');
      });
    }
    function findZone2() {
      return Array.from(document.querySelectorAll('div')).find(function (el) {
        return typeof el.className === 'string' &&
          el.className.includes('absolute') &&
          el.className.includes('inset-y-0.5') &&
          el.className.includes('rounded-full') &&
          typeof el.getAttribute('style') === 'string' &&
          el.getAttribute('style').includes('linear-gradient');
      });
    }
    function findBar2(container) {
      return Array.from(container.children).find(function (el) {
        return typeof el.className === 'string' &&
          el.className.includes('bg-white') &&
          el.className.includes('will-change-transform');
      });
    }
    function getBarX(bar) {
      var t = bar.style.transform || window.getComputedStyle(bar).transform;
      var m = t.match(/translate3d\(([-\d.]+)px/) ||
        t.match(/matrix\([^,]+,[^,]+,[^,]+,[^,]+,\s*([-\d.]+)/);
      return m ? parseFloat(m[1]) : 0;
    }
    function getZoneRangePx(zone, container) {
      var cw = container.clientWidth;
      var left = parseFloat(zone.style.left) / 100 * cw;
      var width = parseFloat(zone.style.width) / 100 * cw;
      return { start: left, end: left + width };
    }
    function findBoton(texto) {
      return Array.from(document.querySelectorAll('button'))
        .find(function (b) { return b.textContent.trim().toUpperCase().includes(texto.toUpperCase()); });
    }
    function clickBoton(boton) {
      if (!boton) return;
      var rect = boton.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var opts = { bubbles: true, cancelable: true, clientX: cx, clientY: cy, pointerId: 1, isPrimary: true };
      boton.focus();
      boton.dispatchEvent(new PointerEvent('pointerdown', opts));
      boton.dispatchEvent(new MouseEvent('mousedown', opts));
      boton.dispatchEvent(new PointerEvent('pointerup', opts));
      boton.dispatchEvent(new MouseEvent('mouseup', opts));
      boton.dispatchEvent(new MouseEvent('click', opts));
      boton.click();
    }

    function start() {
      if (started) return;
      started = true;
      inside = false;
      timer = setInterval(function () {
        var zone = findZone1();
        var bar = null;
        var botonTexto = null;
        var containerUsado = null;

        if (zone) {
          var container = zone.parentElement;
          bar = findBar1(container);
          if (bar) { botonTexto = 'PARAR'; containerUsado = container; }
          else zone = null;
        }
        if (!zone) {
          zone = findZone2();
          if (zone) {
            var container2 = zone.parentElement;
            bar = findBar2(container2);
            if (bar) { botonTexto = 'Frenar'; containerUsado = container2; }
            else zone = null;
          }
        }
        if (!zone || !bar) return;
        var x = getBarX(bar);
        var range = getZoneRangePx(zone, containerUsado);
        var nowInside = x >= range.start && x <= range.end;
        if (nowInside && !inside) {
          var boton = findBoton(botonTexto);
          clickBoton(boton);
        }
        inside = nowInside;
      }, 30);
      console.log('Auto Barras iniciado.');
    }

    function stop() {
      if (!started) return;
      started = false;
      if (timer) { clearInterval(timer); timer = null; }
      console.log('Auto Barras detenido.');
    }

    return { start: start, stop: stop };
  })();

  // ============================================================
  // MÓDULO 2: AUTO PENALES
  // ============================================================

  var modulesAutoPenales = (function () {
    var started = false;
    var loop = null;

    function tick() {
      var field = document.querySelector('.relative.w-full.overflow-hidden.rounded-t-lg.border-x-4.border-t-4');
      if (!field) return;
      var keeper = field.querySelector('.elidolo-mueve');
      if (!keeper) return;
      var left = parseFloat(keeper.style.left);
      if (isNaN(left)) return;
      var botones = field.querySelectorAll('button');
      if (botones.length < 4) return;
      var objetivo;
      if (left < 50) objetivo = Math.random() < 0.5 ? 1 : 3;
      else objetivo = Math.random() < 0.5 ? 0 : 2;
      botones[objetivo].click();
    }

    function start() {
      if (started) return;
      started = true;
      loop = setInterval(tick, 30);
      console.log('Auto Penales iniciado.');
    }

    function stop() {
      if (!started) return;
      started = false;
      if (loop) { clearInterval(loop); loop = null; }
      console.log('Auto Penales detenido.');
    }

    return { start: start, stop: stop };
  })();

  // ============================================================
  // MÓDULO 3: SIMON SPY v3
  // ============================================================

  var modulesSimonSpy = (function () {
    var started = false;
    var panel = null;
    var styleTag = null;
    var winListeners = [];

    function start() {
      if (started) return;
      started = true;

      var CONFIG = {
        ariaPattern: /celda\s*(\d+)/i,
        scaleThreshold: 1.015,
        useBoxShadow: true,
        useBackgroundColor: true,
        useBorderColor: true,
        massToggleWindowMs: 20,
        watchdogIntervalMs: 500,
        debug: true
      };

      var state = {
        calibrating: false,
        cells: [],
        history: [],
        nextNumber: 1,
        running: false
      };

      var pendingActivations = [];
      var massToggleTimer = null;
      var watchdogTimer = null;

      function parseScale(transformStr) {
        if (!transformStr || transformStr === 'none') return 1;
        var m2d = transformStr.match(/^matrix\(([^)]+)\)$/);
        if (m2d) {
          var p2 = m2d[1].split(',').map(parseFloat);
          return Math.sqrt(p2[0] * p2[0] + p2[1] * p2[1]);
        }
        var m3d = transformStr.match(/^matrix3d\(([^)]+)\)$/);
        if (m3d) {
          var p3 = m3d[1].split(',').map(parseFloat);
          return Math.sqrt(p3[0] * p3[0] + p3[1] * p3[1]);
        }
        return 1;
      }

      function isLit(cell) {
        var cs = getComputedStyle(cell.el);
        var scale = parseScale(cs.transform);
        if (scale > CONFIG.scaleThreshold) return true;
        if (CONFIG.useBoxShadow && cs.boxShadow && cs.boxShadow !== 'none') return true;
        if (CONFIG.useBackgroundColor && cell.restBackground &&
          cs.backgroundColor !== cell.restBackground) return true;
        if (CONFIG.useBorderColor && cell.restBorderColor &&
          cs.borderColor !== cell.restBorderColor) return true;
        return false;
      }

      function closestReasonableTarget(el) {
        var node = el, attempts = 0;
        while (node && attempts < 4) {
          var rect = node.getBoundingClientRect();
          if (rect.width > 15 && rect.height > 15) return node;
          node = node.parentElement;
          attempts++;
        }
        return el;
      }

      function autoDetectByAriaLabel() {
        var candidates = Array.prototype.slice.call(document.querySelectorAll('[aria-label]'));
        var matched = [];
        candidates.forEach(function (el) {
          var label = el.getAttribute('aria-label') || '';
          var m = label.match(CONFIG.ariaPattern);
          if (m) matched.push({ el: el, num: parseInt(m[1], 10), label: label });
        });
        matched.sort(function (a, b) { return a.num - b.num; });
        return matched;
      }

      panel = document.createElement('div');
      panel.id = 'simon-spy-panel';
      panel.style.cssText =
        'position:fixed;top:8px;right:8px;z-index:2147483646;' +
        'background:#0a0a0a;color:#fff;font:12px monospace;' +
        'border:2px solid #555;border-radius:8px;padding:8px;' +
        'width:220px;box-shadow:0 4px 12px rgba(0,0,0,.5);';
      panel.innerHTML =
        '<div style="font-weight:bold;margin-bottom:6px;">🎯 Simon Spy v3</div>' +
        '<div id="ss-status" style="margin-bottom:6px;color:#aaa;">Buscando celdas...</div>' +
        '<div style="display:flex;gap:4px;margin-bottom:4px;">' +
        '<button id="ss-calibrate" style="flex:1;">Calibrar</button>' +
        '<button id="ss-finish" style="flex:1;" disabled>Listo</button>' +
        '</div>' +
        '<div style="display:flex;gap:4px;margin-bottom:6px;">' +
        '<button id="ss-start" style="flex:1;" disabled>▶ Iniciar</button>' +
        '<button id="ss-stop" style="flex:1;" disabled>⏸ Parar</button>' +
        '</div>' +
        '<div style="display:flex;gap:4px;margin-bottom:6px;">' +
        '<button id="ss-undo" style="flex:1;">↶ Undo</button>' +
        '<button id="ss-reset" style="flex:1;">Reset</button>' +
        '</div>' +
        '<div id="ss-log" style="max-height:120px;overflow:auto;background:#111;padding:4px;border-radius:4px;">' +
        '<em style="color:#666;">Secuencia vacía</em>' +
        '</div>';
      document.body.appendChild(panel);

      styleTag = document.createElement('style');
      styleTag.id = 'simon-spy-styles';
      styleTag.textContent =
        '#simon-spy-panel button{background:#1c1c1c;color:#fff;border:1px solid #555;' +
        'border-radius:5px;padding:5px 2px;font:11px monospace;cursor:pointer;}' +
        '#simon-spy-panel button:disabled{opacity:.4;cursor:default;}' +
        '.ss-badge{position:absolute;min-width:18px;height:18px;padding:0 3px;' +
        'background:#e63946;color:#fff;font:bold 12px sans-serif;border-radius:9px;' +
        'display:flex;align-items:center;justify-content:center;pointer-events:none;' +
        'z-index:2147483647;box-shadow:0 0 4px rgba(0,0,0,.6);}' +
        '.ss-marker{outline:2px dashed #4cc9f0 !important;outline-offset:-2px;}';
      document.head.appendChild(styleTag);

      var elStatus = panel.querySelector('#ss-status');
      var elLog = panel.querySelector('#ss-log');
      var btnCalibrate = panel.querySelector('#ss-calibrate');
      var btnFinish = panel.querySelector('#ss-finish');
      var btnStart = panel.querySelector('#ss-start');
      var btnStop = panel.querySelector('#ss-stop');
      var btnUndo = panel.querySelector('#ss-undo');
      var btnReset = panel.querySelector('#ss-reset');

      function registerCell(el, ariaLabel) {
        if (state.cells.some(function (c) { return c.el === el; })) return;
        el.classList.add('ss-marker');
        var badge = document.createElement('div');
        badge.className = 'ss-badge';
        document.body.appendChild(badge);
        positionBadge(el, badge);
        var cell = {
          el: el,
          originalAriaLabel: ariaLabel || null,
          restBackground: getComputedStyle(el).backgroundColor,
          restBorderColor: getComputedStyle(el).borderColor,
          badge: badge,
          active: false,
          observer: null
        };
        var index = state.cells.length;
        state.cells.push(cell);
        attachObserver(cell, index);
      }

      function positionBadge(el, badge) {
        var rect = el.getBoundingClientRect();
        badge.style.left = (rect.left + window.scrollX + 4) + 'px';
        badge.style.top = (rect.top + window.scrollY + 4) + 'px';
      }

      function updateStatus() {
        elStatus.textContent = state.calibrating
          ? 'Calibrando: tocá cada casilla (' + state.cells.length + '/16)'
          : (state.cells.length + ' casillas registradas');
      }

      function onCalibrationPointer(ev) {
        if (!state.calibrating) return;
        if (panel.contains(ev.target)) return;
        ev.preventDefault();
        ev.stopPropagation();
        var target = closestReasonableTarget(ev.target);
        registerCell(target, target.getAttribute && target.getAttribute('aria-label'));
        updateStatus();
        if (state.cells.length >= 16) stopCalibration();
      }

      function startCalibration() {
        state.calibrating = true;
        state.cells.forEach(function (c) {
          c.el.classList.remove('ss-marker');
          c.badge.remove();
          if (c.observer) c.observer.disconnect();
        });
        state.cells = [];
        updateStatus();
        btnFinish.disabled = false;
        btnStart.disabled = true;
        document.addEventListener('pointerdown', onCalibrationPointer, true);
      }

      function stopCalibration() {
        state.calibrating = false;
        document.removeEventListener('pointerdown', onCalibrationPointer, true);
        btnFinish.disabled = true;
        btnStart.disabled = state.cells.length === 0;
        updateStatus();
      }

      function tryAutoDetect() {
        var found = autoDetectByAriaLabel();
        if (found.length >= 4) {
          found.forEach(function (f) { registerCell(f.el, f.label); });
          elStatus.textContent = found.length + ' casillas detectadas automáticamente (aria-label)';
          btnStart.disabled = false;
        } else {
          elStatus.textContent = 'Sin calibrar (0/16 casillas) — usá "Calibrar"';
        }
      }

      function attachObserver(cell, index) {
        if (cell.observer) cell.observer.disconnect();
        var obs = new MutationObserver(function () { evaluateCell(cell, index); });
        obs.observe(cell.el, { attributes: true, attributeFilter: ['style', 'class'], subtree: false });
        cell.observer = obs;
      }

      function evaluateCell(cell, index) {
        var lit = isLit(cell);
        if (lit && !cell.active) {
          cell.active = true;
          if (state.running) handleActivation(index);
        } else if (!lit && cell.active) {
          cell.active = false;
        }
      }

      function handleActivation(index) {
        pendingActivations.push(index);
        if (massToggleTimer) clearTimeout(massToggleTimer);
        massToggleTimer = setTimeout(flushActivations, CONFIG.massToggleWindowMs);
      }

      function flushActivations() {
        var batch = pendingActivations;
        pendingActivations = [];
        massToggleTimer = null;
        if (batch.length > 1) return;
        onCellLit(batch[0]);
      }

      function onCellLit(cellIndex) {
        var num = state.nextNumber++;
        state.history.push(cellIndex);
        state.cells[cellIndex].badge.textContent = num;
        renderLog();
      }

      function renderLog() {
        elLog.innerHTML = state.history.length === 0
          ? '<em style="color:#666;">Secuencia vacía</em>'
          : state.history.map(function (_, i) { return i + 1; }).join(' → ');
      }

      function watchdogTick() {
        state.cells.forEach(function (cell, index) {
          if (cell.el.isConnected) return;
          if (!cell.originalAriaLabel) return;
          var replacement = document.querySelector('[aria-label="' + cell.originalAriaLabel + '"]');
          if (replacement && replacement !== cell.el) {
            cell.el = replacement;
            cell.active = false;
            cell.restBackground = getComputedStyle(replacement).backgroundColor;
            cell.restBorderColor = getComputedStyle(replacement).borderColor;
            replacement.classList.add('ss-marker');
            positionBadge(replacement, cell.badge);
            attachObserver(cell, index);
          }
        });
      }

      function startDetection() {
        if (state.running) return;
        state.running = true;
        btnStart.disabled = true;
        btnStop.disabled = false;
        btnCalibrate.disabled = true;
        watchdogTimer = setInterval(watchdogTick, CONFIG.watchdogIntervalMs);
      }

      function stopDetection() {
        state.running = false;
        btnStart.disabled = state.cells.length === 0;
        btnStop.disabled = true;
        btnCalibrate.disabled = false;
        clearInterval(watchdogTimer);
        if (massToggleTimer) { clearTimeout(massToggleTimer); massToggleTimer = null; }
        pendingActivations = [];
      }

      function undo() {
        if (state.history.length === 0) return;
        var lastIndex = state.history.pop();
        state.nextNumber--;
        var cell = state.cells[lastIndex];
        cell.badge.textContent = '';
        cell.active = false;
        renderLog();
      }

      function reset() {
        state.history = [];
        state.nextNumber = 1;
        state.cells.forEach(function (c) {
          c.badge.textContent = '';
          c.active = isLit(c);
        });
        renderLog();
      }

      var _ssScroll = function () { state.cells.forEach(function (c) { positionBadge(c.el, c.badge); }); };
      var _ssResize = function () { state.cells.forEach(function (c) { positionBadge(c.el, c.badge); }); };

      window.addEventListener('scroll', _ssScroll, true);
      window.addEventListener('resize', _ssResize);
      winListeners.push(
        { type: 'scroll', fn: _ssScroll, capture: true },
        { type: 'resize', fn: _ssResize }
      );

      btnCalibrate.addEventListener('click', startCalibration);
      btnFinish.addEventListener('click', stopCalibration);
      btnStart.addEventListener('click', startDetection);
      btnStop.addEventListener('click', stopDetection);
      btnUndo.addEventListener('click', undo);
      btnReset.addEventListener('click', reset);

      tryAutoDetect();
      console.log('Simon Spy v3 cargado.');
    }

    function stop() {
      if (!started) return;
      started = false;
      if (panel) { panel.remove(); panel = null; }
      if (styleTag) { styleTag.remove(); styleTag = null; }
      winListeners.forEach(function (l) { window.removeEventListener(l.type, l.fn, l.capture || false); });
      winListeners = [];
      document.querySelectorAll('.ss-marker').forEach(function (el) { el.classList.remove('ss-marker'); });
      document.querySelectorAll('.ss-badge').forEach(function (el) { el.remove(); });
      console.log('Simon Spy detenido.');
    }

    return { start: start, stop: stop };
  })();

  // ============================================================
  // MÓDULO 4: ESQUIVAR DEFENSAS (v2)
  // ============================================================

  var modulesEsquivar = (function () {
    var running = false;
    var rafId = null;
    var observer = null;
    var cancha = null;
    var botones = null;
    var UMBRAL_PELIGRO = 45; // % de la cancha; bajalo si reacciona tarde, subilo si es nervioso

    function findCancha() {
      var nodes = document.querySelectorAll('[style*="repeating-linear-gradient"]');
      return nodes.length ? nodes[0] : null;
    }

    function leerEstado(cancha, alturaCancha) {
      var miDiv = cancha.querySelector('.absolute.bottom-2 .elidolo-mueve');
      var miCarril = null;
      if (miDiv) {
        var t = miDiv.style.transform || '';
        var m = t.match(/translate3d\((\d+)%/);
        if (m) miCarril = Math.round(Number(m[1]) / 100);
      }

      var ocupados = new Set();
      cancha.querySelectorAll('.elidolo-mueve.top-0, .elidolo-mueve.absolute.top-0').forEach(function (el) {
        var style = el.getAttribute('style') || '';
        if (!/opacity:\s*1/.test(style)) return;

        var yMatch = style.match(/translate3d\(0px,\s*([\d.]+)(px|cqh)/);
        if (!yMatch) return;
        var val = Number(yMatch[1]);
        var unidad = yMatch[2];
        var yPct = unidad === 'px' ? (val / alturaCancha) * 100 : val;
        if (yPct < UMBRAL_PELIGRO) return;

        var leftMatch = style.match(/left:\s*([\d.]+)%/);
        if (!leftMatch) return;
        var carril = Math.round(Number(leftMatch[1]) / 33.3333);
        ocupados.add(carril);
      });

      return { miCarril: miCarril, ocupados: ocupados };
    }

    function elegirCarril(miCarril, ocupados) {
      if (!ocupados.has(miCarril)) return miCarril;
      var orden = miCarril === 0 ? [1, 2] : miCarril === 2 ? [1, 0] : [0, 2];
      for (var i = 0; i < orden.length; i++) {
        if (!ocupados.has(orden[i])) return orden[i];
      }
      return miCarril;
    }

    function moverA(boton) {
      var rect = boton.getBoundingClientRect();
      var x = rect.left + rect.width / 2;
      var y = rect.top + rect.height / 2;
      var opts = { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' };
      boton.dispatchEvent(new PointerEvent('pointerdown', opts));
      boton.dispatchEvent(new MouseEvent('mousedown', opts));
      boton.dispatchEvent(new PointerEvent('pointerup', opts));
      boton.dispatchEvent(new MouseEvent('mouseup', opts));
      boton.dispatchEvent(new MouseEvent('click', opts));
    }

    function refrescarReferencias() {
      cancha = findCancha();
      botones = cancha ? cancha.querySelectorAll('button') : null;
    }

    function loop() {
      if (!running) return;

      if (!cancha || !document.body.contains(cancha) || !botones || botones.length < 3) {
        refrescarReferencias();
      }

      if (cancha && botones && botones.length >= 3) {
        var altura = cancha.getBoundingClientRect().height;
        var estado = leerEstado(cancha, altura);
        if (estado.miCarril !== null) {
          var target = elegirCarril(estado.miCarril, estado.ocupados);
          if (target !== estado.miCarril) {
            moverA(botones[target]);
          }
        }
      }
      rafId = requestAnimationFrame(loop);
    }

    function start() {
      if (running) return;
      running = true;
      refrescarReferencias();
      rafId = requestAnimationFrame(loop);
      console.log('%c Esquivar Defensas iniciado ', 'background:#0a0a0a;color:#4cc9f0;padding:2px 6px;border-radius:4px;');

      if (!cancha) {
        console.log('Esperando a que arranque la partida...');
        observer = new MutationObserver(function () {
          var c = findCancha();
          if (c) { observer.disconnect(); observer = null; refrescarReferencias(); }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }

    function stop() {
      running = false;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      if (observer) { observer.disconnect(); observer = null; }
      cancha = null;
      botones = null;
      console.log('Esquivar Defensas detenido.');
    }

    return { start: start, stop: stop };
  })();

  // ============================================================
  // MÓDULO 5: 4 EN RAYA (Asistente)
  // ============================================================

  var modules4EnRaya = (function () {
    var started = false;
    var scanTimer = null;
    var lastBoardKey = null;

    var MY_SYMBOL = '✖';
    var TIME_BUDGET_MS = 900;
    var CELL_SELECTOR = '.grid.aspect-square.place-items-center.rounded-lg.border.text-xl.font-black.transition';
    var SIZE = 5;
    var WIN_LEN = 4;

    function readCells() {
      return Array.prototype.slice.call(document.querySelectorAll(CELL_SELECTOR));
    }
    function cellValue(btn) {
      var txt = (btn.textContent || '').trim();
      if (!txt) return 0;
      return txt === MY_SYMBOL ? 1 : 2;
    }
    function boardFromDOM(cells) {
      var b = new Array(SIZE * SIZE).fill(0);
      for (var i = 0; i < cells.length && i < b.length; i++) b[i] = cellValue(cells[i]);
      return b;
    }

    var LINES = (function () {
      var lines = [];
      function idx(r, c) { return r * SIZE + c; }
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          if (c + WIN_LEN <= SIZE) {
            var l = []; for (var k = 0; k < WIN_LEN; k++) l.push(idx(r, c + k));
            lines.push(l);
          }
          if (r + WIN_LEN <= SIZE) {
            var l2 = []; for (var k2 = 0; k2 < WIN_LEN; k2++) l2.push(idx(r + k2, c));
            lines.push(l2);
          }
          if (r + WIN_LEN <= SIZE && c + WIN_LEN <= SIZE) {
            var l3 = []; for (var k3 = 0; k3 < WIN_LEN; k3++) l3.push(idx(r + k3, c + k3));
            lines.push(l3);
          }
          if (r + WIN_LEN <= SIZE && c - WIN_LEN + 1 >= 0) {
            var l4 = []; for (var k4 = 0; k4 < WIN_LEN; k4++) l4.push(idx(r + k4, c - k4));
            lines.push(l4);
          }
        }
      }
      return lines;
    })();

    function checkWinner(board) {
      for (var i = 0; i < LINES.length; i++) {
        var line = LINES[i];
        var first = board[line[0]];
        if (first === 0) continue;
        var all = true;
        for (var j = 1; j < line.length; j++) {
          if (board[line[j]] !== first) { all = false; break; }
        }
        if (all) return first;
      }
      return 0;
    }

    function emptyIndices(board) {
      var out = [];
      for (var i = 0; i < board.length; i++) if (board[i] === 0) out.push(i);
      return out;
    }

    function evaluate(board) {
      var score = 0;
      for (var i = 0; i < LINES.length; i++) {
        var line = LINES[i];
        var mine = 0, theirs = 0;
        for (var j = 0; j < line.length; j++) {
          var v = board[line[j]];
          if (v === 1) mine++;
          else if (v === 2) theirs++;
        }
        if (mine > 0 && theirs > 0) continue;
        if (mine > 0) score += Math.pow(10, mine);
        else if (theirs > 0) score -= Math.pow(10, theirs);
      }
      return score;
    }

    function bestMove(board) {
      var empties = emptyIndices(board);
      if (empties.length === 0) return null;

      for (var i = 0; i < empties.length; i++) {
        var idx = empties[i];
        board[idx] = 1;
        var win = checkWinner(board) === 1;
        board[idx] = 0;
        if (win) return idx;
      }
      for (var i2 = 0; i2 < empties.length; i2++) {
        var idx2 = empties[i2];
        board[idx2] = 2;
        var threat = checkWinner(board) === 2;
        board[idx2] = 0;
        if (threat) return idx2;
      }

      var deadline = performance.now() + TIME_BUDGET_MS;
      var best = empties[0];
      var depth = 2;

      function orderMoves(moves) {
        return moves.slice().sort(function (a, b) {
          board[a] = 1; var sa = evaluate(board); board[a] = 0;
          board[b] = 1; var sb = evaluate(board); board[b] = 0;
          return sb - sa;
        });
      }

      function minimax(bd, d, alpha, beta, maximizing) {
        var w = checkWinner(bd);
        if (w === 1) return 100000 + d;
        if (w === 2) return -100000 - d;
        var emp = emptyIndices(bd);
        if (emp.length === 0 || d === 0 || performance.now() > deadline) return evaluate(bd);
        if (maximizing) {
          var val = -Infinity;
          var moves = orderMoves(emp);
          for (var i3 = 0; i3 < moves.length; i3++) {
            bd[moves[i3]] = 1;
            val = Math.max(val, minimax(bd, d - 1, alpha, beta, false));
            bd[moves[i3]] = 0;
            alpha = Math.max(alpha, val);
            if (alpha >= beta || performance.now() > deadline) break;
          }
          return val;
        } else {
          var val2 = Infinity;
          var moves2 = orderMoves(emp);
          for (var i4 = 0; i4 < moves2.length; i4++) {
            bd[moves2[i4]] = 2;
            val2 = Math.min(val2, minimax(bd, d - 1, alpha, beta, true));
            bd[moves2[i4]] = 0;
            beta = Math.min(beta, val2);
            if (alpha >= beta || performance.now() > deadline) break;
          }
          return val2;
        }
      }

      while (performance.now() < deadline && depth <= 8) {
        var moves = orderMoves(empties);
        var localBest = moves[0];
        var localBestScore = -Infinity;
        for (var i5 = 0; i5 < moves.length; i5++) {
          if (performance.now() > deadline) break;
          board[moves[i5]] = 1;
          var s = minimax(board, depth - 1, -Infinity, Infinity, false);
          board[moves[i5]] = 0;
          if (s > localBestScore) { localBestScore = s; localBest = moves[i5]; }
        }
        best = localBest;
        depth += 2;
      }
      return best;
    }

    function ensureOverlayCleared(cells) {
      cells.forEach(function (c) { c.style.outline = ''; c.style.outlineOffset = ''; });
    }

    function highlight(cells, idx) {
      ensureOverlayCleared(cells);
      if (idx == null) return;
      var el = cells[idx];
      if (!el) return;
      el.style.outline = '3px solid #4cc9f0';
      el.style.outlineOffset = '-3px';
    }

    function tick() {
      var cells = readCells();
      if (cells.length < SIZE * SIZE) return;
      var board = boardFromDOM(cells);
      var key = board.join('');
      if (key === lastBoardKey) return;
      lastBoardKey = key;
      if (checkWinner(board) !== 0 || emptyIndices(board).length === 0) {
        ensureOverlayCleared(cells);
        return;
      }
      var move = bestMove(board.slice());
      highlight(cells, move);
    }

    function start() {
      if (started) return;
      started = true;
      lastBoardKey = null;
      scanTimer = setInterval(tick, 400);
      tick();
      console.log('4 en Raya Asistente iniciado.');
    }

    function stop() {
      if (!started) return;
      started = false;
      if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
      ensureOverlayCleared(readCells());
      console.log('4 en Raya Asistente detenido.');
    }

    return { start: start, stop: stop };
  })();

  // ============================================================
  // MÓDULO 6: BOT PELOTA-FRANJA
  // ============================================================

  var modulesPelotaFranja = (function () {
    var started = false;
    var botInstance = null;

    var CONFIG_BOT = {
      EMOJI_PELOTA: '⚽',
      ETIQUETA_FRANJA: 'TU CONTROL',
      DEADZONE_PX: 10,
      MIN_CAMBIO_MS: 80,
      REFRESCO_PULSAR_MS: 100,
      TIEMPO_ANTICIPACION_S: 0.18,
      ZONA_FRENADO_PX: 80,
      INVERTIR_CONTROL: false
    };

    function identificarPelota() {
      var all = document.querySelectorAll('body *');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (el.children.length === 0 && el.textContent.trim() === CONFIG_BOT.EMOJI_PELOTA) return el;
      }
      return null;
    }

    function identificarFranja() {
      var all = document.querySelectorAll('body *');
      for (var i = 0; i < all.length; i++) {
        var el = all[i];
        if (el.children.length === 0 && el.textContent.trim() === CONFIG_BOT.ETIQUETA_FRANJA) return el.parentElement;
      }
      return null;
    }

    function identificarAreaJuego(pelota, franja) {
      var el = pelota || franja;
      while (el && el !== document.body) {
        var estilo = getComputedStyle(el);
        var rect = el.getBoundingClientRect();
        if (estilo.cursor === 'pointer' && rect.height > 100) return el;
        el = el.parentElement;
      }
      return null;
    }

    function dispararEventosPuntero(el, tipo) {
      var rect = el.getBoundingClientRect();
      var x = rect.left + rect.width / 2;
      var y = rect.top + rect.height / 2;
      var opciones = { bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, button: 0 };
      var np = tipo === 'down' ? 'pointerdown' : 'pointerup';
      var nm = tipo === 'down' ? 'mousedown' : 'mouseup';
      var nt = tipo === 'down' ? 'touchstart' : 'touchend';
      el.dispatchEvent(new PointerEvent(np, opciones));
      try {
        var touch = new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
        el.dispatchEvent(new TouchEvent(nt, { bubbles: true, cancelable: true, composed: true, touches: tipo === 'down' ? [touch] : [], targetTouches: tipo === 'down' ? [touch] : [], changedTouches: [touch] }));
      } catch (e) {}
      el.dispatchEvent(new MouseEvent(nm, opciones));
    }

    function dispararEventoMove(el) {
      var rect = el.getBoundingClientRect();
      var x = rect.left + rect.width / 2 + (Math.random() < 0.5 ? 1 : -1);
      var y = rect.top + rect.height / 2;
      var opciones = { bubbles: true, cancelable: true, composed: true, pointerId: 1, pointerType: 'touch', isPrimary: true, clientX: x, clientY: y, button: 0 };
      el.dispatchEvent(new PointerEvent('pointermove', opciones));
      try {
        var touch = new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
        el.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, composed: true, touches: [touch], targetTouches: [touch], changedTouches: [touch] }));
      } catch (e) {}
      el.dispatchEvent(new MouseEvent('mousemove', opciones));
    }

    function crearBotInterno() {
      var corriendo = false;
      var presionadoActual = false;
      var ultimoCambio = 0;
      var ultimoRefresco = 0;
      var lastTs = null;
      var centroFranjaAnterior = null;

      function establecerPresionado(target, valor) {
        if (valor === presionadoActual) return;
        var ahora = performance.now();
        if (ahora - ultimoCambio < CONFIG_BOT.MIN_CAMBIO_MS) return;
        ultimoCambio = ahora;
        ultimoRefresco = ahora;
        presionadoActual = valor;
        dispararEventosPuntero(target, valor ? 'down' : 'up');
      }

      function refrescarPulsarSiNecesario(target) {
        if (!presionadoActual || !target) return;
        var ahora = performance.now();
        if (ahora - ultimoRefresco < CONFIG_BOT.REFRESCO_PULSAR_MS) return;
        ultimoRefresco = ahora;
        dispararEventosPuntero(target, 'down');
        dispararEventoMove(target);
      }

      function loop(ts) {
        if (!corriendo) return;
        if (lastTs === null) lastTs = ts;
        var dt = (ts - lastTs) / 1000;
        lastTs = ts;

        var pelota = identificarPelota();
        var franja = identificarFranja();
        var areaJuego = identificarAreaJuego(pelota, franja);

        if (!pelota || !franja || !areaJuego) {
          requestAnimationFrame(loop);
          return;
        }

        refrescarPulsarSiNecesario(areaJuego);

        var rPelota = pelota.getBoundingClientRect();
        var rFranja = franja.getBoundingClientRect();
        var centroPelota = rPelota.top + rPelota.height / 2;
        var centroFranja = rFranja.top + rFranja.height / 2;

        var diferencia = centroFranja - centroPelota;
        var velocidadFranja = 0;
        if (centroFranjaAnterior !== null && dt > 0.01) {
          velocidadFranja = (centroFranja - centroFranjaAnterior) / dt;
          velocidadFranja = Math.max(-3000, Math.min(3000, velocidadFranja));
        }
        centroFranjaAnterior = centroFranja;

        var diferenciaPredicha = diferencia + velocidadFranja * CONFIG_BOT.TIEMPO_ANTICIPACION_S;
        var valorDecision = Math.abs(diferencia) > CONFIG_BOT.ZONA_FRENADO_PX ? diferencia : diferenciaPredicha;

        if (Math.abs(valorDecision) > CONFIG_BOT.DEADZONE_PX) {
          var debePresionar = valorDecision > 0;
          if (CONFIG_BOT.INVERTIR_CONTROL) debePresionar = !debePresionar;
          establecerPresionado(areaJuego, debePresionar);
        }

        requestAnimationFrame(loop);
      }

      function iniciar() {
        if (corriendo) return;
        corriendo = true;
        lastTs = null;
        ultimoRefresco = performance.now();
        requestAnimationFrame(loop);
      }

      function detener() {
        corriendo = false;
        var pelota = identificarPelota();
        var franja = identificarFranja();
        var areaJuego = identificarAreaJuego(pelota, franja);
        if (areaJuego && presionadoActual) {
          dispararEventosPuntero(areaJuego, 'up');
          presionadoActual = false;
        }
      }

      return { iniciar: iniciar, detener: detener };
    }

    function start() {
      if (started) return;
      started = true;
      botInstance = crearBotInterno();
      botInstance.iniciar();
      console.log('Bot Pelota-Franja iniciado.');
    }

    function stop() {
      if (!started) return;
      started = false;
      if (botInstance) { botInstance.detener(); botInstance = null; }
      console.log('Bot Pelota-Franja detenido.');
    }

    return { start: start, stop: stop };
  })();

  // ============================================================
  // MÓDULO 7: MEMO GRID (v4)
  // ============================================================
  //
  // Anclaje real: ".memocarta" (1 por casilla, 16 en 4x4).
  // "Ya vista" se detecta por la clase "memocarta-abierta".
  // Cuando una carta ya vista queda boca abajo, dibuja el emoji
  // encima (overlay). Mientras está boca arriba no dibuja nada.
  // ============================================================

  var modulesMemoGrid = (function () {
    var started = false;
    var scanTimer = null;
    var waitTimer = null;
    var overlays = [];
    var memory = [];

    var CARD_SELECTOR = '.memocarta';
    var OPEN_CLASS = 'memocarta-abierta';
    var WAIT_STEP_MS = 300;
    var WAIT_MAX_MS = 15000;

    function extractSymbol(cardEl) {
      var frente = cardEl.querySelector('.memocarta-frente .relative');
      if (frente) {
        var t = (frente.textContent || '').trim();
        if (t) return t;
      }
      var label = cardEl.getAttribute('aria-label');
      if (label && label !== 'Carta tapada') return label;
      return null;
    }

    function makeOverlay(cardEl) {
      if (getComputedStyle(cardEl).position === 'static') {
        cardEl.style.position = 'relative';
      }
      var ov = document.createElement('div');
      ov.className = 'memo-grid-overlay';
      ov.style.cssText =
        'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;' +
        'pointer-events:none;font-size:22px;' +
        'text-shadow:0 0 3px #000,0 0 6px #000;z-index:5;';
      cardEl.appendChild(ov);
      return ov;
    }

    function init(cards) {
      memory = new Array(cards.length).fill(null);
      overlays = [];
      cards.forEach(function (card) { overlays.push(makeOverlay(card)); });

      function scan() {
        var nodes = document.querySelectorAll(CARD_SELECTOR);
        var n = Math.min(nodes.length, memory.length);
        for (var i = 0; i < n; i++) {
          var card = nodes[i];
          var isOpen = card.classList.contains(OPEN_CLASS);
          if (isOpen) {
            var sym = extractSymbol(card);
            if (sym) memory[i] = sym;
            overlays[i].textContent = '';
          } else {
            overlays[i].textContent = memory[i] || '';
          }
        }
      }

      scanTimer = setInterval(scan, 200);
      scan();
      console.log('%c Memo Grid activo (' + cards.length + ' cartas) ', 'background:#0a0a0a;color:#4cc9f0;padding:2px 6px;border-radius:4px;');
    }

    function start() {
      if (started) return;
      started = true;

      var waited = 0;
      waitTimer = setInterval(function () {
        var cards = document.querySelectorAll(CARD_SELECTOR);
        waited += WAIT_STEP_MS;
        if (cards.length > 0) {
          clearInterval(waitTimer);
          waitTimer = null;
          init(cards);
        } else if (waited >= WAIT_MAX_MS) {
          clearInterval(waitTimer);
          waitTimer = null;
          console.warn('Memo Grid: no encontré cartas (' + CARD_SELECTOR + ') después de ' + (WAIT_MAX_MS / 1000) + 's.');
          started = false;
        }
      }, WAIT_STEP_MS);
    }

    function stop() {
      if (waitTimer) { clearInterval(waitTimer); waitTimer = null; }
      if (!started) return;
      started = false;
      if (scanTimer) { clearInterval(scanTimer); scanTimer = null; }
      overlays.forEach(function (ov) { if (ov && ov.remove) ov.remove(); });
      overlays = [];
      memory = [];
      console.log('Memo Grid detenido.');
    }

    return { start: start, stop: stop };
  })();

  // ============================================================
  // LÓGICA DE CHECKBOXES (marcar = corre, desmarcar = para)
  // ============================================================

  function bindCheckbox(cb, mod) {
    cb.addEventListener('change', function () {
      if (this.checked) mod.start();
      else mod.stop();
    });
  }

  bindCheckbox(cbBarWatcher, modulesBarWatcher);
  bindCheckbox(cbAutoPenales, modulesAutoPenales);
  bindCheckbox(cbSimonSpy, modulesSimonSpy);
  bindCheckbox(cbEsquivar, modulesEsquivar);
  bindCheckbox(cb4EnRaya, modules4EnRaya);
  bindCheckbox(cbPelotaFranja, modulesPelotaFranja);
  bindCheckbox(cbMemoGrid, modulesMemoGrid);

  // ============================================================
  // API PÚBLICA
  // ============================================================

  window.PanelManager = {
    barWatcher: modulesBarWatcher,
    autoPenales: modulesAutoPenales,
    simonSpy: modulesSimonSpy,
    esquivar: modulesEsquivar,
    cuatroEnRaya: modules4EnRaya,
    pelotaFranja: modulesPelotaFranja,
    memoGrid: modulesMemoGrid,
    stopAll: function () {
      modulesBarWatcher.stop();
      modulesAutoPenales.stop();
      modulesSimonSpy.stop();
      modulesEsquivar.stop();
      modules4EnRaya.stop();
      modulesPelotaFranja.stop();
      modulesMemoGrid.stop();
      cbBarWatcher.checked = false;
      cbAutoPenales.checked = false;
      cbSimonSpy.checked = false;
      cbEsquivar.checked = false;
      cb4EnRaya.checked = false;
      cbPelotaFranja.checked = false;
      cbMemoGrid.checked = false;
    },
    destroy: function () {
      this.stopAll();
      masterPanel.remove();
      delete window.PanelManager;
    }
  };

  console.log('%c PanelManager (Kernel corp.) cargado ',
    'background:#0a0a0a;color:#4cc9f0;padding:2px 6px;border-radius:4px;');

})();