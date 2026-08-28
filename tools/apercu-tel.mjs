/* Rend la page a la taille d'un vrai telephone et verifie le glissement.
   Sans la balise viewport, un mobile rendait la page en 980 px puis la
   reduisait : tout le texte devenait illisible. On mesure donc la largeur de
   mise en page en plus de prendre des images. */
import {chromium} from 'playwright';
const OUT = process.argv[2] || '/tmp/tel';
const nav = await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const page = await nav.newPage({viewport:{width:393,height:852}, deviceScaleFactor:3,
  isMobile:true, hasTouch:true, userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'});
const erreurs = [];
page.on('pageerror', e => erreurs.push('PAGE: '+e.message));
await page.goto('file:///home/user/ltw7/index.html');
await page.waitForTimeout(900);
console.log('largeur de mise en page :', await page.evaluate(() => document.documentElement.clientWidth),
            '(doit valoir 393)');
await page.screenshot({path:`${OUT}-1.png`});

/* glissement vers la gauche = ligne suivante */
const b = await (await page.$('#scene')).boundingBox();
const cy = b.y + b.height/2;
await page.mouse.move(b.x + b.width*0.72, cy);
await page.mouse.down();
for (let k=1;k<=6;k++) await page.mouse.move(b.x + b.width*(0.72 - 0.09*k), cy);
await page.mouse.up();
await page.waitForTimeout(200);
console.log('apres glissement gauche, ligne vue :', await page.evaluate(() => ligneVue), '(doit valoir 1)');
await page.screenshot({path:`${OUT}-2.png`});

/* un simple appui doit encore poser une tour */
await page.evaluate(() => allerLigne(0));
await page.click('[data-poser="guet"]');
const av = await page.evaluate(() => etat.lignes[0].batiments.length);
await page.mouse.click(b.x + b.width*0.3, b.y + b.height*0.4);
await page.waitForTimeout(150);
console.log('appui simple : batiments', av, '->', await page.evaluate(() => etat.lignes[0].batiments.length));
console.log(erreurs.length ? 'ERREURS:\n'+erreurs.join('\n') : 'aucune erreur console');
await nav.close();
