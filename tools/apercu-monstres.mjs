/* Planche des monstres, deux images cote a cote, pour les regarder pendant
   qu'on les dessine. */
import {readFileSync, writeFileSync} from 'fs';
import {deflateSync} from 'zlib';
function png(W,H,px){
  const brut=Buffer.alloc(H*(W*4+1));
  for(let y=0;y<H;y++){brut[y*(W*4+1)]=0;
    Buffer.from(px.buffer,y*W*4,W*4).copy(brut,y*(W*4+1)+1);}
  const T=[...Array(256)].map((_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;return c>>>0;});
  const crc=b=>{let c=0xFFFFFFFF;for(const o of b)c=T[(c^o)&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0;};
  const bl=(t,d)=>{const l=Buffer.alloc(4);l.writeUInt32BE(d.length);
    const td=Buffer.concat([Buffer.from(t),d]);const c=Buffer.alloc(4);c.writeUInt32BE(crc(td));
    return Buffer.concat([l,td,c]);};
  const ih=Buffer.alloc(13);ih.writeUInt32BE(W,0);ih.writeUInt32BE(H,4);ih[8]=8;ih[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
    bl('IHDR',ih),bl('IDAT',deflateSync(brut)),bl('IEND',Buffer.alloc(0))]);
}
const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
const X={};
new Function('g',readFileSync('art/monstres.js','utf8')+'\nObject.assign(g,{NM,MONSTRES_ART,dessinerMonstre});')(X);
const {NM,MONSTRES_ART,dessinerMonstre}=X;
const cles=Object.keys(MONSTRES_ART).filter(k=>!process.env.MONSTRE||k===process.env.MONSTRE), E=+(process.env.ECH||6), M=8;
const fond=hex(process.env.FOND||'#4a7c42');
const cw=(NM*E+M)*2+M*2, ch=NM*E+M*2;
const W=cw*2, H=ch*Math.ceil(cles.length/2);
const px=new Uint8Array(W*H*4);
for(let i=0;i<W*H;i++){px[i*4]=fond[0];px[i*4+1]=fond[1];px[i*4+2]=fond[2];px[i*4+3]=255;}
cles.forEach((k,n)=>{ const col=n%2, row=(n/2)|0;
  for(const f of [0,1]){ const g=dessinerMonstre(k,f);
    for(let y=0;y<NM;y++)for(let x=0;x<NM;x++){const v=g[y][x];if(!v)continue;
      const [R,G,B]=hex(v);
      for(let dy=0;dy<E;dy++)for(let dx=0;dx<E;dx++){
        const Xp=col*cw+M+f*(NM*E+M)+x*E+dx, Yp=row*ch+M+y*E+dy;
        const i=(Yp*W+Xp)*4; px[i]=R;px[i+1]=G;px[i+2]=B;px[i+3]=255;}}}});
writeFileSync(process.argv[2]||'monstres.png',png(W,H,px));
console.log(`${process.argv[2]}  ${W}x${H}  ${cles.length} monstres x 2 images`);
