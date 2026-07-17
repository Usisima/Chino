'use strict';

/* ==================== DICCIONARIO ==================== */
(function () {

var q = '', radFilter = null, histTimer = null;

App.views.dict = function () {
  // al entrar en la sección se reinician los filtros (búsqueda y radical)
  q = ''; radFilter = null;
  var w = App.$('dict-wrap');
  w.innerHTML = '';
  w.appendChild(App.el('p', 'page-title', '<span class="zh">词典</span> · Diccionario'));
  w.appendChild(App.el('div', 'title-divider'));

  var sb = App.el('div', 'search-box',
    '<svg viewBox="0 0 24 24"><use href="#icon-search"/></svg>');
  var inp = App.el('input');
  inp.placeholder = 'Hanzi, pinyin (con o sin tonos) o traducción…';
  inp.autocomplete = 'off';
  inp.value = q;
  sb.appendChild(inp);
  var clr = App.el('button', 'icon-btn', '<svg viewBox="0 0 24 24"><use href="#icon-x"/></svg>');
  clr.style.width = '26px'; clr.style.height = '26px';
  clr.style.display = q ? 'flex' : 'none';
  clr.onclick = function () { q = ''; inp.value = ''; radFilter = null; refresh(); };
  sb.appendChild(clr);
  w.appendChild(sb);

  var results = App.el('div');
  w.appendChild(results);

  inp.addEventListener('input', function () {
    q = inp.value;
    clr.style.display = q ? 'flex' : 'none';
    refresh();
    clearTimeout(histTimer);
    if (q.trim().length > 1) histTimer = setTimeout(function () { App.pushHist(q); }, 1600);
  });

  /* gesto de regresar: primero quita el filtro de radical, luego sale de la sección */
  App.viewBack.dict = function () {
    if (radFilter) { radFilter = null; refresh(); return true; }
    return false;
  };

  function refresh() {
    App.ready.then(function () {
      if (App.currentView !== 'dict') return;
      results.innerHTML = '';
      if (radFilter) {
        var head = App.el('div', 'count-line', 'Radical <span style="font-family:var(--hanzi);color:var(--gold)">' + App.esc(radFilter) + '</span> · <span data-a="quit" style="color:var(--gold2);cursor:pointer">quitar filtro ✕</span>');
        head.querySelector('[data-a="quit"]').onclick = function () { history.back(); };
        results.appendChild(head);
      }
      if (!q.trim() && !radFilter) return renderIdle(results);

      var found = q.trim()
        ? App.search(q, { rad: radFilter, limit: 80 })
        : App.W.filter(function (x) { return x.rad === radFilter; }).slice(0, 120);
      results.appendChild(App.el('div', 'count-line', found.length + ' resultados'));
      if (!found.length) {
        results.appendChild(App.el('div', 'empty-msg', 'Sin resultados. Prueba pinyin sin tonos («nihao») o en español/inglés.'));
        return;
      }
      found.forEach(function (word) { results.appendChild(App.wordRow(word)); });
    });
  }

  /* estado inicial: niveles HSK + radicales + favoritos + historial */
  function renderIdle(box) {
    // vocabulario HSK 3.0 por nivel (contadores seleccionables)
    box.appendChild(App.el('p', 'section-title', 'Vocabulario HSK 3.0 por nivel'));
    var lg = App.el('div', 'lvl-grid');
    App.LEVELS.new.forEach(function (l) {
      var k = App.knownInLevel('new', l);
      var pct = k.total ? Math.round(k.seen / k.total * 100) : 0;
      var tile = App.el('button', 'lvl-tile',
        '<div class="lvl-num">' + App.lvlName('new', l) + '</div>' +
        '<div class="lvl-count">' + k.seen + '/' + k.total + '</div>' +
        '<div class="lvl-mini-bar"><div class="lvl-mini-fill" style="width:' + pct + '%"></div></div>');
      tile.onclick = function () { openLevel(l); };
      lg.appendChild(tile);
    });
    box.appendChild(lg);

    // acceso por radical: siempre visibles todos
    box.appendChild(App.el('p', 'section-title', 'Buscar por radical · ' + App.RADS.length));
    var radBox = App.el('div', 'rad-grid');
    App.RADS.forEach(function (r) {
      var c = App.el('button', 'chip', '<span style="font-family:var(--hanzi)">' + App.esc(r[0]) + '</span>');
      c.onclick = function () { radFilter = r[0]; App.pushState({ sub: 'rad' }); refresh(); };
      radBox.appendChild(c);
    });
    box.appendChild(radBox);

    // historial
    if (App.hist.length) {
      var st = App.el('p', 'section-title', 'Búsquedas recientes <span class="more" data-a="clear">borrar</span>');
      st.querySelector('[data-a="clear"]').onclick = function () {
        App.hist = []; App.save('chino_hist', App.hist); refresh();
      };
      box.appendChild(st);
      var hb = App.el('div', 'chips');
      hb.style.flexWrap = 'wrap';
      App.hist.slice(0, 12).forEach(function (h) {
        var c = App.el('button', 'chip', App.esc(h));
        c.onclick = function () { q = h; inp.value = h; refresh(); };
        hb.appendChild(c);
      });
      box.appendChild(hb);
    }

    // favoritos
    if (App.favs.length) {
      box.appendChild(App.el('p', 'section-title', 'Favoritos'));
      App.favs.slice(0, 10).forEach(function (s) {
        var word = App.byS[s];
        if (word) box.appendChild(App.wordRow(word));
      });
    }

    if (!App.favs.length && !App.hist.length) {
      box.appendChild(App.el('div', 'empty-msg', 'Busca cualquiera de las ' + App.W.length + ' palabras del HSK.<br>Ej.: 你好 · nihao · «hola»'));
    }
  }

  refresh();

  /* todas las palabras de un nivel HSK 3.0, con opción de estudiar */
  function openLevel(l) {
    var words = App.levelWords('new', l);
    words = words.slice().sort(function (a, b) { return (a.freq || 9e9) - (b.freq || 9e9); });
    App.openOverlay('HSK 3.0 · Nivel ' + App.lvlName('new', l) + ' · ' + words.length, function (body) {
      if (words.length >= 2) {
        var st = App.el('button', 'btn btn-jade', '<svg viewBox="0 0 24 24"><use href="#icon-cards"/></svg>Estudiar con flashcards');
        st.style.margin = '0 auto 0.8rem';
        st.onclick = function () {
          App.closeAllOverlays();
          App.studyDeck(App.shuffle(words.slice()).slice(0, 20));
        };
        body.appendChild(st);
      }
      var shown = 0;
      var listEl = App.el('div');
      body.appendChild(listEl);
      var btn = App.el('button', 'btn');
      btn.style.margin = '0.6rem auto';
      function more() {
        words.slice(shown, shown + 80).forEach(function (word) { listEl.appendChild(App.wordRow(word)); });
        shown = Math.min(words.length, shown + 80);
        btn.style.display = shown < words.length ? 'flex' : 'none';
        btn.textContent = 'Mostrar más (' + (words.length - shown) + ')';
      }
      btn.onclick = more;
      body.appendChild(btn);
      more();
    });
  }
};

})();
