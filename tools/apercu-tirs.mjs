/* Capture les projectiles en vol. On truque la ligne du joueur (or, bois,
   branches) pour poser une tour de chaque famille, on lache des monstres,
   et on prend une rafale d'images pour en attraper au moins une pleine de
   tirs. Sans ca, impossible de juger l'animation autrement qu'a l'aveugle. */
import {chromium} from 'playwright';
const OUT = process.argv[2] || '/tmp/tirs';
const nav = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const page = await nav.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const erreurs = [];
page.on('console', m => { if (m.type()==='error') erreurs.push(m.text()); });
page.on('pageerror', e => erreurs.push('PAGE: '+e.message));
await page.goto('file:///home/user/ltw7/index.html');
await page.waitForTimeout(900);
await page.click('#jouer'); await page.waitForTimeout(300);

await page.evaluate(() => {
  const l = etat.lignes[0];
  l.or = 9e6; l.bois = 99;
  for (const k in etat.cfg.BRANCHES) l.branches[k] = true;
  const plan = [
    ['guet',2,2], ['epine',6,2], ['canon',2,4], ['socle',6,4],
    ['barbecue',2,6], ['glacier',6,6], ['courtCircuit',2,8],
    ['cloaque',6,8], ['oiseau',2,10], ['elementaire',6,10]
  ];
  for (const [t,x,y] of plan){
    poserBatiment(etat, l, 'guet', x, y);
    const b = l.batiments[l.batiments.length-1];
    if (t !== 'guet') b.type = t, b.pvMax = etat.cfg.TOURS[t].pv, b.pv = b.pvMax;
  }
});
await page.waitForTimeout(200);
for (let k = 0; k < 10; k++){
  await page.evaluate(() => {
    const l = etat.lignes[0];
    if (l.monstres.length < 6)
      for (const t of ['centaure','fantassin','demolisseur'])
        faireApparaitre(etat, l, t, 1);
  });
  await page.waitForTimeout(200);
  await page.screenshot({path:`${OUT}-${k}.png`});
}
console.log('tirs vivants :', await page.evaluate(() => tirs.length));
console.log(erreurs.length ? 'ERREURS:\n'+erreurs.slice(0,5).join('\n') : 'aucune erreur console');
await nav.close();
