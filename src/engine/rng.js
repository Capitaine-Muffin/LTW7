/* Aleatoire seme. Jamais Math.random() : un replay doit redonner la meme partie. */
function creerRng(graine){
  let e = (graine >>> 0) || 0x2545F491;
  return {
    get etat(){ return e; },
    set etat(v){ e = v >>> 0; },
    /* xorshift32 : court, deterministe, suffisant pour du gameplay. */
    suivant(){ e ^= e << 13; e >>>= 0; e ^= e >>> 17; e ^= e << 5; e >>>= 0; return e; },
    entre(min, max){ return min + (this.suivant() % (max - min + 1)); }
  };
}
