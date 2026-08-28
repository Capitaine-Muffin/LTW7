const N=48;
const CAMPS=[
 {k:'humain',role:'Pierre appareillée et bannières',regle:"Symétrie stricte, angles droits, toit en pente franche. Le seul camp entièrement d'aplomb — c'est ce qui le rend lisible au milieu des trois autres.",detail:"Assises de pierre décalées d'un rang sur l'autre, créneaux, meurtrière, bannière sur hampe.",nom:'Humain',
  pal:{d:'#0a0a10',
       a1:'#2f3345',a2:'#454b60',a3:'#646b81',a4:'#8f97ab',a5:'#c2c8d8',
       m1:'#252938',m2:'#3b4155',m3:'#575e73',m4:'#8b93a6',m5:'#b9c0d0',
       b1:'#3f2717',b2:'#5c3a21',b3:'#7d5330',b4:'#a06f42',
       r1:'#1d3a72',r2:'#2c539c',r3:'#4a7ccd',
       t:'#d8ab34',t2:'#96741d',g:'#8fd0ff',g2:'#e0f4ff'}},
 {k:'orc',role:'Rondins bruts et peaux tendues',regle:"Asymétrie assumée : chaque rondin est décalé d'un pixel, le toit déborde de travers. Reconnaissable à ce qui dépasse.",detail:'Troncs verticaux ceinturés de cordages, toit de peau, crâne planté au faîte.',nom:'Orc',
  pal:{d:'#0d0806',
       a1:'#3a2415',a2:'#54331e',a3:'#75492a',a4:'#9a663c',a5:'#c08d58',
       m1:'#231d1a',m2:'#382f28',m3:'#514338',m4:'#78654f',m5:'#a08a70',
       b1:'#3a2415',b2:'#54331e',b3:'#75492a',b4:'#9a663c',
       r1:'#592116',r2:'#853120',r3:'#b2482c',
       t:'#c2a05e',t2:'#7d6432',g:'#ff9038',g2:'#ffd08a'}},
 {k:'mortvivant',role:'Ossements et pierre nécrosée',regle:'Pointes courbes et couronnement irrégulier. Jamais deux dents de la même hauteur, jamais un sommet plat.',detail:"Colonnes d'os, côtes en travers du fût, suintements verts, crâne aux orbites éteintes.",nom:'Mort-vivant',
  pal:{d:'#08060c',
       a1:'#262034',a2:'#39304c',a3:'#524668',a4:'#77688c',a5:'#a396b4',
       m1:'#1e2622',m2:'#2e3b33',m3:'#455546',m4:'#66796a',m5:'#8fa192',
       b1:'#352d24',b2:'#4d4133',b3:'#6b5c48',b4:'#8c7a60',
       r1:'#1b3023',r2:'#2b5035',r3:'#428249',
       t:'#e2dac0',t2:'#a89f84',g:'#7dff86',g2:'#d2ffd0'}},
 {k:'elfe',role:'Bois vivant et clair de lune',regle:'Courbes et dômes. Aucune arête vive — il se reconnaît à sa rondeur avant même sa couleur.',detail:'Troncs tressés en vannerie, veine lumineuse qui remonte le fût, dôme, croissant de lune.',nom:'Elfe de la nuit',
  pal:{d:'#060b0f',
       a1:'#20373f',a2:'#2d4c54',a3:'#3e666c',a4:'#5a8a8c',a5:'#88b5b1',
       m1:'#1c2c33',m2:'#294147',m3:'#3a5b62',m4:'#57838a',m5:'#83aeb0',
       b1:'#2e2f1e',b2:'#43442b',b3:'#5f6140',b4:'#807f57',
       r1:'#372c60',r2:'#4f3e87',r3:'#755cbe',
       t:'#a6e2d2',t2:'#6ba898',g:'#6fe6dd',g2:'#c4fff8'}}
];
const BATS=[
 {k:'barricade',nom:'Barricade',cout:5,role:'Mur jetable. On en pose trente, on les revend.'},
 {k:'fleche',nom:'Flèche',cout:20,role:'Mono-cible. Le socle de toute défense.'},
 {k:'braise',nom:'Braise',cout:35,role:'Zone, courte portée. La réponse aux nuées.'},
 {k:'givre',nom:'Givre',cout:40,role:'Ralentit. Multiplie la valeur du maze.'},
 {k:'foudre',nom:'Foudre',cout:70,role:'Chaîne sur trois cibles.'},
 {k:'mortier',nom:'Mortier',cout:90,role:'Grosse zone, cadence lente, aveugle au contact.'},
 {k:'perce',nom:'Perce-armure',cout:120,role:'Ignore l’armure. Contre les blindés.'},
 {k:'prisme',nom:'Prisme',cout:250,role:'Une seule par joueur. Doit se voir de loin.',anime:true}
];

const G=()=>Array.from({length:N},()=>Array(N).fill(null));
const P=(g,x,y,c)=>{x=Math.round(x);y=Math.round(y);if(c&&x>=0&&x<N&&y>=0&&y<N)g[y][x]=c;};
const R=(g,x,y,w,h,c)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)P(g,x+i,y+j,c);};
function OUT(g,c){const n=g.map(r=>r.slice());
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){if(g[y][x])continue;
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const a=x+dx,b=y+dy;
      if(a>=0&&a<N&&b>=0&&b<N&&g[b][a]){n[y][x]=c;break;}}}
  return n;}
/* Chaque piece est dessinee a part, detouree, puis collee : c'est ce qui donne
   les traits noirs INTERIEURS, et c'est toute la difference avec un aplat. */
function couche(base,c,fn){const t=G();fn(t);const o=OUT(t,c);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(o[y][x])base[y][x]=o[y][x];}
function sol(g,p,cx,demi){
  for(let x=-demi;x<=demi;x++){const h=Math.round(2.2*Math.sqrt(Math.max(0,1-(x/demi)**2)));
    for(let j=0;j<h;j++)P(g,cx+x,44+j,p.a1);}}

/* ---- volumes ------------------------------------------------------------- */
function fut(g,x0,y0,long,rayon,pente,p,frettes){
  for(let i=0;i<long;i++){
    const cy=y0+i*pente; let r=rayon,ev=0;
    if(i>=long-3){ev=1;r=rayon+1;} if(i>=long-1)r=rayon+2; if(i<2)r=rayon+1;
    const fr=frettes.some(f=>i>=f&&i<f+2); if(fr)r+=1;
    const n=2*r;
    for(let k=0;k<=n;k++){const t=k/n; let c;
      if(fr)      c=t<0.08?p.m2:t<0.20?p.m4:t<0.32?p.m3:t<0.66?p.m2:p.m1;
      else if(ev) c=t<0.10?p.m3:t<0.22?p.m5:t<0.34?p.m4:t<0.62?p.m3:t<0.82?p.m2:p.m1;
      else        c=t<0.10?p.m3:t<0.24?p.m5:t<0.36?p.m4:t<0.64?p.m2:t<0.84?p.m2:p.m1;
      P(g,x0+i,cy-r+k,c);}
    if(fr)P(g,x0+i,cy-r,p.m1);}
  const bx=x0+long-1,by=Math.round(y0+(long-1)*pente),r=rayon+2;
  for(let k=-r;k<=r;k++)P(g,bx,by+k,p.d);
  R(g,bx-1,by-r+1,1,2*r-1,p.m1);}
function colonne(g,x,y,w,h,p){            // cylindre vertical : meme logique, tournee
  for(let j=0;j<h;j++)for(let i=0;i<w;i++){const t=i/(w-1);
    P(g,x+i,y+j, t<0.12?p.m2:t<0.28?p.m4:t<0.42?p.m5:t<0.70?p.m3:t<0.88?p.m2:p.m1);}}
function roue(g,cx,cy,r,p,nr){
  for(let y=-r;y<=r;y++)for(let x=-r;x<=r;x++){const d=Math.hypot(x,y);
    if(d>r+.35)continue;
    if(d>r-2.2){const l=(-x-y)/(r*1.3);
      P(g,cx+x,cy+y,l>0.5?p.b4:l>0.05?p.b3:l>-0.5?p.b2:p.b1);}
    else P(g,cx+x,cy+y,p.d);}
  for(let k=0;k<nr;k++){const a=k*Math.PI*2/nr+0.39,ca=Math.cos(a),sa=Math.sin(a);
    for(let d=1.6;d<r-1.9;d+=0.35){const x=ca*d,y=sa*d,l=(-ca-sa);
      P(g,cx+x,cy+y,l>0.4?p.b4:l>-0.3?p.b3:p.b2);
      P(g,cx+x+(Math.abs(ca)>Math.abs(sa)?0:1),cy+y+(Math.abs(ca)>Math.abs(sa)?1:0),l>0.4?p.b3:p.b2);}}
  for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++){const d=Math.hypot(x,y);
    if(d>3.2)continue; P(g,cx+x,cy+y,d<1.3?p.b4:d<2.4?p.b3:p.b1);}}
function planches(g,x,y,w,h,p){
  R(g,x,y,w,h,p.b2); R(g,x,y,w,1,p.b3);
  for(let j=2;j<h;j+=3)R(g,x,y+j,w,1,p.b1);
  R(g,x,y+h-1,w,1,p.b1);
  R(g,x+1,y,2,h,p.m2); R(g,x+w-3,y,2,h,p.m2);
  P(g,x+1,y+1,p.m4); P(g,x+w-3,y+1,p.m4);}
/* ---- materiaux : un jeu par camp ---------------------------------------- */
const ARCHI={
 humain:{ // pierre appareillee
  mat(g,x,y,w,h,p){
    R(g,x,y,w,h,p.a1);
    for(let j=0;j<h;j+=4){const dec=((j/4)|0)%2?3:0;
      for(let i=-dec;i<w;i+=7){
        const bx=x+Math.max(0,i), bw=Math.min(7,w-Math.max(0,i))-1;
        if(bw<1)continue;
        const v=((i*7+j*3)%5);
        R(g,bx,y+j,bw,3,v<1?p.a4:v<4?p.a3:p.a2);
        R(g,bx,y+j,bw,1,v<1?p.a5:p.a4);
        R(g,bx,y+j+2,bw,1,p.a2);}}
    R(g,x,y,1,h,p.a2); R(g,x+w-1,y,1,h,p.a2);},
  crete(g,x,y,w,p){for(let i=0;i<w;i+=6){const bw=Math.min(4,w-i);
    R(g,x+i,y-4,bw,4,p.a3); R(g,x+i,y-4,bw,1,p.a5); R(g,x+i,y-1,bw,1,p.a2);}},
  toit(g,cx,y,w,p){for(let j=0;j<10;j++){const ww=Math.max(2,w-2*(9-j));
    R(g,cx-(ww>>1),y+j,ww,1,j<3?p.r3:j<7?p.r2:p.r1);
    P(g,cx-(ww>>1),y+j,p.r1);P(g,cx+((ww+1)>>1)-1,y+j,p.r1);
    if(j%3===1)P(g,cx-(ww>>1)+1,y+j,p.r3);}
    R(g,cx-(w>>1)-2,y+10,w+4,2,p.a4); R(g,cx-(w>>1)-2,y+11,w+4,1,p.a2);},
  orne(g,cx,y,p){R(g,cx,y-11,1,12,p.t2); P(g,cx,y-12,p.t);
    R(g,cx+1,y-11,6,5,p.r2); R(g,cx+1,y-11,6,1,p.r3);
    P(g,cx+6,y-6,p.r1);P(g,cx+4,y-6,p.r2);P(g,cx+2,y-6,p.r1);}},
 orc:{ // rondins verticaux
  mat(g,x,y,w,h,p){
    for(let i=0;i<w;i+=4){const d=(i%8)?1:0, ww=Math.min(4,w-i);
      R(g,x+i,y+d,ww,h-d,p.a2);
      R(g,x+i+1,y+d,1,h-d,p.a4); P(g,x+i+1,y+d,p.a5);
      R(g,x+i+2,y+d,Math.max(0,ww-2),h-d,p.a3);
      R(g,x+i+ww-1,y+d,1,h-d,p.a1);
      for(let j=y+d+5;j<y+h;j+=9)P(g,x+i+2,j,p.a1);}
    R(g,x-1,y+Math.floor(h*0.28),w+2,1,p.b1);   // cordages
    R(g,x-1,y+Math.floor(h*0.72),w+2,1,p.b1);
    for(let i=0;i<w;i+=6){P(g,x+i,y+Math.floor(h*0.28),p.b3);P(g,x+i+3,y+Math.floor(h*0.72),p.b3);}},
  crete(g,x,y,w,p){for(let i=0;i<w;i+=4){const d=(i%8)?1:0;
    R(g,x+i+1,y-3-d,2,4,p.a3); P(g,x+i+1,y-4-d,p.a4); P(g,x+i+2,y-3-d,p.a5);}},
  toit(g,cx,y,w,p){for(let j=0;j<7;j++){const ww=Math.max(3,w-2*(6-j));
    R(g,cx-(ww>>1)+1,y+3+j,ww,1,j<3?p.r3:p.r1);}
    R(g,cx-(w>>1)-3,y+9,w+5,2,p.r1); R(g,cx-(w>>1)-3,y+9,w+5,1,p.r2);
    for(const[dx,dy]of[[-1,-1],[-2,0],[-3,1],[1,-2],[2,-1],[3,0]])
      P(g,cx+dx*(w>>2),y+9+dy,p.b2);},
  orne(g,cx,y,p){R(g,cx,y-9,2,10,p.b2); P(g,cx,y-9,p.b3);
    R(g,cx-2,y-14,5,4,p.a5); R(g,cx-2,y-10,1,1,p.a5);R(g,cx+2,y-10,1,1,p.a5);
    R(g,cx-1,y-13,1,2,p.d);R(g,cx+1,y-13,1,2,p.d);
    P(g,cx-3,y-12,p.b3);P(g,cx+3,y-12,p.b3);}},
 mortvivant:{ // os et pierre necrosee
  mat(g,x,y,w,h,p){
    R(g,x,y,w,h,p.a1);
    for(let i=1;i<w-1;i+=5){R(g,x+i,y,3,h,p.a3); R(g,x+i,y,1,h,p.a2); P(g,x+i+1,y,p.a4);
      R(g,x+i+2,y,1,h,p.a1);}
    for(let j=y+3;j<y+h;j+=6){R(g,x+1,j,w-2,1,p.t2); R(g,x+1,j-1,w-2,1,p.t);
      P(g,x,j,p.t2);P(g,x+w-1,j,p.t2);}
    for(let j=y+2;j<y+h;j+=11)P(g,x+3+((j*3)%(w-6)),j,p.g);},
  crete(g,x,y,w,p){for(let i=0;i<w;i+=5){const hh=3+((i/5|0)%3);
    R(g,x+i+1,y-hh,2,hh+1,p.t2); R(g,x+i+1,y-hh,1,hh+1,p.t);
    P(g,x+i+1,y-hh-1,p.t);}},
  toit(g,cx,y,w,p){R(g,cx-(w>>1),y+6,w,3,p.r1); R(g,cx-(w>>1)+1,y+6,w-2,1,p.r2);
    for(let i=0;i<w;i+=4){const hh=2+((i/4|0)%4);
      R(g,cx-(w>>1)+i,y+6-hh,2,hh,p.r2); P(g,cx-(w>>1)+i,y+5-hh,p.r3);}
    R(g,cx-(w>>1)-1,y+9,w+2,2,p.a2);},
  orne(g,cx,y,p){R(g,cx,y-8,1,9,p.t2);
    R(g,cx-3,y-13,7,5,p.t); R(g,cx-2,y-8,2,1,p.t);R(g,cx+2,y-8,2,1,p.t);
    R(g,cx-2,y-12,2,2,p.d);R(g,cx+1,y-12,2,2,p.d);
    P(g,cx-2,y-12,p.g2);P(g,cx+2,y-12,p.g2);
    P(g,cx-4,y-14,p.t2);P(g,cx+4,y-14,p.t2);}},
 elfe:{ // bois vivant tresse
  mat(g,x,y,w,h,p){
    R(g,x,y,w,h,p.a2);
    for(let i=0;i<w;i+=5){
      for(let j=0;j<h;j++){const dec=Math.round(Math.sin((j+i*3)/5)*1.2);
        R(g,x+i+dec,y+j,3,1,p.a3); P(g,x+i+dec+1,y+j,p.a4);
        P(g,x+i+dec+3,y+j,p.a1);}}
    for(let j=2;j<h;j+=3)P(g,x+(w>>1)+Math.round(Math.sin(j/4)*2),y+j,p.g);
    R(g,x,y,w,1,p.a4);},
  crete(g,x,y,w,p){for(let i=0;i<w;i+=5){
    R(g,x+i,y-3,4,3,p.r1); R(g,x+i+1,y-5,3,3,p.r2); P(g,x+i+2,y-6,p.r3);
    P(g,x+i,y-2,p.r2);P(g,x+i+3,y-3,p.r3);}},
  toit(g,cx,y,w,p){
    R(g,cx-(w>>1)+1,y+7,w-2,3,p.r1);
    R(g,cx-(w>>1)+2,y+4,w-4,3,p.r2);
    R(g,cx-(w>>1)+4,y+2,w-8,2,p.r3);
    R(g,cx-3,y+1,6,1,p.r3); R(g,cx-1,y,2,1,p.r3);
    P(g,cx-(w>>1)+2,y+6,p.r2);P(g,cx+(w>>1)-3,y+6,p.r2);
    R(g,cx-(w>>1),y+10,w,1,p.a2);},
  orne(g,cx,y,p){
    for(const[dx,dy]of[[-3,-9],[-3,-8],[-3,-7],[-2,-10],[-1,-11],[0,-11],[1,-10],[2,-9],[2,-8],[1,-6],[0,-5],[-1,-5],[-2,-6]])P(g,cx+dx,y+dy,p.t);
    P(g,cx-2,y-9,p.g2);P(g,cx-1,y-10,p.g);
    R(g,cx,y-5,1,6,p.t2);}}
};
/* ---- machinerie : identique partout, seulement teintee ------------------- */
function vasque(g,cx,y,p){
  R(g,cx-8,y+3,16,3,p.m2); R(g,cx-7,y+2,14,1,p.m4); R(g,cx-7,y+6,14,1,p.m1);
  for(let i=-6;i<=6;i+=3)P(g,cx+i,y+4,p.m1);
  R(g,cx-5,y,10,2,p.m1);
  R(g,cx-5,y-2,10,2,p.r1); R(g,cx-4,y-4,8,2,p.r2); R(g,cx-3,y-6,6,2,p.r3);
  R(g,cx-2,y-8,4,2,p.g); R(g,cx-1,y-10,2,2,p.g2); P(g,cx,y-11,p.g2);
  P(g,cx-5,y-6,p.r2);P(g,cx+4,y-6,p.r2);P(g,cx-3,y-9,p.g);P(g,cx+2,y-9,p.g);}
function cristal(g,cx,y,p){
  const H=16;
  for(let j=0;j<H;j++){
    const w = j<4 ? 1+j : j<11 ? 4 : 4-Math.floor((j-10)/2);
    for(let i=-w;i<=w;i++){
      const t=(i+w)/(2*w+.001);
      P(g,cx+i,y+j, t<0.22?p.g2 : t<0.42?p.g : t<0.72?p.m4 : p.m2);}
    if(j===4||j===10) for(let i=-w;i<=w;i++) P(g,cx+i,y+j,p.m5);   // aretes
  }
  for(let j=0;j<8;j++){const w=j<3?j:2;                            // eclat gauche
    for(let i=-w;i<=w;i++)P(g,cx-6+i,y+j+6, i<0?p.g2:p.m3);}
  for(let j=0;j<6;j++){const w=j<2?j:1;                            // eclat droit
    for(let i=-w;i<=w;i++)P(g,cx+6+i,y+j+8, i<0?p.g:p.m2);}
  R(g,cx-5,y+H,11,2,p.m2); R(g,cx-5,y+H,11,1,p.m4);}
function orbe(g,cx,y,p,r=7){
  R(g,cx-6,y+r,3,7,p.m2); R(g,cx+4,y+r,3,7,p.m2);      // fourche
  P(g,cx-6,y+r,p.m4); P(g,cx+4,y+r,p.m4);
  for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++){
    const d=Math.hypot(i,j); if(d>r+.3)continue;
    const l=(-i-j)/(r*1.35);
    P(g,cx+i,y+j, l>0.62?p.g2 : l>0.22?p.g : l>-0.25?p.m4 : l>-0.62?p.m2 : p.m1);}
  for(let j=-r;j<=r;j++){                               // bande equatoriale
    const w=Math.floor(Math.sqrt(Math.max(0,r*r-j*j)));
    if(j===0||j===1)for(let i=-w;i<=w;i++)P(g,cx+i,y+j,i<0?p.m5:p.m3);}
  const arcs=[[-r-3,-3],[-r-4,-1],[r+3,-3],[r+4,-1],[0,-r-3],[-2,-r-4],[2,-r-4],[-r-3,3],[r+3,3]];
  for(const[dx,dy]of arcs)P(g,cx+dx,y+dy,p.g);
  for(const[dx,dy]of[[-r-2,-4],[r+2,-4],[1,-r-5]])P(g,cx+dx,y+dy,p.g2);}
function baliste(g,cx,y,p){
  R(g,cx-9,y+8,19,4,p.b2);                       // chassis
  R(g,cx-9,y+8,19,1,p.b3); R(g,cx-9,y+11,19,1,p.b1);
  R(g,cx-7,y+7,3,2,p.m2); R(g,cx+5,y+7,3,2,p.m2);
  for(let i=0;i<9;i++){                          // bras d'arc, courbes vers l'arriere
    const dx=i, dy=Math.round(i*i/14);
    R(g,cx-8-dx,y+4+dy,2,2,p.b2); P(g,cx-8-dx,y+4+dy,p.b3);
    R(g,cx+7+dx,y+4+dy,2,2,p.b2); P(g,cx+8+dx,y+4+dy,p.b3);}
  for(let i=-16;i<=16;i++){                      // corde bandee
    const yy=y+5+Math.round(Math.abs(i)*Math.abs(i)/26);
    P(g,cx+i,yy,p.m5);}
  R(g,cx-2,y+3,5,7,p.b1); R(g,cx-1,y+3,3,7,p.b3); // fut
  R(g,cx-1,y-6,3,10,p.m2); R(g,cx,y-6,1,10,p.m5); // trait
  P(g,cx,y-8,p.m5); P(g,cx-1,y-7,p.m3); P(g,cx+1,y-7,p.m3); P(g,cx,y-9,p.g2);
  R(g,cx-4,y+12,9,2,p.m2); P(g,cx-4,y+12,p.m4);}
function coeur(g,cx,y,p,pulse){
  const c=pulse?p.g2:p.g;
  R(g,cx-6,y-2,13,16,p.m1);
  R(g,cx-5,y-1,11,14,p.a1);
  for(let j=0;j<12;j++){const w=Math.max(1,5-Math.abs(j-5)/2|0);
    for(let i=-w;i<=w;i++){const t=(i+w)/(2*w+.001);
      P(g,cx+i,y+j+1, t<0.3?(pulse?p.g2:p.g):t<0.65?c:p.m3);}}
  R(g,cx-6,y+13,13,2,p.t); R(g,cx-6,y-3,13,2,p.t);
  if(pulse){P(g,cx-8,y+5,p.g);P(g,cx+8,y+5,p.g);P(g,cx,y-5,p.g);P(g,cx,y+16,p.g);}}
function socle(g,p,x,y,w,h){
  R(g,x,y,w,h,p.a2); R(g,x,y,w,1,p.a4); R(g,x,y+h-1,w,1,p.a1);
  for(let i=x+2;i<x+w-1;i+=5)P(g,i,y+1,p.a3);}
function meche(g,x,y,p){
  for(const[dx,dy]of[[0,0],[1,-1],[2,-1],[3,-2],[4,-3],[4,-4],[3,-5],[2,-5]])P(g,x+dx,y+dy,p.b3);
  for(const[dx,dy]of[[1,-2],[3,-3]])P(g,x+dx,y+dy,p.b1);
  P(g,x+1,y-6,p.g2);P(g,x+2,y-6,p.g);P(g,x+1,y-7,p.g);P(g,x,y-6,p.g);}

/* ---- une identite visuelle par tour -------------------------------------
   Trente-deux tours, huit familles de silhouette : sans plus, une Tour BOUM
   ressemblait trait pour trait a un Brasier et on ne voyait pas ses propres
   ameliorations. Chaque tour porte donc :
     k — la famille (ce qu'elle tire) ;
     r — le rang, 0 a 5, qui ajoute socle, contreforts, bannieres, runes,
         couronne : la montee en puissance se lit de loin ;
     t — la branche elementaire, qui reteinte les lueurs ;
     v — la variante, pour separer les deux feuilles d'une meme branche.
   Les quadruplets sont tous distincts — c'est ce qui garantit qu'aucune
   paire de tours ne se ressemble. */
const TOURS_ART = {
  guet:        {k:'fleche',  r:0},
  epine:       {k:'perce',   r:0},
  pitie:       {k:'fleche',  r:1},
  sang:        {k:'perce',   r:1},
  canon:       {k:'mortier', r:2},
  socle:       {k:'fleche',  r:2},
  broyeur:     {k:'perce',   r:2},
  lame:        {k:'perce',   r:2, v:1},
  elementaire: {k:'fleche',  r:3},

  barbecue:    {k:'braise',  r:3, t:'feu'},
  glacier:     {k:'givre',   r:3, t:'froid'},
  courtCircuit:{k:'foudre',  r:3, t:'foudre'},
  cloaque:     {k:'prisme',  r:3, t:'tenebres'},
  oiseau:      {k:'prisme',  r:3, t:'lumiere', v:1},

  puits:       {k:'braise',  r:4, t:'feu'},
  eauBenite:   {k:'givre',   r:4, t:'froid'},
  canonElec:   {k:'foudre',  r:4, t:'foudre'},
  damne:       {k:'prisme',  r:4, t:'tenebres'},
  lanterne:    {k:'prisme',  r:4, t:'lumiere', v:1},

  boom:        {k:'braise',  r:5, t:'feu'},
  meteore:     {k:'mortier', r:5, t:'feu',      v:1},
  eauUltime:   {k:'givre',   r:5, t:'froid'},
  glaceUltime: {k:'givre',   r:5, t:'froid',    v:1},
  generateur:  {k:'foudre',  r:5, t:'foudre'},
  condensateur:{k:'foudre',  r:5, t:'foudre',   v:1},
  mort:        {k:'prisme',  r:5, t:'tenebres'},
  fosse:       {k:'braise',  r:5, t:'tenebres', v:1},
  champignon:  {k:'prisme',  r:5, t:'lumiere'},
  teleporteur: {k:'givre',   r:5, t:'lumiere',  v:1},
  barricade:   {k:'barricade', r:0}
};

/* Les trois vendeurs, hors arbre des tours : ils ne se posent pas, ils portent
   les menus. */
const BOUTIQUES = {monstres:'enclos', batiments:'echoppe', techno:'sanctuaire'};

/* La branche ne change pas la pierre — seulement ce qui brille. Un Brasier
   humain reste humain, il rougeoie simplement au lieu de bleuir. */
const TEINTES = {
  feu:     {g:'#ff8a2a', g2:'#ffd79a', r1:'#5a1a08', r2:'#8f2c0d', r3:'#c8501a'},
  froid:   {g:'#79dcff', g2:'#e2f9ff', r1:'#123a5c', r2:'#1d5a86', r3:'#3a8cc0'},
  foudre:  {g:'#ffe14a', g2:'#fffbd0', r1:'#4a3a06', r2:'#7d6410', r3:'#c2a021'},
  tenebres:{g:'#b06cff', g2:'#ecd6ff', r1:'#2e1450', r2:'#4a2278', r3:'#7038b0'},
  lumiere: {g:'#fff2b0', g2:'#ffffff', r1:'#6a5a20', r2:'#9c8836', r3:'#d4bd5e'}
};

/* Les marques de rang. Tout se pose en peripherie — colonnes de bord et bande
   de sol — pour ne jamais recouvrir la silhouette de la famille. */
function galons(g, p, r, v){
  if (r >= 1) couche(g, p.d, t => {                      // socle elargi
    R(t,6,43,36,4,p.a2); R(t,6,43,36,1,p.a4); R(t,7,46,34,1,p.a1);
    /* Les gemmes du socle comptent le rang. C'est le seul repere qui se lit
       a coup sur : d'une famille a l'autre les silhouettes se ressemblent,
       une rangee de gemmes se compte d'un coup d'oeil. */
    const n = r, x0 = 24 - (n * 5 - 1) / 2;
    for (let i = 0; i < n; i++){
      R(t, x0 + i*5, 44, 3, 2, p.t2); R(t, x0 + i*5, 44, 3, 1, p.t);
      P(t, x0 + i*5 + 1, 44, p.g2); } });
  if (r >= 2) couche(g, p.d, t => {                      // contreforts
    for (const x of [2,42]){ R(t,x,34,4,11,p.a2); R(t,x,34,4,1,p.a4);
      R(t,x,44,4,1,p.a1); P(t,x+1,38,p.a3); } });
  if (r >= 3) couche(g, p.d, t => {                      // bannieres pendantes
    for (const [x,sens] of [[3,1],[43,-1]]){
      R(t,x+1,19,1,15,p.b2);
      for (let j=0;j<12;j++){ const w = 4 - (j>8 ? j-8 : 0);
        if (w>0) R(t, sens>0 ? x+2 : x+2-w+1, 21+j, w, 1, j%3 ? p.r2 : p.r3); } } });
  if (r >= 4) couche(g, p.d, t => {                      // runes en suspension
    for (const [x,y] of [[4,9],[42,9],[4,15],[42,15]]){
      R(t,x,y,3,3,p.g); P(t,x+1,y+1,p.g2); } });
  if (r >= 5) couche(g, p.d, t => {
    if (v){                                              // halo
      const cx=24, cy=9, rx=17, ry=6;
      for (let a=0;a<64;a++){ const an=a*Math.PI/32;
        P(t, cx+Math.round(Math.cos(an)*rx), cy+Math.round(Math.sin(an)*ry),
          a%4<2 ? p.g : p.g2); }
    } else {                                             // couronne de pointes
      R(t,6,7,36,2,p.t2); R(t,6,7,36,1,p.t);             // linteau qui les porte
      for (const x of [7,15,23,31,39]){
        R(t,x,2,2,6,p.t2); R(t,x,2,2,3,p.t); P(t,x,1,p.g2); P(t,x+1,1,p.g); }
    } });
}

function dessiner(kind,S,pulse,rang,teinte,variante){
  const p = teinte ? Object.assign({}, S.pal, TEINTES[teinte] || {}) : S.pal;
  const g=G(), A=ARCHI[S.k], cx=24;

  if(kind==='barricade'){
    sol(g,p,cx,22);
    couche(g,p.d,t=>{A.mat(t,3,26,42,18,p); A.crete(t,3,26,42,p);});
    couche(g,p.d,t=>{socle(t,p,2,43,44,2);});
  }
  else if(kind==='fleche'){
    sol(g,p,cx,14);
    couche(g,p.d,t=>socle(t,p,12,40,24,5));
    couche(g,p.d,t=>A.mat(t,16,12,16,29,p));
    couche(g,p.d,t=>{A.toit(t,cx,1,20,p);});
    couche(g,p.d,t=>A.orne(t,cx,1,p));
    couche(g,p.d,t=>{R(t,cx-2,20,5,7,p.d);R(t,cx-1,21,3,5,p.m1);R(t,cx,22,1,3,p.g);});
    couche(g,p.d,t=>{R(t,cx-3,33,7,8,p.b2);R(t,cx-3,33,7,1,p.b3);
      R(t,cx-2,34,5,7,p.b1);P(t,cx+1,37,p.m4);});
  }
  else if(kind==='braise'){
    sol(g,p,cx,18);
    couche(g,p.d,t=>socle(t,p,8,41,32,4));
    couche(g,p.d,t=>A.mat(t,11,26,26,16,p));
    couche(g,p.d,t=>vasque(t,cx,22,p));
    couche(g,p.d,t=>{R(t,12,31,5,6,p.d);R(t,13,32,3,4,p.r1);
      R(t,31,31,5,6,p.d);R(t,32,32,3,4,p.r1);});
  }
  else if(kind==='givre'){
    sol(g,p,cx,11);
    couche(g,p.d,t=>socle(t,p,15,41,18,4));
    couche(g,p.d,t=>A.mat(t,18,20,12,22,p));
    couche(g,p.d,t=>cristal(t,cx,2,p));
    couche(g,p.d,t=>{R(t,cx-2,24,5,6,p.d);R(t,cx-1,25,3,4,p.g);});
  }
  else if(kind==='foudre'){
    sol(g,p,cx,12);
    couche(g,p.d,t=>socle(t,p,14,41,20,4));
    couche(g,p.d,t=>A.mat(t,18,20,12,22,p));
    couche(g,p.d,t=>orbe(t,cx,11,p,7));
    couche(g,p.d,t=>{R(t,16,24,3,3,p.m2);R(t,29,24,3,3,p.m2);
      P(t,16,24,p.m4);P(t,29,24,p.m4);});
  }
  else if(kind==='mortier'){
    sol(g,p,cx,19);
    couche(g,p.d,t=>roue(t,33,34,7,p,6));
    couche(g,p.d,t=>{planches(t,12,29,24,6,p);
      for(let i=0;i<9;i++){const h=5-Math.floor(i/2.6),yy=31+Math.floor(i/2.6);
        R(t,12-i,yy,1,h,p.b2);P(t,12-i,yy,p.b3);P(t,12-i,yy+h-1,p.b1);}
      R(t,3,34,3,2,p.m2);P(t,3,34,p.m4);
      R(t,20,26,3,4,p.b1);P(t,20,26,p.b3);});
    couche(g,p.d,t=>{fut(t,10,19,30,4,0.17,p,[2,11,20]);
      R(t,8,17,3,7,p.m2);R(t,8,17,3,1,p.m4);R(t,8,23,3,1,p.m1);
      P(t,7,20,p.m3);P(t,7,21,p.m2);});
    couche(g,p.d,t=>meche(t,10,17,p));
    couche(g,p.d,t=>{R(t,21,24,4,3,p.m2);R(t,21,24,4,1,p.m4);P(t,21,26,p.m1);});
    couche(g,p.d,t=>roue(t,17,36,8,p,8));
  }
  else if(kind==='perce'){
    sol(g,p,cx,15);
    couche(g,p.d,t=>socle(t,p,12,41,24,4));
    couche(g,p.d,t=>A.mat(t,16,22,16,20,p));
    couche(g,p.d,t=>baliste(t,cx,10,p));
    couche(g,p.d,t=>{R(t,cx-3,33,7,8,p.b2);R(t,cx-3,33,7,1,p.b3);
      R(t,cx-2,34,5,7,p.b1);});
  }
  /* ---- les trois boutiques -----------------------------------------------
     La map pose quatre vendeurs sur le terrain de chaque joueur : Basic
     Monsters, Advanced Monsters, Advanced Towers, Uber Towers. Notre grille de
     neuf sur treize est entierement constructible, on ne peut donc pas leur
     donner de cases sans voler du labyrinthe. Ils vivent sur les trois boutons
     du bas — c'est l'identite de la map, portee par nos commandes. */
  else if(kind==='echoppe'){                       // Advanced Towers : le tailleur
    sol(g,p,cx,20);
    couche(g,p.d,t=>socle(t,p,6,42,36,4));
    couche(g,p.d,t=>{planches(t,8,28,32,14,p);
      R(t,8,28,32,1,p.b3); R(t,8,41,32,1,p.b1);});
    couche(g,p.d,t=>{                              // auvent raye
      for(let i=0;i<36;i+=6){R(t,6+i,20,3,7,p.r2); R(t,9+i,20,3,7,p.a5);}
      R(t,5,18,38,3,p.b2); R(t,5,18,38,1,p.b3);
      for(let i=6;i<42;i+=5)P(t,i,27,p.d);});
    couche(g,p.d,t=>{                              // une tour miniature sur l'etal
      R(t,20,31,8,9,p.a2); R(t,20,31,8,1,p.a4); R(t,22,34,4,3,p.d);
      A.toit(t,24,26,10,p);});
    couche(g,p.d,t=>{                              // marteau pose
      R(t,10,36,2,6,p.b2); R(t,8,34,6,3,p.m2); R(t,8,34,6,1,p.m4);});
  }
  else if(kind==='enclos'){                        // Basic + Advanced Monsters
    sol(g,p,cx,20);
    couche(g,p.d,t=>socle(t,p,6,42,36,4));
    couche(g,p.d,t=>{R(t,7,16,34,26,p.m1);          // fosse sombre
      R(t,9,18,30,22,p.d);});
    /* Les barreaux d'abord, la bete PAR-DESSUS : chaque couche est detouree
       puis collee, donc ce qui est dessine en dernier passe devant. Dans
       l'autre sens, le contour des barreaux effacait le regard. */
    couche(g,p.d,t=>{                              // barreaux : cinq, espaces
      for(let i=0;i<5;i++){const x=9+i*7;
        R(t,x,14,3,28,p.b2); R(t,x,14,1,28,p.b3); P(t,x+1,14,p.b4);}
      R(t,5,12,38,4,p.b1); R(t,5,12,38,1,p.b3);
      R(t,5,40,38,3,p.b1); R(t,5,40,38,1,p.b3);});
    couche(g,p.d,t=>{                              // le regard, colle aux barreaux
      R(t,13,26,8,6,p.g2); R(t,27,26,8,6,p.g2);
      R(t,15,27,4,4,p.d); R(t,30,27,4,4,p.d);
      for(let i=15;i<34;i+=4){R(t,i,33,3,4,p.g2); R(t,i,33,3,1,p.g);}});
    couche(g,p.d,t=>{                              // une griffe qui serre un barreau
      for(const x of [7,11,15])R(t,x,15,3,5,p.a5);
      R(t,6,19,13,4,p.a3); R(t,6,19,13,1,p.a5);});
    couche(g,p.d,t=>{                              // cadenas
      R(t,21,37,7,6,p.m2); R(t,21,37,7,1,p.m4); R(t,23,39,3,3,p.d);
      R(t,22,34,5,4,p.m4); R(t,23,35,3,3,p.d);});
  }
  else if(kind==='sanctuaire'){                    // Uber Towers : les deblocages en bois
    sol(g,p,cx,17);
    couche(g,p.d,t=>socle(t,p,10,42,28,4));
    couche(g,p.d,t=>{                              // buches empilees
      for(let j=0;j<2;j++)for(let i=0;i<4;i++){
        const x=9+i*8+(j?4:0), y=34+j*4;
        R(t,x,y,7,4,p.b2); R(t,x,y,7,1,p.b3); R(t,x+2,y+1,3,2,p.b1);}});
    couche(g,p.d,t=>{                              // tronc vivant
      colonne(t,20,10,9,25,p);
      for(let j=12;j<32;j+=6){R(t,19,j,11,1,p.b1); P(t,18,j,p.b3);}});
    couche(g,p.d,t=>{                              // trois runes, une par bois
      for(let j=0;j<3;j++){const y=14+j*7;
        R(t,22,y,5,4,p.t2); R(t,23,y+1,3,2,p.g);
        P(t,22,y,p.t); P(t,26,y+3,p.t);}});
    couche(g,p.d,t=>{                              // frondaison : ronde et verte
      const F1='#2c5326', F2='#3f7a37', F3='#5aa04a';
      for(let j=0;j<11;j++){
        const w=Math.round(15*Math.sqrt(Math.max(0,1-((j-5)/5.6)**2)));
        for(let i=-w;i<=w;i++){const q=(i+w)/(2*w+.001);
          P(t,cx+i,1+j, q<0.24?F3 : q<0.62?F2 : F1);}}
      P(t,cx-7,3,p.g2); P(t,cx+6,7,p.g); P(t,cx+1,2,p.g2);});
  }
  else if(kind==='prisme'){
    sol(g,p,cx,17);
    couche(g,p.d,t=>socle(t,p,10,40,28,5));
    couche(g,p.d,t=>A.mat(t,14,12,20,29,p));
    couche(g,p.d,t=>A.toit(t,cx,0,24,p));
    couche(g,p.d,t=>A.orne(t,cx,0,p));
    couche(g,p.d,t=>coeur(t,cx,22,p,pulse));
    couche(g,p.d,t=>{R(t,11,37,4,4,p.t2);R(t,33,37,4,4,p.t2);
      P(t,11,37,p.t);P(t,33,37,p.t);});
  }
  galons(g, p, rang || 0, variante || 0);
  return g;
}
