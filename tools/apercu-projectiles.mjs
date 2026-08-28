/* Planche de contact des projectiles : chaque famille, a trois instants du
   vol. Le jeu en montre trop peu a la fois pour juger un dessin ; ici on les
   met tous cote a cote, en grand. Sortie : une image PNG. */
import {chromium} from 'playwright';
const OUT = process.argv[2] || '/tmp/projectiles.png';
const nav = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const page = await nav.newPage({viewport:{width:900,height:820},deviceScaleFactor:2});
page.on('pageerror', e => console.log('PAGE: '+e.message));
await page.goto('file:///home/user/ltw7/index.html');
await page.waitForTimeout(700);
await page.click('#jouer'); await page.waitForTimeout(300);

await page.evaluate(() => {
  const genres = ['fleche','perce','mortier','braise','givre','foudre','prisme','siege'];
  const T = 96, cfg = etat.cfg, L = 220, HL = 90;
  const cv = document.createElement('canvas');
  cv.width = 900 * 2; cv.height = genres.length * HL * 2 + 40;
  cv.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;width:900px;'
                   + 'height:' + (genres.length * HL + 20) + 'px;background:#7fae54';
  document.body.appendChild(cv);
  const c = cv.getContext('2d'); c.setTransform(2,0,0,2,0,0); c.imageSmoothingEnabled = false;
  c.fillStyle = '#7fae54'; c.fillRect(0,0,900,cv.height);
  const m2 = v => v * cfg.MILLI / T;              // pixels -> milli-cases
  genres.forEach((g, i) => {
    const y = 30 + i * HL;
    c.fillStyle = '#12101a'; c.font = 'bold 15px monospace';
    c.fillText(g, 12, y + 5);
    [0.15, 0.55, 1.35].forEach((u, k) => {
      const x0 = 130 + k * 250;
      const p = PROJ[g];
      const duree = p.v ? Math.max(60, Math.min(420, m2(L) / p.v)) : 90;
      const t = {genre:g, p, dist:m2(L), x:m2(x0), y:m2(y), cx:m2(x0 + L * .75),
                 cy:m2(y - 12), zone: g === 'mortier' ? m2(60) : 0,
                 age: u * duree, duree};
      c.fillStyle = 'rgba(0,0,0,.12)';            // le trajet, pour situer
      c.fillRect(x0, y - 1, L * .75, 1);
      dessinerTirs(c, cfg, T, 0, 0, [t]);
    });
  });
  window.__apercu = cv;
});
await page.waitForTimeout(200);
await page.screenshot({path: OUT, clip:{x:0, y:0, width:900, height:760}});
console.log('ecrit ' + OUT);
await nav.close();
