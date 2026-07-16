'use strict';

/* ==================== APRENDER: SRS + flashcards ==================== */
(function () {

var session = null; // {type:'srs'|'new'|'free', deck, i, ok, bad, neu}

App.views.learn = function () {
  var w = App.$('learn-wrap');
  w.innerHTML = '';
  w.appendChild(App.el('p', 'page-title', '<span class="zh">学习</span> · Aprender'));
  w.appendChild(App.el('div', 'title-divider'));
  App.ready.then(function () {
    if (App.currentView !== 'learn') return;
    if (session) renderSession(w); else renderMenu(w);
  });
};

function clearBelowTitle(w) { while (w.children.length > 2) w.removeChild(w.lastChild); }

/* ---------- menú ---------- */
function renderMenu(w) {
  clearBelowTitle(w);
  session = null;

  /* esquema HSK */
  var seg = App.el('div', 'seg');
  [['new', 'HSK 3.0 (2021)'], ['old', 'HSK 2.0 (clásico)']].forEach(function (s) {
    var b = App.el('button', App.S.scheme === s[0] ? 'active' : '', s[1]);
    b.onclick = function () {
      App.S.scheme = s[0];
      if (App.S.scheme === 'old' && App.S.level > 6) App.S.level = 6;
      App.saveS(); renderMenu(w);
    };
    seg.appendChild(b);
  });
  w.appendChild(seg);

  /* niveles */
  var grid = App.el('div', 'lvl-grid');
  App.LEVELS[App.S.scheme].forEach(function (l) {
    var k = App.knownInLevel(App.S.scheme, l);
    var tile = App.el('div', 'lvl-tile' + (App.S.level === l ? ' active' : ''),
      '<div class="lvl-num">' + App.lvlName(App.S.scheme, l) + '</div>' +
      '<div class="lvl-count">' + k.seen + '/' + k.total + '</div>' +
      '<div class="lvl-mini-bar"><div class="lvl-mini-fill" style="width:' + (k.total ? Math.round(k.seen / k.total * 100) : 0) + '%"></div></div>');
    tile.onclick = function () { App.S.level = l; App.saveS(); renderMenu(w); };
    grid.appendChild(tile);
  });
  w.appendChild(grid);

  var pool = App.levelWords(App.S.scheme, App.S.level);
  var due = App.srsDue();
  var dueLvl = App.srsDue(pool);
  var news = App.srsNew(pool, 10);

  w.appendChild(App.el('p', 'section-title', 'Repaso espaciado (SRS)'));

  var cardRev = modeCard('复', due.length ? 'Repasar · ' + due.length + ' pendientes' : 'Repasar', 'Todas las palabras cuyo repaso toca hoy' + (dueLvl.length ? ' (' + dueLvl.length + ' de este nivel)' : ''));
  cardRev.onclick = function () {
    if (!due.length) { App.toast('No hay repasos pendientes 🎉'); return; }
    startSession('srs', App.shuffle(due.slice(0, 40)));
    renderSession(w);
  };
  w.appendChild(cardRev);

  var cardNew = modeCard('新', 'Palabras nuevas', news.length ? 'Aprende 10 palabras nuevas del nivel ' + App.lvlName(App.S.scheme, App.S.level) : 'Ya estudiaste todas las de este nivel');
  cardNew.onclick = function () {
    if (!news.length) { App.toast('Nivel completo ✓'); return; }
    startSession('new', news);
    renderSession(w);
  };
  w.appendChild(cardNew);

  w.appendChild(App.el('p', 'section-title', 'Estudio libre'));

  var cardFree = modeCard('卡', 'Flashcards libres', 'Sesión de 15 tarjetas del nivel, sin afectar el SRS');
  cardFree.onclick = function () {
    if (!pool.length) { App.toast('Este nivel no tiene palabras'); return; }
    startSession('free', App.sample(pool, 15));
    renderSession(w);
  };
  w.appendChild(cardFree);

  var cardBrowse = modeCard('词', 'Vocabulario del nivel', pool.length + ' palabras del nivel ' + App.lvlName(App.S.scheme, App.S.level));
  cardBrowse.onclick = function () { browseLevel(pool); };
  w.appendChild(cardBrowse);

  w.appendChild(App.el('p', 'section-title', 'Lecciones'));
  var les = App.el('div', 'card',
    '<div style="display:flex;align-items:center;gap:1rem">' +
      '<div class="mode-icon">课</div>' +
      '<div class="mode-info"><div class="mode-name">Lecciones estructuradas</div>' +
      '<div class="mode-desc">Vocabulario + gramática + comprensión por unidades · <b style="color:var(--gold2)">próximamente</b></div></div>' +
    '</div>');
  w.appendChild(les);
}

function modeCard(zh, name, desc) {
  var c = App.el('div', 'mode-card');
  c.innerHTML =
    '<div class="mode-icon">' + zh + '</div>' +
    '<div class="mode-info"><div class="mode-name">' + name + '</div><div class="mode-desc">' + desc + '</div></div>' +
    '<svg class="mode-arrow" viewBox="0 0 24 24"><use href="#icon-arrow"/></svg>';
  return c;
}

function browseLevel(pool) {
  App.openOverlay('Nivel ' + App.lvlName(App.S.scheme, App.S.level) + ' · ' + pool.length + ' palabras', function (body) {
    var shown = 0;
    var listEl = App.el('div');
    body.appendChild(listEl);
    function more() {
      var next = pool.slice(shown, shown + 100);
      next.forEach(function (word) { listEl.appendChild(App.wordRow(word)); });
      shown += next.length;
      btn.style.display = shown < pool.length ? 'flex' : 'none';
      btn.textContent = 'Mostrar más (' + (pool.length - shown) + ' restantes)';
    }
    var btn = App.el('button', 'btn');
    btn.style.margin = '0.6rem auto';
    btn.onclick = more;
    body.appendChild(btn);
    more();
  });
}

/* ---------- sesiones ---------- */
function startSession(type, deck) {
  session = { type: type, deck: deck.slice(), i: 0, ok: 0, bad: 0, neu: 0 };
}

/* estudiar un mazo arbitrario (listas, favoritos) como flashcards libres */
App.studyDeck = function (deck) {
  startSession('free', deck);
  App.goto('learn');
};

function renderSession(w) {
  clearBelowTitle(w);
  var s = session;
  if (!s) return renderMenu(w);

  if (s.i >= s.deck.length) return renderDone(w);

  var word = s.deck[s.i];
  var title = { srs: 'Repaso', new: 'Palabras nuevas', free: 'Flashcards' }[s.type];

  var meta = App.el('div', 'fc-meta',
    '<span class="fc-count">' + title + ' · ' + (s.i + 1) + ' / ' + s.deck.length + '</span>' +
    '<span class="fc-cat-tag">' + (App.lvlTag(word) || '') + '</span>');
  w.appendChild(meta);

  var scene = App.el('div', 'fc-scene');
  var card = App.el('div', 'fc-card');
  var roman = App.esc(App.roman(word));
  card.innerHTML =
    '<div class="fc-face fc-front">' +
      '<span class="fc-hanzi">' + App.dispTone(word) + '</span>' +
      (s.type === 'new' ? '<span class="fc-pinyin">' + roman + '</span>' : '') +
      '<span class="fc-tap">Toca para voltear</span>' +
    '</div>' +
    '<div class="fc-face fc-back">' +
      '<span class="fc-hanzi">' + App.esc(App.disp(word)) + '</span>' +
      '<span class="fc-pinyin">' + App.esc(word.p) + '</span>' +
      (word.z && App.S.roman !== 'py' ? '<span class="fc-zhuyin">' + App.esc(word.z) + '</span>' : '') +
      '<span class="fc-es">' + App.esc(word.es || word.en) + '</span>' +
      '<button class="icon-btn" data-a="det" title="Ver ficha" style="margin-top:6px"><svg viewBox="0 0 24 24"><use href="#icon-search"/></svg></button>' +
      '<span class="fc-tap">Toca para voltear</span>' +
    '</div>';
  card.onclick = function (ev) {
    if (ev.target.closest('.icon-btn')) return;
    card.classList.toggle('flip');
    if (card.classList.contains('flip')) App.speak(App.disp(word));
  };
  card.querySelector('[data-a="det"]').onclick = function (e) { e.stopPropagation(); App.openWord(word); };
  scene.appendChild(card);
  w.appendChild(scene);

  var actions = App.el('div', 'fc-actions');
  var no = App.el('button', 'fc-btn fc-btn-no', s.type === 'new' ? 'Difícil' : 'Otra vez');
  var si = App.el('button', 'fc-btn fc-btn-si', s.type === 'new' ? 'Entendida' : 'Bien');
  no.onclick = function () {
    s.bad++;
    if (s.type !== 'free') App.srsReview(word, false);
    // reintenta más adelante
    var pos = Math.min(s.deck.length, s.i + 3 + Math.floor(Math.random() * 3));
    s.deck.splice(pos, 0, word);
    s.i++;
    renderSession(w);
  };
  si.onclick = function () {
    s.ok++;
    if (s.type !== 'free') {
      var wasNew = !App.srsGet(word.s);
      App.srsReview(word, true);
      if (wasNew) { s.neu++; App.day('neu', 1); }
    }
    s.i++;
    renderSession(w);
  };
  actions.appendChild(no);
  actions.appendChild(si);
  w.appendChild(actions);

  var quit = App.el('button', 'btn btn-sm', 'Terminar sesión');
  quit.style.margin = '1rem auto 0';
  quit.onclick = function () { session = null; renderMenu(w); };
  w.appendChild(quit);
}

function renderDone(w) {
  var s = session;
  session = null;
  var pct = (s.ok + s.bad) ? Math.round(s.ok / (s.ok + s.bad) * 100) : 100;
  App.mission('quiz', 1);
  if (pct === 100 && s.ok >= 5) { App.G.perfect = 1; App.saveG(); App.checkBadges(); }

  var d = App.el('div', 'done-card',
    '<div class="done-zh">' + (pct >= 80 ? '很好!' : pct >= 50 ? '不错!' : '加油!') + '</div>' +
    '<div class="done-title">Sesión terminada</div>' +
    '<div class="done-sub">' + s.ok + ' bien · ' + s.bad + ' difíciles · ' + pct + '%' +
    (s.neu ? '<br>' + s.neu + ' palabras nuevas en tu SRS' : '') + '</div>');
  w.appendChild(d);

  var again = App.el('button', 'btn btn-jade', 'Continuar');
  again.style.margin = '0.9rem auto 0';
  again.onclick = function () { renderMenu(w); };
  w.appendChild(again);
}

})();
