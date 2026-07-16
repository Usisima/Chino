'use strict';

/* ==================== CANCIONES: playlist, letra, reproducción y marcado ==================== */
(function () {

/* caracteres que el usuario marca como "ya sé leer" (global, por carácter) */
App.readChars = App.load('chino_read', {});

/* Cancionero de dominio público (canciones populares / folclóricas chinas).
   pinyin por sílaba (separado por espacios) alineado con cada hanzi de la línea. */
var SONGS = [
  {
    id: 'laohu', title: '两只老虎', sub: 'Dos tigres · folclórica', art: '虎',
    grad: 'linear-gradient(145deg,#2C5BE0,#1E45C4)',
    lines: [
      { hz: '两只老虎，两只老虎', py: 'liǎng zhī lǎo hǔ liǎng zhī lǎo hǔ', es: 'Dos tigres, dos tigres' },
      { hz: '跑得快，跑得快', py: 'pǎo de kuài pǎo de kuài', es: 'corren rápido, corren rápido' },
      { hz: '一只没有耳朵', py: 'yì zhī méi yǒu ěr duo', es: 'uno no tiene orejas' },
      { hz: '一只没有尾巴', py: 'yì zhī méi yǒu wěi ba', es: 'uno no tiene cola' },
      { hz: '真奇怪，真奇怪', py: 'zhēn qí guài zhēn qí guài', es: '¡qué raro, qué raro!' }
    ]
  },
  {
    id: 'xingxing', title: '小星星', sub: 'Estrellita · infantil', art: '星',
    grad: 'linear-gradient(145deg,#8E44AD,#2C5BE0)',
    lines: [
      { hz: '一闪一闪亮晶晶', py: 'yì shǎn yì shǎn liàng jīng jīng', es: 'Brilla, brilla, resplandece' },
      { hz: '满天都是小星星', py: 'mǎn tiān dōu shì xiǎo xīng xīng', es: 'el cielo lleno de estrellitas' },
      { hz: '挂在天上放光明', py: 'guà zài tiān shàng fàng guāng míng', es: 'colgadas en el cielo, dando luz' },
      { hz: '好像许多小眼睛', py: 'hǎo xiàng xǔ duō xiǎo yǎn jing', es: 'como muchos ojitos' }
    ]
  },
  {
    id: 'molihua', title: '茉莉花', sub: 'Flor de jazmín · tradicional', art: '花',
    grad: 'linear-gradient(145deg,#1EA268,#2C8C7A)',
    lines: [
      { hz: '好一朵美丽的茉莉花', py: 'hǎo yì duǒ měi lì de mò lì huā', es: 'Qué hermosa flor de jazmín' },
      { hz: '好一朵美丽的茉莉花', py: 'hǎo yì duǒ měi lì de mò lì huā', es: 'Qué hermosa flor de jazmín' },
      { hz: '芬芳美丽满枝桠', py: 'fēn fāng měi lì mǎn zhī yā', es: 'fragante y bella, llena las ramas' },
      { hz: '又香又白人人夸', py: 'yòu xiāng yòu bái rén rén kuā', es: 'aromática y blanca, todos la elogian' }
    ]
  },
  {
    id: 'xinnian', title: '新年好', sub: 'Feliz Año Nuevo · folclórica', art: '年',
    grad: 'linear-gradient(145deg,#E7961F,#E14A44)',
    lines: [
      { hz: '新年好呀，新年好呀', py: 'xīn nián hǎo ya xīn nián hǎo ya', es: 'Feliz año nuevo, feliz año nuevo' },
      { hz: '祝贺大家新年好', py: 'zhù hè dà jiā xīn nián hǎo', es: 'felicidades a todos por el año nuevo' },
      { hz: '我们唱歌，我们跳舞', py: 'wǒ men chàng gē wǒ men tiào wǔ', es: 'cantamos, bailamos' },
      { hz: '祝贺大家新年好', py: 'zhù hè dà jiā xīn nián hǎo', es: 'felicidades a todos por el año nuevo' }
    ]
  }
];

/* caracteres únicos (hanzi) de una canción */
function songChars(song) {
  var seen = {}, out = [];
  song.lines.forEach(function (l) {
    l.hz.split('').forEach(function (ch) { if (/[㐀-鿿]/.test(ch) && !seen[ch]) { seen[ch] = 1; out.push(ch); } });
  });
  return out;
}
function knownCount(song) {
  return songChars(song).filter(function (ch) { return App.readChars[ch]; }).length;
}

/* ---------- reproducción: melodía real sintetizada (Web Audio) ----------
   Las melodías son de dominio público (canciones folclóricas / infantiles).
   Se generan con osciladores, así que suenan sin depender de archivos externos. */
var FREQ = {
  G3: 196.00, A3: 220.00, B3: 246.94,
  C: 261.63, D: 293.66, E: 329.63, F: 349.23, G: 392.00, A: 440.00, B: 493.88, C5: 523.25, D5: 587.33
};
var MELODIES = {
  // 两只老虎 (Frère Jacques)
  laohu: [
    [['C',1],['D',1],['E',1],['C',1],['C',1],['D',1],['E',1],['C',1]],
    [['E',1],['F',1],['G',2],['E',1],['F',1],['G',2]],
    [['G',1],['A',1],['G',1],['F',1],['E',1],['C',2]],
    [['G',1],['A',1],['G',1],['F',1],['E',1],['C',2]],
    [['C',1],['G3',1],['C',2],['C',1],['G3',1],['C',2]]
  ],
  // 小星星 (Twinkle Twinkle)
  xingxing: [
    [['C',1],['C',1],['G',1],['G',1],['A',1],['A',1],['G',2]],
    [['F',1],['F',1],['E',1],['E',1],['D',1],['D',1],['C',2]],
    [['G',1],['G',1],['F',1],['F',1],['E',1],['E',1],['D',2]],
    [['G',1],['G',1],['F',1],['F',1],['E',1],['E',1],['D',2]]
  ],
  // 茉莉花 (pentatónica, aproximada)
  molihua: [
    [['E',1],['G',1],['G',1],['A',1],['C5',2],['A',1],['G',1],['E',1],['G',2]],
    [['E',1],['G',1],['G',1],['A',1],['C5',2],['A',1],['G',1],['E',1],['G',2]],
    [['G',1],['A',1],['C5',1],['A',1],['G',1],['E',1],['D',2]],
    [['E',1],['G',1],['A',1],['G',1],['E',1],['D',1],['C',2]]
  ],
  // 新年好 (Happy New Year)
  xinnian: [
    [['G',1],['G',1],['G',1],['E',1],['G',1],['G',1],['G',1],['E',1]],
    [['G',1],['C5',1],['B',1],['A',1],['G',1],['F',1],['E',2]],
    [['F',1],['F',1],['F',1],['D',1],['F',1],['F',1],['F',1],['D',1]],
    [['G',1],['C5',1],['B',1],['A',1],['G',1],['F',1],['E',2]]
  ]
};

var player = { playing: false };
var actx = null, melTimers = [];
var sub = 'list';   // 'list' | 'song'

/* gesto de regresar: canción → lista → (sale de la sección) */
App.viewBack.songs = function () {
  if (sub === 'song') { renderList(App.$('songs-wrap')); return true; }
  return false;
};
function playIcon(playing) {
  return playing
    ? '<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M7 5v14l12-7z"/></svg>';
}
function setActiveLine(li) {
  var lines = document.querySelectorAll('#songs-wrap .ly-line');
  lines.forEach(function (el, i) { el.classList.toggle('active', i === li); });
  if (lines[li] && lines[li].scrollIntoView) lines[li].scrollIntoView({ block: 'center', behavior: 'smooth' });
}
function stopPlay() {
  player.playing = false;
  melTimers.forEach(clearTimeout); melTimers = [];
  if (actx) { try { actx.close(); } catch (e) {} actx = null; }
  var pb = App.$('play-btn'); if (pb) pb.innerHTML = playIcon(false);
  document.querySelectorAll('#songs-wrap .ly-line').forEach(function (el) { el.classList.remove('active'); });
}
function startPlay(song) {
  var AC = window.AudioContext || window.webkitAudioContext;
  var mel = MELODIES[song.id];
  if (!AC || !mel) { App.toast('Audio no disponible en este navegador'); return; }
  stopPlay();
  actx = new AC();
  player.playing = true;
  var pb = App.$('play-btn'); if (pb) pb.innerHTML = playIcon(true);
  var beat = 0.46, t = actx.currentTime + 0.12;
  mel.forEach(function (line, li) {
    var lineStart = t;
    line.forEach(function (n) {
      var f = FREQ[n[0]], dur = n[1] * beat;
      if (f) {
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        o.connect(g); g.connect(actx.destination);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.22, t + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.92);
        o.start(t); o.stop(t + dur);
      }
      t += dur;
    });
    melTimers.push(setTimeout(function () { if (player.playing) setActiveLine(li); }, Math.max(0, (lineStart - actx.currentTime) * 1000)));
  });
  melTimers.push(setTimeout(stopPlay, Math.max(0, (t - actx.currentTime) * 1000) + 300));
}

/* ---------- vista ---------- */
App.views.songs = function () {
  stopPlay();
  var w = App.$('songs-wrap');
  w.innerHTML = '';
  w.appendChild(App.el('p', 'page-title', '<span class="zh">歌曲</span> · Canciones'));
  w.appendChild(App.el('div', 'title-divider'));
  App.ready.then(function () {
    if (App.currentView !== 'songs') return;
    renderList(w);
  });
};

function renderList(w) {
  stopPlay();
  sub = 'list';
  while (w.children.length > 2) w.removeChild(w.lastChild);
  w.appendChild(App.el('p', 'hint', 'Elige una canción, escucha la pronunciación y marca los caracteres que ya sabes leer.'));

  SONGS.forEach(function (song) {
    var total = songChars(song).length, kn = knownCount(song);
    var card = App.el('div', 'song-card',
      '<div class="song-art" style="background:' + song.grad + '">' + App.esc(song.art) + '</div>' +
      '<div class="song-meta">' +
        '<div class="song-name">' + App.esc(song.title) + '</div>' +
        '<div class="song-sub">' + App.esc(song.sub) + '</div>' +
        '<div class="song-count">' + kn + ' / ' + total + ' caracteres que sabes leer</div>' +
      '</div>' +
      '<svg class="song-arrow" viewBox="0 0 24 24"><use href="#icon-arrow"/></svg>');
    card.onclick = function () { App.pushState({ sub: 'song' }); renderSong(w, song); };
    w.appendChild(card);
  });
}

function renderSong(w, song) {
  stopPlay();
  sub = 'song';
  while (w.children.length > 2) w.removeChild(w.lastChild);

  var back = App.el('button', 'btn btn-sm', '‹ Canciones');
  back.style.margin = '0 auto 0.7rem 0';
  back.onclick = function () { history.back(); };   // usa el historial, como el gesto
  w.appendChild(back);

  var playerEl = App.el('div', 'player',
    '<div class="song-art" style="background:' + song.grad + '">' + App.esc(song.art) + '</div>' +
    '<div class="player-info"><div class="song-name">' + App.esc(song.title) + '</div>' +
    '<div class="song-sub">' + App.esc(song.sub) + '</div></div>' +
    '<button class="play-btn" id="play-btn" title="Reproducir">' + playIcon(false) + '</button>');
  playerEl.querySelector('#play-btn').onclick = function () {
    if (isPlaying()) stopPlay(); else startPlay(song);
  };
  w.appendChild(playerEl);

  var total = songChars(song).length;
  var prog = App.el('div', '');
  prog.innerHTML =
    '<div class="song-progress-label"><span>Caracteres que sabes leer</span><span><b id="song-kn">' + knownCount(song) + '</b> / ' + total + '</span></div>' +
    '<div class="song-progress"><div id="song-bar" style="width:' + (total ? Math.round(knownCount(song) / total * 100) : 0) + '%"></div></div>';
  w.appendChild(prog);

  w.appendChild(App.el('div', 'ly-hint', 'Toca un carácter para marcarlo como «ya lo sé leer». Los colores indican el tono.'));

  song.lines.forEach(function (line) {
    var el = App.el('div', 'ly-line');
    el.appendChild(hanziRow(line, w, song));
    w.appendChild(el);
  });
}

/* fila de hanzi con cada carácter coloreado por tono y marcable */
function hanziRow(line, w, song) {
  var row = App.el('div', 'ly-hz');
  var syls = line.py.trim().split(/\s+/);
  var si = 0;
  line.hz.split('').forEach(function (ch) {
    if (/[㐀-鿿]/.test(ch)) {
      var t = App.toneNum(syls[si++]);
      var span = App.el('span', 'ly-ch t' + t + (App.readChars[ch] ? ' known' : ''), App.esc(ch));
      span.setAttribute('data-ch', ch);
      span.onclick = function () { toggleChar(ch, w, song); };
      row.appendChild(span);
    } else {
      row.appendChild(App.el('span', '', App.esc(ch)));
    }
  });
  return row;
}

function toggleChar(ch, w, song) {
  if (App.readChars[ch]) delete App.readChars[ch]; else App.readChars[ch] = 1;
  App.save('chino_read', App.readChars);
  // actualiza todas las apariciones del carácter en la letra visible
  document.querySelectorAll('#songs-wrap .ly-ch').forEach(function (el) {
    el.classList.toggle('known', !!App.readChars[el.getAttribute('data-ch')]);
  });
  var total = songChars(song).length, kn = knownCount(song);
  var knEl = App.$('song-kn'); if (knEl) knEl.textContent = kn;
  var bar = App.$('song-bar'); if (bar) bar.style.width = (total ? Math.round(kn / total * 100) : 0) + '%';
}

function isPlaying() { return player.playing; }

})();
