# Chino · HSK

PWA completa para aprender chino mandarín (HSK 1–9), con el estilo visual del
proyecto Ukishima. **11,473 palabras** con datos reales de fuentes abiertas.

## Secciones

- **Inicio** — meta diaria con anillo de progreso, racha, misiones diarias,
  palabra del día, nivel de estudiante (XP/monedas).
- **Aprender** — repaso espaciado (SRS, algoritmo SM-2), palabras nuevas por
  nivel, flashcards libres, navegador de vocabulario por nivel. Soporta
  HSK 3.0 (2021, bandas 1 a 7–9) y HSK 2.0 (clásico, 1–6). La sección
  *Lecciones* es un marcador de posición (pendiente de contenido).
- **Diccionario** — búsqueda por hanzi (simplificado/tradicional), pinyin con o
  sin tonos, traducción (ES/EN) y radical (los 238 siempre visibles). Ficha
  completa de cada palabra: pinyin, zhuyin, tradicional, clasificador, nivel,
  radical, número de trazos, etimología por carácter, descomposición,
  **animación del orden de trazos** y **práctica de escritura con
  reconocimiento de trazos** (hanzi-writer), sinónimos aproximados y palabras
  relacionadas. Favoritos e historial de búsqueda.
- **Práctica** — ejercicios: leer, traducir, escuchar, dictado (escribe el
  pinyin), emparejar y escritura de caracteres. Juegos: memorama y
  contrarreloj. **Examen de práctica** de 20 preguntas con temporizador de
  10 minutos e historial de resultados.
- **Perfil** — estadísticas (precisión, tiempo de estudio, actividad de
  14 días con gráficas), progreso por nivel, 16 insignias, listas
  personalizadas de vocabulario, exportar/importar progreso y ajustes:
  simplificado/tradicional, pinyin/zhuyin/ocultar fonética, ocultar
  traducciones, meta diaria y recordatorios.

Todo el progreso vive en `localStorage`; funciona sin conexión una vez
instalada (los trazos se descargan bajo demanda y quedan en caché).

## Cómo usarla / instalarla

- **En esta PC**: doble clic en `Abrir HSK1.bat` (servidor local + navegador).
  En Chrome/Edge aparece «Instalar aplicación».
- **En el teléfono**: sube la carpeta a un hosting estático (GitHub Pages,
  Netlify…). Android/Chrome: «Instalar aplicación»; iPhone/Safari:
  Compartir → «Añadir a pantalla de inicio».

## Datos y regeneración

Los datos se generan con `tools/build-data.js` a partir de fuentes abiertas
(instrucciones de descarga en el propio script):

- [complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) —
  vocabulario HSK 2.0 + 3.0 con pinyin, zhuyin, tradicional y clasificadores.
- [makemeahanzi](https://github.com/skishore/makemeahanzi) — 9,574 caracteres
  con radical, etimología, descomposición y trazos SVG.
- [hanzi-writer](https://hanziwriter.org) — animación y quiz de trazos (MIT).
- `tools/es-*.json` — traducciones al español. **Cobertura: HSK 3.0 niveles
  1–6 completos (5,367 palabras)**. La banda 7–9 (5,606 palabras avanzadas) y
  ~500 palabras exclusivas del HSK 2.0 clásico muestran de momento la
  definición en inglés con la etiqueta «(EN · aún sin traducir)»; para
  ampliarlas basta añadir entradas a un `tools/es-l7.json` y regenerar.

```
node tools/build-data.js [carpeta-datasets]
```

## Estructura

- `index.html` — shell de la SPA
- `assets/css/app.css` — estilos (sistema de diseño Ukishima)
- `assets/js/app/*.js` — core, inicio, aprender, diccionario, práctica, perfil
- `assets/js/lib/hanzi-writer.min.js`
- `assets/data/` — `words.json`, `chars.json`, `radicals.json`,
  `strokes/s0-47.json` (shards de trazos, carga perezosa)
- `manifest.json`, `sw.js` — PWA offline
- `tools/` — pipeline de datos

## Pendiente / fuera de alcance local

- **Lecciones estructuradas** — sección creada, contenido pendiente (a petición).
- Ejercicios que requieren corpus de oraciones (ordenar frases, completar
  espacios), crucigramas, historias interactivas y juego de pronunciación.
- **Sincronización en la nube** — requiere servidor; se sustituye con
  exportar/importar progreso (JSON).
- Imágenes por palabra (no hay dataset libre razonable para 11k palabras).
