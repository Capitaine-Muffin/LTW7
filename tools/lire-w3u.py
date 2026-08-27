import struct, sys, re, json

def lire_wts(p):
    """war3map.wts : les chaines referencees par TRIGSTR_nnn."""
    txt=open(p,'rb').read().decode('utf-8-sig','replace').replace('\r\n','\n')
    d={}
    for m in re.finditer(r'STRING\s+(\d+)[^{]*\{\r?\n(.*?)\r?\n\}', txt, re.S):
        d['TRIGSTR_%03d'%int(m.group(1))]=m.group(2).strip()
        d['TRIGSTR_%d'%int(m.group(1))]=m.group(2).strip()
    return d

CHAMPS={'ugol':'or','ulum':'bois','upoi':'valeur','uhpm':'pv','umvs':'vitesse',
        'unam':'nom','utip':'infobulle','uubs':'infobulle_ext','ua1d':'cadence',
        'ua1c':'portee','ua1b':'degats_base','ua1s':'degats_des','ua1z':'cible',
        'udty':'type_deplacement','udef':'armure','uarm':'type_armure',
        'ucbs':'cout_construction','ufoo':'nourriture','uhpr':'regen',
        'ua1t':'cibles_autorisees','usid':'vendu_par','urac':'race',
        'ubui':'construit_par','ureq':'requiert','uabi':'capacites'}

def parse(p):
    d=open(p,'rb').read(); o=0
    (ver,)=struct.unpack_from('<i',d,o); o+=4
    res=[]
    for _table in range(2):
        (n,)=struct.unpack_from('<i',d,o); o+=4
        for _ in range(n):
            orig=d[o:o+4].decode('latin1'); o+=4
            neuf=d[o:o+4].decode('latin1'); o+=4
            (nmod,)=struct.unpack_from('<i',d,o); o+=4
            mods={}
            for _ in range(nmod):
                mid=d[o:o+4].decode('latin1'); o+=4
                (typ,)=struct.unpack_from('<i',d,o); o+=4
                if typ==0:   (v,)=struct.unpack_from('<i',d,o); o+=4
                elif typ in (1,2): (v,)=struct.unpack_from('<f',d,o); o+=4
                else:
                    e=d.index(b'\0',o); v=d[o:e].decode('utf-8','replace'); o=e+1
                o+=4  # marqueur de fin
                mods[CHAMPS.get(mid,mid)]=v
            res.append({'base':orig,'id':neuf or orig,'mods':mods})
    return res

if __name__=='__main__':
    wts=lire_wts('war3map.wts')
    for u in parse('war3map.w3u'):
        m=u['mods']
        nom=m.get('nom','')
        nom=wts.get(nom,nom)
        print(json.dumps({'base':u['base'],'id':u['id'],'nom':nom,
            **{k:v for k,v in m.items() if k!='nom'}},ensure_ascii=False))
