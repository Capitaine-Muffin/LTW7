/* Genere l'icone de l'application. Elle est DESSINEE, pas peinte a la main :
   la meme bibliotheque de sprites que le jeu, donc l'icone ne peut pas deriver
   du rendu. Une tour de guet humaine sur un fond de couloir, en 512 et en 192.
     node tools/icone.mjs */
import {readFileSync, writeFileSync} from 'fs';
import {deflateSync} from 'zlib';

function png(w, h, px){
  const brut = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++){
    brut[y * (w * 4 + 1)] = 0;
    Buffer.from(px.buffer, y * w * 4, w * 4).copy(brut, y * (w * 4 + 1) + 1);
  }
  const tab = [...Array(256)].map((_, n) => { let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xFFFFFFFF;
    for (const o of b) c = tab[(c ^ o) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const bloc = (nom, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length);
    const c = Buffer.concat([Buffer.from(nom), d]); const q = Buffer.alloc(4);
    q.writeUInt32BE(crc(c)); return Buffer.concat([l, c, q]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
    bloc('IHDR', ihdr), bloc('IDAT', deflateSync(brut)), bloc('IEND', Buffer.alloc(0))]);
}
const hex = c => [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)];

const X = {};
new Function('g', readFileSync('art/sprites.js','utf8') +
  '\nObject.assign(g,{N,CAMPS,TOURS_ART,dessiner});')(X);
const {N, CAMPS, TOURS_ART, dessiner} = X;

/* Composition : le couloir a droite avec un assaillant dessus, la tour a
   gauche qui le vise. Une icone doit raconter le jeu, pas montrer un batiment.
   Verifie a 48 pixels — c'est la taille qui compte, pas le 512. */
const B = 72;
const X2 = {};
new Function('g', readFileSync('art/monstres.js','utf8') +
  '\nObject.assign(g,{NM,dessinerMonstre});')(X2);
const {NM, dessinerMonstre} = X2;

const tour = dessiner('prisme', CAMPS[0], false, TOURS_ART.cloaque.r,
                      TOURS_ART.cloaque.t, 0);
const bete = dessinerMonstre('fantassin', 0);
const grille = Array.from({length: B}, () => Array(B).fill(null));
const HERBE = '#4a7c3f', HERBE2 = '#568c48', SENTIER = '#7a5a34', SENTIER2 = '#8a6a40';
for (let y = 0; y < B; y++) for (let x = 0; x < B; x++){
  const surSentier = x >= 44;
  grille[y][x] = surSentier ? SENTIER : HERBE;
  if ((x * 5 + y * 3) % 19 === 0) grille[y][x] = surSentier ? SENTIER2 : HERBE2;
}
for (let y = 0; y < B; y++){ grille[y][43] = '#3d2a18'; grille[y][44] = '#6b4d2c'; }

/* Le monstre d'abord, la tour par-dessus : elle doit dominer. */
/* Un creep fait environ le tiers d'une tour dans la map : on garde ce rapport,
   c'est lui qui rend la scene juste. */
for (let y = 0; y < NM; y++) for (let x = 0; x < NM; x++){
  const v = bete[y][x]; if (!v) continue;
  const px = 47 + x, py = 12 + y;
  if (px >= 0 && px < B && py >= 0 && py < B) grille[py][px] = v;
}
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
  const v = tour[y][x]; if (!v) continue;
  const px = x - 2, py = y + 22;
  if (px >= 0 && px < B && py >= 0 && py < B) grille[py][px] = v;
}
/* Une fleche en vol, de la tour vers l'assaillant : c'est elle qui dit
   « tower wars » et pas « village medieval ». */
for (let k = 0; k < 14; k++){
  const px = 30 + k, py = 40 - Math.round(k * 0.9);
  for (const [dx, dy] of [[0,0],[0,1]])
    if (px+dx < B && py+dy >= 0) grille[py+dy][px+dx] = k > 10 ? '#e8eef5' : '#8a6b3a';
}
for (const [dx, dy] of [[29,41],[29,42],[28,40],[28,43]]) grille[dy][dx] = '#d8434a';

for (const taille of [512, 192]){
  const E = taille / B;
  const px = new Uint8Array(taille * taille * 4);
  for (let y = 0; y < taille; y++) for (let x = 0; x < taille; x++){
    const v = grille[(y / E) | 0][(x / E) | 0] || FOND;
    const [R, G, Bl] = hex(v); const i = (y * taille + x) * 4;
    px[i] = R; px[i+1] = G; px[i+2] = Bl; px[i+3] = 255;
  }
  writeFileSync(`icone-${taille}.png`, png(taille, taille, px));
  console.log(`icone-${taille}.png`);
}
