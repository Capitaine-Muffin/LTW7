/* Les retours du plateau. Rien ici ne touche a la simulation : ce sont des
   particules qui vivent le temps qu'elles vivent. Sans elles, un monstre qui
   meurt disparait simplement, une vie perdue ne se voit pas, et une tour posee
   apparait sans bruit — le plateau ne repond jamais. */

let particules = [];

/* Chaque type porte sa duree et sa facon de se dessiner. */
const VIE = {bouffee: 420, vol: 700, vapeur: 600, poussiere: 340, vente: 340};

function effet(type, x, y, opts){                  // x, y en milli-cases
  particules.push({type, x, y, age: 0, ...opts});
  if (particules.length > 160) particules.shift();
}

/* Ramasse ce que le moteur a note pendant le pas qui vient d'etre simule. */
function collecterEffets(etat, ligne){
  for (const e of etat.evenements){
    if (e.ligne !== ligne) continue;
    if (e.t === 'mort'){ effet('bouffee', e.x, e.y, {ech: e.ech, c: couleurJoueur(e.de)});
                         jouerSon('mort'); }
    else if (e.t === 'vol'){ effet('vol', 0, 0, {c: couleurJoueur(e.de)}); jouerSon('vol'); }
    else if (e.t === 'vaporise'){ effet('vapeur', e.x, e.y, {zone: e.zone}); jouerSon('vaporise'); }
  }
}

function avancerEffets(dt){
  for (let i = particules.length - 1; i >= 0; i--){
    const p = particules[i];
    p.age += dt;
    if (p.age > VIE[p.type]) particules.splice(i, 1);
  }
}

function dessinerEffets(c, cfg, T, ox, oy){
  const u2p = v => v * T / cfg.MILLI;
  for (const p of particules){
    const u = Math.min(1, p.age / VIE[p.type]);
    const x = ox + u2p(p.x), y = oy + u2p(p.y);

    if (p.type === 'bouffee'){
      /* Huit eclats qui s'ecartent et s'effacent, plus un anneau aux couleurs
         de l'expediteur : on voit ce qui meurt ET a qui ca coutait de l'or. */
      const r = T * (p.ech || .55);
      c.globalAlpha = 1 - u;
      c.strokeStyle = p.c; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, r * (.25 + u * .75), 0, 7); c.stroke();
      c.fillStyle = p.c;
      for (let k = 0; k < 8; k++){
        const a = k * Math.PI / 4, d = r * (.2 + u * .95);
        const s = Math.max(2, r * .16 * (1 - u));
        c.fillRect(Math.round(x + Math.cos(a) * d - s / 2),
                   Math.round(y + Math.sin(a) * d * .8 - s / 2), s, s);
      }
      c.globalAlpha = 1;
      continue;
    }

    if (p.type === 'vapeur'){
      /* Le Controleur ne perce pas, il vaporise : un anneau blanc qui s'ouvre
         sur toute la zone d'effet, pour qu'on comprenne ce qui vient de
         disparaitre. */
      c.globalAlpha = (1 - u) * .9;
      c.strokeStyle = '#fff3c0'; c.lineWidth = 3;
      c.beginPath(); c.arc(x, y, u2p(p.zone) * (.2 + u), 0, 7); c.stroke();
      c.strokeStyle = '#ffcf3a'; c.lineWidth = 1;
      c.beginPath(); c.arc(x, y, u2p(p.zone) * (.2 + u) * .7, 0, 7); c.stroke();
      c.globalAlpha = 1;
      continue;
    }

    if (p.type === 'poussiere' || p.type === 'vente'){
      c.globalAlpha = 1 - u;
      c.fillStyle = p.type === 'vente' ? '#f0c451' : '#cbb99a';
      for (let k = 0; k < 6; k++){
        const a = k * Math.PI / 3 + .4, d = T * (.15 + u * .45);
        const s = Math.max(2, T * .09 * (1 - u));
        c.fillRect(Math.round(x + Math.cos(a) * d - s / 2),
                   Math.round(y + Math.sin(a) * d * .5 + T * .25 - s / 2), s, s);
      }
      c.globalAlpha = 1;
    }
  }
}

/* Le vol de vie ne se dessine pas sur le plateau mais sur tout l'ecran : c'est
   la seule chose qui doit interrompre le regard. */
function voileDeVol(c, larg, haut){
  const p = particules.find(x => x.type === 'vol');
  if (!p) return;
  const u = Math.min(1, p.age / VIE.vol);
  c.globalAlpha = (1 - u) * .45;
  const d = c.createLinearGradient(0, haut, 0, haut * .55);
  d.addColorStop(0, p.c); d.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = d; c.fillRect(0, 0, larg, haut);
  c.globalAlpha = 1;
}

function viderEffets(){ particules = []; }
