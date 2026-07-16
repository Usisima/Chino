'use strict';

/* ==================== TRAZOS: práctica dedicada de escritura de hanzi ==================== */
(function () {

var sState = null;

App.views.strokes = function () {
  var w = App.$('strokes-wrap');
  w.innerHTML = '';
  w.appendChild(App.el('p', 'page-title', '<span class="zh">笔画</span> · Trazos'));
  w.appendChild(App.el('div', 'title-divider'));
  App.ready.then(function () {
    if (App.currentView !== 'strokes') return;
    sState = null;
    renderHub(w);
  });
};

function clearBelow(w) { while (w.children.length > 2) w.removeChild(w.lastChild); }

/* caracteres únicos (con datos) del nivel activo */
function levelChars() {
  var words = App.levelWords(App.S.scheme, App.S.level);
  if (words.length < 4) {
    words = [];
    App.LEVELS[App.S.scheme].forEach(function (l) { words = words.concat(App.levelWords(App.S.scheme, l)); });
  }
  var seen = {}, out = [];
  words.forEach(function (word) {
    App.disp(word).split('').forEach(function (ch) {
      if (!seen[ch] && /[㐀-鿿]/.test(ch) && App.CHARS[ch]) { seen[ch] = 1; out.push({ ch: ch, word: word }); }
    });
  });
  return out;
}

/* ---------- hub ---------- */
function renderHub(w) {
  clearBelow(w);

  var lvlRow = App.el('div', 'select-row');
  lvlRow.innerHTML = '<label>Nivel HSK ' + (App.S.scheme === 'new' ? '3.0' : '2.0') + '</label>';
  var sel = document.createElement('select');
  App.LEVELS[App.S.scheme].forEach(function (l) { sel.appendChild(new Option('Nivel ' + App.lvlName(App.S.scheme, l), l)); });
  sel.value = App.S.level;
  sel.onchange = function () { App.S.level = +sel.value; App.saveS(); renderHub(w); };
  lvlRow.appendChild(sel);
  w.appendChild(lvlRow);

  var chars = levelChars();
  w.appendChild(App.el('p', 'hint', 'Traza los caracteres en el orden correcto. Practica sin límite y termina cuando quieras.'));

  var start = App.el('button', 'btn btn-jade', '<svg viewBox="0 0 24 24"><use href="#icon-brush"/></svg>Practicar trazos · ' + chars.length + ' caracteres');
  start.style.margin = '0.2rem auto 0.9rem';
  start.onclick = function () {
    if (!chars.length) { App.toast('Sin datos de trazos en este nivel'); return; }
    startSession(App.shuffle(chars.slice()), 0);
    renderTrace(w);
  };
  w.appendChild(start);

  if (chars.length) {
    w.appendChild(App.el('p', 'section-title', 'Elige un carácter'));
    var grid = App.el('div', 'rad-grid');
    chars.forEach(function (item, i) {
      var known = App.srsStage(item.word.s) === 'known';
      var c = App.el('button', 'chip' + (known ? ' active' : ''), '<span style="font-family:var(--hanzi)">' + App.esc(item.ch) + '</span>');
      c.onclick = function () { startSession(chars.slice(), i); renderTrace(w); };
      grid.appendChild(c);
    });
    w.appendChild(grid);
  }
}

/* ---------- sesión de trazado (infinita) ---------- */
function startSession(deck, startIdx) {
  sState = { deck: deck, i: startIdx || 0, ok: 0, bad: 0, seen: 0, started: Date.now(), name: 'Trazos' };
}

function renderTrace(w) {
  clearBelow(w);
  var s = sState;
  if (!s) return renderHub(w);
  if (s.i >= s.deck.length) s.i = 0; // ronda infinita
  var item = s.deck[s.i], ch = item.ch, c = App.CHARS[ch];

  w.appendChild(App.el('div', 'q-top',
    '<span class="q-count">Trazos</span>' +
    '<span class="q-score">' + s.ok + ' ✓ · <span style="color:var(--red)">' + s.bad + ' ✗</span></span>'));

  var box = App.el('div', 'writer-box');
  w.appendChild(box);

  var pinyin = (c && c[1]) || item.word.p;
  var def = App.byS[ch] && App.byS[ch].es ? App.byS[ch].es : App.short(item.word);
  var under = App.el('div', 'writer-under',
    '<div class="writer-word">' + App.toneSpans(ch, pinyin) + ' · ' + App.esc(pinyin) + '</div>' +
    '<div class="writer-es">' + App.esc(def) + '</div>');
  w.appendChild(under);

  // suena la pronunciación del carácter al empezar
  setTimeout(function () { if (sState === s) App.speak(ch); }, 350);

  App.strokes(ch).then(function (d) {
    if (!d) { s.i++; renderTrace(w); return; }
    var size = Math.min(300, Math.floor(window.innerWidth * 0.78));
    var hw = App.hwColors();
    var writer = HanziWriter.create(box, ch, {
      width: size, height: size, padding: 12,
      showCharacter: false, showOutline: true,
      strokeColor: hw.strokeColor, outlineColor: hw.outlineColor, drawingColor: hw.drawingColor,
      drawingWidth: 16,
      charDataLoader: function (_c, done) { done({ strokes: d.s, medians: d.m }); }
    });
    writer.quiz({
      onComplete: function (res) {
        var good = res.totalMistakes <= 3;
        s.seen++;
        if (good) s.ok++; else s.bad++;
        App.G.written++; App.saveG();
        App.mission('write', 1);
        App.day(good ? 'ok' : 'bad', 1);
        App.xp(good ? 4 : 1);
        App.speak(ch);
        setTimeout(function () { if (sState === s) { s.i++; renderTrace(w); } }, 900);
      }
    });
  });

  var row = App.el('div', 'btn-row');
  row.style.marginTop = '1rem';
  var hint = App.el('button', 'btn btn-sm', 'Ver trazos');
  hint.onclick = function () {
    App.strokes(ch).then(function (d) {
      if (!d) return;
      App.openOverlay('Trazos de ' + ch, function (body) {
        var bx = App.el('div', 'writer-box');
        body.appendChild(bx);
        var size = Math.min(300, Math.floor(window.innerWidth * 0.78));
        var hw = App.hwColors();
        var wr = HanziWriter.create(bx, ch, {
          width: size, height: size, padding: 12,
          showCharacter: false, showOutline: true,
          strokeColor: hw.drawingColor, outlineColor: hw.outlineColor,
          charDataLoader: function (_c, done) { done({ strokes: d.s, medians: d.m }); }
        });
        wr.loopCharacterAnimation();
      });
    });
  };
  var skip = App.el('button', 'btn btn-sm', 'Saltar');
  skip.onclick = function () { s.i++; renderTrace(w); };
  row.appendChild(hint); row.appendChild(skip);
  w.appendChild(row);

  var fin = App.el('button', 'btn-quiet', 'Terminar y ver estadísticas');
  fin.style.margin = '1.2rem auto 0';
  fin.onclick = function () { renderStats(w); };
  w.appendChild(fin);
}

function renderStats(w) {
  clearBelow(w);
  var s = sState;
  sState = null;
  if (!s) return renderHub(w);
  var seen = s.seen, ok = s.ok, bad = s.bad;
  var pct = seen ? Math.round(ok / seen * 100) : 0;
  var secs = Math.round((Date.now() - s.started) / 1000);
  App.checkBadges();

  if (!seen) {
    w.appendChild(App.el('div', 'done-card',
      '<div class="done-title">Sesión terminada</div>' +
      '<div class="done-sub">No trazaste ningún carácter.</div>'));
  } else {
    var d = App.el('div', 'done-card',
      '<div class="done-zh">' + (pct >= 80 ? '很好!' : pct >= 50 ? '不错!' : '加油!') + '</div>' +
      '<div class="done-title">Sesión de trazos terminada</div>' +
      '<div class="done-sub">Tiempo de estudio: ' + App.fmtMin(secs) + '</div>');
    w.appendChild(d);
    var stats = App.el('div', 'statsrow');
    stats.style.marginTop = '0.7rem';
    stats.innerHTML =
      '<div class="stat-card"><span class="stat-val">' + seen + '</span><span class="stat-key">Trazados</span></div>' +
      '<div class="stat-card"><span class="stat-val" style="color:var(--accent)">' + ok + '</span><span class="stat-key">Bien</span></div>' +
      '<div class="stat-card"><span class="stat-val" style="color:var(--red)">' + bad + '</span><span class="stat-key">Con fallos</span></div>' +
      '<div class="stat-card"><span class="stat-val">' + pct + '%</span><span class="stat-key">Precisión</span></div>';
    w.appendChild(stats);
  }

  var row = App.el('div', 'btn-row');
  row.style.margin = '1rem auto 0';
  var b1 = App.el('button', 'btn btn-jade', 'Otra ronda');
  b1.onclick = function () { renderHub(w); };
  var b2 = App.el('button', 'btn', 'Volver');
  b2.onclick = function () { renderHub(w); };
  row.appendChild(b1); row.appendChild(b2);
  w.appendChild(row);
}

})();
