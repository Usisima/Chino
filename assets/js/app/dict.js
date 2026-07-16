'use strict';

/* ==================== DICCIONARIO ==================== */
(function () {

var q = '', radFilter = null, histTimer = null;

App.views.dict = function () {
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

  function refresh() {
    App.ready.then(function () {
      if (App.currentView !== 'dict') return;
      results.innerHTML = '';
      if (radFilter) {
        var head = App.el('div', 'count-line', 'Radical <span style="font-family:var(--hanzi);color:var(--gold)">' + App.esc(radFilter) + '</span> · <span data-a="quit" style="color:var(--gold2);cursor:pointer">quitar filtro ✕</span>');
        head.querySelector('[data-a="quit"]').onclick = function () { radFilter = null; refresh(); };
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

  /* estado inicial: radicales + favoritos + historial */
  function renderIdle(box) {
    // acceso por radical: siempre visibles todos
    box.appendChild(App.el('p', 'section-title', 'Buscar por radical · ' + App.RADS.length));
    var radBox = App.el('div', 'rad-grid');
    App.RADS.forEach(function (r) {
      var c = App.el('button', 'chip', '<span style="font-family:var(--hanzi)">' + App.esc(r[0]) + '</span><span class="n">' + r[1] + '</span>');
      c.onclick = function () { radFilter = r[0]; refresh(); };
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
};

})();
