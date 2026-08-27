#!/usr/bin/env python3
"""Ouvre une map Warcraft III (.w3x / .w3m) et en extrait les fichiers lisibles.

Une map WC3 est une archive MPQ precedee d'un en-tete de 512 octets. Ce qui
nous interesse en priorite :

  war3map.j    le script JASS -- les VRAIES constantes du jeu (or, revenu,
               vies, comportement de l'anti-block). C'est la source de verite.
  war3map.wts  la table des chaines : noms et infobulles des unites et tours.
  war3map.w3u  unites personnalisees (binaire, editeur d'objets)
  war3map.w3t  tours / objets personnalises
  war3mapunits.doo  les unites placees sur la carte

Usage : python3 tools/extract-w3x.py chemin/vers/la.w3x [dossier_sortie]
"""
import sys, os, io

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import mpyq
    import mpq_crypto  # greffe le dechiffrement sur MPQArchive
except ImportError:
    sys.exit("mpyq introuvable. Recuperer mpyq.py :\n"
             "  pip download mpyq --no-deps --no-binary :all: -d /tmp/mpq\n"
             "  tar xzf /tmp/mpq/mpyq-*.tar.gz -C /tmp/mpq\n"
             "  cp /tmp/mpq/mpyq-*/mpyq.py tools/")

INTERESSANTS = ['war3map.j', 'scripts\\war3map.j', 'war3map.wts', 'war3map.w3u',
                'war3map.w3t', 'war3map.w3a', 'war3map.w3q', 'war3map.w3i',
                'war3mapunits.doo', 'war3map.doo', '(listfile)']

def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else 'extrait'
    os.makedirs(out, exist_ok=True)

    brut = open(src, 'rb').read()
    # L'en-tete HM3W de 512 octets precede l'archive MPQ.
    debut = brut.find(b'MPQ\x1a')
    if debut == -1:
        sys.exit("Pas d'archive MPQ trouvee : ce n'est pas une map WC3 ?")
    if debut:
        print(f"En-tete de map de {debut} octets ignore.")

    archive = mpyq.MPQArchive.__new__(mpyq.MPQArchive)
    archive.file = io.BytesIO(brut[debut:])
    archive.header = archive.read_header()
    archive.hash_table = archive.read_table('hash')
    archive.block_table = archive.read_table('block')

    noms = list(INTERESSANTS)
    try:  # le listfile, s'il est present, donne le contenu reel
        lf = archive.lire('(listfile)')
        if lf:
            noms += [n.strip() for n in lf.decode('utf-8', 'replace').splitlines() if n.strip()]
    except Exception:
        pass

    vus, extraits = set(), 0
    for nom in noms:
        cle = nom.lower()
        if cle in vus:
            continue
        vus.add(cle)
        try:
            data = archive.lire(nom)
        except Exception as e:
            print(f"  !! {nom} : {type(e).__name__} {e}")
            continue
        if not data:
            continue
        dest = os.path.join(out, os.path.basename(nom.replace('\\', '/')))
        open(dest, 'wb').write(data)
        extraits += 1
        print(f"  ok {nom}  ({len(data):,} octets)")

    print(f"\n{extraits} fichier(s) dans {out}/")
    if extraits == 0:
        print("Rien n'est sorti. Compression inhabituelle : verifier "
              "mpq_crypto._decompresser.")

if __name__ == '__main__':
    main()
