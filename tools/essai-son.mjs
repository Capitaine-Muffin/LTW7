/* Je ne peux pas ecouter le jeu. On rend donc chaque son hors ligne dans un
   OfflineAudioContext et on mesure : un son muet (crete quasi nulle) ou sature
   (crete >= 1) est un defaut qu'aucun test de code ne verrait.
     node tools/essai-son.mjs */
import {chromium} from 'playwright';
const nav = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const page = await nav.newPage();
page.on('pageerror', e => console.log('PAGE: ' + e.message));
await page.goto('file:///home/user/ltw7/index.html');
await page.waitForTimeout(700);

const mesures = await page.evaluate(async () => {
  const noms = Object.keys(SONS);
  const out = [];
  for (const nom of noms){
    const c = new OfflineAudioContext(1, 44100 * 2, 44100);
    const g = c.createGain(); g.gain.value = 1; g.connect(c.destination);
    /* meme tampon de bruit que le jeu, mais dans le contexte hors ligne */
    const n = c.sampleRate, b = c.createBuffer(1, n, n), d = b.getChannelData(0);
    let s = 22222;
    for (let i = 0; i < n; i++){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s |= 0;
      d[i] = (s / 2147483648) % 1; }
    rendreSon(c, g, nom, 0.01, b);
    const rendu = await c.startRendering();
    const x = rendu.getChannelData(0);
    let crete = 0, somme = 0, fin = 0;
    for (let i = 0; i < x.length; i++){
      const v = Math.abs(x[i]);
      if (v > crete) crete = v;
      somme += x[i] * x[i];
      if (v > 0.002) fin = i;
    }
    out.push({nom, crete: +crete.toFixed(3),
              rms: +Math.sqrt(somme / x.length).toFixed(4),
              duree: +(fin / 44100).toFixed(2)});
  }
  return out;
});
await nav.close();

let mauvais = 0;
console.log('son          crete    rms   duree');
for (const m of mesures){
  /* Cibles : un tir doit s'effacer derriere un evenement, un evenement
     derriere un vol de vie. C'est ce rapport-la qu'on verifie, pas un volume
     absolu. */
  const TIRS = ['fleche','dard','mortier','braise','givre','foudre','prisme','siege'];
  const cible = m.nom === 'vol' || m.nom === 'vaporise' ? [.55, .95]
              : TIRS.includes(m.nom) ? [.15, .38] : [.30, .75];
  const souci = m.crete < 0.02 ? ' MUET' : m.crete >= 1 ? ' SATURE'
              : m.duree > 1.2 ? ' TROP LONG'
              : m.crete < cible[0] ? ' TROP FAIBLE'
              : m.crete > cible[1] ? ' TROP FORT' : '';
  if (souci) mauvais++;
  console.log(m.nom.padEnd(12) + String(m.crete).padStart(6) +
              String(m.rms).padStart(8) + String(m.duree).padStart(7) + 's' + souci);
}
console.log(mauvais ? `\n${mauvais} son(s) a revoir` : '\ntous les sons sont audibles et propres');
process.exit(mauvais ? 1 : 0);
