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

/* 夜走 — 打倒三明治 (Sandwich Fail), EP «Roadkill» (2020). Letra en tradicional.
   Copia personal del usuario: audio local en assets/songs/yezou.mp3 (no incluido);
   tiempos por línea tomados del LRC sincronizado de la canción. */
(function () {
  var L = [
    { hz: '只是想和你並肩向前走 卻濺起水花',
      py: 'zhǐ shì xiǎng hé nǐ bìng jiān xiàng qián zǒu què jiàn qǐ shuǐ huā',
      es: 'Solo quería avanzar a tu lado, pero salpiqué el agua' },
    { hz: '本以為雨滴只是輕輕的 落在他的肩上',
      py: 'běn yǐ wéi yǔ dī zhǐ shì qīng qīng de luò zài tā de jiān shàng',
      es: 'Creía que las gotas de lluvia caían suaves sobre sus hombros' },
    { hz: '風雨過了一季 還會再來 這是無法避免的啊',
      py: 'fēng yǔ guò le yí jì hái huì zài lái zhè shì wú fǎ bì miǎn de a',
      es: 'La tormenta pasa una estación y vuelve; eso no se puede evitar' },
    { hz: '我們只能將自己 包覆得更緊',
      py: 'wǒ men zhǐ néng jiāng zì jǐ bāo fù de gèng jǐn',
      es: 'Solo podemos envolvernos más fuerte en nosotros mismos' },
    { hz: '困在了沒有溫度的世界裡',
      py: 'kùn zài le méi yǒu wēn dù de shì jiè lǐ',
      es: 'Atrapados en un mundo sin calor' },
    { hz: '天空也不知何時會亮',
      py: 'tiān kōng yě bù zhī hé shí huì liàng',
      es: 'Ni el cielo sabe cuándo va a amanecer' },
    { hz: '走在沒有人群的海岸邊',
      py: 'zǒu zài méi yǒu rén qún de hǎi àn biān',
      es: 'Camino por una costa sin gente' },
    { hz: '獨自說著沒人聽懂的道理',
      py: 'dú zì shuō zhe méi rén tīng dǒng de dào lǐ',
      es: 'Diciendo a solas razones que nadie entiende' },
    { hz: '我在你的手心畫一個圈 走啊走的走不停啊',
      py: 'wǒ zài nǐ de shǒu xīn huà yí ge quān zǒu a zǒu de zǒu bù tíng a',
      es: 'Dibujo un círculo en tu palma; camino y camino sin parar' },
    { hz: '放開瞬間 我能了解 走得太遠回不去了',
      py: 'fàng kāi shùn jiān wǒ néng liǎo jiě zǒu de tài yuǎn huí bú qù le',
      es: 'Al soltarte lo entiendo: fuimos demasiado lejos para volver' },
    { hz: '用那些累積 想說的話 推擠漸層的高牆',
      py: 'yòng nà xiē lěi jī xiǎng shuō de huà tuī jǐ jiàn céng de gāo qiáng',
      es: 'Con las palabras acumuladas que quería decir, empujo el muro que crece' },
    { hz: '誰能夠讓 大雨落在 乾枯了你我的範圍',
      py: 'shéi néng gòu ràng dà yǔ luò zài gān kū le nǐ wǒ de fàn wéi',
      es: '¿Quién hará que la lluvia caiga sobre lo que de ti y de mí se secó?' }
  ];
  /* [índice de línea, segundo en que empieza] según el LRC */
  var seq = [
    [0, 0.23], [1, 7.79], [2, 14.78], [3, 21.96],
    [4, 28.93], [5, 32.23], [6, 35.74], [7, 39.47],
    [8, 46.86], [9, 53.99], [10, 60.98], [11, 67.93],
    [4, 89.26], [5, 92.71], [6, 96.57], [7, 99.88],
    [8, 106.92], [9, 114.57], [10, 121.40], [11, 128.35],
    [0, 167.55], [1, 174.75]
  ];
  SONGS.push({
    id: 'yezou', title: '夜走', sub: 'Caminar de noche · 打倒三明治 (Sandwich Fail)', art: '夜',
    grad: 'linear-gradient(145deg,#2C3E6B,#6B5CA8)',
    cover: 'assets/songs/yezou.jpg',
    audio: 'assets/songs/yezou.mp3',
    lines: seq.map(function (s) {
      return { hz: L[s[0]].hz, py: L[s[0]].py, es: L[s[0]].es, t: s[1] };
    })
  });
})();

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

var player = { playing: false, line: -1 };
var actx = null, melTimers = [], audioEl = null;
var sub = 'list';   // 'list' | 'song'

/* carátula: imagen si la canción tiene portada, si no el carácter con degradado */
function artHtml(song) {
  return '<div class="song-art" style="background:' + song.grad + '">' +
    (song.cover ? '<img src="' + song.cover + '" alt="">' : App.esc(song.art)) +
    '</div>';
}

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
  player.line = -1;
  melTimers.forEach(clearTimeout); melTimers = [];
  if (actx) { try { actx.close(); } catch (e) {} actx = null; }
  if (audioEl) { try { audioEl.pause(); } catch (e) {} audioEl = null; }
  var pb = App.$('play-btn'); if (pb) pb.innerHTML = playIcon(false);
  document.querySelectorAll('#songs-wrap .ly-line').forEach(function (el) { el.classList.remove('active'); });
}

/* audio real (mp3 local) con letra sincronizada por los tiempos t de cada línea */
function startAudio(song) {
  stopPlay();
  audioEl = new Audio(song.audio);
  player.playing = true;
  var pb = App.$('play-btn'); if (pb) pb.innerHTML = playIcon(true);
  audioEl.ontimeupdate = function () {
    if (!player.playing || !audioEl) return;
    var ct = audioEl.currentTime, li = -1;
    for (var i = 0; i < song.lines.length; i++) {
      if (song.lines[i].t != null && ct >= song.lines[i].t) li = i;
    }
    if (li !== player.line) { player.line = li; if (li >= 0) setActiveLine(li); }
  };
  audioEl.onended = stopPlay;
  audioEl.onerror = function () {
    App.toast('Falta el audio: copia el mp3 en ' + song.audio);
    stopPlay();
  };
  audioEl.play().catch(function () {
    App.toast('No se pudo reproducir ' + song.audio);
    stopPlay();
  });
}

function startPlay(song) {
  if (song.audio) { startAudio(song); return; }
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
      artHtml(song) +
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
  markMode = false;
  cardEl = null; cardSpan = null;
  while (w.children.length > 2) w.removeChild(w.lastChild);

  var back = App.el('button', 'btn btn-sm', '‹ Canciones');
  back.style.margin = '0 auto 0.7rem 0';
  back.onclick = function () { history.back(); };   // usa el historial, como el gesto
  w.appendChild(back);

  var playerEl = App.el('div', 'player',
    artHtml(song) +
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

  /* herramientas de la letra */
  var bar = App.el('div', 'ly-toolbar');
  var bPy = App.el('button', 'btn btn-sm' + (App.S.songPy !== false ? ' btn-jade' : ''), 'Pinyin');
  bPy.onclick = function () {
    App.S.songPy = App.S.songPy === false;   // alterna mostrar/ocultar
    App.saveS();
    bPy.classList.toggle('btn-jade', App.S.songPy !== false);
    document.querySelectorAll('#songs-wrap .ly-py').forEach(function (el) {
      el.style.display = App.S.songPy === false ? 'none' : '';
    });
  };
  var bMark = App.el('button', 'btn btn-sm', '✓ Marcar conocidos');
  bMark.onclick = function () {
    markMode = !markMode;
    bMark.classList.toggle('btn-jade', markMode);
    closeCharCard();
  };
  bar.appendChild(bPy); bar.appendChild(bMark);
  w.appendChild(bar);

  w.appendChild(App.el('div', 'ly-hint',
    'Toca un carácter para ver su significado. Con «Marcar conocidos» activo, tocarlos los marca como «ya los sé leer». Los colores indican el tono.'));

  song.lines.forEach(function (line) {
    var el = App.el('div', 'ly-line');
    el.appendChild(hanziRow(line, w, song));
    var py = App.el('div', 'ly-py', App.esc(line.py));
    if (App.S.songPy === false) py.style.display = 'none';
    el.appendChild(py);
    w.appendChild(el);
  });
}

/* fila de hanzi con cada carácter coloreado por tono; el toque muestra la
   tarjeta de significado o marca el carácter, según el modo activo */
var markMode = false, cardEl = null, cardSpan = null;

function hanziRow(line, w, song) {
  var row = App.el('div', 'ly-hz');
  var syls = line.py.trim().split(/\s+/);
  var si = 0;
  line.hz.split('').forEach(function (ch) {
    if (/[㐀-鿿]/.test(ch)) {
      var syl = syls[si++];
      var t = App.toneNum(syl);
      var span = App.el('span', 'ly-ch t' + t + (App.readChars[ch] ? ' known' : ''), App.esc(ch));
      span.setAttribute('data-ch', ch);
      span.onclick = function () {
        if (markMode) { toggleChar(ch, w, song); return; }
        showCharCard(span, ch, syl, w, song);
      };
      row.appendChild(span);
    } else {
      row.appendChild(App.el('span', '', App.esc(ch)));
    }
  });
  return row;
}

function closeCharCard() {
  if (cardEl && cardEl.parentNode) cardEl.parentNode.removeChild(cardEl);
  if (cardSpan) cardSpan.classList.remove('sel');
  cardEl = null; cardSpan = null;
}

/* significado del carácter: palabra monosílaba del diccionario (sirve para
   tradicional y simplificado); si no existe, la palabra más frecuente que lo contiene */
function charInfo(ch) {
  var cands = App.byChar[ch] || [], word = null, i;
  for (i = 0; i < cands.length; i++) {
    if (cands[i].s === ch || cands[i].t === ch) { word = cands[i]; break; }
  }
  if (word) return { es: word.es || '', en: word.en || '', via: null };
  var best = null;
  for (i = 0; i < cands.length; i++) {
    if (!best || (cands[i].freq || 9e9) < (best.freq || 9e9)) best = cands[i];
  }
  if (best) return { es: best.es || '', en: best.en || '', via: best };
  return null;
}

function showCharCard(span, ch, syl, w, song) {
  if (cardSpan === span) { closeCharCard(); return; }   // segundo toque: cerrar
  closeCharCard();
  var line = span.closest('.ly-line');
  if (!line) return;
  var c = App.CHARS[ch];
  var py = syl || (c && c[1]) || '';
  var tone = App.toneNum(py);
  var info = charInfo(ch);
  var trans = 'Sin traducción disponible';
  if (info) {
    var t = info.es || (info.en ? info.en + ' (EN)' : '');
    if (t) trans = info.via ? 'En «' + App.disp(info.via) + '»: ' + t : t;
  }
  cardEl = App.el('div', 'ly-card',
    '<span class="ly-card-ch t' + tone + '">' + App.esc(ch) + '</span>' +
    '<div class="ly-card-info">' +
      '<div class="ly-card-py">' + App.esc(py) + (c && c[3] ? ' · ' + c[3] + ' trazos' : '') + '</div>' +
      '<div class="ly-card-es">' + App.esc(trans) + '</div>' +
    '</div>' +
    '<div class="ly-card-btns">' +
      '<button class="icon-btn" data-a="say" title="Escuchar"><svg viewBox="0 0 24 24"><use href="#icon-audio"/></svg></button>' +
      '<button class="icon-btn' + (App.readChars[ch] ? ' on' : '') + '" data-a="know" title="Ya lo sé leer"><svg viewBox="0 0 24 24"><use href="#icon-check"/></svg></button>' +
    '</div>');
  cardEl.querySelector('[data-a="say"]').onclick = function () { App.speak(ch); };
  cardEl.querySelector('[data-a="know"]').onclick = function (e) {
    toggleChar(ch, w, song);
    e.currentTarget.classList.toggle('on', !!App.readChars[ch]);
  };
  line.parentNode.insertBefore(cardEl, line.nextSibling);
  cardSpan = span;
  span.classList.add('sel');
  App.speak(ch);
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
