// Rend les sprites en PNG pour pouvoir les REGARDER pendant qu'on les dessine.
// Sans ça, on dessine a l'aveugle.
import {readFileSync, writeFileSync} from 'fs';
import {deflateSync} from 'zlib';

function png(largeur, hauteur, pixels){         // pixels: Uint8Array RGBA
  const brut = Buffer.alloc(hauteur * (largeur * 4 + 1));
  for (let y = 0; y < hauteur; y++){
    brut[y * (largeur * 4 + 1)] = 0;            // filtre 0
    Buffer.from(pixels.buffer, y * largeur * 4, largeur * 4)
      .copy(brut, y * (largeur * 4 + 1) + 1);
  }
  const crcTable = [...Array(256)].map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = b => {
    let c = 0xFFFFFFFF;
    for (const o of b) c = crcTable[(c ^ o) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  };
  const bloc = (type, data) => {
    const l = Buffer.alloc(4); l.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([l, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largeur, 0); ihdr.writeUInt32BE(hauteur, 4);
  ihdr[8] = 8; ihdr[9] = 6;                     // 8 bits, RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    bloc('IHDR', ihdr), bloc('IDAT', deflateSync(brut)), bloc('IEND', Buffer.alloc(0))
  ]);
}

const hex = c => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];

// --- charge la bibliotheque de sprites (globals, pas de modules) ------------
const src = readFileSync(process.argv[2] || 'art/sprites.js', 'utf8');
const ctx = {};
new Function('g', src + '\nObject.assign(g,{N,CAMPS,BATS,TOURS_ART,BOUTIQUES,dessiner});')(ctx);
const {N, CAMPS, BATS, TOURS_ART, BOUTIQUES, dessiner} = ctx;

const ECH   = +(process.env.ECH || 6);
const MARGE = 6;
const fond  = process.env.FOND ? hex(process.env.FOND) : [35,32,48];

const filtreB = process.env.BAT, filtreC = process.env.CAMP;
/* Une ligne par TOUR (rang et teinte compris), pas par famille : c'est la
   seule facon de verifier qu'aucune paire ne se ressemble. */
const tout = Object.keys(TOURS_ART).map(type => ({type, ...TOURS_ART[type]}))
  .concat(Object.entries(BOUTIQUES).map(([type, k]) => ({type, k, r: 0})));
const bats  = process.env.BOUTIQUES
  ? Object.entries(BOUTIQUES).map(([type, k]) => ({type, k, r: 0}))
  : tout.filter(b => !filtreB || b.type === filtreB || b.k === filtreB);
const camps = CAMPS.filter(c => !filtreC || c.k === filtreC);

const cw = N * ECH + MARGE * 2, ch = N * ECH + MARGE * 2;
/* COLS replie la liste en grille : trente tours en colonne font une bande de
   cinq mille pixels que personne ne peut regarder d'un coup. */
const COLS = +(process.env.COLS || 0);
const cols = COLS || camps.length;
const lignes = COLS ? Math.ceil(bats.length * camps.length / COLS) : bats.length;
const W = cw * cols, H = ch * lignes;
const px = new Uint8Array(W * H * 4);
for (let i = 0; i < W * H; i++){
  px[i*4] = fond[0]; px[i*4+1] = fond[1]; px[i*4+2] = fond[2]; px[i*4+3] = 255;
}
let n = 0;
bats.forEach((b, r0) => camps.forEach((f, c0) => {
  const r = COLS ? Math.floor(n / COLS) : r0, c = COLS ? n % COLS : c0;
  n++;
  const g = dessiner(b.k, f, false, b.r, b.t, b.v);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
    const v = g[y][x]; if (!v) continue;
    const [R, G, B] = hex(v);
    for (let dy = 0; dy < ECH; dy++) for (let dx = 0; dx < ECH; dx++){
      const X = c*cw + MARGE + x*ECH + dx, Y = r*ch + MARGE + y*ECH + dy;
      const i = (Y*W + X) * 4;
      px[i] = R; px[i+1] = G; px[i+2] = B; px[i+3] = 255;
    }
  }
}));
const sortie = process.argv[3] || 'apercu.png';
writeFileSync(sortie, png(W, H, px));
console.log(`${sortie}  ${W}x${H}  (${bats.length} tours x ${camps.length} camps, echelle ${ECH})`);
