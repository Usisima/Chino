'use strict';

/* ==================== PERFIL: estadísticas, logros, listas, ajustes ==================== */
(function () {

App.views.profile = function () {
  var w = App.$('profile-wrap');
  w.innerHTML = '';
  w.appendChild(App.el('p', 'page-title', '<span class="zh">我的</span> · Perfil'));
  w.appendChild(App.el('div', 'title-divider'));
  App.ready.then(function () {
    if (App.currentView !== 'profile') return;
    render(w);
  });
};

function render(w) {
  while (w.children.length > 2) w.removeChild(w.lastChild);

  var lp = App.lvlProgress();
  var counts = App.srsCounts();

  /* nivel de estudiante */
  var lvlCard = App.el('div', 'card');
  lvlCard.innerHTML =
    '<div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.6rem">' +
      '<div class="mode-icon" style="width:46px;height:46px;font-size:20px">' + lp.lvl + '</div>' +
      '<div class="mode-info"><div class="mode-name">Nivel de estudiante ' + lp.lvl + '</div>' +
      '<div class="mode-desc">' + App.G.xp + ' XP · 🔥 racha de ' + App.streak() + '</div></div>' +
    '</div>' +
    '<div class="prog-row"><div class="prog-bar-wrap"><div class="prog-bar' + (lp.pct ? '' : ' zero') + '" style="width:' + lp.pct + '%"></div></div>' +
    '<span class="prog-pct">' + lp.pct + '%</span></div>';
  w.appendChild(lvlCard);

  /* totales */
  var totSecs = 0, totOk = 0, totBad = 0;
  Object.keys(App.G.days).forEach(function (k) {
    var d = App.G.days[k];
    totSecs += d.secs || 0; totOk += d.ok || 0; totBad += d.bad || 0;
  });
  var acc = (totOk + totBad) ? Math.round(totOk / (totOk + totBad) * 100) + '%' : '—';
  var stats = App.el('div', 'statsrow');
  stats.innerHTML =
    '<div class="stat-card"><span class="stat-val">' + counts.total + '</span><span class="stat-key">Estudiadas</span></div>' +
    '<div class="stat-card"><span class="stat-val">' + counts.known + '</span><span class="stat-key">Dominadas</span></div>' +
    '<div class="stat-card"><span class="stat-val">' + acc + '</span><span class="stat-key">Precisión</span></div>' +
    '<div class="stat-card"><span class="stat-val">' + App.fmtMin(totSecs) + '</span><span class="stat-key">Tiempo total</span></div>';
  w.appendChild(stats);

  /* actividad: 14 días */
  w.appendChild(App.el('p', 'section-title', 'Actividad · últimos 14 días'));
  w.appendChild(chart14('Minutos de estudio', function (d) { return Math.round((d.secs || 0) / 60); }, 'min'));
  w.appendChild(chart14('Palabras repasadas', function (d) { return d.rev || 0; }, ''));

  /* progreso por nivel */
  w.appendChild(App.el('p', 'section-title', 'Progreso por nivel · HSK ' + (App.S.scheme === 'new' ? '3.0' : '2.0')));
  var lvls = App.el('div', 'card');
  App.LEVELS[App.S.scheme].forEach(function (l) {
    var k = App.knownInLevel(App.S.scheme, l);
    var pct = k.total ? Math.round(k.seen / k.total * 100) : 0;
    var row = App.el('div', 'prog-row');
    row.style.padding = '0.32rem 0';
    row.innerHTML =
      '<span class="prog-pct" style="min-width:34px;text-align:left;color:var(--ink2)">' + App.lvlName(App.S.scheme, l) + '</span>' +
      '<div class="prog-bar-wrap"><div class="prog-bar' + (pct ? '' : ' zero') + '" style="width:' + pct + '%"></div></div>' +
      '<span class="prog-pct">' + k.seen + '/' + k.total + '</span>';
    lvls.appendChild(row);
  });
  w.appendChild(lvls);

  /* insignias */
  var won = Object.keys(App.G.badges).length;
  w.appendChild(App.el('p', 'section-title', 'Insignias · ' + won + '/' + App.BADGES.length));
  var bg = App.el('div', 'badge-grid');
  App.BADGES.forEach(function (b) {
    bg.appendChild(App.el('div', 'badge' + (App.G.badges[b.id] ? ' won' : ''),
      '<div class="b-ico">' + b.ico + '</div><div class="b-name">' + b.name + '</div>'));
  });
  w.appendChild(bg);

  /* listas */
  w.appendChild(App.el('p', 'section-title', 'Mis listas <span class="more" id="list-new">+ nueva</span>'));
  var names = Object.keys(App.lists);
  if (!names.length) w.appendChild(App.el('p', 'hint', 'Crea listas con el botón + de cualquier palabra.'));
  names.forEach(function (name) {
    var c = App.el('div', 'card tappable',
      '<div style="display:flex;align-items:center;gap:0.8rem">' +
        '<div class="mode-icon" style="width:34px;height:34px;font-size:14px">单</div>' +
        '<div class="mode-info"><div class="mode-name" style="font-size:0.85rem">' + App.esc(name) + '</div>' +
        '<div class="mode-desc">' + App.lists[name].length + ' palabras</div></div>' +
        '<svg class="mode-arrow" viewBox="0 0 24 24"><use href="#icon-arrow"/></svg>' +
      '</div>');
    c.onclick = function () { openList(name); };
    w.appendChild(c);
  });
  var newBtnEl = w.querySelector('#list-new');
  if (newBtnEl) newBtnEl.onclick = function () {
    var name = prompt('Nombre de la lista:');
    if (!name || !name.trim()) return;
    App.lists[name.trim()] = App.lists[name.trim()] || [];
    App.saveLists();
    render(w);
  };

  /* favoritos */
  if (App.favs.length) {
    var favC = App.el('div', 'card tappable',
      '<div style="display:flex;align-items:center;gap:0.8rem">' +
        '<div class="mode-icon" style="width:34px;height:34px;font-size:14px">★</div>' +
        '<div class="mode-info"><div class="mode-name" style="font-size:0.85rem">Favoritos</div>' +
        '<div class="mode-desc">' + App.favs.length + ' palabras</div></div>' +
        '<svg class="mode-arrow" viewBox="0 0 24 24"><use href="#icon-arrow"/></svg>' +
      '</div>');
    favC.style.marginTop = '0.5rem';
    favC.onclick = function () { openFavs(); };
    w.appendChild(favC);
  }

  /* exámenes */
  if (App.G.examHist.length) {
    w.appendChild(App.el('p', 'section-title', 'Historial de exámenes'));
    var ex = App.el('div', 'card');
    App.G.examHist.slice(-6).reverse().forEach(function (e) {
      var pct = Math.round(e.score / e.total * 100);
      ex.appendChild(App.el('div', 'kv',
        '<span class="k">' + new Date(e.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }) + '</span>' +
        '<span class="v">Nivel ' + App.lvlName(e.scheme || 'new', e.level || 1) + ' · ' + e.score + '/' + e.total +
        ' · <b style="color:' + (pct >= 80 ? 'var(--gold)' : 'var(--red2)') + '">' + pct + '%</b></span>'));
    });
    w.appendChild(ex);
  }

  /* ajustes */
  w.appendChild(App.el('p', 'section-title', 'Ajustes'));
  w.appendChild(settings(w));

  /* datos */
  w.appendChild(App.el('p', 'section-title', 'Tus datos'));
  var dataRow = App.el('div', 'btn-row');
  var exp = App.el('button', 'btn btn-sm', 'Exportar progreso');
  exp.onclick = exportData;
  var imp = App.el('button', 'btn btn-sm', 'Importar');
  imp.onclick = importData;
  var rst = App.el('button', 'btn btn-sm btn-red', 'Reiniciar todo');
  rst.onclick = function () {
    if (!confirm('¿Borrar todo el progreso? Esta acción no se puede deshacer.')) return;
    ['chino_settings', 'chino_srs', 'chino_gam', 'chino_lists', 'chino_favs', 'chino_hist'].forEach(function (k) { localStorage.removeItem(k); });
    location.reload();
  };
  dataRow.appendChild(exp); dataRow.appendChild(imp); dataRow.appendChild(rst);
  w.appendChild(dataRow);
  w.appendChild(App.el('p', 'hint', 'El progreso vive en este dispositivo (localStorage). Usa exportar/importar para pasarlo a otro dispositivo.'));
}

/* ---------- gráfica de barras HTML (una serie, 14 días) ---------- */
function chart14(title, getVal, unit) {
  var days = [], max = 0;
  var d = new Date();
  d.setDate(d.getDate() - 13);
  for (var i = 0; i < 14; i++) {
    var k = d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    var v = getVal(App.G.days[k] || {});
    days.push({ v: v, dow: 'DLMMJVS'[d.getDay()], key: d.getDate() + '/' + (d.getMonth() + 1) });
    if (v > max) max = v;
    d.setDate(d.getDate() + 1);
  }
  var card = App.el('div', 'card');
  var html = '<div class="mode-desc" style="margin-bottom:8px">' + title + '</div>' +
    '<div style="display:flex;align-items:flex-end;gap:2px;height:64px">';
  days.forEach(function (day, i) {
    var h = max ? Math.max(2, Math.round(day.v / max * 56)) : 2;
    var isMax = max > 0 && day.v === max;
    html +=
      '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%" title="' + day.key + ': ' + day.v + (unit ? ' ' + unit : '') + '">' +
        (isMax ? '<span style="font-family:\'DM Mono\',monospace;font-size:8px;color:var(--ink);margin-bottom:2px">' + day.v + '</span>' : '') +
        '<div style="width:100%;height:' + h + 'px;border-radius:4px 4px 2px 2px;background:' + (day.v ? 'var(--gold)' : 'var(--track)') + '"></div>' +
      '</div>';
  });
  html += '</div><div style="display:flex;gap:2px;margin-top:3px">';
  days.forEach(function (day) {
    html += '<span style="flex:1;text-align:center;font-family:\'DM Mono\',monospace;font-size:7px;color:var(--ink3)">' + day.dow + '</span>';
  });
  html += '</div>';
  card.innerHTML = html;
  return card;
}

/* ---------- listas / favoritos ---------- */
function openList(name) {
  App.openOverlay('Lista · ' + name, function (body) {
    var words = App.lists[name].map(function (s) { return App.byS[s]; }).filter(Boolean);
    var row = App.el('div', 'btn-row');
    row.style.marginBottom = '0.7rem';
    if (words.length >= 2) {
      var st = App.el('button', 'btn btn-sm btn-jade', 'Estudiar (flashcards)');
      st.onclick = function () {
        App.closeAllOverlays();
        App.studyDeck(App.shuffle(words.slice()).slice(0, 20));
      };
      row.appendChild(st);
    }
    var del = App.el('button', 'btn btn-sm btn-red', 'Eliminar lista');
    del.onclick = function () {
      if (!confirm('¿Eliminar la lista «' + name + '»?')) return;
      delete App.lists[name];
      App.saveLists();
      App.closeOverlay();
      App.views.profile();
    };
    row.appendChild(del);
    body.appendChild(row);
    if (!words.length) body.appendChild(App.el('p', 'empty-msg', 'Lista vacía.'));
    words.forEach(function (word) { body.appendChild(App.wordRow(word)); });
  });
}
function openFavs() {
  App.openOverlay('Favoritos', function (body) {
    var words = App.favs.map(function (s) { return App.byS[s]; }).filter(Boolean);
    if (words.length >= 2) {
      var st = App.el('button', 'btn btn-sm btn-jade', 'Estudiar (flashcards)');
      st.style.margin = '0 auto 0.7rem';
      st.onclick = function () {
        App.closeAllOverlays();
        App.studyDeck(App.shuffle(words.slice()).slice(0, 20));
      };
      body.appendChild(st);
    }
    if (!words.length) body.appendChild(App.el('p', 'empty-msg', 'Sin favoritos aún.'));
    words.forEach(function (word) { body.appendChild(App.wordRow(word)); });
  });
}

/* ---------- ajustes ---------- */
function settings(w) {
  var box = App.el('div');

  function segRow(label, opts, get, set) {
    var row = App.el('div', 'select-row');
    row.innerHTML = '<label>' + label + '</label>';
    var seg = App.el('div', 'seg');
    seg.style.margin = '0';
    seg.style.maxWidth = '60%';
    opts.forEach(function (o) {
      var b = App.el('button', get() === o[0] ? 'active' : '', o[1]);
      b.style.padding = '0.42rem 0.7rem';
      b.onclick = function () {
        set(o[0]); App.saveS();
        App.views.profile();
      };
      seg.appendChild(b);
    });
    row.appendChild(seg);
    return row;
  }

  box.appendChild(segRow('Caracteres',
    [['s', '简 Simpl.'], ['t', '繁 Trad.']],
    function () { return App.S.script; },
    function (v) { App.S.script = v; }));

  box.appendChild(segRow('Fonética',
    [['py', 'Pinyin'], ['zy', 'Zhuyin'], ['both', 'Ambos'], ['none', 'Oculta']],
    function () { return App.S.roman; },
    function (v) { App.S.roman = v; }));

  box.appendChild(segRow('Traducciones',
    [[true, 'Visibles'], [false, 'Ocultas']],
    function () { return App.S.showTrans; },
    function (v) { App.S.showTrans = v; }));

  var goalRow = App.el('div', 'select-row');
  goalRow.innerHTML = '<label>Meta diaria (repasos)</label>';
  var sel = document.createElement('select');
  [10, 20, 30, 50, 100].forEach(function (n) { sel.appendChild(new Option(n + ' palabras', n)); });
  sel.value = App.S.goal;
  sel.onchange = function () { App.S.goal = +sel.value; App.saveS(); };
  goalRow.appendChild(sel);
  box.appendChild(goalRow);

  var remRow = App.el('div', 'select-row');
  remRow.innerHTML = '<label>Recordatorio diario</label>';
  var tog = App.el('button', 'toggle' + (App.S.reminders ? ' on' : ''));
  tog.onclick = function () {
    if (!App.S.reminders && 'Notification' in window) {
      Notification.requestPermission().then(function (p) {
        App.S.reminders = p === 'granted';
        App.saveS();
        tog.classList.toggle('on', App.S.reminders);
        App.toast(App.S.reminders ? '🔔 Te recordaremos tus repasos al abrir el día' : 'Permiso denegado');
      });
    } else {
      App.S.reminders = false; App.saveS();
      tog.classList.remove('on');
    }
  };
  remRow.appendChild(tog);
  box.appendChild(remRow);

  return box;
}

/* ---------- exportar / importar ---------- */
function exportData() {
  var data = {};
  ['chino_settings', 'chino_srs', 'chino_gam', 'chino_lists', 'chino_favs', 'chino_hist'].forEach(function (k) {
    data[k] = App.load(k, null);
  });
  var blob = new Blob([JSON.stringify({ app: 'chino-hsk', v: 2, date: new Date().toISOString(), data: data }, null, 1)], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'chino-hsk-progreso-' + App.today() + '.json';
  a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  App.toast('📦 Progreso exportado');
}
function importData() {
  var inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json,application/json';
  inp.onchange = function () {
    var f = inp.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function () {
      try {
        var obj = JSON.parse(r.result);
        if (!obj || obj.app !== 'chino-hsk' || !obj.data) throw new Error('formato');
        if (!confirm('¿Reemplazar tu progreso actual con el archivo del ' + (obj.date || '?').slice(0, 10) + '?')) return;
        Object.keys(obj.data).forEach(function (k) {
          if (obj.data[k] != null) App.save(k, obj.data[k]);
        });
        location.reload();
      } catch (e) { App.toast('❌ Archivo no válido'); }
    };
    r.readAsText(f);
  };
  inp.click();
}

})();
