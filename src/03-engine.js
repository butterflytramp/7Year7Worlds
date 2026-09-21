

import * as THREE from 'three';

/* =====================================================================
   7 YEARS / 7 WORLDS — THE MUSEUM CORRIDOR
   The corridor is the eighth world: one continuous surface whose
   cross-section morphs along a curving path — wide chamber, narrow
   passage, tall atrium, curving gallery, low compression, vast void,
   final chamber. Apertures are cut into that surface in the shader and
   the seven worlds leak through them.
   ===================================================================== */

/* ============ boot ============ */
let renderer;
try{
  renderer=new THREE.WebGLRenderer({canvas:document.getElementById('scene'),
    antialias:true, powerPreference:'high-performance'});
}catch(e){ document.getElementById('nogl').style.display='grid'; throw e; }
const NARROW=innerWidth<820;
const LOWPOWER=NARROW || (navigator.hardwareConcurrency||8)<=4;
renderer.setPixelRatio(Math.min(devicePixelRatio, LOWPOWER?1.25:1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.02;

const PAPER=0xefebe3;
const scene=new THREE.Scene();
scene.background=new THREE.Color(PAPER);
scene.fog=new THREE.Fog(0xeceae3, 18, 160);

/* ~20mm equivalent, eye at 1.6m */
const camera=new THREE.PerspectiveCamera(NARROW?78:64, innerWidth/innerHeight, .3, 400);
const UP=new THREE.Vector3(0,1,0);

/* soft graded environment: bright warm sky, grey ground — white-on-white
   surfaces need a gradient to read, not a photo studio */
{
  const g=new THREE.SphereGeometry(50,16,12);
  const col=[]; const pos=g.attributes.position;
  const a=new THREE.Color(0xfff9f0), b=new THREE.Color(0x6d6862), c=new THREE.Color();
  for(let i=0;i<pos.count;i++){ const t=THREE.MathUtils.clamp(pos.getY(i)/50*.5+.5,0,1);
    c.copy(b).lerp(a, Math.pow(t,.8)); col.push(c.r,c.g,c.b); }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col,3));
  const es=new THREE.Scene(); es.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true, side:THREE.BackSide})));
  const pm=new THREE.PMREMGenerator(renderer); scene.environment=pm.fromScene(es,.05).texture; pm.dispose();
}
scene.add(new THREE.HemisphereLight(0xfff4ec, 0x6b665e, 1.26));
/* gently warm architectural light, with just enough direction to let the
   grain and the curvature read */
const key=new THREE.DirectionalLight(0xfff6ef, .54); key.position.set(-.3,1,.25); scene.add(key);
const graze=new THREE.DirectionalLight(0xfff8f2, .20); graze.position.set(.85,.16,-.2); scene.add(graze);

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=t=>t*t*(3-2*t);
const sstep=(a,b,v)=>smooth(clamp((v-a)/(b-a),0,1));
const lerp=(a,b,t)=>a+(b-a)*t;

/* ============ THE PATH ============
   It sways, so the route hides itself. Straight through the void so the
   bridge can be one slab. */
const PATH=new THREE.CatmullRomCurve3([
  new THREE.Vector3(  0, 0,   0),
  new THREE.Vector3(  0, 0, -26),
  new THREE.Vector3(  5, 0, -52),
  new THREE.Vector3( -4, .8,-80),
  new THREE.Vector3(-15, 2.4,-112),
  new THREE.Vector3(-23, 2.4,-140),
  new THREE.Vector3(-14, 1.6,-172),
  new THREE.Vector3(  2, 1.0,-196),
  new THREE.Vector3( 12, .4,-214),
  new THREE.Vector3( 12, .4,-252),
  new THREE.Vector3( 12, .4,-278),
  new THREE.Vector3(  6, 0,-306),
  new THREE.Vector3(  0, 0,-330),
],false,'centripetal',.5);
PATH.arcLengthDivisions=1200;
const LEN=PATH.getLength();
const S=u=>u*LEN;

/* ============ THE SECTION ============
   u, full width, height, lean (asymmetry), bulge (ribboning) */
const KEYS=[
/* Each world stands in an identical bay: straight walls, no lean, no bulge,
   nothing for an aperture to fight. The building does its moving between
   them instead, so the drama is in the walk and the worlds get stillness. */
 [0.000,   22,   17,  0.0,  0.0],
 [0.090,   19,   14, 0.12, 0.05],
 [0.153, 11.5, 11.5,  0.0,  0.0],   /* bay 01 opens */
 [0.197, 11.5, 11.5,  0.0,  0.0],   /* bay 01 closes */
 [0.245,  6.2,  7.0, -0.08, 0.03],
 [0.293, 11.5, 11.5,  0.0,  0.0],   /* bay 02 opens */
 [0.337, 11.5, 11.5,  0.0,  0.0],   /* bay 02 closes */
 [0.385,   15,   25, 0.18, 0.05],
 [0.433, 11.5, 11.5,  0.0,  0.0],   /* bay 03 opens */
 [0.477, 11.5, 11.5,  0.0,  0.0],   /* bay 03 closes */
 [0.525,  9.0,  8.6,  0.0, 0.04],
 [0.573, 11.5, 11.5,  0.0,  0.0],   /* bay 04 opens */
 [0.617, 11.5, 11.5,  0.0,  0.0],   /* bay 04 closes */
 [0.665,  7.6,  4.2,  0.0,  0.0],
 [0.708, 11.5, 11.5,  0.0,  0.0],   /* bay 05 opens */
 [0.752, 11.5, 11.5,  0.0,  0.0],   /* bay 05 closes */
 [0.795,   16,   15, -0.08, 0.04],
 [0.838, 11.5, 11.5,  0.0,  0.0],   /* bay 06 opens */
 [0.882, 11.5, 11.5,  0.0,  0.0],   /* bay 06 closes */
 [0.935,   14,   18,  0.0, 0.03],
 [1.000,   15,   20,  0.1, 0.02],
];
function prof(u){
  u=clamp(u,0,1);
  let i=0; while(i<KEYS.length-2 && u>=KEYS[i+1][0]) i++;
  const A=KEYS[i], B=KEYS[i+1];
  const t=smooth(clamp((u-A[0])/(B[0]-A[0]),0,1));
  return {W:lerp(A[1],B[1],t), H:lerp(A[2],B[2],t), lean:lerp(A[3],B[3],t), bulge:lerp(A[4],B[4],t)};
}
/* section-local point for angle v: v=-PI/2 floor centre, 0 right wall,
   PI/2 ceiling apex, PI left wall */
function sec(u,v,out){
  const P=prof(u), W=P.W, H=P.H;
  const cs=Math.cos(v), sn=Math.sin(v);
  const n=sn<0?6:2.3;
  let x=W/2*Math.sign(cs)*Math.pow(Math.abs(cs),2/n);
  let y=H/2+H/2*Math.sign(sn)*Math.pow(Math.abs(sn),2/n);
  const yn=y/H;
  x+=P.lean*W*Math.pow(yn,1.6);
  const bl=P.bulge*Math.sin(3*v+u*9)*sstep(.12,.55,yn);
  x*=1+bl;                                   /* width only: y stays monotonic on each wall */
  out.x=x; out.y=y; out.W=W; out.H=H; return out;
}
const _p=new THREE.Vector3(), _t=new THREE.Vector3(), _r=new THREE.Vector3();
function frameAt(u, o){
  o=o||{};
  o.P=PATH.getPointAt(clamp(u,0,1), o.P||new THREE.Vector3());
  o.T=PATH.getTangentAt(clamp(u,0,1), o.T||new THREE.Vector3()).setY(0).normalize();
  o.R=(o.R||new THREE.Vector3()).crossVectors(o.T,UP).normalize();
  return o;
}
const _s={x:0,y:0,W:0,H:0}, _f={};
function surf(u,v,out){
  frameAt(u,_f); sec(u,v,_s);
  return (out||new THREE.Vector3()).copy(_f.P).addScaledVector(_f.R,_s.x).addScaledVector(UP,_s.y);
}
const _a=new THREE.Vector3(), _b=new THREE.Vector3(), _c=new THREE.Vector3(), _d=new THREE.Vector3();
function normalAt(u,v,out){
  out=out||new THREE.Vector3();
  const du=.0015, dv=.02;
  surf(u+du,v,_a); surf(u-du,v,_b); surf(u,v+dv,_c); surf(u,v-dv,_d);
  _a.sub(_b); _c.sub(_d);
  out.crossVectors(_c,_a).normalize();
  /* inward: toward the section centre */
  frameAt(u,_f); sec(u,v,_s);
  _b.copy(_f.P).addScaledVector(UP,_s.H/2).sub(surf(u,v,_a));
  if(out.dot(_b)<0) out.negate();
  return out;
}
/* invert y on a wall side (y monotonic in v on each side) */
function vForY(u,side,y){
  let lo,hi; if(side>0){lo=-Math.PI/2;hi=Math.PI/2;} else {lo=Math.PI/2;hi=3*Math.PI/2;}
  for(let k=0;k<40;k++){ const m=(lo+hi)/2; sec(u,m,_s);
    const up = side>0 ? (_s.y<y) : (_s.y>y);
    if(up) lo=m; else hi=m; }
  return (lo+hi)/2;
}
function vForX(u,x){ /* floor: v in (-PI,0), x monotonic */
  let lo=-Math.PI,hi=0;
  for(let k=0;k<40;k++){ const m=(lo+hi)/2; sec(u,m,_s); if(_s.x<x) lo=m; else hi=m; }
  return (lo+hi)/2;
}

/* ============ THE SURFACE ============ */
const U=LOWPOWER?420:760, V=LOWPOWER?72:120;
const tubeGeo=new THREE.BufferGeometry();
{
  const n=(U+1)*(V+1);
  const pos=new Float32Array(n*3), uv=new Float32Array(n*2),
        aS=new Float32Array(n), aX=new Float32Array(n), aY=new Float32Array(n),
        aXn=new Float32Array(n), aYn=new Float32Array(n), aV=new Float32Array(n), aAO=new Float32Array(n);
  let k=0; const P=new THREE.Vector3();
  for(let i=0;i<=U;i++){
    const u=i/U; frameAt(u,_f);
    for(let j=0;j<=V;j++){
      const v=-Math.PI/2+2*Math.PI*j/V;
      sec(u,v,_s);
      P.copy(_f.P).addScaledVector(_f.R,_s.x).addScaledVector(UP,_s.y);
      pos[k*3]=P.x; pos[k*3+1]=P.y; pos[k*3+2]=P.z;
      uv[k*2]=u; uv[k*2+1]=j/V;
      const xn=_s.x/(_s.W/2), yn=_s.y/_s.H;
      aS[k]=u*LEN; aX[k]=_s.x; aY[k]=_s.y; aXn[k]=xn; aYn[k]=yn; aV[k]=v;
      let ao=1;
      ao-=.40*sstep(.5,1,Math.abs(xn))*(1-sstep(0,.16,yn));   /* floor-wall corners */
      ao*=.84+.16*yn;                                          /* ceilings brighter */
      ao*=.78+.22*sstep(3,14,_s.H);                            /* low rooms darker */
      aAO[k]=ao;
      k++;
    }
  }
  const idx=[];
  for(let i=0;i<U;i++)for(let j=0;j<V;j++){
    const a=i*(V+1)+j, b=a+V+1;
    idx.push(a,b,a+1, b,b+1,a+1);
  }
  tubeGeo.setIndex(idx);
  tubeGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  tubeGeo.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  tubeGeo.setAttribute('aS',new THREE.BufferAttribute(aS,1));
  tubeGeo.setAttribute('aX',new THREE.BufferAttribute(aX,1));
  tubeGeo.setAttribute('aY',new THREE.BufferAttribute(aY,1));
  tubeGeo.setAttribute('aXn',new THREE.BufferAttribute(aXn,1));
  tubeGeo.setAttribute('aYn',new THREE.BufferAttribute(aYn,1));
  tubeGeo.setAttribute('aV',new THREE.BufferAttribute(aV,1));
  tubeGeo.setAttribute('aAO',new THREE.BufferAttribute(aAO,1));
  tubeGeo.computeVertexNormals();
  /* make the winding face inward */
  const nrm=tubeGeo.attributes.normal; const test=(Math.floor(U/2))*(V+1)+Math.floor(V*.25);
  frameAt(.5,_f); sec(.5,0,_s);
  _a.set(pos[test*3],pos[test*3+1],pos[test*3+2]);
  _b.copy(_f.P).addScaledVector(UP,_s.H/2).sub(_a);
  if(_b.dot(new THREE.Vector3(nrm.getX(test),nrm.getY(test),nrm.getZ(test)))<0){
    const ii=tubeGeo.index.array; for(let q=0;q<ii.length;q+=3){ const t=ii[q+1]; ii[q+1]=ii[q+2]; ii[q+2]=t; }
    tubeGeo.computeVertexNormals();
  }
  /* weld the normals across the seam at the floor centreline */
  { const nn=tubeGeo.attributes.normal;
    for(let i=0;i<=U;i++){ const a=i*(V+1), b=a+V;
      const x=(nn.getX(a)+nn.getX(b))/2, y=(nn.getY(a)+nn.getY(b))/2, z=(nn.getZ(a)+nn.getZ(b))/2;
      nn.setXYZ(a,x,y,z); nn.setXYZ(b,x,y,z); } nn.needsUpdate=true; }
  tubeGeo.computeBoundingSphere();
}

/* ============ THE MATERIAL ============ shader-cut apertures, light cuts,
   panel seams, skylight pools, world colour contaminating the white */
const NH=8, NSEAM=8, NPOOL=12;
const uni={
  uHoleA:{value:Array.from({length:NH},()=>new THREE.Vector4())},
  uHoleB:{value:Array.from({length:NH},()=>new THREE.Vector4())},
  uSeam:{value:Array.from({length:NSEAM},()=>new THREE.Vector4(0,0,0,-1))},
  uSeamW:{value:.0085},
  uSeamCol:{value:new THREE.Color(0xfff3e4)},
  uPool:{value:Array.from({length:NPOOL},()=>new THREE.Vector4(0,0,1,1))},
  uPoolCol:{value:Array.from({length:NPOOL},()=>new THREE.Vector4(1,1,1,0))},
  uBridge:{value:new THREE.Vector4(0,0,0,0)},
  uTime:{value:0},
  /* Filled in once the collection is hung: R = local wall tone, G = how far
     the surface is quieted, B = contact shadow, A = how far the warmth is
     pulled out for a saturated work. A 1x1 neutral stands in until then. */
  uMod:{value:(function(){
    const t=new THREE.DataTexture(new Uint8Array([128,0,0,0]),1,1,THREE.RGBAFormat);
    t.needsUpdate=true; return t;
  })()},
};
/* Matte mineral plaster rather than the old synthetic white. Low saturation,
   pale warm grey; the floor is mixed to a honed charcoal further down in the
   shader so the pale architecture has something to stand on. */
const tubeMat=new THREE.MeshStandardMaterial({color:0xe6e2da, roughness:.88, metalness:0, envMapIntensity:.5});
tubeMat.onBeforeCompile=sh=>{
  Object.assign(sh.uniforms, uni);
  sh.vertexShader=sh.vertexShader
    .replace('#include <common>',`#include <common>
      attribute float aS,aX,aY,aXn,aYn,aV,aAO;
      varying float vS,vX,vY,vXn,vYn,vV,vAO; varying vec2 vUvT;`)
    .replace('#include <begin_vertex>',`#include <begin_vertex>
      vS=aS; vX=aX; vY=aY; vXn=aXn; vYn=aYn; vV=aV; vAO=aAO; vUvT=uv;`);
  sh.fragmentShader=sh.fragmentShader
    .replace('#include <common>',`#include <common>
      varying float vS,vX,vY,vXn,vYn,vV,vAO; varying vec2 vUvT;
      uniform vec4 uHoleA[${NH}]; uniform vec4 uHoleB[${NH}];
      uniform vec4 uSeam[${NSEAM}]; uniform float uSeamW; uniform vec3 uSeamCol;
      uniform vec4 uPool[${NPOOL}]; uniform vec4 uPoolCol[${NPOOL}];
      uniform vec4 uBridge; uniform float uTime; uniform sampler2D uMod;
      float angd(float a,float b){ float d=abs(a-b); return min(d, 6.2831853-d); }
      /* value noise — cheap, and evaluated in metres so one millimetre of
         grain is one millimetre everywhere on the shell */
      float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
      float vn(vec2 p){
        vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
        return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),
                   mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x), f.y);
      }`)
    .replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
      /* apertures */
      for(int i=0;i<${NH};i++){
        vec4 A=uHoleA[i]; vec4 B=uHoleB[i]; if(B.w<0.5) continue;
        float c; bool region;
        if(B.x<0.5){ c=vY; region = B.y*vXn>0.42; }
        else if(B.x<1.5){ c=vX; region = vYn<0.07; }
        else { c=vX; region = vYn>0.88; }
        float ds=(vS-A.x)/A.z, dc=(c-A.y)/A.w;
        if(region && ds*ds+dc*dc<1.0) discard;
      }
      /* the void: the floor falls away, only the bridge remains */
      if(uBridge.x>0.5 && vS>uBridge.y && vS<uBridge.z && vYn<0.07) discard;`)
    .replace('#include <map_fragment>',`#include <map_fragment>
      float vdist=length(vViewPosition);
      vec4 md=texture2D(uMod, vUvT);
      float mTone=(md.r-0.5)*2.0;      /* local wall tone, -1..1  */
      float mCalm=md.g;                /* quieted around exhibits */
      float mAO  =md.b;                /* contact shadow          */
      float mNeut=md.a;                /* warmth pulled out       */

      /* one surface coordinate, in metres, continuous from floor to vault:
         up the wall it is the height, across the floor it is the width */
      float tv = vY + (1.0-smoothstep(0.0,0.12,vYn))*abs(vX);
      vec2 mp = vec2(vS, tv);

      /* three scales, as a real plaster has */
      float broad = vn(mp*0.055);                       /* ~18m drift      */
      float fine  = vn(mp*1.55)*0.62 + vn(mp*3.1)*0.38; /* ~0.6m grain     */
      float pore  = vn(mp*11.0);                        /* ~9cm pores      */
      /* Each scale is faded out once one screen pixel covers too much of its
         wavelength. Measuring the footprint rather than the distance is what
         keeps the grain stable on a wall seen at a glancing angle, where a
         distance test still reads as "near" but a pixel is smeared across
         half a metre of surface — which is where procedural noise starts to
         crawl as the camera moves. */
      float foot = max(fwidth(vS), fwidth(tv));
      float aaF = 1.0-smoothstep(0.30,0.85, foot*2.3);
      float aaP = 1.0-smoothstep(0.30,0.85, foot*11.0);
      float quiet = 1.0-0.82*mCalm;   /* the wall calms down around exhibits */

      /* amplitudes are set against the noise's spread, not its peak: this
         lands the grain around 2-3% variation, plainly there as material but
         well under the step from wall to frame moulding */
      float tone = 1.0
        + 0.050*(broad-0.5)*2.0*quiet
        + 0.095*(fine -0.5)*2.0*aaF*quiet
        + 0.065*(pore -0.5)*2.0*aaP*quiet;

      /* shallow striations, following the curves because they are a function
         of height alone. Upper wall and vault only, and only along some
         stretches — a band across every surface is what made it read as a
         hull rather than as cast stone. */
      float zone  = smoothstep(0.44,0.66,vYn);
      float where = smoothstep(0.52,0.74, vn(vec2(vS*0.011, 7.3)));
      float ph    = fract(tv/3.8);
      float ridge = (1.0-smoothstep(0.0,0.055,abs(ph-0.5)))
                  - (1.0-smoothstep(0.0,0.055,abs(ph-0.44)));
      float aaR   = (1.0-smoothstep(0.30,0.85,foot*0.43))*(1.0-smoothstep(40.0,90.0,vdist));
      float stri  = 1.0 + 0.045*ridge*zone*where*aaR*quiet;

      /* the floor: honed charcoal, warm rather than blue. Its junction is
         measured in metres, not as a fraction of the room's height, so it
         stays a believable 16cm everywhere instead of climbing the wall as a
         dark skirting in the tall rooms. It carries the same grain at about
         half strength — honed stone is quieter than plaster, not blank — and
         none of the striation. */
      float fl = 1.0-smoothstep(0.02,0.16,vY);
      vec3 wallCol  = diffuseColor.rgb * tone * stri;
      vec3 floorCol = vec3(0.228,0.217,0.203) * (1.0+(tone-1.0)*0.55);
      diffuseColor.rgb = mix(wallCol, floorCol, fl);

      /* the wall takes its local value from the work hanging on it, and drops
         its warmth behind a strongly coloured one */
      diffuseColor.rgb *= 1.0 + mTone*0.5;
      float g=dot(diffuseColor.rgb, vec3(0.2126,0.7152,0.0722));
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(g), 0.55*mNeut);

      diffuseColor.rgb *= 1.0-0.22*mAO;      /* frames sit on the wall */
      diffuseColor.rgb *= vAO;`)
    .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
      /* pores break the sheen up close; the floor is honed, not polished */
      roughnessFactor = clamp(roughnessFactor - 0.07*(pore-0.5)*2.0*aaP, 0.55, 1.0);
      roughnessFactor = mix(roughnessFactor, 0.46+0.10*fine, fl);`)
    .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
      /* light cuts embedded in the surface */
      for(int i=0;i<${NSEAM};i++){
        vec4 Sm=uSeam[i]; if(Sm.w<=Sm.z) continue;
        float vc=Sm.x+Sm.y*(vS-Sm.z);
        float dv=angd(vV,vc);
        float inS=smoothstep(Sm.z,Sm.z+1.2,vS)*(1.0-smoothstep(Sm.w-1.2,Sm.w,vS));
        /* less filament, more wash: the cut reads as light grazing stone
           rather than as a lit strip running the length of a hull */
        float core=1.0-smoothstep(0.0,uSeamW,dv);
        float halo=(1.0-smoothstep(0.0,uSeamW*26.0,dv));
        totalEmissiveRadiance+=uSeamCol*(core*0.72+halo*halo*0.17)*inS;
      }
      /* pools: skylight on the floor, and each world's colour leaking onto the white */
      for(int i=0;i<${NPOOL};i++){
        vec4 Pq=uPool[i]; vec4 Cq=uPoolCol[i]; if(Cq.w<=0.0) continue;
        float ds=(vS-Pq.x)/Pq.z, dv=angd(vV,Pq.y)/Pq.w;
        float g=exp(-(ds*ds+dv*dv)*1.6);
        totalEmissiveRadiance+=Cq.rgb*Cq.w*g;
      }`);
  tubeMat.userData.shader=sh;
};
const tube=new THREE.Mesh(tubeGeo,tubeMat);
tube.frustumCulled=false;
scene.add(tube);

/* plain white for everything sculpted onto the surface */
/* ribs, aperture rims, the ribbon, the peel and the bridge: cast from the
   same mineral as the shell, a shade cleaner as cast elements are */
const whiteMat=new THREE.MeshStandardMaterial({color:0xe8e4dc, roughness:.84, metalness:0, envMapIntensity:.5, side:THREE.DoubleSide});
const darkMat=new THREE.MeshStandardMaterial({color:0x14161c, roughness:.6, metalness:.1});

/* ============ LIGHT CUTS — seven of them ============ */
const seams=uni.uSeam.value;
seams[0].set(Math.PI/2, 0, S(.012), S(.10));           /* entrance ceiling apex */
seams[1].set(2.3, 0, S(.213), S(.279));                 /* the passage itself, clear of bay 01's left wall */
seams[2].set(.62, 0, S(.350), S(.412));                 /* atrium — the bar of a 7, clear of bay 02 */
seams[3].set(-.72, (0.62+.72)/4.2, S(.412)-4.2, S(.412)); /* — and its stroke */
seams[4].set(Math.PI/2, 0, S(.44), S(.60));             /* gallery apex, bending away */
seams[5].set(-Math.PI/2+1.05, 0, S(.63), S(.705));      /* compression — floor edge */
seams[6].set(Math.PI/2, 0, S(.737), S(.86));            /* void apex */

/* ============ SKYLIGHT POOLS ============ */
const pools=uni.uPool.value, poolCol=uni.uPoolCol.value;
let poolN=0;
function addPool(s,v,rs,rv,hex,inten){ pools[poolN].set(s,v,rs,rv); poolCol[poolN].set(...new THREE.Color(hex).toArray(),inten); return poolN++; }
addPool(S(.045),-Math.PI/2, 7, .9, 0xfff5e6, .22);
addPool(S(.385),-Math.PI/2, 6, .8, 0xfff5e6, .20);   /* atrium centre, not bay 02 */
addPool(S(.94),-Math.PI/2, 7, .9, 0xfff5e6, .26);
addPool(S(.52), Math.PI/2, 9, .5, 0xfff5e6, .10);

/* ============ the ribs — seven, in the atrium ============ */
{
  for(let r=0;r<7;r++){
    const u=.354+r*.0105;   /* the atrium, clear of bay 02 (.293-.337) and bay 03 (.433-.477) */
    const pts=[]; const N=new THREE.Vector3();
    for(let j=0;j<V;j+=2){ const v=-Math.PI/2+2*Math.PI*j/V;
      const p=surf(u,v); normalAt(u,v,N); p.addScaledVector(N,.32); pts.push(p); }
    const crv=new THREE.CatmullRomCurve3(pts,true,'centripetal');
    const g=new THREE.TubeGeometry(crv, 110, .30, 7, true);
    scene.add(new THREE.Mesh(g, whiteMat));
  }
}

/* ============ helpers: textures ============ */
/* The museum's lettering is painted into canvas textures at boot — which is
   normally before the webfont has arrived, so the browser would quietly
   substitute and the signage would come out in a fallback face. Each text
   texture therefore keeps its draw function and repaints itself once
   Nazarena is genuinely ready. */
const NZ='"Y7Jost","Helvetica Neue",Arial,sans-serif';   /* canvas signage follows the type sheet */
const REDRAW=[];
function regTex(t,draw){ REDRAW.push(function(){ draw(); t.needsUpdate=true; }); return t; }
if(document.fonts && document.fonts.load){
  Promise.all([document.fonts.load('400 90px "Nazarena"'),
               document.fonts.load('400 24px "Nazarena"')])
    .then(function(){ return document.fonts.ready; })
    .then(function(){ for(const f of REDRAW) f(); })
    .catch(function(){});
}
function softDisc(inner,outer){
  const c=document.createElement('canvas'); c.width=c.height=256;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,inner); g.addColorStop(1,outer);
  x.fillStyle=g; x.fillRect(0,0,256,256);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function glimpse01(){ /* world 01 — maze, dots, motion */
  const c=document.createElement('canvas'); c.width=256; c.height=512;
  const x=c.getContext('2d');
  x.fillStyle='#0c0e1c'; x.fillRect(0,0,256,512);
  x.strokeStyle='#2121de'; x.lineWidth=5;
  for(let i=0;i<7;i++){ x.strokeRect(18+((i*67)%180), 24+((i*131)%420), 60, 40); }
  x.fillStyle='#ffe14d';
  for(let i=0;i<9;i++) x.fillRect(24+i*26, 250, 7, 7);
  x.beginPath(); x.moveTo(128,380); x.arc(128,380,26,.6,5.7); x.closePath(); x.fill();
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}
function glimpse02(){ /* world 02 — chrome night, falling 99s */
  const c=document.createElement('canvas'); c.width=256; c.height=512;
  const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,512);
  g.addColorStop(0,'#0a0e1c'); g.addColorStop(.5,'#1a1030'); g.addColorStop(1,'#060a14');
  x.fillStyle=g; x.fillRect(0,0,256,512);
  const cg=x.createLinearGradient(0,0,256,0);
  cg.addColorStop(0,'rgba(255,255,255,0)'); cg.addColorStop(.5,'rgba(200,210,240,.55)');
  cg.addColorStop(1,'rgba(255,255,255,0)');
  x.fillStyle=cg; x.fillRect(60,0,60,512);
  x.font='28px monospace'; x.fillStyle='#ff3366';
  for(let i=0;i<10;i++){ x.globalAlpha=.35+Math.random()*.6; x.fillText('99', 30+((i*83)%190), 40+i*48); }
  x.globalAlpha=1; x.fillStyle='#ffb454'; x.fillRect(20,470,216,3);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  t.wrapS=t.wrapT=THREE.RepeatWrapping; return t;
}
/* World 03 — a frame from the ice itself, decoded behind an ice wash */
const W03_PLATE="__ASSET:world03-plate.jpg__";
function glimpse03(){
  const c=document.createElement("canvas"); c.width=512; c.height=1024;
  const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,0,1024);
  g.addColorStop(0,"#dbe9f2"); g.addColorStop(.55,"#a8cadd"); g.addColorStop(1,"#8fb6cc");
  x.fillStyle=g; x.fillRect(0,0,512,1024);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4;
  const img=new Image();
  img.onload=function(){ x.drawImage(img,0,0,512,1024); t.needsUpdate=true; };
  img.src=W03_PLATE;
  return t;
}
function slabTex(num){
  const c=document.createElement('canvas'); c.width=256; c.height=460;
  const x=c.getContext('2d');
  function draw(){
    x.clearRect(0,0,256,460);
    x.fillStyle='#f4f1ea'; x.fillRect(0,0,256,460);
    x.strokeStyle='#e6e1d6'; x.lineWidth=2; x.strokeRect(6,6,244,448);
    /* blind emboss: the numeral is pressed into the membrane, not printed */
    x.font='500 104px '+NZ; x.textAlign='center';
    x.fillStyle='#ffffff'; x.fillText(num,130,254);
    x.fillStyle='#ddd7ca'; x.fillText(num,128,252);
  }
  draw();
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  return regTex(t,draw);
}
/* small museum type, drawn once */
function textTex(lines, opts={}){
  const W=opts.w||512, H=opts.h||160;
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const x=c.getContext('2d');
  function draw(){
    x.clearRect(0,0,W,H);
    x.textAlign=opts.align||'left'; x.fillStyle=opts.color||'#2a2823';
    let y=opts.y||34;
    for(const L of lines){
      x.font=L.font; const ls=L.ls||0;
      if(ls){ let cx=(opts.align==='center')?W/2-([...L.t].length*ls)/2:16;
        x.textAlign='left';
        for(const ch of L.t){ x.fillText(ch,cx,y); cx+=x.measureText(ch).width+ls; }
        x.textAlign=opts.align||'left';
      } else x.fillText(L.t, opts.align==='center'?W/2:16, y);
      y+=L.lh||40;
    }
  }
  draw();
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8;
  return regTex(t,draw);
}

/* ============ THE WORLDS ============ */
const clickables=[];
const holes=[]; let holeN=0;
function cutHole(type, side, s, c, rs, rc){
  const A=uni.uHoleA.value[holeN], B=uni.uHoleB.value[holeN];
  A.set(s,c,rs,rc); B.set(type==='wall'?0:type==='floor'?1:2, side, 0, 1);
  holes.push({type,side,s,c,rs,rc}); return holeN++;
}
/* rim: the thickness of the wall, seen through the opening */
function buildRim(h, thick){
  const M=80, pos=[], idx=[]; const N=new THREE.Vector3();
  for(let k=0;k<=M;k++){
    const th=k/M*Math.PI*2;
    const s=h.s+h.rs*Math.cos(th), c=h.c+h.rc*Math.sin(th);
    const u=s/LEN; let v;
    if(h.type==='wall') v=vForY(u,h.side,Math.max(.12,c)); else v=vForX(u,c);
    const p=surf(u,v); normalAt(u,v,N);
    pos.push(p.x,p.y,p.z, p.x-N.x*thick, p.y-N.y*thick, p.z-N.z*thick);
    if(k<M){ const a=k*2; idx.push(a,a+1,a+2, a+1,a+3,a+2); }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setIndex(idx); g.computeVertexNormals();
  const m=new THREE.Mesh(g, whiteMat); scene.add(m); return m;
}
/* a frame on the surface at (u,v): +z points into the corridor */
function surfaceGroup(u,v,standoff=0){
  const p=surf(u,v), N=normalAt(u,v);
  const g=new THREE.Group(); g.position.copy(p).addScaledVector(N,standoff);
  g.up.copy(UP); g.lookAt(p.clone().addScaledVector(N,5)); scene.add(g);
  return g;
}
const doorFX=[];
const worldLights=[];
const WORLD_DEF=[
  {id:'01',name:'RETRO GAMES',href:'./RetroGames/',u:0.175,type:'wall',side:-1,c:4.2,rs:3.3,rc:4.0,hex:0x2f5cff,leak:'rgba(47,92,255,.5)',kind:'pixel',open:true,cur:'cur-w01',glimpse:glimpse01,thick:0.9},
  {id:'02',name:'Y2K',href:'./Y2K/',u:0.315,type:'wall',side:1,c:4.2,rs:3.3,rc:4.0,hex:0xff3366,leak:'rgba(255,51,102,.45)',kind:'chrome',open:true,cur:'cur-w02',glimpse:glimpse02,thick:0.9,peel:true},
  {id:'03',name:'THE ICE AGE',href:'/iceage',u:0.455,type:'wall',side:-1,c:4.2,rs:3.3,rc:4.0,hex:0x64c8dc,leak:'rgba(100,200,220,.5)',kind:'shard',open:true,cur:'cur-w03',glimpse:glimpse03,thick:0.9},
  {id:'04',name:'TO BE REVEALED',u:0.595,type:'wall',side:1,c:4.2,rs:3.3,rc:4.0,hex:0xe0a050,open:false,thick:0.9},
  {id:'05',name:'TO BE REVEALED',u:0.73,type:'wall',side:-1,c:4.2,rs:3.3,rc:4.0,hex:0x9a8cff,open:false,thick:0.9},
  {id:'06',name:'TO BE REVEALED',u:0.86,type:'wall',side:1,c:4.2,rs:3.3,rc:4.0,hex:0x5fd0a0,open:false,thick:0.9},
  {id:'07',name:'TO BE REVEALED',u:.985,type:'end',hex:0xffd166,open:false},
];
const WORLDS=[];
const labelMats=[];
function label(g, id, name, x, y, z, w=1.7){
  /* the name alone: the number is wayfinding, and it already lives on the
     placard and the rail — on the wall it was just titling the room twice */
  const t=textTex([{t:name,font:'500 30px '+NZ,ls:6}],{w:512,h:180,y:104});
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*180/512),
    new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));
  m.position.set(x,y,z); g.add(m); labelMats.push(m.material); return m;
}
function niche(w, g, hw, hh, depth){
  /* the dark chamber behind the aperture, and the picture at the back of it */
  /* A shadowed room rather than a void: near-black read as a tear in the
     building wherever an edge showed past the aperture. */
  const dk=new THREE.MeshStandardMaterial({color:0x4a453e,roughness:.95,metalness:0,side:THREE.DoubleSide});
  const back=new THREE.Mesh(new THREE.PlaneGeometry(hw*2+2.5,hh*2+2.5), dk); back.position.z=-depth; g.add(back);
  for(const sd of [-1,1]){
    const sw=new THREE.Mesh(new THREE.PlaneGeometry(depth,hh*2+2.5), dk);
    sw.position.set(sd*(hw+1.2),0,-depth/2); sw.rotation.y=-sd*Math.PI/2; g.add(sw);
    const fc=new THREE.Mesh(new THREE.PlaneGeometry(hw*2+2.5,depth), dk);
    fc.position.set(0,sd*(hh+1.2),-depth/2); fc.rotation.x=sd*Math.PI/2; g.add(fc);
  }
  return back;
}
function motes(g, hex, N, spread, size){
  const mp=new Float32Array(N*3), off=new Float32Array(N), dx=new Float32Array(N), dy=new Float32Array(N);
  for(let i=0;i<N;i++){ off[i]=Math.random(); dx[i]=(Math.random()-.5)*spread.x; dy[i]=(Math.random()-.5)*spread.y; }
  const mg=new THREE.BufferGeometry(); mg.setAttribute('position',new THREE.BufferAttribute(mp,3));
  const pts=new THREE.Points(mg,new THREE.PointsMaterial({color:hex,size:size,transparent:true,opacity:0,
    depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true}));
  g.add(pts); return {pts,mg,off,dx,dy,N};
}
function makeWorld(w){
  const W={def:w, id:w.id, prox:0, p:0, u:w.u};
  WORLDS.push(W);
  if(w.type==='wall'){
    const s=S(w.u);
    cutHole('wall',w.side,s,w.c,w.rs,w.rc);
    const h=holes[holes.length-1];
    buildRim(h,w.thick);
    const v0=vForY(w.u,w.side,w.c);
    W.v=v0; W.s=s;
    const g=surfaceGroup(w.u,v0); W.g=g;
    W.point=g.position.clone(); W.normal=g.getWorldDirection(new THREE.Vector3());
    const depth=w.open?1.6:1.2;
    const back=niche(W,g,w.rs,w.rc,depth);
    if(w.open){
      const tex=w.glimpse();
      const pic=new THREE.Mesh(new THREE.CircleGeometry(1,96),
        new THREE.MeshBasicMaterial({map:tex}));
      pic.scale.set(w.rs+1.9, w.rc+2.2, 1);   /* covers the opening from 3m in — closer than the camera ever gets */
      pic.position.z=-depth+.05; g.add(pic); W.pic=pic;
      pic.userData={kind:'door',W}; clickables.push(pic);
      /* a veil of the world's colour hanging in the opening, for the raycast and the leak */
      const veil=new THREE.Mesh(new THREE.PlaneGeometry(w.rs*2,w.rc*2),
        new THREE.MeshBasicMaterial({color:w.hex,transparent:true,opacity:.06,depthWrite:false}));
      veil.position.z=-.2; g.add(veil); veil.userData={kind:'door',W}; clickables.push(veil);
      /* pieces of the world adrift in the dark */
      const debris=[]; const PIX=[0x4d5dff,0xffed4e,0xff3b4e,0x35e07a,0xf5f7ff];
      for(let i=0;i<16;i++){
        let m;
        if(w.kind==='pixel'){ const sz=.14+Math.random()*.2;
          m=new THREE.Mesh(new THREE.BoxGeometry(sz,sz,sz),new THREE.MeshBasicMaterial({color:PIX[i%5],transparent:true,opacity:0}));
        } else if(w.kind==='chrome'){
          m=new THREE.Mesh(new THREE.SphereGeometry(.12+Math.random()*.16,16,12),
            new THREE.MeshStandardMaterial({color:0xe4e9f0,metalness:1,roughness:.12,transparent:true,opacity:0}));
        } else {
          m=new THREE.Mesh(new THREE.OctahedronGeometry(.16+Math.random()*.26,0),
            new THREE.MeshStandardMaterial({color:0xc4e7f5,metalness:.15,roughness:.22,flatShading:true,transparent:true,opacity:0}));
        }
        m.userData={ph:Math.random()*6.283, rr:.3+Math.random()*(w.rs*.9), dp:.6+Math.random()*(depth-1.2), sp:.5+Math.random(),
          ax:new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize()};
        g.add(m); debris.push(m);
      }
      W.debris=debris;
      W.motes=motes(g,w.hex,26,{x:w.rs*2,y:w.rc*1.6},.12);
      W.fog=motes(g,w.hex,10,{x:w.rs*2.4,y:w.rc*1.4},w.kind==='shard'?2.4:1.2);
      W.fog.pts.material.opacity=0; W.fog.pts.material.map=softDisc('rgba(255,255,255,.35)','rgba(255,255,255,0)');
      const inL=new THREE.PointLight(w.hex, 0, depth*3, 1.8); inL.position.set(0,0,-depth*.4); g.add(inL); W.inLight=inL;
    } else {
      /* sealed: a membrane with the numeral, a breath of colour behind it */
      const slab=new THREE.Mesh(new THREE.CircleGeometry(1,96),
        new THREE.MeshStandardMaterial({map:slabTex(w.id),roughness:.9}));
      slab.scale.set(w.rs+1.5, w.rc+1.8, 1); W.slabBase={x:w.rs+1.5,y:w.rc+1.8};
      slab.position.z=-.35; g.add(slab); slab.userData={kind:'sealed',W}; clickables.push(slab); W.slab=slab;
      const inL=new THREE.PointLight(w.hex, 2.5, 10, 2); inL.position.set(0,0,-.3); g.add(inL);
      const glow=new THREE.Mesh(new THREE.PlaneGeometry(w.rs*2+1.2,w.rc*2+1.2),
        new THREE.MeshBasicMaterial({color:w.hex,transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false}));
      glow.position.z=-.5; g.add(glow);
    }
    /* light from the world falling into the museum */
    const L=new THREE.PointLight(w.hex, 0, 40, 1.6); L.position.copy(W.point).addScaledVector(W.normal, 2.5); scene.add(L); W.light=L;
    W.pool=addPool(s, v0, w.rs+9, 1.4, w.hex, 0);
    /* wayfinding: beside the opening, at eye level */
    const lu=w.u+ (w.rs+1.6)/LEN, lv=vForY(lu,w.side,1.5);
    const lg=surfaceGroup(lu,lv,.03); label(lg,w.id,w.name,0,0,0, 1.5);
  }
  else if(w.type==='below'){
    /* the sunken gallery, seen from the bridge above */
    frameAt(w.u,_f);
    const g=new THREE.Group(); g.position.copy(_f.P).addScaledVector(UP,-9.5);
    g.up.copy(UP); g.lookAt(g.position.clone().add(_f.T)); scene.add(g); W.g=g;
    const fl=new THREE.Mesh(new THREE.BoxGeometry(16,.6,14), whiteMat); fl.position.y=-.3; g.add(fl);
    const slab=new THREE.Mesh(new THREE.PlaneGeometry(2.6,4.7), new THREE.MeshStandardMaterial({map:slabTex('04'),roughness:.9}));
    slab.position.set(0,2.35,-4); g.add(slab); slab.userData={kind:'sealed',W}; clickables.push(slab); W.slab=slab;
    const wall=new THREE.Mesh(new THREE.PlaneGeometry(16,7), whiteMat); wall.position.set(0,3.5,-4.2); g.add(wall);
    const L=new THREE.PointLight(w.hex, 60, 30, 1.5); L.position.set(0,5,3); g.add(L); W.light=L;
    const pool=new THREE.Mesh(new THREE.CircleGeometry(5,40),new THREE.MeshBasicMaterial({map:softDisc('rgba(255,200,120,.5)','rgba(255,200,120,0)'),transparent:true,depthWrite:false}));
    pool.rotation.x=-Math.PI/2; pool.position.y=.02; g.add(pool);
    W.point=g.position.clone(); W.normal=UP.clone();
    W.pool=addPool(S(w.u), -Math.PI/2, 10, 1.2, w.hex, 0);
    label(g,'04','TO BE REVEALED',-3.2,1.2,0, 2.2).rotation.set(-Math.PI/2,0,Math.PI);
  }
  else if(w.type==='portal'){
    /* a suspended portal, across a bridge, over nothing */
    frameAt(w.u,_f);
    const g=new THREE.Group(); g.position.copy(_f.P); g.up.copy(UP); g.lookAt(g.position.clone().add(_f.T)); scene.add(g); W.g=g;
    /* side bridge: group +x is the walker's right */
    const sb=new THREE.Mesh(new THREE.BoxGeometry(4.2,.9,3.4), whiteMat); sb.position.set(5.4,-.45,0); g.add(sb);
    const edge=new THREE.Mesh(new THREE.BoxGeometry(4.2,.03,.06),new THREE.MeshBasicMaterial({color:0xffefd6}));
    edge.position.set(5.4,0.01,1.55); g.add(edge); const e2=edge.clone(); e2.position.z=-1.55; g.add(e2);
    const ring=new THREE.Mesh(new THREE.TorusGeometry(3.0,.42,14,64), whiteMat);
    ring.position.set(7.4,3.0,0); ring.rotation.y=Math.PI/2; g.add(ring);
    const slab=new THREE.Mesh(new THREE.PlaneGeometry(4.6,4.6), new THREE.MeshStandardMaterial({map:slabTex('06'),roughness:.9,side:THREE.DoubleSide}));
    slab.position.set(7.4,3.0,0); slab.rotation.y=-Math.PI/2; g.add(slab); slab.userData={kind:'sealed',W}; clickables.push(slab); W.slab=slab;
    const L=new THREE.PointLight(w.hex, 30, 24, 1.6); L.position.set(13,3.5,0); g.add(L); W.light=L;
    W.point=g.localToWorld(new THREE.Vector3(14.2,3,0)); W.normal=_f.R.clone().negate();
    W.pool=addPool(S(w.u), 0, 9, 1.2, w.hex, 0);
    const lg=new THREE.Group(); lg.position.set(2.6,1.4,-1.9); lg.rotation.y=Math.PI/2; g.add(lg); label(lg,'06','TO BE REVEALED',0,0,0,1.5);
  }
  else if(w.type==='end'){
    /* the cathedral void, and the black door within it */
    frameAt(1,_f);
    const pts=[]; for(let j=0;j<=V;j++){ pts.push(surf(1,-Math.PI/2+2*Math.PI*j/V)); }
    const C=_f.P.clone().addScaledVector(UP,prof(1).H/2);
    const pos=[C.x,C.y,C.z]; for(const q of pts){ q.sub(C).multiplyScalar(1.9).add(C); pos.push(q.x,q.y,q.z); }
    const idx=[]; for(let j=0;j<V;j++) idx.push(0,j+1,j+2);
    const cg=new THREE.BufferGeometry(); cg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); cg.setIndex(idx);
    const cap=new THREE.Mesh(cg,new THREE.MeshBasicMaterial({color:0xece7de,side:THREE.DoubleSide,fog:false}));
    cap.position.addScaledVector(_f.T,6); scene.add(cap);
    /* the dark beyond: a second, dimmer skin so the end reads as depth, not a wall */
    frameAt(w.u,_f);
    const g=new THREE.Group(); g.position.copy(_f.P); g.up.copy(UP); g.lookAt(g.position.clone().sub(_f.T)); scene.add(g); W.g=g;
    /* the last door is the numeral's material: polished chrome, hinged on
       its left edge so the walk ends by it opening rather than by a cut */
    /* The seventh world is opened in person, so the corridor does not end on
       a way through — it ends on the door itself, filled with the same chrome
       as the numeral, carrying the invitation. */
    const door=new THREE.Mesh(new THREE.BoxGeometry(3.4,6.4,.22),new THREE.MeshStandardMaterial(
      {color:0xf2f3f5,roughness:.07,metalness:1,envMapIntensity:1.5}));
    door.position.set(0,3.2,0); g.add(door); door.userData={kind:'door7',W}; clickables.push(door);
    W.door7=door;
    /* a shallow reveal around it so the panel reads as set into the wall */
    const jamb=new THREE.Mesh(new THREE.BoxGeometry(3.9,6.9,.10), whiteMat);
    jamb.position.set(0,3.2,-.09); g.add(jamb);
    const sill=new THREE.Mesh(new THREE.PlaneGeometry(3.2,.1),new THREE.MeshBasicMaterial({color:0xffd166,transparent:true,opacity:.9}));
    sill.position.set(0,.06,.14); g.add(sill); W.sill=sill;
    const sg=new THREE.Mesh(new THREE.CircleGeometry(2.6,32),new THREE.MeshBasicMaterial({map:softDisc('rgba(255,209,102,.55)','rgba(255,255,255,0)'),transparent:true,depthWrite:false}));
    sg.rotation.x=-Math.PI/2; sg.position.set(0,.02,1.4); sg.scale.set(1.4,1,1); g.add(sg); W.sillGlow=sg;
    const L=new THREE.PointLight(w.hex, 0, 30, 1.6); L.position.set(0,2,2); g.add(L); W.light=L;
    W.point=g.position.clone().addScaledVector(UP,2.5); W.normal=_f.T.clone().negate();
    W.pool=addPool(S(.975), -Math.PI/2, 8, 1.0, w.hex, 0);
  }
  return W;
}
for(const w of WORLD_DEF) makeWorld(w);

/* The floor runs unbroken to the end: the void, its bridge and the abyss
   beneath were reading as a hole in the building rather than a room. */

/* World 02 — the architecture peels upward off its opening */
{
  const W=WORLDS[1], w=W.def, h=holes[1];
  const M=44, T=10, pos=[], idx=[]; const N=new THREE.Vector3();
  for(let k=0;k<=M;k++){
    const th=.12+(Math.PI-.24)*k/M;                 /* the upper arc of the opening */
    const s=h.s+h.rs*Math.cos(th), c=h.c+h.rc*Math.sin(th);
    const u=s/LEN, v=vForY(u,h.side,c);
    const p=surf(u,v); normalAt(u,v,N);
    for(let t=0;t<=T;t++){ const q=t/T;
      const lift=q*3.6, curl=q*q*2.6;
      pos.push(p.x+UP.x*lift+N.x*curl, p.y+UP.y*lift+N.y*curl, p.z+UP.z*lift+N.z*curl);
      if(k<M&&t<T){ const a=k*(T+1)+t, b=a+T+1; idx.push(a,b,a+1, b,b+1,a+1); }
    }
  }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx); g.computeVertexNormals();
  scene.add(new THREE.Mesh(g, whiteMat));
}
/* World 05's ribbon is retired: a bay holds one opening and nothing else. */

/* ============ the small print (HAT) ============ */
{
  const tiny=(u,side,y,txt,w=1.4)=>{ const v=vForY(u,side,y); const g=surfaceGroup(u,v,.02);
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w*60/512),new THREE.MeshBasicMaterial({map:textTex([{t:txt,font:'400 21px '+NZ,ls:5}],{w:512,h:60,y:40}),transparent:true,depthWrite:false}));
    g.add(m); };
  /* on the floor, under the ceiling seam, where the seven ribs line up */
  frameAt(.385,_f); const fg=new THREE.Group(); fg.position.copy(surf(.385,-Math.PI/2)).addScaledVector(UP,.02);
  fg.rotation.set(-Math.PI/2,0,0); fg.rotateOnWorldAxis(UP, Math.atan2(-_f.T.x,-_f.T.z)); scene.add(fg);
  const fm=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2*60/512),new THREE.MeshBasicMaterial({map:textTex([{t:'LOOK UP. NOW LOOK BACK.',font:'400 21px '+NZ,ls:5}],{w:512,h:60,y:40}),transparent:true,depthWrite:false}));
  fg.add(fm);
}

/* ============ THE COLLECTION — the studio's work, hung on the curve ============ */
const ART_DATA={"a1.jpg": "__ASSET:a1.jpg__", "a2.jpg": "__ASSET:a2.jpg__", "a3.jpg": "__ASSET:a3.jpg__", "a4.jpg": "__ASSET:a4.jpg__", "a5.jpg": "__ASSET:a5.jpg__", "a6.jpg": "__ASSET:a6.jpg__", "a7.jpg": "__ASSET:a7.jpg__", "a8.jpg": "__ASSET:a8.jpg__","a9.jpg":"__ASSET:a9.jpg__","a10.jpg":"__ASSET:a10.jpg__","a11.jpg":"__ASSET:a11.jpg__","a12.jpg":"__ASSET:a12.jpg__","a13.jpg":"__ASSET:a13.jpg__","a14.jpg":"__ASSET:a14.jpg__","a15.jpg":"__ASSET:a15.jpg__"};
['truck','cricket','layer','paperbag','heroslider','sloka','solvecube',
 'cherrypickers','frame-a','frame-b','frame-c'].forEach(n=>{ ART_DATA[n+'.jpg']='/art/'+n+'.jpg'; });
const texLoader=new THREE.TextureLoader();
const artGroups=[];
function ringGeo(ow,oh,iw,ih,d){
  const bw=(ow-iw)/2, bh=(oh-ih)/2;
  const rails=[[ow,bh,d,0,-(oh+ih)/4],[ow,bh,d,0,(oh+ih)/4],[bw,ih,d,-(ow+iw)/4,0],[bw,ih,d,(ow+iw)/4,0]];
  let pos=[],nor=[],uv=[];
  for(const [rw,rh,rd,x,y] of rails){ const g=new THREE.BoxGeometry(rw,rh,rd).toNonIndexed(); g.translate(x,y,0);
    pos=pos.concat(Array.from(g.attributes.position.array)); nor=nor.concat(Array.from(g.attributes.normal.array)); uv=uv.concat(Array.from(g.attributes.uv.array)); g.dispose(); }
  const out=new THREE.BufferGeometry();
  out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); out.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); out.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  return out;
}
const frameMatDark=new THREE.MeshStandardMaterial({color:0xd7d2c7,roughness:.88});
const matMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.92});
const mouldMat=new THREE.MeshStandardMaterial({color:0xf1eee6,roughness:.5,metalness:.05,envMapIntensity:.45});
/* Measured off the actual files: mean luminance and saturation of every work
   that is inlined in this page. The wall behind a work is toned from these —
   a near-white photograph needs the wall to step down or its edge disappears,
   a dark one needs the wall to step up, and a strongly coloured one needs the
   warmth pulled out of the plaster behind it so its own colour stays true.
   Works served as files (/art/*.jpg) are not measured here and take the
   neutral default. */
const ART_LUM={'a1.jpg':[0.7369,0.054],'a10.jpg':[0.514,0.239],'a11.jpg':[0.1768,0.58],'a12.jpg':[0.3276,0.441],'a13.jpg':[0.6464,0.172],'a14.jpg':[0.3979,0.133],'a15.jpg':[0.3741,0.23],'a2.jpg':[0.5758,0.968],'a3.jpg':[0.4803,0.228],'a4.jpg':[0.5696,0.369],'a5.jpg':[0.4932,0.819],'a6.jpg':[0.4679,0.083],'a7.jpg':[0.2498,0.411],'a8.jpg':[0.5526,0.338],'a9.jpg':[0.9526,0.002]};
const artFields=[];
function hangArt(src, ratio, h, u, side, y=2.6){
  const w=h*ratio;
  const v=vForY(u,side,y);
  const g=surfaceGroup(u,v,.19);
  /* built the way a frame is built: backing, print, window mat, moulding */
  const bk=new THREE.Mesh(new THREE.BoxGeometry(w+.18,h+.18,.05),frameMatDark); bk.position.z=.025; g.add(bk);
  const tex=texLoader.load(ART_DATA[src]); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
  const art=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex})); art.position.z=.068; g.add(art);
  art.userData={kind:'art',grp:g}; clickables.push(art);
  const mt=new THREE.Mesh(ringGeo(w+.26,h+.26,w-.07,h-.07,.006),matMat); mt.position.z=.079; g.add(mt);
  const mo=new THREE.Mesh(ringGeo(w+.26,h+.26,w+.10,h+.10,.042),mouldMat); mo.position.z=.105; g.add(mo);
  /* a soft shadow on the wall behind */
  /* the broad wall shadow is now carried by the modulation map, so this is
     only the soft ambient darkening immediately under the frame */
  const sh=new THREE.Mesh(new THREE.PlaneGeometry(w+.5,h+.5),new THREE.MeshBasicMaterial({map:softDisc('rgba(18,18,24,.17)','rgba(18,18,24,0)'),transparent:true,depthWrite:false}));
  sh.position.set(0,-.07,-.17); g.add(sh);
  g.userData.art={u,side,y,w,h,pos:g.position.clone()}; artGroups.push(g);

  /* what this exhibit asks of the wall around it */
  const m=ART_LUM[src]||[0.50,0.25];
  const vT=vForY(u,side,y+h/2), vB=vForY(u,side,y-h/2);
  artFields.push({
    u, v, hu:(w/2)/LEN, hv:Math.abs(vT-vB)/2,
    /* darker work -> lighter wall, brighter work -> deeper wall */
    tone: clamp(0.34*(0.52-m[0]), -0.17, 0.12),
    /* and a saturated one gets a neutral ground */
    neut: clamp((m[1]-0.34)/0.45, 0, 1)
  });
}
/* the entrance chamber holds the first works; the curving gallery holds the rest */
hangArt('a2.jpg',0.8,2.5,0.0099,1);
hangArt('a1.jpg',1.667,1.9,0.0298,-1);
hangArt('truck.jpg',1.499,2.0,0.0496,1);
hangArt('cricket.jpg',1.664,2.1,0.0695,-1);
hangArt('a9.jpg',1.57,1.5,0.0894,1,2.2);
hangArt('a3.jpg',0.8,1.8,0.1092,-1,2.2);
hangArt('paperbag.jpg',1.687,2.2,0.1291,1);
hangArt('heroslider.jpg',1.723,2.0,0.2195,-1);
hangArt('a4.jpg',0.8,2.2,0.2365,1);
hangArt('solvecube.jpg',1.778,1.9,0.2535,-1);
hangArt('a11.jpg',0.821,2.4,0.2705,1);
hangArt('a13.jpg',0.984,2.2,0.4995,-1);
hangArt('a14.jpg',0.999,2.2,0.5165,1);
hangArt('layer.jpg',1.777,1.7,0.5335,-1);
hangArt('sloka.jpg',0.8,2.6,0.5505,1);
hangArt('a10.jpg',0.797,2.4,0.6415,-1);
hangArt('frame-a.jpg',1.6,2.0,0.6625,1);
hangArt('a6.jpg',1.048,3.0,0.6835,-1,2.9);   /* hero — the mural */
hangArt('a15.jpg',1.778,1.8,0.7757,1);
hangArt('a5.jpg',0.8,2.0,0.7950,-1);
hangArt('cherrypickers.jpg',1.599,2.2,0.8143,1);
hangArt('a7.jpg',1.667,1.9,0.9064,-1);
hangArt('frame-b.jpg',1.6,2.1,0.9272,1);
hangArt('frame-c.jpg',1.646,2.0,0.9480,-1);
hangArt('a12.jpg',0.71,2.4,0.9688,1);
hangArt('a8.jpg',0.784,2.5,0.9896,-1);

/* ---- the modulation map ----------------------------------------------
   One texture over the shell's own parametrisation. Around each exhibit it
   quiets the plaster (less grain, no striation, fewer tonal swings), sets the
   wall's local value from that work's brightness, pulls the warmth if the
   work is strongly coloured, and lays a tight contact shadow where the frame
   meets the wall. The falloff is a rounded superellipse with a long taper, so
   the quiet area blends out rather than showing as a rectangle behind the
   picture. */
{
  const MW=LOWPOWER?256:512, MH=LOWPOWER?96:192, TAU=Math.PI*2;
  const data=new Uint8Array(MW*MH*4), wbuf=new Float32Array(MW*MH);
  for(let i=0;i<MW*MH;i++) data[i*4]=128;           /* neutral tone */
  for(const F of artFields){
    const cx=F.u*MW, cy=((F.v+Math.PI/2)/TAU)*MH;
    const hx=Math.max(F.hu*MW,1.5), hy=Math.max((F.hv/TAU)*MH,1.5);
    const RX=hx*2.7, RY=hy*2.5;
    for(let y=Math.floor(cy-RY)-1;y<=Math.ceil(cy+RY)+1;y++){
      const yy=((y%MH)+MH)%MH;
      for(let x=Math.max(0,Math.floor(cx-RX)-1);x<=Math.min(MW-1,Math.ceil(cx+RX)+1);x++){
        const dx=(x+.5-cx)/RX, dy=(y+.5-cy)/RY;
        const d=Math.pow(Math.pow(Math.abs(dx),2.4)+Math.pow(Math.abs(dy),2.4),1/2.4);
        if(d>=1) continue;
        const k=1-smooth(clamp((d-.10)/.90,0,1));
        const idx=yy*MW+x, o=idx*4;
        /* the nearest exhibit owns the tone, so two frames never sum into a
           darker patch where their fields overlap */
        if(k>wbuf[idx]){ wbuf[idx]=k; data[o]=Math.round(clamp(128+F.tone*127*k,0,255)); }
        data[o+1]=Math.max(data[o+1], Math.round(k*255));
        data[o+3]=Math.max(data[o+3], Math.round(F.neut*k*255));
        /* contact shadow: a tight band hugging the frame, heavier underneath */
        const er=Math.pow(Math.pow(Math.abs((x+.5-cx)/(hx*1.14)),3.0)
                         +Math.pow(Math.abs((y+.5-cy)/(hy*1.14)),3.0),1/3.0);
        if(er>1.0&&er<2.0){
          const s=1-smooth(clamp((er-1)/1.0,0,1));
          data[o+2]=Math.max(data[o+2], Math.round(s*((y+.5>cy)?1:.45)*225));
        }
      }
    }
  }
  const mt2=new THREE.DataTexture(data,MW,MH,THREE.RGBAFormat);
  mt2.wrapS=THREE.ClampToEdgeWrapping; mt2.wrapT=THREE.RepeatWrapping;
  mt2.minFilter=THREE.LinearFilter; mt2.magFilter=THREE.LinearFilter;
  mt2.needsUpdate=true;
  uni.uMod.value.dispose(); uni.uMod.value=mt2;
}
/* two track heads travel with the visitor and light the nearest works */
const artLights=[];
for(let i=0;i<(LOWPOWER?1:2);i++){ const L=new THREE.SpotLight(0xfffaf4,0,22,.5,.8,2); scene.add(L); scene.add(L.target); artLights.push(L); }

/* ============ DIRECTOR ============ */
/* Three bands: the overture holds, then the visitor drifts slowly through
   the entrance chamber while the note is read, then the walk proper. */
const PD=.10, P0=.25, P1=.935, UMAX=.963, UOFF=.012, UB=.035;
const uToP=u=>P0+((u-UOFF-UB)/(UMAX-UB))*(P1-P0);
const pToU=p=> p<P0 ? UOFF+clamp((p-PD)/(P0-PD),0,1)*UB
                    : UOFF+UB+clamp((p-P0)/(P1-P0),0,1)*(UMAX-UB);
for(const W of WORLDS) W.p=uToP(W.def.u);

const acts=[...document.querySelectorAll('.act')].map(el=>{
  const wi=el.dataset.world;
  if(wi!==undefined){
    const i=+wi, W=WORLDS[i], c=W.p;
    /* 04, 05 and 06 stand within a few metres of each other in the void, so a
       fixed window put two placards on screen at once, stacked in the same
       corner. Each placard now yields at the midpoint to its neighbours. */
    const pv=i>0 ? WORLDS[i-1].p : c-.12;
    const nx=i<WORLDS.length-1 ? WORLDS[i+1].p : c+.12;
    const s=Math.max(c-.042, (pv+c)/2+.003);
    const t=Math.min(c+.030, (nx+c)/2-.003);
    el.dataset.s=s.toFixed(4); el.dataset.e=Math.max(t,s+.006).toFixed(4);
    W.plaq=el.querySelector('.plaq');
  }
  return {el,s:+el.dataset.s,e:+el.dataset.e,on:false};
});
const hint=document.getElementById('hint'), soon=document.getElementById('soon');
const whiteout=document.getElementById('whiteout'), veil=document.getElementById('veil');
/* the parting halves are retired: the numeral is the threshold now */
const nav=document.getElementById('nav'), rail=document.getElementById('rail');
const navBtns=[];
WORLDS.forEach((W,i)=>{
  const b=document.createElement('button'); b.type='button'; b.textContent=W.id; if(W.def.open) b.classList.add('open');
  b.title='World '+W.id; b.addEventListener('click',()=>{ const h=document.documentElement.scrollHeight-innerHeight; scrollTo({top:h*(W.p-.004),behavior:'smooth'}); });
  rail.appendChild(b); navBtns.push(b);
  if(i<WORLDS.length-1){ const s=document.createElement('i'); s.innerHTML='<b></b>'; rail.appendChild(s); }
});
const navFills=[...rail.querySelectorAll('i b')];

/* the note's button, and the overture's, aim at real places in the building */
window.__W1P = WORLDS[0].p - .022;
{ const cta=document.getElementById('story-cta');
  if(cta) cta.addEventListener('click',()=>{
    const h=document.documentElement.scrollHeight-innerHeight;
    scrollTo({top:h*window.__W1P, behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
  }); }

let target=0, p=0, mx=0, my=0, smx=0, smy=0;
addEventListener('scroll',()=>{ const h=document.documentElement.scrollHeight-innerHeight; target=h>0?scrollY/h:0; },{passive:true});
addEventListener('resize',()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });

const ray=new THREE.Raycaster(); let hovered=null, knockT=-9;
addEventListener('pointermove',e=>{
  mx=(e.clientX/innerWidth-.5)*2; my=(e.clientY/innerHeight-.5)*2;
  ray.setFromCamera({x:mx,y:-my},camera);
  const hit=ray.intersectObjects(clickables,false)[0];
  hovered=hit?hit.object:null;
  const cl=document.body.classList; cl.remove('cur-w01','cur-w02','cur-w03','cur-soon'); document.body.style.cursor='';
  if(hovered&&hovered.userData.kind==='door') cl.add(hovered.userData.W.def.cur);
  else if(hovered&&hovered.userData.kind==='sealed') cl.add('cur-soon');
  else if(hovered&&hovered.userData.kind==='door7') document.body.style.cursor='pointer';
},{passive:true});

/* ============ SOUND — a vast quiet interior, generated, never theatrical ============ */
let AC=null, snd=null;
const sndBtn=document.getElementById('snd');
function makeSound(){
  AC=new (window.AudioContext||window.webkitAudioContext)();
  const master=AC.createGain(); master.gain.value=0; master.connect(AC.destination);
  /* air: brown noise, low-passed */
  const N=AC.sampleRate*4, buf=AC.createBuffer(1,N,AC.sampleRate), d=buf.getChannelData(0);
  let last=0; for(let i=0;i<N;i++){ const w=Math.random()*2-1; last=(last+.02*w)/1.02; d[i]=last*3.5; }
  const noise=AC.createBufferSource(); noise.buffer=buf; noise.loop=true;
  const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=240;
  const airG=AC.createGain(); airG.gain.value=.34; noise.connect(lp); lp.connect(airG); airG.connect(master); noise.start();
  /* structural hum */
  const hum=AC.createOscillator(); hum.frequency.value=52; const humG=AC.createGain(); humG.gain.value=.030; hum.connect(humG); humG.connect(master); hum.start();
  const hum2=AC.createOscillator(); hum2.frequency.value=78.3; const hum2G=AC.createGain(); hum2G.gain.value=.013; hum2.connect(hum2G); hum2G.connect(master); hum2.start();
  /* world signatures, each almost inaudible until you are close */
  const sig=[];
  { const o=AC.createOscillator(); o.type='square'; o.frequency.value=440; const g=AC.createGain(); g.gain.value=0;
    const lfo=AC.createOscillator(); lfo.frequency.value=2.5; const lg=AC.createGain(); lg.gain.value=1; lfo.connect(lg); lg.connect(g.gain);
    const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=1200; o.connect(f); f.connect(g); g.connect(master); o.start(); lfo.start(); sig.push({g,k:.012}); }
  { const o=AC.createOscillator(); o.type='sine'; o.frequency.value=1760; const g=AC.createGain(); g.gain.value=0;
    const lfo=AC.createOscillator(); lfo.frequency.value=.3; const lg=AC.createGain(); lg.gain.value=40; lfo.connect(lg); lg.connect(o.frequency);
    o.connect(g); g.connect(master); o.start(); lfo.start(); sig.push({g,k:.01}); }
  { const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=700; bp.Q.value=.8; const g=AC.createGain(); g.gain.value=0;
    const lfo=AC.createOscillator(); lfo.frequency.value=.11; const lg=AC.createGain(); lg.gain.value=350; lfo.connect(lg); lg.connect(bp.frequency);
    noise.connect(bp); bp.connect(g); g.connect(master); lfo.start(); sig.push({g,k:.25}); }
  /* ---- Bach, Prelude No. 1 in C, BWV 846 — public domain. Each bar is the
     same broken-chord figure over a changing harmony, which is why it suits a
     room you walk through: it never arrives anywhere, it just keeps turning.
     Played on a soft triangle voice with a long tail, well under the air. ---- */
  const BARS=[
    [48,52,55,60,64],[48,50,57,62,65],[47,50,55,62,65],[48,52,55,60,64],
    [48,52,57,64,69],[48,50,54,57,62],[47,50,55,62,67],[47,48,52,55,60],
    [45,48,52,55,60],[38,45,50,54,60],[43,47,50,55,59],[43,46,52,55,61],
    [41,45,50,57,62],[41,44,50,53,59],[40,43,48,55,60],[40,41,45,48,53]];
  const musG=AC.createGain(); musG.gain.value=.30;
  const musLP=AC.createBiquadFilter(); musLP.type='lowpass'; musLP.frequency.value=2600;
  /* a long slap back into the hall, so it sounds played in the space */
  const dly=AC.createDelay(2.0); dly.delayTime.value=.42;
  const fb=AC.createGain(); fb.gain.value=.34;
  const wet=AC.createGain(); wet.gain.value=.5;
  musG.connect(musLP); musLP.connect(master);
  musLP.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(master);
  const STEP=.276;                                  /* one semiquaver */
  const FIG=[0,1,2,3,4,2,3,4];                      /* the figure, twice a bar */
  function note(midi,at){
    const f=440*Math.pow(2,(midi-69)/12);
    const o=AC.createOscillator(); o.type='triangle'; o.frequency.value=f;
    const g=AC.createGain();
    g.gain.setValueAtTime(0,at);
    g.gain.linearRampToValueAtTime(.16,at+.012);
    g.gain.exponentialRampToValueAtTime(.0008,at+1.5);
    o.connect(g); g.connect(musG); o.start(at); o.stop(at+1.6);
  }
  let step=0, nextAt=AC.currentTime+.4;
  function pump(){
    if(!snd||!snd.on){ nextAt=Math.max(nextAt,AC.currentTime+.4); return; }
    while(nextAt<AC.currentTime+1.2){
      const bar=BARS[Math.floor(step/16)%BARS.length];
      note(bar[FIG[step%8]],nextAt);
      nextAt+=STEP; step++;
    }
  }
  setInterval(pump,220);
  snd={master,sig,on:false};
}
sndBtn.addEventListener('click',()=>{
  if(!AC) makeSound();
  if(AC.state==='suspended') AC.resume();
  snd.on=!snd.on;
  snd.master.gain.setTargetAtTime(snd.on?.9:0, AC.currentTime, .8);
  sndBtn.textContent=snd.on?'SOUND · ON':'SOUND · OFF'; sndBtn.setAttribute('aria-pressed',snd.on);
});

/* ============ TRANSITIONS — the camera travels into the world ============ */
let trans=null;
/* Coming back from a world: the entry transition pinned camLook twelve units
   behind the doorway and nothing ever released it, so the corridor returned
   facing the wall it had just gone through. Drop the transition, lift the
   veil, and snap to the restored scroll rather than replaying the whole walk
   from the entrance. */
addEventListener('pageshow',function(){
  trans=null;
  if(typeof veil!=='undefined'&&veil) veil.style.opacity='0';
  const h=document.documentElement.scrollHeight-innerHeight;
  target=h>0?scrollY/h:0; p=target;
});
function enterWorld(W){
  /* A world opens in its own tab, so the corridor is never left and there is
     nothing to come back to. The open has to happen inside the click itself —
     fired later, from the end of a transition, a browser treats it as a popup
     and blocks it. So there is no cinematic entry any more: the tab is the
     entry, and this window stays exactly where the visitor left it. */
  window.open(W.def.href,'_blank','noopener');
  document.body.classList.remove('cur-w01','cur-w02','cur-w03');
}
addEventListener('click',e=>{
  if(trans) return;
  ray.setFromCamera({x:(e.clientX/innerWidth)*2-1,y:-((e.clientY/innerHeight)*2-1)},camera);
  const hit=ray.intersectObjects(clickables,false)[0]; if(!hit) return;
  const u=hit.object.userData;
  if(u.kind==='door') enterWorld(u.W);
  else if(u.kind==='sealed'||u.kind==='door7'){
    knockT=clock.elapsedTime;
    soon.textContent=u.kind==='door7'?'soon. (knock again.)':'soon.';
    soon.style.left=(e.clientX+14)+'px'; soon.style.top=(e.clientY-10)+'px';
    soon.classList.add('on'); setTimeout(()=>soon.classList.remove('on'),1100);
  }
});

/* ============ FRAME ============ */
const clock=new THREE.Clock();
const camLook=new THREE.Vector3(), camPos=new THREE.Vector3(), tmpV=new THREE.Vector3();
const cf={}, lf={};
let lastArt=[];
function frame(){
  requestAnimationFrame(frame);
  const t=clock.elapsedTime, dt=Math.min(.05,clock.getDelta());
  p+=(target-p)*(1-Math.pow(.0015,dt));      /* inertia, frame-rate independent */
  smx+=(mx-smx)*.05; smy+=(my-smy)*.05;
  uni.uTime.value=t;

  /* The way in is now the numeral itself: the visitor passes through the 7,
     so the corridor must already be standing behind it. The parting halves
     and their line of light are superseded — two thresholds in three seconds
     read as a stutter, and the halves would have shown black through the
     counter of the 7 exactly when the corridor should be visible. */

  /* walk */
  const creep=.006*sstep(.09,.12,p);
  const u=pToU(p)+creep;
  frameAt(u,cf);
  camPos.copy(cf.P).addScaledVector(UP,1.6-smy*.12).addScaledVector(cf.R,smx*.35);
  /* look ahead along the path; the road bends, so the look point bends with it */
  frameAt(Math.min(1,u+.028),lf);
  camLook.copy(lf.P).addScaledVector(UP,1.75-smy*.5).addScaledVector(cf.R,smx*1.0);
  /* turn toward each world as it arrives */
  let nearest=null, nd=1;
  for(const W of WORLDS){
    const d=(p-W.p);
    const w=sstep(-.05,-.018,d)*(1-sstep(.012,.03,d));
    W.face=w;
    if(w>0){ camLook.lerp(W.point, w*(W.def.type==='below'?.55:.62)); }
    const prox=1-clamp(Math.abs(d)/.05,0,1); W.prox=prox;
    if(Math.abs(d)<nd){ nd=Math.abs(d); nearest=W; }
  }
  /* the compression: the visitor is made to stoop */
  camPos.y-=.35*sstep(.62,.65,u)*(1-sstep(.70,.73,u));

  if(trans&&!trans.done){
    const k=clamp((t-trans.t0)/trans.dur,0,1), e=smooth(k), W=trans.W;
    const into=W.point.clone().addScaledVector(W.normal,-3.2*e);
    if(W.def.kind==='pixel'){       /* the slit widens; steps quantise as the pixels take over */
      const st=1+Math.floor(e*6)*.0; camPos.lerp(into,e); camera.fov=trans.fov+40*e*e;
      camPos.x=Math.round(camPos.x/(.02+.12*e))*(.02+.12*e);
    } else if(W.def.kind==='chrome'){ /* dip beneath the peel and slide under */
      camPos.lerp(into,e); camPos.y-=1.1*Math.sin(e*Math.PI); camera.fov=trans.fov+18*e; camera.rotation.z=.12*Math.sin(e*Math.PI);
    } else {                        /* light consumes the frame */
      camPos.lerp(into,e*.8); camera.fov=trans.fov-10*e;
    }
    camera.updateProjectionMatrix();
    camLook.copy(W.point).addScaledVector(W.normal,-12);
    veil.style.opacity=sstep(.55,1,k).toFixed(3);
    if(k>=1){ trans.done=true; trans.t0=1e9; veil.style.opacity='0'; }
  }
  camera.position.copy(camPos); camera.lookAt(camLook);
  if(trans&&!trans.done&&trans.W.def.kind==='chrome'){ camera.rotateZ(.12*Math.sin(clamp((t-trans.t0)/trans.dur,0,1)*Math.PI)); }

  /* the worlds leak: colour, light, sound, motes */
  for(const W of WORLDS){
    const pr=W.prox, d=W.def;
    if(W.light) W.light.intensity=(d.open?70:d.type==='below'?60:30)*(d.type==='wall'?pr*pr:Math.max(.25,pr));
    poolCol[W.pool].w=(d.open?.55:.28)*pr*pr;
    if(W.plaq){ W.plaq.classList.toggle('near',pr>.55); W.plaq.classList.toggle('tint',pr>.2); }
    if(W.inLight) W.inLight.intensity=2+8*pr;
    if(W.pic){ if(d.kind==='pixel') W.pic.material.map.offset.x=t*.03; if(d.kind==='chrome') W.pic.material.map.offset.y=-t*.05; }
    if(W.debris){
      for(const m of W.debris){ const u2=m.userData;
        if(d.kind==='pixel'){ const st=.2, qz=v=>Math.round(v/st)*st; const rise=(t*.15*u2.sp+u2.ph/6.283)%1;
          m.position.set(qz(Math.sin(u2.ph*3)*u2.rr), qz(-d.rc*.7+rise*d.rc*1.4), qz(-u2.dp));
          m.rotation.set(0,Math.floor(t*1.6+u2.ph)*Math.PI/2,0); m.material.opacity=Math.min(1,6*Math.min(rise,1-rise))*(.3+.7*pr); }
        else if(d.kind==='chrome'){ const sp=t*.17+u2.ph;
          m.position.set(Math.cos(sp)*u2.rr, Math.sin(sp*.78)*d.rc*.6, -u2.dp+Math.sin(sp*.55)*.3); m.rotateOnAxis(u2.ax,.013*u2.sp); m.material.opacity=.3+.7*pr; }
        else { const fall=(t*.05*u2.sp+u2.ph/6.283)%1;
          m.position.set(Math.sin(u2.ph*5)*u2.rr+Math.sin(t*.45+u2.ph)*.2, d.rc*.9-fall*d.rc*1.8, -u2.dp+Math.cos(t*.28+u2.ph)*.3);
          m.rotateOnAxis(u2.ax,.0045*u2.sp); m.material.opacity=Math.min(1,7*Math.min(fall,1-fall))*(.3+.7*pr); }
      }
    }
    if(W.motes){
      for(const M of [W.motes,W.fog]){ const arr=M.mg.attributes.position.array, isFog=M===W.fog;
        for(let i=0;i<M.N;i++){ const k=(t*(isFog?.04:.08)+M.off[i])%1;
          arr[i*3]=M.dx[i]+Math.sin(t*.7+i)*.2; arr[i*3+1]=M.dy[i]+Math.sin(t*.5+i*2)*.3-(isFog?d.rc*.5:0); arr[i*3+2]=-1+k*(isFog?7:6); }
        M.mg.attributes.position.needsUpdate=true;
        M.pts.material.opacity=(isFog?.16:.85)*(.25+.75*pr); }
    }
    if(W.door7){
      /* arriving does not open it; it brings the invitation up on its face */
      document.documentElement.classList.toggle('door7-open',sstep(.35,.75,pr)>.5);
    }
    if(W.sill){ const kn=Math.max(0,1-(t-knockT)*1.4);
      W.sill.material.opacity=.75+.2*Math.sin(t*2.2)+kn*(Math.random()<.5?-.5:.3); W.sillGlow.material.opacity=.75+kn*.4*Math.random(); }
    if(W.slab&&W.slabBase){ const k=(hovered===W.slab)?1.04:1;
      W.slab.scale.x+=(W.slabBase.x*k-W.slab.scale.x)*.1;
      W.slab.scale.y+=(W.slabBase.y*k-W.slab.scale.y)*.1; }
  }
  if(snd&&snd.on){ snd.sig[0].g.gain.value=snd.sig[0].k*Math.pow(WORLDS[0].prox,2);
    snd.sig[1].g.gain.value=snd.sig[1].k*Math.pow(WORLDS[1].prox,2); snd.sig[2].g.gain.value=snd.sig[2].k*Math.pow(WORLDS[2].prox,2); }

  /* the picture lights follow */
  lastArt.length=0;
  for(const g of artGroups){ const a=g.userData.art; const dd=a.pos.distanceTo(camera.position); if(dd<26) lastArt.push({dd,g}); }
  lastArt.sort((A,B)=>A.dd-B.dd);
  for(let i=0;i<artLights.length;i++){ const L=artLights[i];
    if(i>=lastArt.length){ L.intensity=0; continue; }
    const g=lastArt[i].g, a=g.userData.art; const N=g.getWorldDirection(tmpV);
    L.position.copy(a.pos).addScaledVector(N,2.6).addScaledVector(UP,4.2); L.target.position.copy(a.pos); L.target.updateMatrixWorld();
    L.intensity=140*Math.max(0,1-Math.max(0,lastArt[i].dd-10)/16); }
  for(const c of clickables){ if(c.userData.kind==='art'){ const want=(hovered===c)?1.02:1; const g=c.userData.grp; g.scale.x+=(want-g.scale.x)*.12; g.scale.y+=(want-g.scale.y)*.12; } }

  /* overlays */
  for(const a of acts){ const on=p>=a.s&&p<a.e; if(on!==a.on){ a.on=on; a.el.classList.toggle('active',on); } }
  whiteout.style.opacity=sstep(.93,.955,p).toFixed(3);
  hint.classList.toggle('off', p<.272||p>=.335);
  nav.classList.toggle('on', p>.262&&p<.93);
  for(let i=0;i<navBtns.length;i++){ navBtns[i].classList.toggle('on', WORLDS[i]===nearest && nd<.06); }
  for(let i=0;i<navFills.length;i++){ const a=WORLDS[i].p, b=WORLDS[i+1].p; navFills[i].style.width=(clamp((p-a)/(b-a),0,1)*100).toFixed(1)+'%'; }
  /* a walk begins at the first world */
  if(navFills.length){ /* before world 01 the rail fills from the entrance */ }

  renderer.render(scene,camera);
}
frame();
document.documentElement.classList.add('gl-ready');

