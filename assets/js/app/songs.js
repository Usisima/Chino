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

/* 新世界 — Sleep Leaps 碎梦飞跃, álbum «外面是夏天». Letra en simplificado.
   Copia personal: audio local en assets/songs/xinshijie.mp3 (no incluido);
   tiempos por línea del LRC sincronizado (NetEase). Pinyin revisado a mano
   (一/不 con sandhi, partículas 地/个/字 y 漂亮/故事 en tono neutro). */
(function () {
  var L = {
    intro: { hz: 'Check Check', py: '', es: '' },
    a: { hz: '谁握着那根线', py: 'shuí wò zhe nà gēn xiàn', es: '¿Quién sostiene ese hilo?' },
    b: { hz: '操纵着她的声音和表现', py: 'cāo zòng zhe tā de shēng yīn hé biǎo xiàn', es: 'que maneja su voz y su actuación' },
    c: { hz: '哦看不见', py: 'ó kàn bú jiàn', es: 'ah, no se ve' },
    d: { hz: '偶尔', py: 'ǒu ěr', es: 'a veces' },
    e: { hz: '也会感到疲倦', py: 'yě huì gǎn dào pí juàn', es: 'también siente cansancio' },
    f: { hz: '舞台灯熄灭', py: 'wǔ tái dēng xī miè', es: 'las luces del escenario se apagan' },
    g: { hz: '她闭上了双眼', py: 'tā bì shàng le shuāng yǎn', es: 'ella cierra los ojos' },
    h: { hz: '微笑着一成不变地', py: 'wēi xiào zhe yì chéng bú biàn de', es: 'sonriendo, siempre igual' },
    i: { hz: '歌唱着不属于她的', py: 'gē chàng zhe bù shǔ yú tā de', es: 'cantando lo que no le pertenece' },
    j: { hz: '微笑着成为另一个', py: 'wēi xiào zhe chéng wéi lìng yí ge', es: 'sonriendo, se vuelve otra' },
    k: { hz: '歌唱着遗忘了', py: 'gē chàng zhe yí wàng le', es: 'cantando, ya lo ha olvidado' },
    l: { hz: '掌声之间', py: 'zhǎng shēng zhī jiān', es: 'entre los aplausos' },
    m: { hz: '欢呼之间', py: 'huān hū zhī jiān', es: 'entre las ovaciones' },
    n: { hz: '光圈中眩晕的脸', py: 'guāng quān zhōng xuàn yùn de liǎn', es: 'un rostro que se marea bajo los focos' },
    o: { hz: '签下契约来到新世界', py: 'qiān xià qì yuē lái dào xīn shì jiè', es: 'firma el contrato y llega al nuevo mundo' },
    p: { hz: '丢掉名字', py: 'diū diào míng zi', es: 'tira su nombre' },
    q: { hz: '丢掉昨日', py: 'diū diào zuó rì', es: 'tira su ayer' },
    r: { hz: '穿上漂亮的故事', py: 'chuān shàng piào liang de gù shi', es: 'se viste con una bonita historia' }
  };
  /* [clave de línea, segundo en que empieza] según el LRC */
  var seq = [
    ['intro', 46.32], ['a', 47.67], ['b', 49.41], ['c', 54.87], ['d', 57.37], ['e', 58.80], ['f', 60.48], ['g', 61.98],
    ['h', 68.49], ['i', 71.22], ['j', 74.03], ['k', 76.71], ['h', 79.47], ['i', 82.11], ['j', 84.88], ['k', 87.58],
    ['l', 112.20], ['m', 113.52], ['n', 114.93], ['o', 117.66], ['p', 123.18], ['q', 124.53], ['r', 125.79], ['o', 128.52],
    ['h', 159.00], ['i', 161.83], ['j', 164.37], ['k', 167.21], ['h', 169.99], ['i', 172.63], ['j', 175.30], ['k', 177.96],
    ['l', 224.67], ['m', 225.96], ['n', 227.34], ['o', 230.16], ['p', 235.65], ['q', 236.97], ['r', 238.26], ['o', 240.99]
  ];
  SONGS.push({
    id: 'xinshijie', title: 'New World', sub: 'Sleep Leaps 碎梦飞跃', art: '新',
    grad: 'linear-gradient(145deg,#2C6BA8,#7A9EC0)',
    cover: 'assets/songs/xinshijie.jpg',
    audio: 'assets/songs/xinshijie.mp3',
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
  var el = lines[li];
  var view = document.getElementById('view-songs');
  if (!el || !view) return;
  // scroll manual acotado al propio contenedor: centra la línea pero nunca
  // pasa del final, así no rebota ni arrastra la barra inferior.
  var target = el.offsetTop - view.clientHeight / 2 + el.offsetHeight / 2;
  var max = view.scrollHeight - view.clientHeight;
  target = Math.max(0, Math.min(target, max));
  view.scrollTo({ top: target, behavior: 'smooth' });
}

/* lleva el audio al inicio de una línea (y lo pone a sonar si estaba parado) */
function seekToLine(song, li) {
  var line = song.lines[li];
  if (!line || line.t == null) return;
  if (!audioEl) startPlay(song);
  var a = audioEl;
  if (!a) return;
  var apply = function () { a.currentTime = line.t; };
  if (a.readyState >= 1) apply();
  else a.addEventListener('loadedmetadata', apply, { once: true });
  player.line = li;
  setActiveLine(li);
  if (a.paused) { a.play().then(function () {
    player.playing = true;
    var pb = App.$('play-btn'); if (pb) pb.innerHTML = playIcon(true);
  }).catch(function () {}); }
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
    var card = App.el('div', 'song-card',
      artHtml(song) +
      '<div class="song-meta">' +
        '<div class="song-name">' + App.esc(song.title) + '</div>' +
        '<div class="song-sub">' + App.esc(song.sub) + '</div>' +
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
  var bEs = App.el('button', 'btn btn-sm' + (App.S.songEs ? ' btn-jade' : ''), 'Traducción');
  bEs.onclick = function () {
    App.S.songEs = !App.S.songEs;   // alterna mostrar/ocultar
    App.saveS();
    bEs.classList.toggle('btn-jade', !!App.S.songEs);
    document.querySelectorAll('#songs-wrap .ly-es').forEach(function (el) {
      el.classList.toggle('off', !App.S.songEs);
    });
  };
  var bMark = App.el('button', 'btn btn-sm', '✓ Marcar');
  bMark.onclick = function () {
    markMode = !markMode;
    bMark.classList.toggle('btn-jade', markMode);
    closeCharCard();
  };
  bar.appendChild(bPy); bar.appendChild(bEs); bar.appendChild(bMark);
  w.appendChild(bar);

  song.lines.forEach(function (line, li) {
    var el = App.el('div', 'ly-line');
    el.appendChild(hanziRow(line, w, song));
    el.appendChild(App.el('div', 'ly-py' + (App.S.songPy === false ? ' off' : ''), App.esc(line.py)));
    if (line.es) el.appendChild(App.el('div', 'ly-es' + (App.S.songEs ? '' : ' off'), App.esc(line.es)));
    // tocar un espacio vacío de la línea lleva el audio a ese momento
    if (line.t != null) {
      el.classList.add('seekable');
      el.onclick = function (e) {
        if (e.target.closest('.ly-ch')) return;   // los caracteres abren su ficha / se marcan
        seekToLine(song, li);
      };
    }
    w.appendChild(el);
  });
  // espacio final: permite centrar las últimas líneas sin arrastrar la barra inferior
  w.appendChild(App.el('div', 'ly-tail'));
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
      '<div class="ly-card-py">' + App.esc(py) + '</div>' +
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
