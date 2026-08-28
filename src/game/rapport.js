/* Le rapport de fin de partie. Un ecran de fin dit qui a gagne ; il ne dit pas
   POURQUOI. Ce texte-la se copie en un appui et se colle dans une
   conversation : c'est le seul moyen pour moi de voir ce qui a ete bati, ce
   qui a ete envoye, et qui a tue qui — sans etre devant l'ecran. */

function listeNommee(cfg, table, compteur){
  const cles = Object.keys(compteur || {}).filter(k => compteur[k] > 0);
  if (!cles.length) return 'rien';
  cles.sort((a, z) => compteur[z] - compteur[a]);
  return cles.map(k => `${(table[k] || {nom: k}).nom} x${compteur[k]}`).join(', ');
}

function rapport(etat, camp){
  const cfg = etat.cfg, prof = cfg.PROFILS[etat.profil], diff = cfg.DIFFICULTES[etat.difficulte];
  const s = p => (p / 10).toFixed(0) + ' s';
  const nom = i => etat.lignes[i] ? etat.lignes[i].nom : '?';
  const L = [];

  L.push(`LTW7 — rapport de partie · version ${typeof VERSION === 'string' ? VERSION : '?'}`);
  L.push(`${etat.lignes.length} joueurs · bots ${diff.nom || etat.difficulte}` +
         ` · rythme ${prof.nom} · graine ${etat.graine} · camp ${camp.nom}`);
  L.push(`durée ${s(etat.pas)}` +
         (etat.eliminations.length ? ` · 1re élimination ${s(etat.eliminations[0].pas)}` : '') +
         ` · vainqueur ${etat.vainqueur == null ? 'personne' : nom(etat.vainqueur)}`);
  L.push('');

  for (const l of etat.lignes){
    const fin = etat.eliminations.find(e => e.ligne === l.i);
    L.push(`${l.nom.toUpperCase()} — ${l.mort
      ? `éliminé à ${s(fin ? fin.pas : etat.pas)}${fin && fin.par != null ? ' par ' + nom(fin.par) : ''}`
      : `${l.vies} vies`} · revenu +${l.revenu}`);
    L.push(`  défense  : ${l.batiments.length} tours debout` +
           `, ${l.detruites} détruites, ${l.vendues} vendues` +
           ` — ${l.depenseTours} or`);
    L.push(`  bâti     : ${listeNommee(cfg, cfg.TOURS, l.construits)}`);
    L.push(`  monté    : ${listeNommee(cfg, cfg.TOURS, l.montees)}`);
    const tech = Object.keys(l.branches).filter(k => l.branches[k])
      .map(k => cfg.BRANCHES[k].nom)
      .concat(Object.keys(l.feuilles).filter(k => l.feuilles[k]).map(k => cfg.TOURS[k].nom));
    L.push(`  techno   : ${tech.length ? tech.join(', ') : 'aucune'} (${l.bois} bois restant)`);
    L.push(`  envoyé   : ${listeNommee(cfg, cfg.MONSTRES, l.envoisParType)} — ${l.depenseEnvois} or`);
    const recu = Object.keys(l.recuDe).filter(k => l.recuDe[k] > 0)
      .map(k => `${nom(+k)} x${l.recuDe[k]}`);
    L.push(`  reçu de  : ${recu.length ? recu.join(', ') : 'personne'}`);
    L.push('');
  }

  if (etat.eliminations.length){
    L.push('CHRONO');
    for (const e of etat.eliminations)
      L.push(`  ${s(e.pas).padStart(6)}  ${nom(e.ligne)} éliminé` +
             (e.par != null ? ` par ${nom(e.par)}` : ''));
  }
  return L.join('\n');
}

/* La copie doit marcher sur un telephone hors ligne : `navigator.clipboard`
   n'existe pas partout, d'ou le repli par zone de texte. */
async function copierRapport(texte){
  try {
    if (navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(texte);
      return true;
    }
  } catch (e){ /* refuse par le navigateur : on tente le repli */ }
  try {
    const z = document.createElement('textarea');
    z.value = texte;
    z.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(z);
    z.select(); z.setSelectionRange(0, texte.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(z);
    return ok;
  } catch (e){ return false; }
}
