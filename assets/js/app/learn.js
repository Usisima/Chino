'use strict';

/* ==================== APRENDER: vocabulario por temas (HSK 3.0) ==================== */
(function () {

/* normaliza texto para emparejar (minúsculas, sin acentos, conserva espacios) */
function norm(s) {
  return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/* ---------- temas por palabras clave (español) ---------- */
var TOPICS = [
  { id: 'animales', ico: '🐾', name: 'Animales', kw: ['animal','gato','perro','pajaro','ave','pez','pescado','caballo','vaca','buey','oveja','cabra','cerdo','cochino','pollo','gallina','pato','conejo','tigre','leon','oso','mono','serpiente','dragon','raton','rata','elefante','lobo','insecto','mosca','mosquito','abeja','mariposa','tortuga','rana','panda','ganso'] },
  { id: 'comida', ico: '🍜', name: 'Comida y bebida', kw: ['comer','comida','beber','bebida','arroz','fideo','pan','carne','huevo','verdura','fruta','manzana','platano','naranja','sandia','uva','sopa','te','cafe','leche','agua','vino','cerveza','azucar','sal','aceite','sabor','dulce','picante','restaurante','hambre','sed','desayuno','almuerzo','cena','plato','galleta','pastel','helado','chocolate','tofu','jugo'] },
  { id: 'familia', ico: '👪', name: 'Familia y personas', kw: ['familia','padre','madre','papa','mama','hijo','hija','hermano','hermana','abuelo','abuela','esposo','esposa','marido','nino','nina','bebe','amigo','persona','gente','senor','senora','tio','tia','primo','novio','novia','hombre','mujer','companero','vecino'] },
  { id: 'cuerpo', ico: '🧍', name: 'Cuerpo', kw: ['cuerpo','cabeza','cara','ojo','oreja','oido','nariz','boca','diente','mano','pie','pierna','brazo','dedo','corazon','pelo','cabello','estomago','sangre','piel','hueso','rostro','hombro'] },
  { id: 'colores', ico: '🎨', name: 'Colores', kw: ['color','rojo','azul','verde','amarillo','negro','blanco','gris','rosa','morado','purpura','marron','dorado','plateado'] },
  { id: 'naturaleza', ico: '🌿', name: 'Naturaleza y clima', kw: ['naturaleza','sol','luna','estrella','cielo','nube','lluvia','nieve','viento','fuego','montana','rio','mar','oceano','arbol','flor','hierba','hoja','tierra','piedra','bosque','lago','playa','planta','clima','nublado','soleado','trueno','tormenta'] },
  { id: 'ropa', ico: '👕', name: 'Ropa', kw: ['ropa','camisa','pantalon','falda','vestido','zapato','sombrero','calcetin','abrigo','chaqueta','bufanda','guante','cinturon','gafas','lentes','traje','uniforme'] },
  { id: 'transporte', ico: '🚗', name: 'Transporte', kw: ['coche','carro','auto','autobus','tren','avion','barco','bicicleta','metro','taxi','moto','motocicleta','camion','transporte','conducir','manejar','viajar','viaje','estacion','aeropuerto','boleto','billete','pasajero'] },
  { id: 'casa', ico: '🏠', name: 'Casa y objetos', kw: ['casa','hogar','habitacion','cuarto','puerta','ventana','mesa','silla','cama','sofa','lampara','telefono','computadora','ordenador','television','reloj','libro','papel','lapiz','boligrafo','llave','dinero','bolsa','caja','espejo','cocina','bano','mueble','cuchillo','cuchara','tenedor','plato','taza','vaso'] },
  { id: 'lugares', ico: '🗺️', name: 'Lugares y países', kw: ['pais','ciudad','pueblo','lugar','calle','escuela','universidad','hospital','banco','tienda','mercado','oficina','parque','biblioteca','hotel','china','estados unidos','america','japon','mundo','mapa','direccion','camino','norte','sur','este','oeste','pekin','extranjero'] },
  { id: 'tiempo', ico: '📅', name: 'Tiempo y calendario', kw: ['hora','minuto','segundo','dia','semana','mes','ano','hoy','manana','ayer','ahora','temprano','tarde','noche','mediodia','fecha','calendario','momento','lunes','martes','miercoles','jueves','viernes','sabado','domingo','estacion del ano','primavera','verano','otono','invierno'] },
  { id: 'emociones', ico: '😊', name: 'Emociones', kw: ['feliz','contento','triste','enojado','enfadado','miedo','amor','amar','gustar','odiar','alegria','emocion','sentir','cansado','preocupado','sorpresa','reir','llorar','sonreir','nervioso','tranquilo','aburrido','enamorado'] },
  { id: 'estudio', ico: '📚', name: 'Estudio y trabajo', kw: ['estudiar','aprender','ensenar','escuela','clase','profesor','maestro','alumno','estudiante','examen','tarea','libro','leer','escribir','palabra','pregunta','respuesta','trabajo','trabajar','oficina','empresa','jefe','reunion','proyecto','negocio','profesion'] },
  { id: 'saludos', ico: '💬', name: 'Saludos y expresiones', kw: ['hola','adios','gracias','por favor','perdon','disculpa','saludo','expresion','bienvenido','felicidades','buenos dias','buenas noches','de nada','lo siento'] }
];

/* categorías gramaticales (por códigos de w.pos) */
var GRAMMAR = [
  { id: 'v', ico: '跑', name: 'Verbos', pos: ['v', 'vn'] },
  { id: 'n', ico: '名', name: 'Sustantivos', pos: ['n', 'nz', 'ns', 'nr', 'nt', 't', 's'] },
  { id: 'a', ico: '好', name: 'Adjetivos', pos: ['a', 'z', 'b'] },
  { id: 'd', ico: '很', name: 'Adverbios', pos: ['d'] },
  { id: 'q', ico: '个', name: 'Clasificadores', pos: ['q'] },
  { id: 'r', ico: '你', name: 'Pronombres', pos: ['r'] },
  { id: 'm', ico: '三', name: 'Numerales', pos: ['m'] },
  { id: 'p', ico: '在', name: 'Preposiciones', pos: ['p'] },
  { id: 'c', ico: '和', name: 'Conjunciones', pos: ['c'] },
  { id: 'u', ico: '了', name: 'Partículas', pos: ['u', 'y'] },
  { id: 'e', ico: '啊', name: 'Interjecciones', pos: ['e', 'o'] }
];

/* índice memoizado: id de categoría -> [palabras] (solo HSK 3.0) */
var index = null;
function buildIndex() {
  if (index) return index;
  index = {};
  TOPICS.concat(GRAMMAR).forEach(function (c) { index[c.id] = []; });
  var res = TOPICS.map(function (t) {
    return { id: t.id, re: new RegExp('\\b(' + t.kw.map(function (k) { return k.replace(/ /g, '\\s'); }).join('|') + ')', 'i') };
  });
  App.W.forEach(function (word) {
    if (!word.l3) return;   // estándar HSK 3.0
    var g = norm(word.es || word.en);
    res.forEach(function (t) { if (t.re.test(g)) index[t.id].push(word); });
    var codes = (word.pos || '').split(',').map(function (p) { return p.trim().toLowerCase(); });
    GRAMMAR.forEach(function (gr) {
      if (codes.some(function (c) { return gr.pos.indexOf(c) >= 0; })) index[gr.id].push(word);
    });
  });
  return index;
}

App.viewBack.learn = function () { return false; };

App.views.learn = function () {
  var w = App.$('learn-wrap');
  w.innerHTML = '';
  w.appendChild(App.el('p', 'page-title', '<span class="zh">学习</span> · Aprender'));
  w.appendChild(App.el('div', 'title-divider'));
  App.ready.then(function () {
    if (App.currentView !== 'learn') return;
    render(w);
  });
};

function render(w) {
  while (w.children.length > 2) w.removeChild(w.lastChild);
  var idx = buildIndex();

  w.appendChild(App.el('p', 'hint', 'Explora el vocabulario HSK 3.0 agrupado por temas. Toca un grupo para ver y estudiar sus palabras.'));

  w.appendChild(App.el('p', 'section-title', 'Vocabulario por tema'));
  var tg = App.el('div', 'cat-grid');
  TOPICS.forEach(function (t) {
    var n = idx[t.id].length;
    if (!n) return;
    var c = App.el('button', 'cat-card',
      '<span class="cat-ico">' + t.ico + '</span>' +
      '<span class="cat-name">' + t.name + '</span>' +
      '<span class="cat-count">' + n + '</span>');
    c.onclick = function () { openCat(t.name + ' ' + t.ico, idx[t.id]); };
    tg.appendChild(c);
  });
  w.appendChild(tg);

  w.appendChild(App.el('p', 'section-title', 'Por categoría gramatical'));
  var gg = App.el('div', 'cat-grid');
  GRAMMAR.forEach(function (gr) {
    var n = idx[gr.id].length;
    if (!n) return;
    var c = App.el('button', 'cat-card',
      '<span class="cat-ico zh">' + gr.ico + '</span>' +
      '<span class="cat-name">' + gr.name + '</span>' +
      '<span class="cat-count">' + n + '</span>');
    c.onclick = function () { openCat(gr.name, idx[gr.id]); };
    gg.appendChild(c);
  });
  w.appendChild(gg);
}

/* lista de palabras de una categoría, con opción de estudiar */
function openCat(title, words) {
  words = words.slice().sort(function (a, b) { return (a.freq || 9e9) - (b.freq || 9e9); });
  App.openOverlay(title + ' · ' + words.length, function (body) {
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

})();
