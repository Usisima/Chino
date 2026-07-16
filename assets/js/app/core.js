'use strict';

/* ==================================================================
   Chino · HSK — núcleo: datos, ajustes, SRS, gamificación, UI común
   ================================================================== */
var App = window.App = {};

/* ---------- almacenamiento ---------- */
App.load = function (key, fallback) {
  try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
  catch (e) { return fallback; }
};
App.save = function (key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
};

/* ---------- ajustes ---------- */
App.S = Object.assign({
  script: 's',        // 's' simplificado | 't' tradicional
  roman: 'py',        // 'py' pinyin | 'zy' zhuyin | 'both' | 'none'
  showTrans: true,    // mostrar traducciones
  scheme: 'new',      // 'new' HSK 3.0 | 'old' HSK 2.0
  level: 1,
  goal: 20,           // meta diaria (repasos)
  rate: 0.85,         // velocidad TTS
  reminders: false
}, App.load('chino_settings', {}));
App.saveS = function () { App.save('chino_settings', App.S); };

/* ---------- utilidades ---------- */
App.$ = function (id) { return document.getElementById(id); };
App.el = function (tag, cls, html) {
  var n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};
App.esc = function (s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
App.norm = function (s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s'·.-]/g, '');
};
App.shuffle = function (a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
};
App.sample = function (arr, n) { return App.shuffle(arr.slice()).slice(0, n); };
App.today = function () {
  var d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
};
App.fmtMin = function (secs) {
  var m = Math.round(secs / 60);
  return m >= 60 ? Math.floor(m / 60) + 'h ' + (m % 60) + 'm' : m + ' min';
};
/* lee un token CSS (para colores que dependen del tema claro/oscuro) */
App.cssVar = function (name, fallback) {
  var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
};
/* colores de HanziWriter según el tema actual */
App.hwColors = function () {
  return {
    strokeColor: App.cssVar('--ink', '#16203A'),
    outlineColor: App.cssVar('--hw-outline', 'rgba(22,32,58,0.16)'),
    drawingColor: App.cssVar('--gold', '#2C5BE0')
  };
};

/* ---------- tema (claro / oscuro / automático) ---------- */
App.applyTheme = function () {
  var t = App.S.theme;
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  else document.documentElement.removeAttribute('data-theme');
};
App.toggleTheme = function () {
  // estado efectivo actual → alterna al contrario
  var forced = document.documentElement.getAttribute('data-theme');
  var eff = forced || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  App.S.theme = eff === 'dark' ? 'light' : 'dark';
  App.saveS();
  App.applyTheme();
};
App.applyTheme();

/* ---------- toast ---------- */
var toastTimer = null;
App.toast = function (msg) {
  var t = App.$('toast');
  t.textContent = msg;
  t.style.display = 'block';
  t.style.animation = 'none'; void t.offsetHeight; t.style.animation = '';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.style.display = 'none'; }, 2600);
};

/* ---------- datos ---------- */
App.W = [];            // palabras
App.CHARS = {};        // caracteres
App.RADS = [];         // radicales [rad, count]
App.byS = {};          // simplificado -> palabra
App.byChar = {};       // carácter -> [palabras]
var strokeCache = {};  // shard -> Promise

App.LEVELS = { old: [1, 2, 3, 4, 5, 6], new: [1, 2, 3, 4, 5, 6, 7] };
App.lvlName = function (scheme, l) {
  return scheme === 'new' && l === 7 ? '7–9' : String(l);
};

App.ready = (function () {
  function j(u) { return fetch(u).then(function (r) { if (!r.ok) throw new Error(u); return r.json(); }); }
  return Promise.all([j('assets/data/words.json'), j('assets/data/chars.json'), j('assets/data/radicals.json')])
    .then(function (res) {
      App.CHARS = res[1].chars;
      App.RADS = res[2];
      App.W = res[0].words.map(function (a) {
        return {
          s: a[0], t: a[1], p: a[2], z: a[3], en: a[4], es: a[5],
          cls: a[6], pos: a[7], rad: a[8], freq: a[9], l2: a[10], l3: a[11]
        };
      });
      App.W.forEach(function (w) {
        if (!App.byS[w.s]) App.byS[w.s] = w;
        var seen = {};
        (w.s + (w.t || '')).split('').forEach(function (ch) {
          if (seen[ch] || !/[㐀-鿿]/.test(ch)) return;
          seen[ch] = 1;
          (App.byChar[ch] = App.byChar[ch] || []).push(w);
        });
      });
      return App;
    });
})();

/* búsqueda: claves normalizadas perezosas */
function keys(w) {
  if (!w._k) {
    w._k = {
      py: App.norm(w.p),
      tx: (w.es + ' ' + w.en).toLowerCase()
    };
  }
  return w._k;
}
App.search = function (q, opts) {
  opts = opts || {};
  q = q.trim();
  if (!q) return [];
  var isHan = /[㐀-鿿]/.test(q);
  var nq = App.norm(q), lq = q.toLowerCase();
  var out = [], starts = [], contains = [];
  for (var i = 0; i < App.W.length; i++) {
    var w = App.W[i];
    if (opts.rad && w.rad !== opts.rad) continue;
    if (isHan) {
      if (w.s === q || w.t === q) starts.push(w);
      else if (w.s.indexOf(q) >= 0 || (w.t && w.t.indexOf(q) >= 0)) contains.push(w);
    } else {
      var k = keys(w);
      if (k.py === nq) starts.push(w);
      else if (k.py.indexOf(nq) === 0) starts.push(w);
      else if ((' ' + k.tx).indexOf(' ' + lq) >= 0) starts.push(w); // límite de palabra en la traducción
      else if (k.py.indexOf(nq) >= 0 || k.tx.indexOf(lq) >= 0) contains.push(w);
    }
    if (starts.length + contains.length > 400) break;
  }
  out = starts.concat(contains);
  return out.slice(0, opts.limit || 60);
};

/* trazos: shard perezoso */
App.strokes = function (ch) {
  var shard = ch.codePointAt(0) % 48;
  if (!strokeCache[shard]) {
    strokeCache[shard] = fetch('assets/data/strokes/s' + shard + '.json')
      .then(function (r) { return r.ok ? r.json() : {}; })
      .catch(function () { return {}; });
  }
  return strokeCache[shard].then(function (m) { return m[ch] || null; });
};

/* ---------- presentación según ajustes ---------- */
App.disp = function (w) { return App.S.script === 't' && w.t ? w.t : w.s; };
App.roman = function (w) {
  if (App.S.roman === 'none') return '';
  if (App.S.roman === 'py') return w.p;
  if (App.S.roman === 'zy') return w.z || w.p;
  return w.p + (w.z ? ' · ' + w.z : '');
};
App.trans = function (w) {
  if (!App.S.showTrans) return '···';
  return w.es || w.en;
};
/* glosa corta: primera acepción, para opciones de quiz y fichas de juego */
App.gloss = function (w) {
  var t = w.es || w.en || '';
  var first = t.split(/\s*[|;]\s*/)[0].trim();
  if (first.length > 28) first = first.split(/,\s*/)[0].trim();
  return first;
};
App.short = function (w) {
  if (!App.S.showTrans) return '···';
  return App.gloss(w) || App.trans(w);
};
App.lvlTag = function (w) {
  var parts = [];
  if (w.l3) parts.push('HSK3 ' + App.lvlName('new', w.l3));
  if (w.l2) parts.push('HSK2 ' + w.l2);
  return parts.join(' · ');
};

/* categorías gramaticales en español */
var POS_ES = {
  n: 'sustantivo', v: 'verbo', a: 'adjetivo', d: 'adverbio', m: 'numeral',
  q: 'clasificador', r: 'pronombre', p: 'preposición', c: 'conjunción',
  u: 'partícula', i: 'modismo', l: 'locución', o: 'onomatopeya',
  e: 'interjección', y: 'partícula modal', t: 'sustantivo de tiempo',
  f: 'localizador', s: 'sustantivo de lugar', z: 'adjetivo descriptivo',
  x: 'no clasificado', nz: 'nombre propio', ns: 'topónimo', nr: 'nombre de persona',
  nt: 'organización', vn: 'verbo-sustantivo'
};
App.posES = function (pos) {
  if (!pos) return '';
  return pos.split(',').map(function (p) {
    return POS_ES[p.trim().toLowerCase()] || '';
  }).filter(Boolean).join(', ');
};
App.levelWords = function (scheme, lvl) {
  var f = scheme === 'old' ? 'l2' : 'l3';
  return App.W.filter(function (w) { return w[f] === lvl; });
};

/* ---------- audio (TTS) ---------- */
var zhVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  var vs = speechSynthesis.getVoices();
  for (var i = 0; i < vs.length; i++) {
    if (/^zh([-_]CN)?$/i.test(vs[i].lang)) { zhVoice = vs[i]; break; }
    if (/^zh/i.test(vs[i].lang) && !zhVoice) zhVoice = vs[i];
  }
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
/* ---------- color por tono del pinyin ---------- */
var TONE_MAP = {};
['āáǎà', 'ēéěè', 'īíǐì', 'ōóǒò', 'ūúǔù', 'ǖǘǚǜ'].forEach(function (g) {
  g.split('').forEach(function (ch, i) { TONE_MAP[ch] = i + 1; });
});
App.toneNum = function (syl) {
  syl = String(syl || '');
  for (var i = 0; i < syl.length; i++) { if (TONE_MAP[syl[i]]) return TONE_MAP[syl[i]]; }
  return syl.trim() ? 5 : 0; // sin marca = neutro (5)
};
/* devuelve el hanzi con cada carácter envuelto en <span class="tN"> según su tono */
App.toneSpans = function (hanzi, pinyin) {
  hanzi = String(hanzi == null ? '' : hanzi);
  var syls = String(pinyin || '').trim().split(/\s+/).filter(Boolean);
  var hz = hanzi.split('').filter(function (c) { return /[㐀-鿿]/.test(c); });
  if (!syls.length || syls.length !== hz.length) return App.esc(hanzi); // sin alineación segura
  var out = '', si = 0;
  hanzi.split('').forEach(function (ch) {
    if (/[㐀-鿿]/.test(ch)) {
      var t = App.toneNum(syls[si++]);
      out += t ? '<span class="t' + t + '">' + App.esc(ch) + '</span>' : App.esc(ch);
    } else { out += App.esc(ch); }
  });
  return out;
};
App.dispTone = function (w) { return App.toneSpans(App.disp(w), w.p); };

App.speak = function (text) {
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'zh-CN';
    if (zhVoice) u.voice = zhVoice;
    u.rate = App.S.rate;
    speechSynthesis.speak(u);
  } catch (e) {}
};

/* ==================================================================
   SRS — SM-2 simplificado
   ================================================================== */
var DAY = 86400000;
App.srs = App.load('chino_srs', {});
App.srsSave = function () { App.save('chino_srs', App.srs); };

App.srsGet = function (s) { return App.srs[s] || null; };
App.srsStage = function (s) {
  var it = App.srs[s];
  if (!it) return 'new';
  return it.iv >= 21 ? 'known' : 'learning';
};
App.srsReview = function (w, pass) {
  var it = App.srs[w.s] || { ef: 2.5, iv: 0, due: 0, reps: 0, lapses: 0 };
  if (pass) {
    it.reps++;
    it.iv = it.iv === 0 ? 1 : it.iv === 1 ? 3 : Math.round(it.iv * it.ef);
    if (it.iv > 365) it.iv = 365;
    it.ef = Math.min(3, it.ef + 0.05);
    it.due = Date.now() + it.iv * DAY;
  } else {
    it.lapses++;
    it.ef = Math.max(1.3, it.ef - 0.2);
    it.iv = 0;
    it.due = Date.now() + 10 * 60 * 1000;
  }
  App.srs[w.s] = it;
  App.srsSave();
  App.day(pass ? 'ok' : 'bad', 1);
  App.day('rev', 1);
  App.mission('rev', 1);
  App.xp(pass ? 2 : 1);
};
App.srsDue = function (pool) {
  var now = Date.now();
  return (pool || App.W).filter(function (w) {
    var it = App.srs[w.s];
    return it && it.due <= now;
  });
};
App.srsNew = function (pool, n) {
  var out = [];
  for (var i = 0; i < pool.length && out.length < n; i++) {
    if (!App.srs[pool[i].s]) out.push(pool[i]);
  }
  return out;
};
App.srsCounts = function () {
  var c = { total: 0, known: 0, learning: 0 };
  for (var s in App.srs) {
    c.total++;
    if (App.srs[s].iv >= 21) c.known++; else c.learning++;
  }
  return c;
};
App.knownInLevel = function (scheme, lvl) {
  var ws = App.levelWords(scheme, lvl), n = 0;
  ws.forEach(function (w) { if (App.srsStage(w.s) !== 'new') n++; });
  return { seen: n, total: ws.length };
};

/* migración desde la v1 (HSK1 sencilla) */
(function () {
  var old = App.load('hsk1_aprendidas_v1', null);
  if (old && !Object.keys(App.srs).length) {
    var n = 0;
    for (var h in old) {
      App.srs[h] = { ef: 2.5, iv: 30, due: Date.now() + Math.floor(Math.random() * 20 + 5) * DAY, reps: 3, lapses: 0 };
      n++;
    }
    if (n) { App.srsSave(); }
  }
})();

/* ==================================================================
   Gamificación: XP, monedas, días, misiones, insignias
   ================================================================== */
App.G = Object.assign({
  xp: 0,
  badges: {},           // id -> timestamp
  days: {},             // fecha -> {secs, rev, ok, bad, neu}
  missions: null,       // {date, prog:{}, done:{}}
  examHist: [],         // [{date, mode, score, total, secs}]
  written: 0,           // caracteres escritos correctamente
  searches: 0
}, App.load('chino_gam', {}));
App.saveG = function () { App.save('chino_gam', App.G); };

App.day = function (field, inc) {
  var t = App.today();
  var d = App.G.days[t] || (App.G.days[t] = { secs: 0, rev: 0, ok: 0, bad: 0, neu: 0 });
  d[field] = (d[field] || 0) + inc;
  App.saveG();
};
App.todayStats = function () {
  return App.G.days[App.today()] || { secs: 0, rev: 0, ok: 0, bad: 0, neu: 0 };
};
App.streak = function () {
  var n = 0, d = new Date();
  var t = App.G.days[App.today()];
  if (!(t && (t.rev > 0 || t.secs >= 60))) d.setDate(d.getDate() - 1); // hoy aún no cuenta
  for (;;) {
    var k = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    var e = App.G.days[k];
    if (e && (e.rev > 0 || e.secs >= 60)) { n++; d.setDate(d.getDate() - 1); }
    else break;
  }
  if (t && (t.rev > 0 || t.secs >= 60)) n++;
  return n;
};

App.lvl = function () { return Math.floor(Math.sqrt(App.G.xp / 60)) + 1; };
App.lvlProgress = function () {
  var l = App.lvl();
  var base = 60 * (l - 1) * (l - 1), next = 60 * l * l;
  return { lvl: l, pct: Math.min(100, Math.round((App.G.xp - base) / (next - base) * 100)), next: next };
};
App.xp = function (n) {
  App.G.xp += n;
  App.saveG();
  App.hdr();
  App.checkBadges();
};
App.hdr = function () {
  App.$('hdr-xp').textContent = App.G.xp + ' XP';
};

/* misiones diarias */
App.MISSIONS = [
  { id: 'rev', ico: '📖', name: 'Repasa 20 palabras', goal: 20 },
  { id: 'time', ico: '⏱️', name: 'Estudia 10 minutos', goal: 10 },
  { id: 'quiz', ico: '⚡', name: 'Completa 2 ejercicios', goal: 2 },
  { id: 'write', ico: '✍️', name: 'Escribe 3 caracteres', goal: 3 }
];
function missionsToday() {
  var t = App.today();
  if (!App.G.missions || App.G.missions.date !== t) {
    App.G.missions = { date: t, prog: {}, done: {} };
    App.saveG();
  }
  return App.G.missions;
}
App.mission = function (id, inc) {
  var m = missionsToday();
  var def = null;
  App.MISSIONS.forEach(function (d) { if (d.id === id) def = d; });
  if (!def || m.done[id]) return;
  m.prog[id] = (m.prog[id] || 0) + inc;
  if (m.prog[id] >= def.goal) {
    m.done[id] = 1;
    App.G.xp += 15;
    App.toast('✅ Misión: ' + def.name + ' · +15 XP');
    App.hdr();
  }
  App.saveG();
};

/* insignias */
App.BADGES = [
  { id: 'w10', ico: '🌱', name: '10 palabras', test: function (c) { return c.total >= 10; } },
  { id: 'w50', ico: '🌿', name: '50 palabras', test: function (c) { return c.total >= 50; } },
  { id: 'w150', ico: '🎋', name: '150 palabras', test: function (c) { return c.total >= 150; } },
  { id: 'w500', ico: '🌳', name: '500 palabras', test: function (c) { return c.total >= 500; } },
  { id: 'w1000', ico: '🏯', name: '1000 palabras', test: function (c) { return c.total >= 1000; } },
  { id: 's3', ico: '🔥', name: 'Racha de 3 días', test: function () { return App.streak() >= 3; } },
  { id: 's7', ico: '🧨', name: 'Racha de 7 días', test: function () { return App.streak() >= 7; } },
  { id: 's30', ico: '🐉', name: 'Racha de 30 días', test: function () { return App.streak() >= 30; } },
  { id: 'xp500', ico: '⭐', name: '500 XP', test: function () { return App.G.xp >= 500; } },
  { id: 'xp2000', ico: '🌟', name: '2000 XP', test: function () { return App.G.xp >= 2000; } },
  { id: 'xp10000', ico: '💫', name: '10 000 XP', test: function () { return App.G.xp >= 10000; } },
  { id: 'write50', ico: '🖌️', name: '50 caracteres escritos', test: function () { return App.G.written >= 50; } },
  { id: 'perfect', ico: '💯', name: 'Ejercicio perfecto', test: function () { return App.G.perfect; } },
  { id: 'exam80', ico: '🎓', name: 'Examen ≥ 80 %', test: function () { return App.G.examHist.some(function (e) { return e.score / e.total >= 0.8; }); } },
  { id: 'know100', ico: '🧠', name: '100 dominadas', test: function (c) { return c.known >= 100; } },
  { id: 'search100', ico: '🔎', name: '100 búsquedas', test: function () { return App.G.searches >= 100; } }
];
App.checkBadges = function () {
  var c = App.srsCounts();
  App.BADGES.forEach(function (b) {
    if (!App.G.badges[b.id] && b.test(c)) {
      App.G.badges[b.id] = Date.now();
      App.toast(b.ico + ' Insignia: ' + b.name);
    }
  });
  App.saveG();
};

/* ---------- favoritos, listas, historial ---------- */
App.favs = App.load('chino_favs', []);
App.isFav = function (s) { return App.favs.indexOf(s) >= 0; };
App.toggleFav = function (s) {
  var i = App.favs.indexOf(s);
  if (i >= 0) App.favs.splice(i, 1); else App.favs.unshift(s);
  App.save('chino_favs', App.favs);
  return i < 0;
};
App.lists = App.load('chino_lists', {});
App.saveLists = function () { App.save('chino_lists', App.lists); };
App.hist = App.load('chino_hist', []);
App.pushHist = function (q) {
  q = q.trim();
  if (!q) return;
  var i = App.hist.indexOf(q);
  if (i >= 0) App.hist.splice(i, 1);
  App.hist.unshift(q);
  App.hist = App.hist.slice(0, 30);
  App.save('chino_hist', App.hist);
  App.G.searches++; App.saveG();
};

/* ==================================================================
   UI común
   ================================================================== */
App.wordRow = function (w, opts) {
  opts = opts || {};
  var stage = App.srsStage(w.s);
  var row = App.el('div', 'w-row' + (stage === 'known' ? ' learned' : ''));
  row.innerHTML =
    '<span class="w-hanzi">' + App.dispTone(w) + '</span>' +
    '<div class="w-info">' +
      '<div class="w-pinyin">' + App.esc(App.roman(w)) + '</div>' +
      '<div class="w-es">' + App.esc(App.trans(w)) + '</div>' +
    '</div>' +
    '<div class="w-actions">' +
      '<button class="icon-btn" data-a="audio" title="Escuchar"><svg viewBox="0 0 24 24"><use href="#icon-audio"/></svg></button>' +
      '<button class="icon-btn' + (App.isFav(w.s) ? ' on' : '') + '" data-a="fav" title="Favorito"><svg viewBox="0 0 24 24"><use href="#icon-star"/></svg></button>' +
    '</div>';
  row.querySelector('[data-a="audio"]').onclick = function (e) { e.stopPropagation(); App.speak(App.disp(w)); };
  row.querySelector('[data-a="fav"]').onclick = function (e) {
    e.stopPropagation();
    var on = App.toggleFav(w.s);
    e.currentTarget.classList.toggle('on', on);
  };
  row.onclick = function () { App.openWord(w); };
  return row;
};

/* ---------- overlay con pila ---------- */
var ovStack = [];
function ovRender() {
  var ov = App.$('overlay');
  if (!ovStack.length) { ov.style.display = 'none'; document.body.style.overflow = ''; return; }
  ov.style.display = 'flex';
  var top = ovStack[ovStack.length - 1];
  App.$('overlay-title').textContent = top.title || '';
  var body = App.$('overlay-body');
  body.innerHTML = '';
  body.scrollTop = 0;
  top.render(body);
}
App.openOverlay = function (title, render) {
  ovStack.push({ title: title, render: render });
  ovRender();
  App.pushState();               // una entrada de historial por ficha abierta
};
/* cerrar = retroceder, para que el historial no se desincronice */
App.closeOverlay = function () {
  if (ovStack.length) history.back(); else ovRender();
};
App.closeAllOverlays = function () {
  var n = ovStack.length;
  if (n) history.go(-n); else ovRender();
};
App.overlayDepth = function () { return ovStack.length; };

/* ---------- ficha de palabra ---------- */
App.openWord = function (w) {
  App.openOverlay(App.disp(w) || 'Palabra', function (body) { renderWord(body, w); });
};

function relWords(w) {
  var rel = [], seen = {};
  seen[w.s] = 1;
  w.s.split('').forEach(function (ch) {
    (App.byChar[ch] || []).forEach(function (o) {
      if (!seen[o.s]) { seen[o.s] = 1; rel.push(o); }
    });
  });
  rel.sort(function (a, b) { return (a.freq || 9e9) - (b.freq || 9e9); });
  return rel.slice(0, 8);
}
function synWords(w) {
  // sinónimos aproximados: comparten un significado (gloss) exacto en inglés
  var glosses = {};
  w.en.split(' | ').forEach(function (g) { glosses[g.toLowerCase().replace(/\(.*?\)/g, '').trim()] = 1; });
  var out = [];
  for (var i = 0; i < App.W.length && out.length < 6; i++) {
    var o = App.W[i];
    if (o.s === w.s) continue;
    var ms = o.en.split(' | ');
    for (var k = 0; k < ms.length; k++) {
      var m = ms[k].toLowerCase().replace(/\(.*?\)/g, '').trim();
      if (m && m.length > 2 && glosses[m]) { out.push(o); break; }
    }
  }
  return out;
}

function renderWord(body, w) {
  var head = App.el('div', 'wd-head');
  var dispS = App.S.script === 't' && w.t ? w.t : w.s;
  var other = App.S.script === 't' && w.t ? w.s : w.t;
  head.innerHTML =
    '<div class="wd-hanzi">' + App.toneSpans(dispS, w.p) + '</div>' +
    (other ? '<div class="wd-trad">' + (App.S.script === 't' ? 'Simplificado: ' : 'Tradicional: ') + App.esc(other) + '</div>' : '') +
    '<div class="wd-pinyin">' + App.esc(w.p) + '</div>' +
    (w.z ? '<div class="wd-zhuyin">' + App.esc(w.z) + '</div>' : '') +
    (w.es ? '<div class="wd-es">' + App.esc(w.es) + '</div>'
          : '<div class="wd-en">' + App.esc(w.en) + ' <span style="font-size:0.65rem;color:var(--ink3)">(EN · aún sin traducir)</span></div>') +
    '<div class="wd-actions">' +
      '<button class="icon-btn" data-a="audio" title="Escuchar" style="width:44px;height:44px"><svg viewBox="0 0 24 24" style="width:18px;height:18px"><use href="#icon-audio"/></svg></button>' +
      '<button class="icon-btn' + (App.isFav(w.s) ? ' on' : '') + '" data-a="fav" title="Favorito" style="width:44px;height:44px"><svg viewBox="0 0 24 24" style="width:18px;height:18px"><use href="#icon-star"/></svg></button>' +
      '<button class="icon-btn" data-a="list" title="Añadir a lista" style="width:44px;height:44px"><svg viewBox="0 0 24 24" style="width:18px;height:18px"><use href="#icon-plus"/></svg></button>' +
    '</div>';
  head.querySelector('[data-a="audio"]').onclick = function () { App.speak(dispS); };
  head.querySelector('[data-a="fav"]').onclick = function (e) {
    var on = App.toggleFav(w.s);
    e.currentTarget.classList.toggle('on', on);
    App.toast(on ? '★ Añadida a favoritos' : 'Quitada de favoritos');
  };
  head.querySelector('[data-a="list"]').onclick = function () { addToListDialog(w); };
  body.appendChild(head);

  // detalles
  var strokesTotal = 0;
  dispS.split('').forEach(function (ch) {
    var c = App.CHARS[ch];
    if (c) strokesTotal += c[3] || 0;
  });
  var it = App.srsGet(w.s);
  var kv = App.el('div', 'card');
  kv.innerHTML =
    (w.cls ? '<div class="kv"><span class="k">Clasificador</span><span class="v zh">' + App.esc(w.cls) + '</span></div>' : '') +
    (w.rad ? '<div class="kv"><span class="k">Radical</span><span class="v"><span class="zh">' + App.esc(w.rad) + '</span></span></div>' : '') +
    (strokesTotal ? '<div class="kv"><span class="k">Trazos</span><span class="v">' + strokesTotal + '</span></div>' : '') +
    (w.pos ? '<div class="kv"><span class="k">Categoría</span><span class="v">' + App.esc(App.posES(w.pos)) + '</span></div>' : '') +
    '<div class="kv"><span class="k">Estudio</span><span class="v">' + (it ? (App.srsStage(w.s) === 'known' ? 'Dominada' : 'Aprendiendo') + ' · ' + it.reps + ' repasos' : 'Sin estudiar') + '</span></div>';
  body.appendChild(kv);

  // caracteres con trazos
  var chars = dispS.split('').filter(function (ch) { return /[㐀-鿿]/.test(ch); });
  if (chars.length) {
    body.appendChild(App.el('p', 'section-title', 'Caracteres y trazos'));
    chars.forEach(function (ch) { body.appendChild(charCard(ch)); });
  }

  // sinónimos
  var syns = synWords(w);
  if (syns.length) {
    body.appendChild(App.el('p', 'section-title', 'Sinónimos aproximados'));
    syns.forEach(function (o) { body.appendChild(App.wordRow(o, { tags: false })); });
  }

  // relacionadas
  var rel = relWords(w);
  if (rel.length) {
    body.appendChild(App.el('p', 'section-title', 'Palabras relacionadas'));
    rel.forEach(function (o) { body.appendChild(App.wordRow(o, { tags: false })); });
  }
}

var ETYM_ES = { ideographic: 'ideográfico', pictographic: 'pictográfico', pictophonetic: 'compuesto fono-semántico' };
function charCard(ch) {
  var c = App.CHARS[ch];
  var card = App.el('div', 'char-card');
  var top = App.el('div', 'char-card-top');
  var box = App.el('div', 'char-writer');
  top.appendChild(box);
  var info = App.el('div', 'char-info');
  if (c) {
    // definición: solo en español (la de la palabra monosílaba equivalente);
    // si no existe aún, se omite — nada de inglés en la interfaz.
    var wES = App.byS[ch] && App.byS[ch].es;
    var defHtml = wES ? App.esc(wES) : '';
    // etimología: solo lo componible en español
    var etym = '';
    if (c[4] === 'pictophonetic' && (c[7] || c[8])) {
      etym = 'Compuesto fono-semántico: ' +
        (c[7] ? '<span class="zh">' + App.esc(c[7]) + '</span> aporta la pronunciación' : '') +
        (c[7] && c[8] ? ' y ' : '') +
        (c[8] ? '<span class="zh">' + App.esc(c[8]) + '</span> el significado' : '') + '.';
    } else if (c[4] && ETYM_ES[c[4]]) {
      etym = 'Carácter ' + ETYM_ES[c[4]] + '.';
    }
    info.innerHTML =
      (defHtml ? '<div class="char-def">' + defHtml + '</div>' : '') +
      '<div class="char-meta">' +
        (c[1] ? c[1] + ' · ' : '') +
        (c[2] ? 'radical <span class="zh">' + App.esc(c[2]) + '</span> · ' : '') +
        (c[3] ? c[3] + ' trazos' : '') +
        (c[6] && c[6] !== '？' ? '<br>descomposición: <span class="zh">' + App.esc(c[6]) + '</span>' : '') +
      '</div>' +
      (etym ? '<div class="etym">' + etym + '</div>' : '');
  } else {
    info.innerHTML = '<div class="char-def">Sin datos del carácter.</div>';
  }
  top.appendChild(info);
  card.appendChild(top);

  var btns = App.el('div', 'char-btns');
  var bAnim = App.el('button', 'btn btn-sm btn-jade', 'Ver trazos');
  var bWrite = App.el('button', 'btn btn-sm', 'Practicar');
  var bAudio = App.el('button', 'btn btn-sm', 'Audio');
  btns.appendChild(bAnim); btns.appendChild(bWrite); btns.appendChild(bAudio);
  card.appendChild(btns);

  var writer = null;
  function makeWriter(cb) {
    App.strokes(ch).then(function (d) {
      if (!d) { if (cb) App.toast('Sin datos de trazos para ' + ch); return; }
      if (!writer) {
        box.innerHTML = '';
        var hw = App.hwColors();
        writer = HanziWriter.create(box, ch, {
          width: 156, height: 156, padding: 10,
          showCharacter: false, showOutline: true,
          strokeColor: hw.strokeColor,
          outlineColor: hw.outlineColor,
          drawingColor: hw.drawingColor,
          drawingWidth: 16,
          strokeAnimationSpeed: 1.1,
          delayBetweenStrokes: 120,
          charDataLoader: function (_c, done) { done({ strokes: d.s, medians: d.m }); }
        });
      }
      if (cb) cb(writer);
    });
  }
  // el símbolo principal es el de los trazos: se dibuja solo al abrir la ficha
  makeWriter(function (wr) { wr.animateCharacter(); });
  bAnim.onclick = function () {
    makeWriter(function (wr) { wr.cancelQuiz(); wr.animateCharacter(); });
  };
  bWrite.onclick = function () {
    makeWriter(function (wr) {
      wr.quiz({
        onComplete: function (res) {
          App.G.written++; App.saveG();
          App.mission('write', 1);
          App.xp(3);
          App.toast('✍️ ' + ch + ' · ' + res.totalMistakes + ' fallos · +3 XP');
        }
      });
    });
  };
  bAudio.onclick = function () { App.speak(ch); };
  return card;
}

function addToListDialog(w) {
  App.openOverlay('Añadir a lista', function (body) {
    var names = Object.keys(App.lists);
    if (!names.length) body.appendChild(App.el('p', 'empty-msg', 'Aún no tienes listas.'));
    names.forEach(function (name) {
      var has = App.lists[name].indexOf(w.s) >= 0;
      var c = App.el('div', 'card tappable',
        '<b>' + App.esc(name) + '</b> <span class="count-line" style="padding:0"> · ' + App.lists[name].length + ' palabras' + (has ? ' · ya incluida' : '') + '</span>');
      c.onclick = function () {
        if (!has) {
          App.lists[name].push(w.s);
          App.saveLists();
          App.toast('Añadida a «' + name + '»');
        }
        App.closeOverlay();
      };
      body.appendChild(c);
    });
    var inp = App.el('input', 'input');
    inp.placeholder = 'Nueva lista…';
    inp.style.marginTop = '0.6rem';
    body.appendChild(inp);
    var b = App.el('button', 'btn btn-jade', 'Crear y añadir');
    b.style.margin = '0.6rem auto 0';
    b.onclick = function () {
      var name = inp.value.trim();
      if (!name) return;
      App.lists[name] = App.lists[name] || [];
      if (App.lists[name].indexOf(w.s) < 0) App.lists[name].push(w.s);
      App.saveLists();
      App.toast('Añadida a «' + name + '»');
      App.closeOverlay();
    };
    body.appendChild(b);
  });
}

/* ---------- navegación ---------- */
App.views = {};
App.currentView = 'home';
/* cada sección puede registrar App.viewBack[nombre] = fn(estado)
   y devolver true para consumir el gesto de regresar (p. ej. ronda → estadísticas) */
App.viewBack = {};
var navSeq = 0;

function applyView(name) {
  App.currentView = name;
  document.querySelectorAll('#main > .view').forEach(function (sec) {
    sec.classList.toggle('active', sec.id === 'view-' + name);
  });
  document.querySelectorAll('.nav-item').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-goto') === name);
  });
  if (App.views[name]) App.views[name]();
}

/* ---------- historial ---------- */
App.navState = function (extra) {
  var st = { v: App.currentView, ov: ovStack.length, s: ++navSeq };
  if (extra) for (var k in extra) st[k] = extra[k];
  return st;
};
App.pushState = function (extra) {
  try { history.pushState(App.navState(extra), '', '#' + App.currentView); } catch (e) {}
};
App.replaceState = function (extra) {
  try { history.replaceState(App.navState(extra), '', '#' + App.currentView); } catch (e) {}
};

App.goto = function (name, replace) {
  // al cambiar de sección se cierran las fichas abiertas
  if (ovStack.length) { ovStack.length = 0; ovRender(); }
  if (name === App.currentView && !replace) { applyView(name); return; }
  applyView(name);
  if (replace) App.replaceState({ sub: 'base' });
  else App.pushState({ sub: 'base' });
};
App.gotoSilent = function (name) { applyView(name); };

window.addEventListener('popstate', function (e) {
  var st = e.state || { v: App.currentView, ov: 0 };
  // 1) hay fichas abiertas de más → cerrar una
  var targetOv = st.ov || 0;
  if (ovStack.length > targetOv) {
    while (ovStack.length > targetOv) ovStack.pop();
    ovRender();
    return;
  }
  // 2) la sección actual puede consumir el gesto
  var h = App.viewBack[App.currentView];
  if (h && h(st)) return;
  // 3) cambiar de sección
  if (st.v && st.v !== App.currentView) App.gotoSilent(st.v);
});
