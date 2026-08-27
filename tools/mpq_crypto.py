"""Ajoute a mpyq le dechiffrement des fichiers MPQ (et l'implode PKWARE).

mpyq lit les archives MPQ mais s'arrete devant les fichiers chiffres, ce qui
est justement le cas des maps Warcraft III protegees. L'algorithme est public :
la cle derive du nom de fichier, la table des secteurs est chiffree avec
cle - 1, et le secteur i avec cle + i.

On ne modifie pas mpyq.py : on lui greffe une methode.
"""
import struct, zlib, bz2
from io import BytesIO
import mpyq

CHIFFRE   = 0x00010000
CLE_AJUST = 0x00020000
EXISTE    = 0x80000000
COMPRESSE = 0x00000200
BLOC_CRC  = 0x04000000
UN_SEUL   = 0x01000000


def _implode(data, taille_attendue):
    """PKWARE DCL 'implode' — l'algorithme de compression des maps de l'epoque."""
    LONG_BASE = [3,2,3,3,4,4,4,5,5,5,5,6,6,6,7,7,7,8,8,8,9,9,9,10,10,10,
                 11,11,11,12,12,12,13,13,13,14,14,14,15,15,15,16,16,16,
                 17,17,17,18,18,18,19,19,19,20,20,20,21,21,21,22,22,22,
                 23,23,23,24,24,24,25,25,25,26,26,26,27,27,27,28,28,28,
                 29,29,29,30,30,30,31,31,31,32,32,32,33,33,33,34,34,34,
                 35,35,35,36,36,36,37,37,37,38,38,38,39,39,39,40,40,40]
    LONG_BITS = [0x05,0x03,0x01,0x06,0x0A,0x02,0x0C,0x14,0x04,0x18,0x08,0x30,
                 0x10,0x20,0x40,0x00]
    LONG_LEN  = [3,2,3,3,4,4,4,5,5,5,5,6,6,6,7,7]  # non utilise directement
    # Tables officielles DCL
    DIST_BITS = [2,4,4,5,5,5,5,6,6,6,6,6,6,6,6,7,7,7,7,7,7,7,7,7,7,7,7,7,7,
                 7,7,7,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8,8]
    DIST_CODE = [0x03,0x0D,0x05,0x19,0x09,0x11,0x01,0x3E,0x1E,0x2E,0x0E,0x36,
                 0x16,0x26,0x06,0x3A,0x1A,0x2A,0x0A,0x32,0x12,0x22,0x02,0x7C,
                 0x3C,0x5C,0x1C,0x6C,0x2C,0x4C,0x0C,0x74,0x34,0x54,0x14,0x64,
                 0x24,0x44,0x04,0x78,0x38,0x58,0x18,0x68,0x28,0x48,0x08,0xF0,
                 0x70,0xB0,0x30,0xD0,0x50,0x90,0x10,0xE0,0x60,0xA0,0x20,0xC0,
                 0x40,0x80,0x00]
    LEN_BITS  = [3,2,3,3,4,4,4,5,5,5,5,6,6,6,7,7]
    LEN_CODE  = [0x05,0x03,0x01,0x06,0x0A,0x02,0x0C,0x14,0x04,0x18,0x08,0x30,
                 0x10,0x20,0x40,0x00]
    LEN_BASE  = [0,1,2,3,4,5,6,7,8,0x0A,0x0E,0x16,0x26,0x46,0x86,0x106]
    LEN_EXTRA = [0,0,0,0,0,0,0,0,1,2,3,4,5,6,7,8]

    if len(data) < 4:
        raise ValueError("flux implode trop court")
    litteral_code, dict_bits = data[0], data[1]
    if litteral_code not in (0, 1) or not (4 <= dict_bits <= 6):
        raise ValueError("en-tete implode invalide")
    if litteral_code == 1:
        raise NotImplementedError("implode avec litteraux codes (rare) non gere")

    flux, pos_octet, pos_bit = data, 2, 0

    def bits(n):
        nonlocal pos_octet, pos_bit
        v = 0
        for i in range(n):
            if pos_octet >= len(flux):
                raise EOFError
            v |= ((flux[pos_octet] >> pos_bit) & 1) << i
            pos_bit += 1
            if pos_bit == 8:
                pos_bit = 0
                pos_octet += 1
        return v

    def decoder(codes, longueurs):
        nonlocal pos_octet, pos_bit
        val, n = 0, 0
        while n < 16:
            val |= bits(1) << n
            n += 1
            for i, c in enumerate(codes):
                if longueurs[i] == n and c == val:
                    return i
        raise ValueError("code implode introuvable")

    sortie = bytearray()
    while len(sortie) < taille_attendue:
        try:
            if bits(1):                                   # paire longueur/distance
                i = decoder(LEN_CODE, LEN_BITS)
                longueur = LEN_BASE[i] + 2
                if LEN_EXTRA[i]:
                    longueur += bits(LEN_EXTRA[i])
                if longueur == 0x208:
                    break
                j = decoder(DIST_CODE, DIST_BITS)
                if longueur == 2:
                    distance = (j << 2) | bits(2)
                else:
                    distance = (j << dict_bits) | bits(dict_bits)
                distance += 1
                for _ in range(longueur):
                    sortie.append(sortie[-distance])
            else:
                sortie.append(bits(8))
        except EOFError:
            break
    return bytes(sortie)


def _decompresser(data, taille_attendue):
    """Le premier octet est un masque de compression, parfois cumulatif."""
    masque = data[0]
    charge = data[1:]
    if masque == 0:
        return data
    if masque & 0x10:
        charge = bz2.decompress(charge)
    elif masque & 0x02:
        charge = zlib.decompress(charge, 15)
    elif masque & 0x08:
        charge = _implode(charge, taille_attendue)
    elif masque & 0x01:
        raise NotImplementedError("compression huffman non geree")
    else:
        raise RuntimeError("compression inconnue 0x%02x" % masque)
    return charge


def lire(archive, nom):
    """Comme MPQArchive.read_file, mais gere les fichiers chiffres."""
    hash_entry = archive.get_hash_table_entry(nom)
    if hash_entry is None:
        return None
    bloc = archive.block_table[hash_entry.block_table_index]
    if not (bloc.flags & EXISTE) or bloc.archived_size == 0:
        return None

    archive.file.seek(bloc.offset + archive.header['offset'])
    brut = archive.file.read(bloc.archived_size)

    cle = None
    if bloc.flags & CHIFFRE:
        base = nom.replace('/', '\\').split('\\')[-1]
        cle = archive._hash(base, 'TABLE')
        if bloc.flags & CLE_AJUST:
            cle = ((cle + bloc.offset) ^ bloc.size) & 0xFFFFFFFF

    if bloc.flags & UN_SEUL:
        if cle is not None:
            brut = archive._decrypt(brut, cle)
        if bloc.flags & COMPRESSE and bloc.size > len(brut):
            return brut
        if bloc.flags & COMPRESSE:
            return _decompresser(brut, bloc.size)
        return brut[:bloc.size]

    taille_secteur = 512 << archive.header['sector_size_shift']
    nb = bloc.size // taille_secteur + 1
    if bloc.flags & BLOC_CRC:
        nb += 1
    entete = brut[:4 * (nb + 1)]
    if cle is not None:
        entete = archive._decrypt(entete, (cle - 1) & 0xFFFFFFFF)
    positions = struct.unpack('<%dI' % (nb + 1), entete)

    out = BytesIO()
    restant = bloc.size
    fin = len(positions) - (2 if bloc.flags & BLOC_CRC else 1)
    for i in range(fin):
        sect = brut[positions[i]:positions[i + 1]]
        if cle is not None:
            sect = archive._decrypt(sect, (cle + i) & 0xFFFFFFFF)
        attendu = min(taille_secteur, restant)
        if bloc.flags & COMPRESSE and len(sect) < attendu:
            sect = _decompresser(sect, attendu)
        restant -= len(sect)
        out.write(sect)
    return out.getvalue()[:bloc.size]


mpyq.MPQArchive.lire = lire
