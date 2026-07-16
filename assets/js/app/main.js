'use strict';

/* ==================== ARRANQUE ==================== */
(function () {

/* estrellas de fondo */
(function () {
  var cv = App.$('stars'), ctx = cv.getContext('2d');
  function draw() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    var rgb = App.cssVar('--star-rgb', '44,91,224');
    var n = Math.floor(innerWidth * innerHeight / 9000);
    for (var i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * innerWidth, Math.random() * innerHeight, Math.random() * 1.1 + 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + rgb + ',' + (Math.random() * 0.35 + 0.05).toFixed(2) + ')';
      ctx.fill();
    }
  }
  draw();
  var t;
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(draw, 250); });
})();

/* splash (solo la primera vez) */
(function () {
  var intro = App.$('intro');
  var seen = null;
  try { seen = localStorage.getItem('hsk1_intro_v1') || localStorage.getItem('chino_intro'); } catch (e) {}
  if (seen) {
    if (intro.parentNode) intro.parentNode.removeChild(intro);
    return;
  }
  try { localStorage.setItem('chino_intro', '1'); } catch (e) {}
  setTimeout(function () {
    intro.classList.add('intro-hide');
    setTimeout(function () { if (intro.parentNode) intro.parentNode.removeChild(intro); }, 750);
  }, 3100);
})();

/* navegación */
document.querySelectorAll('.nav-item').forEach(function (b) {
  b.addEventListener('click', function () { App.goto(b.getAttribute('data-goto')); });
});

/* interruptor de tema claro / oscuro */
(function () {
  var tb = App.$('theme-toggle');
  if (tb) tb.addEventListener('click', App.toggleTheme);
})();

/* el icono del header abre Perfil (perfil + ajustes del usuario) */
(function () {
  var hp = App.$('open-profile');
  if (!hp) return;
  hp.addEventListener('click', function () { App.goto('profile'); });
  hp.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); App.goto('profile'); } });
})();
App.$('overlay-back').addEventListener('click', App.closeOverlay);
App.$('overlay').addEventListener('click', function (e) {
  if (e.target === App.$('overlay')) App.closeOverlay();
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') App.closeOverlay();
});

/* tiempo de estudio: cuenta si la pestaña está visible y hubo interacción reciente */
var lastInput = Date.now();
['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
  document.addEventListener(ev, function () { lastInput = Date.now(); }, { passive: true });
});
var secAcc = 0;
setInterval(function () {
  if (document.hidden) return;
  if (Date.now() - lastInput > 120000) return; // 2 min sin tocar = pausa
  App.day('secs', 15);
  secAcc += 15;
  if (secAcc >= 60) { secAcc -= 60; App.mission('time', 1); }
}, 15000);

/* instalación PWA */
window.deferredPrompt = null;
window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  window.deferredPrompt = e;
  var b = App.$('btn-install');
  if (b) b.style.display = 'flex';
});
window.addEventListener('appinstalled', function () {
  window.deferredPrompt = null;
  var b = App.$('btn-install');
  if (b) b.style.display = 'none';
  App.toast('✅ Aplicación instalada');
});

/* service worker */
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  });
}

/* recordatorio de repasos (al abrir, una vez al día) */
App.ready.then(function () {
  if (!App.S.reminders || !('Notification' in window) || Notification.permission !== 'granted') return;
  var last = App.load('chino_notif', '');
  if (last === App.today()) return;
  var due = App.srsDue().length;
  if (due > 0) {
    App.save('chino_notif', App.today());
    try {
      new Notification('Chino · HSK', {
        body: 'Tienes ' + due + ' repasos pendientes. ¡5 minutos bastan! 加油',
        icon: 'assets/images/icon-192.png'
      });
    } catch (e) {}
  }
});

/* header + primera vista */
App.hdr();
var h = (location.hash || '').slice(1);
// entrada base del historial: se reemplaza, así el primer "atrás" sale de la app
App.goto(['home', 'learn', 'dict', 'practice', 'strokes', 'songs', 'profile'].indexOf(h) >= 0 ? h : 'home', true);

})();
