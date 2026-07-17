'use strict';

/* ==================== CANCIONES: playlist, letra, reproducción y marcado ==================== */
(function () {

/* caracteres que el usuario marca como "ya sé leer" (global, por carácter) */
App.readChars = App.load('chino_read', {});

/* Cancionero del usuario (uso personal). Cada canción: título/artista sin
   traducir, pinyin por sílaba alineado con cada hanzi, audio mp3 local con
   tiempos LRC por línea y portada en assets/songs/. */
var SONGS = [];

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
    id: 'yezou', title: '夜走', sub: '打倒三明治 (Sandwich Fail)', art: '夜',
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

/* ---------- reproducción: audio mp3 local + letra sincronizada ---------- */
var player = { playing: false, line: -1 };
var audioEl = null;
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
  player.pending = false;
  player.line = -1;
  if (audioEl) { try { audioEl.pause(); } catch (e) {} audioEl = null; }
  var pb = App.$('play-btn'); if (pb) pb.innerHTML = playIcon(false);
  document.querySelectorAll('#songs-wrap .ly-line').forEach(function (el) { el.classList.remove('active'); });
}

/* audio local (song.audio) con letra sincronizada por los tiempos t de cada línea */
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
  audioEl.onerror = fail;
  audioEl.play().catch(fail);
  function fail() {
    stopPlay();
    App.toast('Sin audio · copia el mp3 de la canción como ' + song.audio);
  }
}

function startPlay(song) {
  if (!song.audio) { App.toast('Esta canción no tiene audio'); return; }
  startAudio(song);
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

/* muestra u oculta la cabecera «歌曲 · Canciones» (título + divisor) */
function setHeader(w, show) {
  for (var i = 0; i < 2 && i < w.children.length; i++) {
    w.children[i].style.display = show ? '' : 'none';
  }
}

function renderList(w) {
  stopPlay();
  sub = 'list';
  setHeader(w, true);
  while (w.children.length > 2) w.removeChild(w.lastChild);

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
  setHeader(w, false);   // sin cabecera «Canciones» en la vista de la canción

  var playerEl = App.el('div', 'player',
    artHtml(song) +
    '<div class="player-info"><div class="song-name">' + App.esc(song.title) + '</div>' +
    '<div class="song-sub">' + App.esc(song.sub) + '</div></div>' +
    '<button class="play-btn" id="play-btn" title="Reproducir">' + playIcon(false) + '</button>');
  playerEl.querySelector('#play-btn').onclick = function () {
    if (isPlaying()) stopPlay(); else startPlay(song);
  };
  w.appendChild(playerEl);

  /* herramientas de la letra */
  var bar = App.el('div', 'ly-toolbar');
  var bPy = App.el('button', 'btn btn-sm' + (App.S.songPy !== false ? ' btn-jade' : ''), 'Pinyin');
  bPy.onclick = function () {
    App.S.songPy = App.S.songPy === false;   // alterna mostrar/ocultar
    App.saveS();
    bPy.classList.toggle('btn-jade', App.S.songPy !== false);
    document.querySelectorAll('#songs-wrap .ly-py').forEach(function (el) {
      el.classList.toggle('off', App.S.songPy === false);
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

  song.lines.forEach(function (line) {
    var el = App.el('div', 'ly-line');
    el.appendChild(hanziRow(line, w, song));
    el.appendChild(App.el('div', 'ly-py' + (App.S.songPy === false ? ' off' : ''), App.esc(line.py)));
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
}

function isPlaying() { return player.playing; }

})();
