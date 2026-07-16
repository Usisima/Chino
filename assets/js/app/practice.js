'use strict';

/* ==================== PRÁCTICA: ejercicios, juegos, examen ==================== */
(function () {

var state = null;   // sesión activa
var timerId = null;

function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

App.views.practice = function () {
  stopTimer();
  var w = App.$('practice-wrap');
  w.innerHTML = '';
  w.appendChild(App.el('p', 'page-title', '<span class="zh">练习</span> · Práctica'));
  w.appendChild(App.el('div', 'title-divider'));
  App.ready.then(function () {
    if (App.currentView !== 'practice') return;
    state = null;
    renderHub(w);
  });
};

function clearBelow(w) { stopTimer(); while (w.children.length > 2) w.removeChild(w.lastChild); }

function pool() {
  var p = App.levelWords(App.S.scheme, App.S.level);
  if (p.length < 8) {
    p = [];
    App.LEVELS[App.S.scheme].forEach(function (l) { p = p.concat(App.levelWords(App.S.scheme, l)); });
  }
  return p;
}

/* muestreo sin glosas repetidas: evita parejas/opciones con el mismo texto */
function sampleDistinct(p, n) {
  var out = [], seen = {}, rest = [];
  App.shuffle(p.slice()).forEach(function (word) {
    var g = App.gloss(word);
    if (out.length < n && !seen[g]) { seen[g] = 1; out.push(word); }
    else rest.push(word);
  });
  while (out.length < n && rest.length) out.push(rest.pop());
  return out;
}

function progressRow(cur, total) {
  var pct = total ? Math.round(cur / total * 100) : 0;
  return App.el('div', 'q-progress-row',
    '<div class="q-progress"><div class="q-progress-fill" style="width:' + pct + '%"></div></div>' +
    '<span class="q-frac">' + cur + ' / ' + total + '</span>');
}

function hanziBlock(word) {
  var d = App.disp(word);
  // el pinyin solo se muestra si las opciones no son pinyin (delataría la respuesta)
  var py = App.S.showTrans && App.S.roman !== 'none' ? App.roman(word) : '';
  return '<span class="q-hanzi' + (d.length > 3 ? ' long' : '') + '">' + App.toneSpans(d, word.p) + '</span>' +
    (py ? '<span class="q-pinyin">' + App.esc(py) + '</span>' : '');
}

/* botón "Escuchar" para las pruebas */
function listenBtnHtml() {
  return '<button class="btn btn-sm listen-btn" data-a="say" style="min-width:0;margin-top:4px">' +
    '<svg viewBox="0 0 24 24"><use href="#icon-audio"/></svg>Escuchar</button>';
}

function confettiBurst(host) {
  var colors = [App.cssVar('--accent', '#1EA268'), App.cssVar('--gold', '#2C5BE0'), App.cssVar('--amber', '#E7961F'), App.cssVar('--red', '#E14A44')];
  for (var i = 0; i < 20; i++) {
    var c = document.createElement('i');
    c.className = 'confetti';
    c.style.left = (8 + Math.random() * 84) + '%';
    c.style.background = colors[i % 4];
    c.style.animationDelay = (Math.random() * 0.3) + 's';
    host.appendChild(c);
  }
}

/* ---------- hub ---------- */
function renderHub(w) {
  clearBelow(w);

  var lvlRow = App.el('div', 'select-row');
  lvlRow.innerHTML = '<label>Nivel HSK ' + (App.S.scheme === 'new' ? '3.0' : '2.0') + '</label>';
  var sel = document.createElement('select');
  App.LEVELS[App.S.scheme].forEach(function (l) {
    sel.appendChild(new Option('Nivel ' + App.lvlName(App.S.scheme, l), l));
  });
  sel.value = App.S.level;
  sel.onchange = function () { App.S.level = +sel.value; App.saveS(); };
  lvlRow.appendChild(sel);
  w.appendChild(lvlRow);

  w.appendChild(App.el('p', 'section-title', 'Ejercicios'));
  hubCard(w, '读', 'Leer', 'Ve el hanzi y elige el significado · sin límite', function () { startMC(w, 'read'); });
  hubCard(w, '译', 'Traducir', 'Ve el significado y elige el hanzi · sin límite', function () { startMC(w, 'trans'); });
  if ('speechSynthesis' in window) {
    hubCard(w, '听', 'Escuchar', 'Escucha y elige el significado · sin límite', function () { startMC(w, 'listen'); });
    hubCard(w, '写', 'Dictado', 'Escucha y escribe el pinyin · sin límite', function () { startDictation(w); });
  }
  hubCard(w, '对', 'Emparejar', 'Une cada hanzi con su significado', function () { startMatch(w); });
  hubCard(w, '笔', 'Escritura', 'Traza caracteres con el orden correcto', function () { startWriting(w); });

  w.appendChild(App.el('p', 'section-title', 'Juegos'));
  hubCard(w, '记', 'Memorama', 'Encuentra las parejas ocultas', function () { startMemo(w); });
  hubCard(w, '闪', 'Contrarreloj', '60 segundos, tantas como puedas', function () { startRush(w); });

  w.appendChild(App.el('p', 'section-title', 'Examen'));
  hubCard(w, '考', 'Examen de práctica', '20 preguntas mixtas · 10 minutos · con historial', function () { startExam(w); });
  if (App.G.examHist.length) {
    var h = App.G.examHist.slice(-3).reverse().map(function (e) {
      return new Date(e.date).toLocaleDateString() + ' · ' + e.score + '/' + e.total + ' (' + Math.round(e.score / e.total * 100) + '%)';
    }).join('<br>');
    w.appendChild(App.el('p', 'hint', 'Últimos exámenes:<br>' + h));
  }
}

function hubCard(w, zh, name, desc, fn) {
  var c = App.el('div', 'mode-card',
    '<div class="mode-icon">' + zh + '</div>' +
    '<div class="mode-info"><div class="mode-name">' + name + '</div><div class="mode-desc">' + desc + '</div></div>' +
    '<svg class="mode-arrow" viewBox="0 0 24 24"><use href="#icon-arrow"/></svg>');
  c.onclick = fn;
  w.appendChild(c);
}

/* ---------- generador de preguntas MC ---------- */
function makeQ(p, word, mode) {
  var g = App.gloss(word);
  var others = p.filter(function (x) {
    return x.s !== word.s && x.en !== word.en && x.p !== word.p && App.gloss(x) !== g;
  });
  var wrong = App.sample(others, 3);
  return { w: word, mode: mode, opts: App.shuffle([word].concat(wrong)) };
}
function makeQs(n, modes) {
  var p = pool();
  var words = App.sample(p, Math.min(n, p.length));
  return words.map(function (word) {
    return makeQ(p, word, modes[Math.floor(Math.random() * modes.length)]);
  });
}

/* ---------- ejercicio de opción múltiple (ronda infinita) ---------- */
function startMC(w, mode) {
  state = {
    mode: mode, ok: 0, bad: 0, seen: 0, infinite: true,
    name: { read: 'Leer', trans: 'Traducir', listen: 'Escuchar' }[mode],
    started: Date.now(), arr: pool()
  };
  state.again = function (ww) { startMC(ww, mode); };
  renderInfMC(w);
}

function renderInfMC(w) {
  clearBelow(w);
  var s = state;
  if (!s) return renderHub(w);
  var p = s.arr;
  var word = App.sample(p, 1)[0];
  var q = makeQ(p, word, s.mode);

  // ronda infinita: solo marcador de aciertos/fallos, sin barra ni porcentaje
  w.appendChild(App.el('div', 'q-top',
    '<span class="q-count">' + s.name + '</span>' +
    '<span class="q-score">' + s.ok + ' ✓ · <span style="color:var(--red)">' + s.bad + ' ✗</span></span>'));

  var prompt = App.el('div', 'q-prompt');
  if (s.mode === 'read') {
    prompt.innerHTML = '<span class="q-prompt-label">¿Qué significa?</span>' + hanziBlock(word) + listenBtnHtml();
  } else if (s.mode === 'trans') {
    prompt.innerHTML = '<span class="q-prompt-label">¿Qué palabra es?</span><span class="q-es">' + App.esc(App.short(word)) + '</span>';
  } else {
    prompt.innerHTML =
      '<span class="q-prompt-label">¿Qué significa lo que oyes?</span>' +
      '<button class="icon-btn" data-a="say" style="width:56px;height:56px"><svg viewBox="0 0 24 24" style="width:22px;height:22px"><use href="#icon-audio"/></svg></button>';
  }
  var say = prompt.querySelector('[data-a="say"]');
  if (say) say.onclick = function () { App.speak(App.disp(word)); };
  w.appendChild(prompt);
  // la pronunciación suena al inicio del ejercicio (no al responder)
  if (s.mode === 'read' || s.mode === 'listen') setTimeout(function () { App.speak(App.disp(word)); }, 350);

  var opts = App.el('div', 'q-opts');
  var answered = false;
  q.opts.forEach(function (o) {
    var b = App.el('button', 'q-opt');
    if (s.mode === 'trans') b.innerHTML = '<span class="zh">' + App.toneSpans(App.disp(o), o.p) + '</span>';
    else b.textContent = App.S.showTrans ? App.short(o) : o.p;
    b.onclick = function () {
      if (answered) return;
      answered = true;
      var right = o.s === word.s;
      s.seen++;
      if (right) s.ok++; else s.bad++;
      App.day(right ? 'ok' : 'bad', 1);
      if (right) App.xp(2);
      opts.querySelectorAll('.q-opt').forEach(function (x) { x.classList.add('off'); });
      b.classList.add(right ? 'ok' : 'bad');
      var okBtn = b;
      if (!right) {
        q.opts.forEach(function (oo, j) { if (oo.s === word.s) okBtn = opts.children[j]; });
        okBtn.classList.add('ok');
      }
      okBtn.insertAdjacentHTML('afterbegin', '<span class="opt-check">✓</span>');
      setTimeout(function () { if (state === s) renderInfMC(w); }, right ? 750 : 1400);
    };
    opts.appendChild(b);
  });
  w.appendChild(opts);

  var fin = App.el('button', 'btn-quiet', 'Terminar y ver estadísticas');
  fin.style.margin = '1.4rem auto 0';
  fin.onclick = function () { renderRoundStats(w); };
  w.appendChild(fin);
}

/* estadísticas al terminar una ronda infinita (MC, dictado, escritura) */
function renderRoundStats(w) {
  clearBelow(w);
  var s = state;
  state = null;
  if (!s) return renderHub(w);
  var seen = s.seen, ok = s.ok, bad = s.bad;
  var pct = seen ? Math.round(ok / seen * 100) : 0;
  var secs = Math.round((Date.now() - s.started) / 1000);
  App.mission('quiz', 1);
  if (pct === 100 && seen >= 5) { App.G.perfect = 1; App.saveG(); }
  App.checkBadges();

  if (!seen) {
    w.appendChild(App.el('div', 'done-card',
      '<div class="done-title">Ronda terminada</div>' +
      '<div class="done-sub">No respondiste ninguna pregunta.</div>'));
  } else {
    var d = App.el('div', 'done-card',
      '<div class="done-zh">' + (pct >= 80 ? '很好!' : pct >= 50 ? '不错!' : '加油!') + '</div>' +
      '<div class="done-title">Ronda terminada · ' + (s.name || '') + '</div>' +
      '<div class="done-sub">Tiempo de estudio: ' + App.fmtMin(secs) + '</div>');
    w.appendChild(d);
    if (pct >= 80) confettiBurst(d);
    var stats = App.el('div', 'statsrow');
    stats.style.marginTop = '0.7rem';
    stats.innerHTML =
      '<div class="stat-card"><span class="stat-val">' + seen + '</span><span class="stat-key">Respondidas</span></div>' +
      '<div class="stat-card"><span class="stat-val" style="color:var(--accent)">' + ok + '</span><span class="stat-key">Correctas</span></div>' +
      '<div class="stat-card"><span class="stat-val" style="color:var(--red)">' + bad + '</span><span class="stat-key">Incorrectas</span></div>' +
      '<div class="stat-card"><span class="stat-val">' + pct + '%</span><span class="stat-key">Precisión</span></div>';
    w.appendChild(stats);
  }

  var row = App.el('div', 'btn-row');
  row.style.margin = '1rem auto 0';
  var b1 = App.el('button', 'btn btn-jade', 'Otra ronda');
  b1.onclick = function () { if (s.again) s.again(w); else renderHub(w); };
  var b2 = App.el('button', 'btn', 'Volver');
  b2.onclick = function () { renderHub(w); };
  row.appendChild(b1); row.appendChild(b2);
  w.appendChild(row);
}

function renderQ(w, onDone, extraTop) {
  clearBelow(w);
  var s = state;
  if (s.i >= s.qs.length) return onDone();
  var q = s.qs[s.i], word = q.w;

  var top = App.el('div', 'q-top',
    '<span class="q-count">' + (s.name || 'Pregunta') + '</span>' +
    (extraTop || '<span class="q-score">' + s.ok + ' ✓</span>'));
  w.appendChild(top);
  w.appendChild(progressRow(s.i, s.qs.length));

  var prompt = App.el('div', 'q-prompt');
  if (q.mode === 'read') {
    prompt.innerHTML = '<span class="q-prompt-label">¿Qué significa?</span>' + hanziBlock(word) + listenBtnHtml();
  } else if (q.mode === 'trans') {
    prompt.innerHTML = '<span class="q-prompt-label">¿Qué palabra es?</span><span class="q-es">' + App.esc(App.short(word)) + '</span>';
  } else {
    prompt.innerHTML =
      '<span class="q-prompt-label">¿Qué significa lo que oyes?</span>' +
      '<button class="icon-btn" data-a="say" style="width:56px;height:56px"><svg viewBox="0 0 24 24" style="width:22px;height:22px"><use href="#icon-audio"/></svg></button>';
  }
  var say = prompt.querySelector('[data-a="say"]');
  if (say) say.onclick = function () { App.speak(App.disp(word)); };
  w.appendChild(prompt);
  // la pronunciación suena al inicio (no al responder)
  if (q.mode === 'read' || q.mode === 'listen') setTimeout(function () { App.speak(App.disp(word)); }, 350);

  var opts = App.el('div', 'q-opts');
  var answered = false;
  q.opts.forEach(function (o, idx) {
    var b = App.el('button', 'q-opt');
    if (q.mode === 'trans') b.innerHTML = '<span class="zh">' + App.toneSpans(App.disp(o), o.p) + '</span>';
    else b.textContent = App.S.showTrans ? App.short(o) : o.p;
    b.onclick = function () {
      if (answered) return;
      answered = true;
      var right = o.s === word.s;
      if (right) s.ok++;
      App.day(right ? 'ok' : 'bad', 1);
      App.xp(right ? 2 : 0);
      opts.querySelectorAll('.q-opt').forEach(function (x) { x.classList.add('off'); });
      b.classList.add(right ? 'ok' : 'bad');
      var okBtn = b;
      if (!right) {
        q.opts.forEach(function (oo, j) { if (oo.s === word.s) okBtn = opts.children[j]; });
        okBtn.classList.add('ok');
      }
      okBtn.insertAdjacentHTML('afterbegin', '<span class="opt-check">✓</span>');
      setTimeout(function () { s.i++; renderQ(w, onDone, extraTop && s.topFn ? s.topFn() : extraTop); }, right ? 800 : 1500);
    };
    opts.appendChild(b);
  });
  w.appendChild(opts);
}

function renderResults(w, ok, total, kind) {
  clearBelow(w);
  state = null;
  var pct = total ? Math.round(ok / total * 100) : 0;
  App.mission('quiz', 1);
  if (pct === 100 && total >= 5) { App.G.perfect = 1; App.saveG(); }
  App.xp(Math.round(pct / 10));
  App.checkBadges();
  var d = App.el('div', 'done-card',
    '<div class="done-zh">' + (pct >= 80 ? '很好!' : pct >= 50 ? '不错!' : '加油!') + '</div>' +
    '<div class="done-title">' + ok + ' de ' + total + ' correctas</div>' +
    '<div class="done-sub">' + pct + '% · +' + Math.round(pct / 10) + ' XP</div>');
  w.appendChild(d);
  if (pct >= 80) confettiBurst(d);
  var b = App.el('button', 'btn btn-jade', 'Volver a práctica');
  b.style.margin = '0.9rem auto 0';
  b.onclick = function () { renderHub(w); };
  w.appendChild(b);
}

/* ---------- dictado (ronda infinita) ---------- */
function startDictation(w) {
  state = { dict: true, ok: 0, bad: 0, seen: 0, name: 'Dictado', started: Date.now(), arr: pool() };
  state.again = startDictation;
  renderDict(w);
}
function renderDict(w) {
  clearBelow(w);
  var s = state;
  if (!s) return renderHub(w);
  var word = App.sample(s.arr, 1)[0];

  w.appendChild(App.el('div', 'q-top',
    '<span class="q-count">Dictado</span>' +
    '<span class="q-score">' + s.ok + ' ✓ · <span style="color:var(--red)">' + s.bad + ' ✗</span></span>'));

  var prompt = App.el('div', 'q-prompt');
  prompt.innerHTML =
    '<span class="q-prompt-label">Escucha y escribe el pinyin</span>' +
    '<button class="icon-btn" data-a="say" style="width:56px;height:56px"><svg viewBox="0 0 24 24" style="width:22px;height:22px"><use href="#icon-audio"/></svg></button>' +
    '<span class="q-prompt-label" style="letter-spacing:0.08em;text-transform:none">con o sin tonos · ej. «nihao» o «nǐ hǎo»</span>';
  prompt.querySelector('[data-a="say"]').onclick = function () { App.speak(App.disp(word)); };
  setTimeout(function () { App.speak(App.disp(word)); }, 300);
  w.appendChild(prompt);

  var row = App.el('div', 'dict-input-row');
  var inp = App.el('input', 'input');
  inp.placeholder = 'pinyin…';
  inp.autocomplete = 'off';
  row.appendChild(inp);
  var b = App.el('button', 'btn btn-sm btn-jade', 'Comprobar');
  row.appendChild(b);
  w.appendChild(row);

  var fb = App.el('div', 'hint', '');
  w.appendChild(fb);

  var doneBtn = false;
  function check() {
    if (doneBtn) { renderDict(w); return; }
    var ans = App.norm(inp.value).replace(/[0-9]/g, '');
    var target = App.norm(word.p).replace(/[0-9]/g, '');
    var right = ans && ans === target;
    s.seen++;
    if (right) { s.ok++; App.xp(3); } else { s.bad++; }
    App.day(right ? 'ok' : 'bad', 1);
    fb.innerHTML = (right ? '✅ ¡Correcto!' : '❌ Era:') +
      ' <b style="color:var(--gold)">' + App.esc(word.p) + '</b> · ' +
      '<span style="font-family:var(--hanzi);color:var(--ink)">' + App.esc(App.disp(word)) + '</span> · ' +
      App.esc(App.short(word));
    b.textContent = 'Siguiente';
    doneBtn = true;
  }
  b.onclick = check;
  inp.onkeydown = function (e) { if (e.key === 'Enter') check(); };
  inp.focus();

  var quit = App.el('button', 'btn-quiet', 'Terminar y ver estadísticas');
  quit.style.margin = '1.4rem auto 0';
  quit.onclick = function () { renderRoundStats(w); };
  w.appendChild(quit);
}

/* ---------- emparejar ---------- */
function startMatch(w) {
  clearBelow(w);
  var words = sampleDistinct(pool(), 6);
  var tiles = [];
  words.forEach(function (word, i) {
    tiles.push({ pid: i, kind: 'h', label: '<span class="zh">' + App.esc(App.disp(word)) + '</span>', word: word });
    tiles.push({ pid: i, kind: 't', label: App.esc(App.short(word)), word: word });
  });
  App.shuffle(tiles);

  w.appendChild(App.el('div', 'q-top', '<span class="q-count">Emparejar · 6 parejas</span><span class="q-score" id="match-left">6 restantes</span>'));
  var grid = App.el('div', 'match-grid');
  var sel = null, left = 6, errs = 0, lock = false;
  tiles.forEach(function (t) {
    var tile = App.el('button', 'm-tile', t.label);
    tile.onclick = function () {
      if (lock || tile.classList.contains('done')) return;
      if (sel === tile) { tile.classList.remove('sel'); sel = null; return; }
      if (t.kind === 'h') App.speak(App.disp(t.word));
      if (!sel) { sel = tile; tile.classList.add('sel'); sel._t = t; return; }
      var a = sel._t, b = t;
      var first = sel;
      sel = null;
      if (a.pid === b.pid && a.kind !== b.kind) {
        first.classList.remove('sel');
        first.classList.add('done'); tile.classList.add('done');
        left--; App.day('ok', 1); App.xp(2);
        App.$('match-left').textContent = left + ' restantes';
        if (!left) {
          setTimeout(function () {
            var penal = Math.max(0, 6 - errs);
            renderResults(w, penal, 6, 'emparejar');
          }, 450);
        }
      } else {
        errs++; App.day('bad', 1);
        lock = true;
        first.classList.add('err'); tile.classList.add('err');
        setTimeout(function () {
          first.classList.remove('sel', 'err'); tile.classList.remove('err');
          lock = false;
        }, 420);
      }
    };
    grid.appendChild(tile);
  });
  w.appendChild(grid);
  state = { match: true };
  var quit = App.el('button', 'btn btn-sm', 'Salir');
  quit.style.margin = '1.2rem auto 0';
  quit.onclick = function () { state = null; renderHub(w); };
  w.appendChild(quit);
}

/* ---------- memorama ---------- */
function startMemo(w) {
  clearBelow(w);
  var words = sampleDistinct(pool(), 6);
  var tiles = [];
  words.forEach(function (word, i) {
    tiles.push({ pid: i, label: '<span class="zh">' + App.esc(App.disp(word)) + '</span>', word: word });
    tiles.push({ pid: i, label: '<div>' + App.esc(word.p) + '<br><span style="font-size:0.68rem;color:var(--ink3)">' + App.esc(App.short(word)) + '</span></div>', word: word });
  });
  App.shuffle(tiles);

  w.appendChild(App.el('div', 'q-top', '<span class="q-count">Memorama · 6 parejas</span><span class="q-score" id="memo-tries">0 intentos</span>'));
  var grid = App.el('div', 'match-grid mem');
  grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
  var open = null, lock = false, found = 0, tries = 0;
  tiles.forEach(function (t) {
    var tile = App.el('button', 'm-tile hidden-face', '');
    tile._label = t.label;
    tile.onclick = function () {
      if (lock || !tile.classList.contains('hidden-face')) return;
      tile.classList.remove('hidden-face');
      tile.innerHTML = t.label;
      if (!open) { open = { tile: tile, t: t }; return; }
      tries++;
      App.$('memo-tries').textContent = tries + ' intentos';
      var a = open; open = null;
      if (a.t.pid === t.pid) {
        a.tile.classList.add('done'); tile.classList.add('done');
        App.speak(App.disp(t.word));
        App.xp(2); App.day('ok', 1);
        found++;
        if (found === 6) {
          setTimeout(function () {
            var score = Math.max(1, 6 - Math.max(0, tries - 6));
            renderResults(w, score, 6, 'memorama');
          }, 500);
        }
      } else {
        lock = true;
        App.day('bad', 1);
        setTimeout(function () {
          a.tile.classList.add('hidden-face'); a.tile.innerHTML = '';
          tile.classList.add('hidden-face'); tile.innerHTML = '';
          lock = false;
        }, 750);
      }
    };
    grid.appendChild(tile);
  });
  w.appendChild(grid);
  state = { memo: true };
  var quit = App.el('button', 'btn btn-sm', 'Salir');
  quit.style.margin = '1.2rem auto 0';
  quit.onclick = function () { state = null; renderHub(w); };
  w.appendChild(quit);
}

/* ---------- escritura ---------- */
function startWriting(w) {
  clearBelow(w);
  var p = pool();
  // caracteres únicos de palabras del nivel
  var chars = [], seen = {};
  App.shuffle(p.slice()).forEach(function (word) {
    App.disp(word).split('').forEach(function (ch) {
      if (!seen[ch] && /[㐀-鿿]/.test(ch) && App.CHARS[ch]) { seen[ch] = word; chars.push({ ch: ch, word: word }); }
    });
  });
  if (!chars.length) { App.toast('Sin datos de escritura en este nivel'); return renderHub(w); }
  state = { writing: true, deck: App.shuffle(chars), i: 0, ok: 0, bad: 0, seen: 0, name: 'Escritura', started: Date.now() };
  state.again = startWriting;
  renderWriting(w);
}
function renderWriting(w) {
  clearBelow(w);
  var s = state;
  if (!s) return renderHub(w);
  if (s.i >= s.deck.length) s.i = 0; // ronda infinita: recicla los caracteres
  var item = s.deck[s.i], ch = item.ch;

  w.appendChild(App.el('div', 'q-top',
    '<span class="q-count">Escritura</span>' +
    '<span class="q-score">' + s.ok + ' ✓</span>'));
  w.appendChild(progressRow(s.i, s.deck.length));

  var box = App.el('div', 'writer-box');
  w.appendChild(box);
  var under = App.el('div', 'writer-under',
    '<div class="writer-word">' + App.esc(ch) + ' · ' + App.esc((App.CHARS[ch] && App.CHARS[ch][1]) || item.word.p) + '</div>' +
    '<div class="writer-es">de «' + App.esc(App.disp(item.word)) + '» · ' + App.esc(App.short(item.word)) + '</div>');
  w.appendChild(under);

  App.strokes(ch).then(function (d) {
    if (!d) { s.i++; renderWriting(w); return; }
    var size = Math.min(300, Math.floor(window.innerWidth * 0.78));
    var hw = App.hwColors();
    var writer = HanziWriter.create(box, ch, {
      width: size, height: size, padding: 12,
      showCharacter: false, showOutline: true,
      strokeColor: hw.strokeColor,
      outlineColor: hw.outlineColor,
      drawingColor: hw.drawingColor,
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
        setTimeout(function () { if (state === s) { s.i++; renderWriting(w); } }, 900);
      }
    });
  });

  var row = App.el('div', 'btn-row');
  row.style.marginTop = '1rem';
  var hint = App.el('button', 'btn btn-sm', 'Ver trazos');
  hint.onclick = function () {
    App.strokes(ch).then(function (d) {
      if (!d) return;
      // pista: animación en un writer temporal de la ficha
      App.openOverlay('Trazos de ' + ch, function (body) {
        var bx = App.el('div', 'writer-box');
        body.appendChild(bx);
        var size = Math.min(300, Math.floor(window.innerWidth * 0.78));
        var hw = App.hwColors();
        var wr = HanziWriter.create(bx, ch, {
          width: size, height: size, padding: 12,
          showCharacter: false, showOutline: true,
          strokeColor: hw.drawingColor,
          outlineColor: hw.outlineColor,
          charDataLoader: function (_c, done) { done({ strokes: d.s, medians: d.m }); }
        });
        wr.loopCharacterAnimation();
      });
    });
  };
  var skip = App.el('button', 'btn btn-sm', 'Saltar');
  skip.onclick = function () { s.i++; renderWriting(w); };
  var quit = App.el('button', 'btn btn-sm', 'Terminar');
  quit.onclick = function () { renderRoundStats(w); };
  row.appendChild(hint); row.appendChild(skip); row.appendChild(quit);
  w.appendChild(row);
}

/* ---------- contrarreloj ---------- */
function startRush(w) {
  var p = pool();
  state = { rush: true, ok: 0, total: 0, ends: Date.now() + 60000 };
  nextRush(w, p);
}
function nextRush(w, p) {
  clearBelow(w);
  var s = state;
  if (!s || Date.now() >= s.ends) {
    var ok = s ? s.ok : 0, total = s ? s.total : 0;
    state = null;
    return renderResults(w, ok, Math.max(total, 1), 'contrarreloj');
  }
  var word = App.sample(p, 1)[0];
  var q = makeQ(p, word, 'read');

  var top = App.el('div', 'q-top',
    '<span class="q-count">Contrarreloj · ' + s.ok + '/' + s.total + '</span>' +
    '<span class="q-timer" id="rush-t"></span>');
  w.appendChild(top);
  function tick() {
    var el = App.$('rush-t');
    if (!el || !el.isConnected || !state || !state.rush) { stopTimer(); return; }
    var left = Math.max(0, Math.ceil((state.ends - Date.now()) / 1000));
    el.textContent = '⏱ ' + left + 's';
    if (left <= 0) { stopTimer(); nextRush(w, p); }
  }
  stopTimer();
  timerId = setInterval(tick, 250);
  tick();

  var prompt = App.el('div', 'q-prompt',
    '<span class="q-prompt-label">¿Qué significa?</span>' + hanziBlock(word));
  w.appendChild(prompt);

  var opts = App.el('div', 'q-opts');
  var answered = false;
  q.opts.forEach(function (o) {
    var b = App.el('button', 'q-opt');
    b.textContent = App.S.showTrans ? App.short(o) : o.p;
    b.onclick = function () {
      if (answered) return;
      answered = true;
      var right = o.s === word.s;
      s.total++;
      if (right) { s.ok++; App.xp(2); }
      App.day(right ? 'ok' : 'bad', 1);
      b.classList.add(right ? 'ok' : 'bad');
      if (right) b.insertAdjacentHTML('afterbegin', '<span class="opt-check">✓</span>');
      setTimeout(function () { nextRush(w, p); }, right ? 250 : 700);
    };
    opts.appendChild(b);
  });
  w.appendChild(opts);
}

/* ---------- examen ---------- */
function startExam(w) {
  var modes = 'speechSynthesis' in window ? ['read', 'trans', 'listen'] : ['read', 'trans'];
  state = {
    qs: makeQs(20, modes), i: 0, ok: 0, name: 'Examen',
    exam: true, ends: Date.now() + 10 * 60000, started: Date.now()
  };
  renderExamQ(w);
}
function renderExamQ(w) {
  var s = state;
  if (!s) return renderHub(w);
  if (s.i >= s.qs.length || Date.now() >= s.ends) return finishExam(w);

  s.topFn = function () { return '<span class="q-timer" id="exam-t"></span>'; };
  renderQ(w, function () { finishExam(w); }, s.topFn());

  function tick() {
    var el = App.$('exam-t');
    if (!state || !state.exam) { stopTimer(); return; }
    if (!el || !el.isConnected) return; // se re-renderiza entre preguntas
    var left = Math.max(0, Math.ceil((state.ends - Date.now()) / 1000));
    el.textContent = '⏱ ' + Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2);
    if (left <= 0) { stopTimer(); finishExam(w); }
  }
  stopTimer();
  timerId = setInterval(tick, 500);
  tick();
}
function finishExam(w) {
  stopTimer();
  var s = state;
  if (!s) return renderHub(w);
  state = null;
  var secs = Math.round((Date.now() - s.started) / 1000);
  App.G.examHist.push({ date: Date.now(), score: s.ok, total: s.qs.length, secs: secs, scheme: App.S.scheme, level: App.S.level });
  App.G.examHist = App.G.examHist.slice(-30);
  App.saveG();
  App.checkBadges();
  clearBelow(w);
  var pct = Math.round(s.ok / s.qs.length * 100);
  var d = App.el('div', 'done-card',
    '<div class="done-zh">' + (pct >= 80 ? '通过!' : '加油!') + '</div>' +
    '<div class="done-title">Examen: ' + s.ok + ' / ' + s.qs.length + '</div>' +
    '<div class="done-sub">' + pct + '% · ' + Math.floor(secs / 60) + ':' + ('0' + secs % 60).slice(-2) + ' min · nivel ' +
    App.lvlName(App.S.scheme, App.S.level) + (pct >= 80 ? '<br>¡Aprobado! 🎓' : '<br>Se aprueba con 80 %') + '</div>');
  w.appendChild(d);
  App.xp(pct >= 80 ? 40 : 10);
  var b = App.el('button', 'btn btn-jade', 'Volver a práctica');
  b.style.margin = '0.9rem auto 0';
  b.onclick = function () { renderHub(w); };
  w.appendChild(b);
}

/* nota: renderQ usa s.topFn si existe para refrescar el timer del examen */

})();
