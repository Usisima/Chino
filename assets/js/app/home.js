'use strict';

/* ==================== INICIO ==================== */
(function () {

App.views.home = function () {
  var w = App.$('home-wrap');
  w.innerHTML = '';
  w.appendChild(App.el('p', 'page-title', '<span class="zh">汉语</span> · Chino HSK'));
  w.appendChild(App.el('div', 'title-divider'));

  App.ready.then(function () { renderHome(w); });
};

function renderHome(w) {
  if (App.currentView !== 'home') return;
  // limpia todo menos título+divisor
  while (w.children.length > 2) w.removeChild(w.lastChild);

  var t = App.todayStats();
  var counts = App.srsCounts();
  var streak = App.streak();
  var lp = App.lvlProgress();

  /* anillo de meta diaria */
  var goal = App.S.goal || 20;
  var pct = Math.min(100, Math.round(t.rev / goal * 100));
  var C = 2 * Math.PI * 56;
  var ring = App.el('div', 'card', '');
  ring.style.display = 'flex';
  ring.style.alignItems = 'center';
  ring.style.gap = '1rem';
  ring.innerHTML =
    '<div class="ring-wrap" style="flex-shrink:0">' +
      '<svg class="ring-svg" viewBox="0 0 128 128">' +
        '<circle class="ring-bg" cx="64" cy="64" r="56"/>' +
        '<circle class="ring-fg" cx="64" cy="64" r="56" stroke-dasharray="' + C + '" stroke-dashoffset="' + (C * (1 - pct / 100)) + '"/>' +
      '</svg>' +
      '<div class="ring-center"><span class="ring-num">' + t.rev + '</span><span class="ring-label">de ' + goal + '</span></div>' +
    '</div>' +
    '<div style="flex:1;min-width:0">' +
      '<div class="mode-name" style="margin-bottom:4px">Meta diaria</div>' +
      '<div class="mode-desc">' + (pct >= 100 ? '¡Meta cumplida! 加油' : 'Repasa ' + (goal - t.rev) + ' palabras más hoy') + '</div>' +
      '<div class="mode-desc" style="margin-top:8px">🔥 Racha: <b style="color:var(--gold)">' + streak + ' ' + (streak === 1 ? 'día' : 'días') + '</b></div>' +
      '<div class="mode-desc" style="margin-top:4px">Nivel de estudiante <b style="color:var(--gold)">' + lp.lvl + '</b> · ' + lp.pct + '% al siguiente</div>' +
    '</div>';
  w.appendChild(ring);

  /* stats del día */
  var acc = (t.ok + t.bad) ? Math.round(t.ok / (t.ok + t.bad) * 100) + '%' : '—';
  var stats = App.el('div', 'statsrow');
  stats.innerHTML =
    '<div class="stat-card"><span class="stat-val">' + counts.total + '</span><span class="stat-key">Estudiadas</span></div>' +
    '<div class="stat-card"><span class="stat-val">' + counts.known + '</span><span class="stat-key">Dominadas</span></div>' +
    '<div class="stat-card"><span class="stat-val">' + acc + '</span><span class="stat-key">Precisión hoy</span></div>' +
    '<div class="stat-card"><span class="stat-val">' + App.fmtMin(t.secs) + '</span><span class="stat-key">Tiempo hoy</span></div>';
  w.appendChild(stats);

  /* repasos pendientes */
  var due = App.srsDue().length;
  var quick = App.el('div', 'card tappable');
  quick.style.marginTop = '0.55rem';
  quick.innerHTML =
    '<div style="display:flex;align-items:center;gap:1rem">' +
      '<div class="mode-icon">复</div>' +
      '<div class="mode-info"><div class="mode-name">' + (due ? due + ' repasos pendientes' : 'Sin repasos pendientes') + '</div>' +
      '<div class="mode-desc">' + (due ? 'El repaso espaciado mantiene la memoria fresca' : 'Aprende palabras nuevas o practica') + '</div></div>' +
      '<svg class="mode-arrow" viewBox="0 0 24 24"><use href="#icon-arrow"/></svg>' +
    '</div>';
  quick.onclick = function () { App.goto('practice'); };
  w.appendChild(quick);

  /* misiones del día */
  w.appendChild(App.el('p', 'section-title', 'Misiones diarias'));
  var mCard = App.el('div', 'card');
  var m = App.G.missions && App.G.missions.date === App.today() ? App.G.missions : { prog: {}, done: {} };
  App.MISSIONS.forEach(function (def) {
    var prog = def.id === 'time' ? Math.floor((t.secs || 0) / 60) : (m.prog[def.id] || 0);
    var done = !!m.done[def.id];
    var row = App.el('div', 'mission-row',
      '<div class="mission-ico">' + def.ico + '</div>' +
      '<div class="mission-info"><div class="mission-name">' + def.name + '</div>' +
      '<div class="mission-prog">' + Math.min(prog, def.goal) + ' / ' + def.goal + '</div></div>' +
      (done ? '<span class="mission-done">✓ +15 XP</span>' : ''));
    mCard.appendChild(row);
  });
  w.appendChild(mCard);

  /* palabra del día */
  var seed = Math.floor(Date.now() / 86400000);
  var pool = App.levelWords(App.S.scheme, App.S.level);
  if (!pool.length) pool = App.W.slice(0, 500);
  var wd = pool[seed % pool.length];
  var wotd = App.el('div', 'card tappable');
  wotd.style.textAlign = 'center';
  wotd.innerHTML =
    '<div class="stat-key" style="letter-spacing:0.18em;margin-bottom:8px">Palabra del día · 今日单词</div>' +
    '<div class="wd-hanzi" style="font-size:2.6rem">' + App.esc(App.disp(wd)) + '</div>' +
    '<div class="w-pinyin" style="font-size:0.85rem;margin-top:4px">' + App.esc(App.roman(wd)) + '</div>' +
    '<div class="w-es" style="margin-top:6px;-webkit-line-clamp:3">' + App.esc(App.trans(wd)) + '</div>';
  wotd.onclick = function () { App.openWord(wd); };
  w.appendChild(wotd);

  /* accesos rápidos */
  var pills = App.el('div', 'pills');
  [['learn', 'icon-cards', 'Aprender'], ['dict', 'icon-search', 'Diccionario'], ['practice', 'icon-zap', 'Práctica']].forEach(function (p) {
    var b = App.el('button', 'pill', '<svg viewBox="0 0 24 24"><use href="#' + p[1] + '"/></svg>' + p[2]);
    b.onclick = function () { App.goto(p[0]); };
    pills.appendChild(b);
  });
  var inst = App.el('button', 'btn btn-jade', '<svg viewBox="0 0 24 24"><use href="#icon-dl"/></svg>Instalar aplicación');
  inst.id = 'btn-install';
  inst.style.display = window.deferredPrompt ? 'flex' : 'none';
  inst.onclick = function () {
    if (!window.deferredPrompt) return;
    window.deferredPrompt.prompt();
    window.deferredPrompt.userChoice.then(function () {
      window.deferredPrompt = null;
      inst.style.display = 'none';
    });
  };
  pills.appendChild(inst);
  w.appendChild(pills);
}

})();
