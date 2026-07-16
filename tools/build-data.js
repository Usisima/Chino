// Pipeline: datasets abiertos -> datos de la app Chino
// - complete-hsk-vocabulary (drkameleon) -> words.json
// - makemeahanzi dictionary.txt + graphics.txt -> chars.json + shards de trazos
// - fusiona las traducciones ES de es-hsk1.json
//
// Uso: node build-data.js [carpeta-datasets]
// Datasets necesarios en esa carpeta (descargas abiertas):
//  - complete.json   https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.json
//  - dictionary.txt  https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt
//  - graphics.txt    https://raw.githubusercontent.com/skishore/makemeahanzi/master/graphics.txt
const fs = require('fs');
const path = require('path');

const D = process.argv[2] || path.join(__dirname, 'datasets');
const OUT = path.join(__dirname, '..', 'assets', 'data');
const SHARDS = 48;

fs.mkdirSync(path.join(OUT, 'strokes'), { recursive: true });

/* ---------- 1. Español: fusiona todos los tools/es-*.json ---------- */
const esMap = {};
fs.readdirSync(__dirname).filter(f => /^es-.*\.json$/.test(f)).sort().forEach(f => {
  Object.assign(esMap, JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8')));
});
console.log('ES translations:', Object.keys(esMap).length);

/* ---------- 2. Palabras ---------- */
const raw = JSON.parse(fs.readFileSync(D + '/complete.json', 'utf8'));
let noLevel = 0;
const words = [];
for (const w of raw) {
  let l2 = 0, l3 = 0;
  (w.level || []).forEach(l => {
    const m = l.match(/^(old|new)-(\d)$/);
    if (!m) return;
    const n = +m[2];
    if (m[1] === 'old') l2 = l2 ? Math.min(l2, n) : n;
    else l3 = l3 ? Math.min(l3, n) : n;
  });
  if (!l2 && !l3) { noLevel++; continue; }
  const f = w.forms && w.forms[0];
  if (!f) continue;
  // une significados de todas las formas (sin duplicar)
  const seen = new Set();
  const meanings = [];
  const cls = new Set();
  for (const fm of w.forms) {
    (fm.meanings || []).forEach(m => { if (!seen.has(m)) { seen.add(m); meanings.push(m); } });
    (fm.classifiers || []).forEach(c => cls.add(c));
  }
  const t = f.traditional && f.traditional !== w.simplified ? f.traditional : '';
  words.push([
    w.simplified,
    t,
    (f.transcriptions && f.transcriptions.pinyin) || '',
    (f.transcriptions && f.transcriptions.bopomofo) || '',
    meanings.join(' | '),
    esMap[w.simplified] || '',
    Array.from(cls).join(' '),
    (w.pos || []).join(','),
    w.radical || '',
    w.frequency || 0,
    l2,
    l3
  ]);
}
// suplemento: expresiones esenciales que el dataset no incluye como entrada
const have = new Set(words.map(w => w[0]));
[
  ['你好', '', 'nǐ hǎo', 'ㄋㄧˇ ㄏㄠˇ', 'hello | hi', 'hola', '', 'l', '亻', 120, 1, 1],
  ['您好', '', 'nín hǎo', 'ㄋㄧㄣˊ ㄏㄠˇ', 'hello (polite) | how do you do?', 'hola (formal)', '', 'l', '亻', 1800, 2, 1],
  ['是的', '', 'shì de', 'ㄕˋ ㄉㄜ˙', 'yes, that is right', 'sí, así es', '', 'l', '日', 2200, 1, 1]
].forEach(w => { if (!have.has(w[0])) words.push(w); });

// orden por frecuencia (más común primero) para resultados de búsqueda útiles
words.sort((a, b) => (a[9] || 9e9) - (b[9] || 9e9));
console.log('words kept:', words.length, '| dropped (solo "newest"):', noLevel);

const wordsOut = { v: 2, fields: 's,t,p,z,en,es,cls,pos,rad,freq,l2,l3', words };
fs.writeFileSync(path.join(OUT, 'words.json'), JSON.stringify(wordsOut));
console.log('words.json:', (fs.statSync(path.join(OUT, 'words.json')).size / 1048576).toFixed(2), 'MB');

// nivel: conteos
const c2 = {}, c3 = {};
words.forEach(w => { if (w[10]) c2[w[10]] = (c2[w[10]] || 0) + 1; if (w[11]) c3[w[11]] = (c3[w[11]] || 0) + 1; });
console.log('HSK2.0:', JSON.stringify(c2), 'HSK3.0:', JSON.stringify(c3));

/* ---------- 3. Trazos (graphics.txt) ---------- */
const strokeCount = {};
const shards = Array.from({ length: SHARDS }, () => ({}));
const glines = fs.readFileSync(D + '/graphics.txt', 'utf8').split('\n');
let gtotal = 0;
for (const line of glines) {
  if (!line.trim()) continue;
  const g = JSON.parse(line);
  const ch = g.character;
  strokeCount[ch] = g.strokes.length;
  shards[ch.codePointAt(0) % SHARDS][ch] = { s: g.strokes, m: g.medians };
  gtotal++;
}
let shardBytes = 0;
shards.forEach((sh, i) => {
  const p = path.join(OUT, 'strokes', 's' + i + '.json');
  fs.writeFileSync(p, JSON.stringify(sh));
  shardBytes += fs.statSync(p).size;
});
console.log('stroke chars:', gtotal, '| shards:', SHARDS, '| total', (shardBytes / 1048576).toFixed(1), 'MB, avg', Math.round(shardBytes / SHARDS / 1024), 'KB');

/* ---------- 4. Caracteres (dictionary.txt) ---------- */
const chars = {};
const dlines = fs.readFileSync(D + '/dictionary.txt', 'utf8').split('\n');
for (const line of dlines) {
  if (!line.trim()) continue;
  const c = JSON.parse(line);
  chars[c.character] = [
    c.definition || '',
    (c.pinyin || []).join(', '),
    c.radical || '',
    strokeCount[c.character] || 0,
    c.etymology ? (c.etymology.type || '') : '',
    c.etymology ? (c.etymology.hint || '') : '',
    c.decomposition || '',
    c.etymology ? (c.etymology.phonetic || '') : '',
    c.etymology ? (c.etymology.semantic || '') : ''
  ];
}
fs.writeFileSync(path.join(OUT, 'chars.json'), JSON.stringify({ v: 2, fields: 'def,pinyin,rad,strokes,etymType,etymHint,decomp,etymPhon,etymSem', chars }));
console.log('chars.json:', Object.keys(chars).length, 'chars,', (fs.statSync(path.join(OUT, 'chars.json')).size / 1048576).toFixed(2), 'MB');

/* ---------- 5. Radicales (para el buscador por radical) ---------- */
const radCount = {};
words.forEach(w => { if (w[8]) radCount[w[8]] = (radCount[w[8]] || 0) + 1; });
const rads = Object.entries(radCount).sort((a, b) => b[1] - a[1]);
fs.writeFileSync(path.join(OUT, 'radicals.json'), JSON.stringify(rads));
console.log('radicals:', rads.length, '| top:', rads.slice(0, 8).map(r => r[0] + ':' + r[1]).join(' '));
