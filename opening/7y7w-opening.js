/* 7Y7W opening, revision 2. The approved chrome artwork is the hero in every frame. */
const ASSETS = {
  chrome: new URL('./assets/chrome-seven.png', import.meta.url).href,
  poppins: new URL('./fonts/Poppins-SemiBold.ttf', import.meta.url).href,
  jost: new URL('./fonts/Jost-Variable.ttf', import.meta.url).href,
  mono: new URL('./fonts/IBMPlexMono-Medium.ttf', import.meta.url).href,
};
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const x = clamp((v - a) / (b - a)); return x * x * (3 - 2 * x); };
const easeOut = v => 1 - (1 - clamp(v)) ** 3;
let fontTask;
function loadFonts() {
  return fontTask ||= Promise.allSettled([
    ['Y7WPoppins', ASSETS.poppins, '600'], ['Y7WJost', ASSETS.jost, '100 900'], ['Y7WMono', ASSETS.mono, '500'],
  ].map(async ([family, url, weight]) => {
    const face = new FontFace(family, `url("${url}")`, { weight, display: 'swap' });
    document.fonts.add(face);
    await face.load();
  }));
}
const styles = `
  :host { display:block; position:relative; height:var(--y7w-total-height,210svh); isolation:isolate; background:#f6f3ee; color:#191a1b; --y7w-paper:#f6f3ee; --y7w-accent:#975017; font-synthesis:none; -webkit-font-smoothing:antialiased; }
  :host([hidden]) { display:none !important; }
  :host([scroll-mode="external"]),:host([static]),:host(.reduced) { height:100svh; }
  *,*::before,*::after { box-sizing:border-box; }
  .viewport { position:sticky; top:0; width:100%; height:100svh; overflow:hidden; background:#000; isolation:isolate; }
  .ambient { position:absolute; inset:0; background:var(--y7w-paper); opacity:var(--ambient,0); }
  .ambient::after { content:''; position:absolute; inset:0; background:radial-gradient(ellipse at 47% 37%,#fffdf9 0%,#f8f5f0 48%,#f1ede7 100%); opacity:var(--atmosphere,1); }
  .stage { position:absolute; width:min(100%,177.6833svh); aspect-ratio:1672/941; top:50%; left:50%; transform:translate(-50%,-50%); container-type:inline-size; }
  .art { position:absolute; left:50.83735%; top:10.4145%; width:35.1675%; aspect-ratio:1118/1407; transform:translateX(-50%) translateY(var(--art-y,0%)) scale(var(--art-scale,1.035)) rotate(var(--art-angle,0deg)); transform-origin:44% 87%; opacity:var(--art-opacity,0); pointer-events:none; }
  .chrome,.sheen { position:absolute; display:block; width:100%; height:100%; object-fit:contain; }
  .chrome { filter:brightness(var(--exposure,1)); }
  .sheen { filter:brightness(1.35) saturate(.55); opacity:var(--sheen,0); mask-image:linear-gradient(to bottom,transparent calc(var(--light,-20%) - 25%),#000 var(--light,-20%),transparent calc(var(--light,-20%) + 30%)); -webkit-mask-image:linear-gradient(to bottom,transparent calc(var(--light,-20%) - 25%),#000 var(--light,-20%),transparent calc(var(--light,-20%) + 30%)); }
  .ground { position:absolute; left:17%; top:92.1%; width:82%; height:1.3%; background:radial-gradient(ellipse,#3e37302d 0%,#3e37300b 48%,transparent 73%); transform:translateY(-50%); filter:blur(1.3px); opacity:var(--ground,0); }
  .reflection { position:absolute; left:0; top:92.1%; width:100%; height:8%; overflow:hidden; opacity:var(--reflection,0); mask-image:linear-gradient(#000,transparent); -webkit-mask-image:linear-gradient(#000,transparent); }
  .reflection img { position:absolute; width:100%; height:auto; top:0; transform:translateY(-92.1%) scaleY(-1); transform-origin:50% 92.1%; filter:blur(4px); }
  .studio { position:absolute; z-index:2; top:3.65%; left:0; width:100%; margin:0; text-align:center; color:#686868; font:600 1.4354cqw/1.35 Y7WPoppins,Poppins,sans-serif; letter-spacing:0; opacity:var(--studio,0); transform:translateY(var(--studio-y,7px)); }
  .word { position:absolute; z-index:2; margin:0; font:500 3.7081cqw/1.15 Y7WJost,Jost,sans-serif; letter-spacing:.19em; }
  .years { left:8.97%; top:59.61%; opacity:var(--years,0); transform:translate(var(--years-x,0cqw),var(--years-y,12px)) rotate(var(--years-angle,0deg)); }
  .worlds { left:73.8%; top:22.32%; opacity:var(--worlds,0); transform:translate(var(--worlds-x,0cqw),var(--worlds-y,12px)) rotate(var(--worlds-angle,0deg)); }
  .copy { position:absolute; z-index:2; top:86.71%; left:8%; width:84%; margin:0; text-align:center; font:400 1.9139cqw/1.3 Y7WJost,Jost,sans-serif; opacity:var(--copy,0); transform:translateY(var(--copy-y,8px)); }
  button { -webkit-appearance:none; appearance:none; position:absolute; z-index:3; top:92.21%; left:50%; transform:translate(-50%,var(--button-y,6px)); min-width:170px; min-height:44px; margin:0; padding:.2em .5em 1em; border:0; border-radius:0; background:transparent; color:var(--y7w-accent); font:500 max(12px,.9569cqw)/1.2 Y7WMono,'IBM Plex Mono',monospace; letter-spacing:.22em; white-space:nowrap; cursor:pointer; opacity:var(--button,0); touch-action:manipulation; }
  button::after { content:''; position:absolute; bottom:.2em; left:50%; width:4.8em; height:1px; background:currentColor; transform:translateX(-50%); transition:width 180ms ease; }
  button:hover::after { width:7em; }
  button:focus-visible { outline:2px solid currentColor; outline-offset:5px; }
  button:disabled { cursor:default; pointer-events:none; }
  .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; margin:-1px; }
  .stage.portrait { width:100%; height:100%; aspect-ratio:auto; }
  .portrait .studio { top:max(29px,env(safe-area-inset-top)); padding:0 18px; font-size:clamp(14px,4cqw,20px); }
  .portrait .art { width:min(83%,47svh); left:50%; top:20%; }
  .portrait .word { font-size:clamp(18px,5.15cqw,36px); letter-spacing:.16em; }
  .portrait .years { left:5.5%; top:55.5%; }
  .portrait .worlds { left:auto; right:6%; top:16%; }
  .portrait .copy { top:auto; bottom:14%; left:8%; width:84%; font-size:clamp(19px,5.45cqw,31px); line-height:1.35; text-wrap:balance; }
  .portrait button { top:auto; bottom:max(5.2%,env(safe-area-inset-bottom)); font-size:12px; }
  .portrait .reflection { opacity:calc(var(--reflection,0) * .6); }
  .compact .art { width:32%; top:9%; }
  .compact .studio { font-size:max(11px,1.4354cqw); }
  .compact .copy { top:80.5%; font-size:max(13px,1.9139cqw); }
  .compact button { top:auto; bottom:1%; }
  :host(.asset-error) .chrome,:host(.asset-error) .sheen,:host(.asset-error) .reflection { display:none; }
  .replacement { display:none; margin:0; color:#555b61; font:500 48cqw/.92 Y7WJost,sans-serif; }
  :host(.asset-error) .replacement { display:block; text-align:center; }
  .portrait .replacement { font-size:94cqw; }
  @media(prefers-reduced-motion:reduce) { *,*::before,*::after { transition:none !important; } }
`;

export class SevenWorldsOpening extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode:'open' });
    this.shadowRoot.innerHTML = `<style>${styles}</style>
      <section class="viewport" aria-label="7 years, 7 worlds">
        <div class="ambient" aria-hidden="true"></div>
        <div class="stage">
          <div class="art" aria-hidden="true">
            <div class="ground"></div>
            <div class="reflection"><img src="${ASSETS.chrome}" alt="" width="1118" height="1407"></div>
            <img class="chrome" src="${ASSETS.chrome}" alt="" width="1118" height="1407" fetchpriority="high">
            <img class="sheen" src="${ASSETS.chrome}" alt="" width="1118" height="1407">
            <span class="replacement">7</span>
          </div>
          <p class="studio">Studio How About That!</p>
          <h1 class="sr">7 years. 7 worlds.</h1>
          <p class="word years" aria-hidden="true">YEARS</p>
          <p class="word worlds" aria-hidden="true">WORLDS</p>
          <p class="copy">An ode to the worlds we've drawn inspiration from</p>
          <button type="button" disabled>STEP INSIDE <span aria-hidden="true">→</span></button>
        </div>
      </section>`;
    this._viewport=this.shadowRoot.querySelector('.viewport');
    this._stage=this.shadowRoot.querySelector('.stage');
    this._button=this.shadowRoot.querySelector('button');
    this._draw=this._draw.bind(this);
    this._wake=this._wake.bind(this);
  }

  connectedCallback() {
    if(this._active)return;
    this._active=true;
    this._generation=(this._generation||0)+1;
    this._abort=new AbortController();
    this._progress=0; this._target=0; this._intro=0; this._entered=false;
    this._visible=true; this._raf=0; this._lastTime=0; this._ready=false;
    this._revealed=false; this._fast=null; this._exit=null;
    const duration=Number(this.getAttribute('reveal-duration'));
    const distance=Number(this.getAttribute('scroll-length'));
    this._duration=clamp(Number.isFinite(duration)&&duration>0?duration:2600,500,10000);
    this._distance=clamp(Number.isFinite(distance)&&distance>0?distance:1.1,.5,5);
    this._reduced=matchMedia('(prefers-reduced-motion: reduce)');
    this._static=this.hasAttribute('static')||this._reduced.matches;
    this._external=this.getAttribute('scroll-mode')==='external';
    this.classList.toggle('reduced',this._reduced.matches);
    const signal=this._abort.signal;
    this._button.addEventListener('click',()=>this._enter('button'),{signal});
    window.addEventListener('scroll',()=>{this._measureProgress();this._wake();},{passive:true,signal});
    window.addEventListener('resize',()=>this._resize(),{passive:true,signal});
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden)this._pausedAt=performance.now();
      else {
        const pause=this._pausedAt?performance.now()-this._pausedAt:0;
        this._started+=pause;
        if(this._fast)this._fast.start+=pause;
        if(this._exit)this._exit.start+=pause;
        this._pausedAt=0; this._wake();
      }
    },{signal});
    this._reduced.addEventListener('change',e=>{
      if(e.matches){
        this._static=true; this.classList.add('reduced');
        this._progress=0; this._target=0;
        const exiting=this._exit; this._exit=null;
        this.finishReveal(); this._resize();
        if(exiting)this._commitEntry('button');
      }
    },{signal});
    this._resizeObserver=new ResizeObserver(()=>this._resize());
    this._resizeObserver.observe(this._viewport);
    this._intersection=new IntersectionObserver(entries=>{
      this._visible=entries[0].isIntersecting;
      if(this._visible)this._wake();
      else {cancelAnimationFrame(this._raf);this._raf=0;}
    },{rootMargin:'100px'});
    this._intersection.observe(this);
    this._resize(); this._paint(this._static?1:0,0);
    this._boot(this._generation);
  }

  async _boot(generation) {
    const artwork=this.shadowRoot.querySelector('.chrome');
    const decode=artwork.decode().catch(()=>{
      if(this._active&&generation===this._generation){
        this.classList.add('asset-error');
        this.dispatchEvent(new CustomEvent('y7w:fallback',{bubbles:true,composed:true,detail:{reason:'Artwork unavailable'}}));
      }
    });
    // Fonts can finish in the background on an unusually slow connection.
    await Promise.all([decode,Promise.race([loadFonts(),new Promise(resolve=>setTimeout(resolve,1200))])]);
    if(!this._active||generation!==this._generation)return;
    this._started=performance.now(); this._ready=true;
    if(this._static)this.finishReveal();
    this._measureProgress(); this._wake();
    this.dispatchEvent(new CustomEvent('y7w:ready',{bubbles:true,composed:true,detail:{mode:this._static?'static':'artwork'}}));
  }

  _resize() {
    if(!this._active)return;
    const {clientWidth:width,clientHeight:height}=this._viewport;
    if(!width||!height)return;
    this._stage.classList.toggle('portrait',width/height<.88);
    this._stage.classList.toggle('compact',height<500&&width/height>=.88);
    this._range=height*this._distance;
    this.style.setProperty('--y7w-total-height',`${this._external||this._static?height:height+this._range}px`);
    this._measureProgress(); this._wake();
  }

  _measureProgress() {
    if(this._external||this._static||this._exit)return;
    this._target=clamp(-this.getBoundingClientRect().top/Math.max(1,this._range));
    if(this._target<.9)this._entered=false;
    if(this._target>.015)this._accelerateReveal();
  }

  _accelerateReveal() {
    if(this._intro<1&&this._ready&&!this._fast)this._fast={from:this._intro,start:performance.now()};
  }

  _wake() {
    if(this._active&&this._ready&&this._visible&&!document.hidden&&!this._raf)this._raf=requestAnimationFrame(this._draw);
  }

  _draw(now) {
    this._raf=0;
    if(!this._active||!this._visible||document.hidden)return;
    const dt=this._lastTime?Math.min(64,now-this._lastTime):16;
    this._lastTime=now;
    this._intro=this._static?1:this._fast
      ?this._fast.from+(1-this._fast.from)*smooth(0,420,now-this._fast.start)
      :clamp((now-this._started)/this._duration);
    if(this._exit){
      const exit=easeOut((now-this._exit.start)/720);
      this._progress=this._exit.from+(1-this._exit.from)*exit;
      this._target=this._progress;
    }else{
      this._progress+=(this._target-this._progress)*(1-Math.exp(-dt/75));
      if(Math.abs(this._target-this._progress)<.0002)this._progress=this._target;
    }
    const p=this._static?0:this._progress;
    this._paint(this._intro,p);
    if(this._intro===1&&!this._revealed){
      this._revealed=true;
      this.dispatchEvent(new CustomEvent('y7w:revealed',{bubbles:true,composed:true}));
    }
    if(p>=.9998&&this._intro===1&&!this._entered){
      const source=this._exit?'button':'scroll';
      this._exit=null; this._commitEntry(source);
    }
    if(this._intro<1||this._exit||Math.abs(this._target-this._progress)>.0001)this._wake();
  }

  _paint(r,p) {
    const movement=smooth(.06,.88,p), out=smooth(.57,1,p);
    const studio=smooth(.55,.81,r)*(1-smooth(.35,.74,p));
    const years=smooth(.58,.85,r)*(1-smooth(.32,.77,p));
    const worlds=smooth(.62,.89,r)*(1-smooth(.37,.82,p));
    const copy=smooth(.70,.94,r)*(1-smooth(.22,.64,p));
    const button=smooth(.79,1,r)*(1-smooth(.13,.52,p));
    const values={
      ambient:smooth(.29,.76,r), atmosphere:1-smooth(.65,1,p),
      'art-opacity':smooth(.055,.36,r)*(1-out),
      exposure:.06+.94*smooth(.10,.51,r),
      sheen:smooth(.06,.17,r)*(1-smooth(.32,.58,r))*.52,
      light:`${-8+smooth(.045,.57,r)*126}%`,
      'art-scale':1+.035*(1-smooth(.1,.85,r))+.075*movement,
      'art-y':`${-2.5*movement}%`, 'art-angle':`${-3.5*movement}deg`,
      ground:smooth(.42,.78,r)*(1-movement*.75),
      reflection:smooth(.5,.82,r)*.10*(1-movement),
      studio, 'studio-y':`${(1-smooth(.55,.81,r))*7}px`,
      years, 'years-x':`${-2.5*movement}cqw`, 'years-y':`${(1-smooth(.58,.85,r))*12-18*movement}px`, 'years-angle':`${-3*movement}deg`,
      worlds, 'worlds-x':`${2.1*movement}cqw`, 'worlds-y':`${(1-smooth(.62,.89,r))*12+12*movement}px`, 'worlds-angle':`${3*movement}deg`,
      copy, 'copy-y':`${(1-smooth(.70,.94,r))*8-8*movement}px`,
      button, 'button-y':`${(1-smooth(.79,1,r))*6}px`,
    };
    for(const [name,value] of Object.entries(values))this.style.setProperty(`--${name}`,String(value));
    this._button.disabled=button<.6||!!this._exit;
  }

  _enter(source) {
    if(!this._active||this._exit)return;
    this.finishReveal();
    if(this._static){this._entered=false;this._commitEntry(source);return;}
    this._entered=false;
    this._exit={from:this._progress,start:performance.now()};
    this._wake();
  }

  _commitEntry(source) {
    if(this._entered)return;
    this._entered=true;
    const event=new CustomEvent('y7w:enter',{bubbles:true,composed:true,cancelable:true,detail:{source}});
    if(!this.dispatchEvent(event))return;
    let target;
    try{target=document.querySelector(this.getAttribute('next')||'');}catch{return;}
    if(!target)return;
    if(!target.hasAttribute('tabindex'))target.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
    target.scrollIntoView({behavior:'instant',block:'start'});
  }

  /** Feed the existing site's scroll/timeline value, clamped to 0..1. */
  setProgress(value) {
    const n=Number(value);
    if(!Number.isFinite(n)||this._exit)return;
    this._target=this._static?0:clamp(n);
    if(this._target<.9)this._entered=false;
    if(this._target>0)this._accelerateReveal();
    this._wake();
  }
  /** Settle the opening immediately, retaining scroll progress. */
  finishReveal() {
    this._intro=1; this._started=performance.now()-this._duration; this._fast=null;
    if(this._active)this._paint(1,this._static?0:this._progress);
    this._wake();
  }
  /** Return the host scroll position to the start before calling replay. */
  replay() {
    this._exit=null; this._progress=0; this._target=0; this._entered=false;
    this._intro=this._static?1:0; this._started=performance.now(); this._fast=null; this._revealed=false;
    this._paint(this._intro,0); this._measureProgress(); this._wake();
  }
  destroy() {
    this._active=false; this._generation=(this._generation||0)+1;
    cancelAnimationFrame(this._raf); this._raf=0;
    this._abort?.abort(); this._resizeObserver?.disconnect(); this._intersection?.disconnect();
  }
  disconnectedCallback(){this.destroy();}
}
if(!customElements.get('y7w-opening'))customElements.define('y7w-opening',SevenWorldsOpening);
