/* Le son, entierement synthetise. Aucun fichier a heberger, aucun octet de
   plus a telecharger, et chaque bruit se regle par un chiffre plutot que par
   un reenregistrement. Les fonctions de synthese prennent leur contexte en
   parametre : c'est ce qui permet au test de les rendre hors ligne et de
   verifier qu'aucune n'est muette ni saturee. */

let ctx = null, maitre = null, bruitBuffer = null;
let sonActif = true;
const CLE_SON = 'ltw7.son';

/* Un tampon de bruit blanc d'une seconde, reutilise partout : le creer a
   chaque coup de feu ferait ramer des la premiere vague. */
function tamponBruit(c){
  const n = c.sampleRate;
  const b = c.createBuffer(1, n, c.sampleRate);
  const d = b.getChannelData(0);
  /* Generateur a graine fixe : le meme bruit a chaque partie, donc un rendu
     hors ligne reproductible pour le test. */
  let s = 22222;
  for (let i = 0; i < n; i++){
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s |= 0;
    d[i] = (s / 2147483648) % 1;
  }
  return b;
}

/* ---- briques ------------------------------------------------------------- */
function enveloppe(c, g, t, attaque, duree, pic){
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(pic, t + attaque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
}
function ton(c, sortie, t, {f, f2, forme = 'sine', duree = .2, pic = .3, attaque = .006}){
  const o = c.createOscillator(), g = c.createGain();
  o.type = forme; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + duree);
  enveloppe(c, g, t, attaque, duree, pic);
  o.connect(g).connect(sortie); o.start(t); o.stop(t + duree + .02);
}
function souffle(c, sortie, t, {duree = .15, pic = .3, type = 'bandpass',
                                f = 1800, f2, q = 1, attaque = .004, tampon}){
  const s = c.createBufferSource(); s.buffer = tampon;
  s.loop = true;
  const fi = c.createBiquadFilter(); fi.type = type;
  fi.frequency.setValueAtTime(f, t);
  if (f2) fi.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + duree);
  fi.Q.value = q;
  const g = c.createGain(); enveloppe(c, g, t, attaque, duree, pic);
  s.connect(fi).connect(g).connect(sortie); s.start(t); s.stop(t + duree + .02);
}

/* ---- la banque ----------------------------------------------------------- */
/* Chaque entree recoit (contexte, sortie, instant, tamponDeBruit). Les volumes
   sont deja equilibres entre eux : un tir doit s'effacer derriere un vol de
   vie, sinon dix tours couvrent l'evenement qui compte. */
const SONS = {
  /* Les tirs, une signature par famille — c'est a l'oreille qu'on doit
     reconnaitre ce qui tire. */
  fleche(c, o, t, b){ souffle(c, o, t, {tampon:b, duree:.085, pic:.13, f:3200, f2:900, q:1.6}); },
  dard(c, o, t, b){   souffle(c, o, t, {tampon:b, duree:.055, pic:.12, f:5200, f2:2000, q:2.4}); },
  mortier(c, o, t, b){ ton(c, o, t, {f:150, f2:44, forme:'sine', duree:.26, pic:.30});
                       souffle(c, o, t, {tampon:b, duree:.10, pic:.16, type:'lowpass', f:900, f2:180}); },
  braise(c, o, t, b){ souffle(c, o, t, {tampon:b, duree:.20, pic:.15, type:'lowpass', f:400, f2:2400, q:.7});
                      ton(c, o, t, {f:220, f2:110, forme:'sawtooth', duree:.16, pic:.08}); },
  givre(c, o, t, b){  ton(c, o, t, {f:1760, f2:2640, forme:'triangle', duree:.17, pic:.13});
                      ton(c, o, t + .02, {f:2640, f2:1980, forme:'sine', duree:.13, pic:.07}); },
  foudre(c, o, t, b){ souffle(c, o, t, {tampon:b, duree:.06, pic:.16, type:'highpass', f:2600, q:.5});
                      ton(c, o, t, {f:900, f2:180, forme:'square', duree:.07, pic:.09}); },
  prisme(c, o, t, b){ ton(c, o, t, {f:523, forme:'sine', duree:.28, pic:.12});
                      ton(c, o, t, {f:784, forme:'sine', duree:.22, pic:.07});
                      ton(c, o, t + .04, {f:1046, forme:'sine', duree:.18, pic:.05}); },
  siege(c, o, t, b){  souffle(c, o, t, {tampon:b, duree:.14, pic:.20, type:'lowpass', f:700, f2:150});
                      ton(c, o, t, {f:110, f2:60, forme:'square', duree:.10, pic:.10}); },

  /* Les evenements. Plus rares, donc plus forts. */
  mort(c, o, t, b){   souffle(c, o, t, {tampon:b, duree:.13, pic:.18, type:'bandpass', f:1400, f2:300, q:1});
                      ton(c, o, t, {f:300, f2:90, forme:'triangle', duree:.12, pic:.10}); },
  vol(c, o, t, b){    ton(c, o, t, {f:392, f2:262, forme:'sawtooth', duree:.42, pic:.26});
                      ton(c, o, t + .10, {f:311, f2:196, forme:'sine', duree:.38, pic:.16}); },
  pose(c, o, t, b){   souffle(c, o, t, {tampon:b, duree:.09, pic:.22, type:'lowpass', f:1600, f2:400});
                      ton(c, o, t, {f:180, f2:120, forme:'square', duree:.06, pic:.10}); },
  vente(c, o, t, b){  ton(c, o, t, {f:1046, forme:'sine', duree:.09, pic:.18});
                      ton(c, o, t + .07, {f:1568, forme:'sine', duree:.13, pic:.16}); },
  techno(c, o, t, b){ [523, 659, 784, 1046].forEach((f, i) =>
                        ton(c, o, t + i * .055, {f, forme:'triangle', duree:.18, pic:.14})); },
  envoi(c, o, t, b){  souffle(c, o, t, {tampon:b, duree:.22, pic:.16, type:'lowpass', f:200, f2:1400});
                      ton(c, o, t + .05, {f:147, f2:196, forme:'sawtooth', duree:.20, pic:.13}); },
  /* Le Controleur ne perce pas, il vaporise : un souffle qui s'effondre. */
  vaporise(c, o, t, b){ souffle(c, o, t, {tampon:b, duree:.55, pic:.30, type:'lowpass', f:5000, f2:120, q:.8});
                        ton(c, o, t, {f:80, f2:40, forme:'sine', duree:.50, pic:.24}); },
  victoire(c, o, t, b){ [523, 659, 784, 1046].forEach((f, i) =>
                          ton(c, o, t + i * .13, {f, forme:'triangle', duree:.34, pic:.24})); },
  defaite(c, o, t, b){  [392, 330, 262].forEach((f, i) =>
                          ton(c, o, t + i * .17, {f, forme:'sawtooth', duree:.40, pic:.22})); }
};

/* Normalisation. Les synthetiseurs ne sortent pas au meme niveau : un bruit
   filtre en bande etroite perd presque tout, un accord de sinusoides non. Ces
   coefficients ont ete mesures son par son (tools/essai-son.mjs) pour amener
   chaque famille a sa cible : un tir discret, un evenement franc, un vol de
   vie ou un passage du Controleur qui dominent tout le reste. */
const NIVEAU = {
  fleche:4.2, dard:3.6, mortier:0.9, braise:2.9, givre:2.0, foudre:1.1,
  prisme:1.4, siege:2.2,
  mort:3.4, pose:3.4, vente:2.6, techno:3.1, envoi:3.9,
  vol:3.0, vaporise:1.9, victoire:2.6, defaite:2.9
};

/* Point d'entree unique de la synthese : le jeu et le banc de mesure passent
   tous les deux par ici, donc ce qu'on mesure est ce qu'on entend. */
function rendreSon(c, sortie, nom, t, tampon){
  const f = c.createGain();
  f.gain.value = NIVEAU[nom] || 1;
  f.connect(sortie);
  SONS[nom](c, f, t, tampon);
}

/* ---- pilotage ------------------------------------------------------------ */
/* Un navigateur refuse de sonner avant un geste : on cree le contexte au
   premier appui, jamais au chargement. */
function reveillerSon(){
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  maitre = ctx.createGain();
  maitre.gain.value = 0.45;
  maitre.connect(ctx.destination);
  bruitBuffer = tamponBruit(ctx);
}

/* Etranglement par nom : a x4, dix tours tirent dans le meme dixieme de
   seconde et le resultat est une mitraillette illisible. */
const dernierEmis = {};
const ECART = {fleche:55, dard:55, mortier:80, braise:70, givre:70, foudre:60,
               prisme:80, siege:90, mort:45};

function jouerSon(nom){
  if (!sonActif || !ctx || !SONS[nom]) return;
  const maintenant = ctx.currentTime * 1000;
  const ecart = ECART[nom] || 0;
  if (ecart && maintenant - (dernierEmis[nom] || -1e9) < ecart) return;
  dernierEmis[nom] = maintenant;
  /* Legere variation de hauteur pour que deux tirs de suite ne soient pas
     exactement le meme son. Elle ne touche pas au RNG de la partie. */
  const g = ctx.createGain();
  g.gain.value = 0.85 + Math.random() * 0.3;
  g.connect(maitre);
  try { rendreSon(ctx, g, nom, ctx.currentTime + .001, bruitBuffer); }
  catch (e){ /* un navigateur qui refuse : le jeu continue sans le son */ }
}

function basculerSon(){
  sonActif = !sonActif;
  if (sonActif) reveillerSon();
  try { localStorage.setItem(CLE_SON, sonActif ? '1' : '0'); } catch (e){}
  return sonActif;
}
function lireSon(){
  try { sonActif = localStorage.getItem(CLE_SON) !== '0'; } catch (e){}
  return sonActif;
}
