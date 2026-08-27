/* Fait jouer la page dans un vrai Chromium et prend des captures.
   C'est ce qui a attrape les deux bugs qu'aucun test unitaire ne voyait :
   un calque `hidden` qui interceptait les clics, et une collision de noms
   globaux entre config.js et jeu.js.
     node tools/essai-navigateur.mjs
   Les captures partent dans /tmp. */
import {chromium} from 'playwright';
const nav = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const page = await nav.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
const erreurs = [];
page.on('console', m => { if (m.type()==='error') erreurs.push(m.text()); });
page.on('pageerror', e => erreurs.push('PAGE: '+e.message));
await page.goto('file:///home/user/ltw7/index.html');
await page.waitForTimeout(900);
// on pose quelques tours comme un joueur
const g = await page.$('#scene'); const b = await g.boundingBox();
const T = Math.floor(Math.min(b.width/9, b.height/13));
const ox = b.x + (b.width - T*9)/2, oy = b.y + (b.height - T*13)/2;
const clic = async (x,y) => { await page.mouse.click(ox+(x+.5)*T, oy+(y+.5)*T); await page.waitForTimeout(60); };
if (!await page.$('[data-poser="guet"]')) await page.click('[data-menu="batiments"]');
await page.waitForTimeout(150);
await page.click('[data-poser="guet"]');
for (const [x,y] of [[3,3],[5,3],[3,5],[5,5],[2,7]]) await clic(x,y);
await page.click('[data-poser="epine"]');
for (const [x,y] of [[6,7],[3,9],[5,9]]) await clic(x,y);
await page.waitForTimeout(2500);
await page.screenshot({path:'/tmp/claude-0/-home-user-FOLLOWER-1/e3001a36-86fb-5ffe-9c4c-fbbd121ecdd6/scratchpad/jeu1.png'});
// panneau monstres
await page.click('[data-menu="monstres"]'); await page.waitForTimeout(250);
await page.screenshot({path:'/tmp/claude-0/-home-user-FOLLOWER-1/e3001a36-86fb-5ffe-9c4c-fbbd121ecdd6/scratchpad/jeu2.png'});
const etat = await page.evaluate(() => ({or:etat.lignes[0].or, rev:etat.lignes[0].revenu,
  vies:etat.lignes[0].vies, bat:etat.lignes[0].batiments.length, pas:etat.pas,
  monstres:etat.lignes[0].monstres.length}));
console.log('etat en jeu :', JSON.stringify(etat));
console.log(erreurs.length ? 'ERREURS:\n'+erreurs.slice(0,5).join('\n') : 'aucune erreur console');
await nav.close();
