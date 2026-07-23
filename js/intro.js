  // ══════════════════════════════════════════
  // TOUCH TEXTURE
  // ══════════════════════════════════════════
  class TouchTexture {
    constructor() {
      this.size = 64; this.width = this.height = 64;
      this.maxAge = 64; this.radius = 0.25 * 64;
      this.speed = 1 / 64; this.trail = []; this.last = null;
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.canvas.height = 64;
      this.ctx = this.canvas.getContext('2d');
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(0,0,64,64);
      this.texture = new THREE.Texture(this.canvas);
    }
    update() {
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(0,0,64,64);
      for (let i = this.trail.length-1; i >= 0; i--) {
        const p = this.trail[i];
        const f = p.force * this.speed * (1 - p.age/this.maxAge);
        p.x += p.vx*f; p.y += p.vy*f; p.age++;
        if (p.age > this.maxAge) { this.trail.splice(i,1); continue; }
        const px = p.x*64, py = (1-p.y)*64;
        let intensity = p.age < this.maxAge*0.3
          ? Math.sin((p.age/(this.maxAge*0.3))*(Math.PI/2))
          : (t => -t*(t-2))(1-(p.age-this.maxAge*0.3)/(this.maxAge*0.7));
        intensity *= p.force;
        const c = `${((p.vx+1)/2)*255},${((p.vy+1)/2)*255},${intensity*255}`;
        const off = 320;
        this.ctx.shadowOffsetX = off; this.ctx.shadowOffsetY = off;
        this.ctx.shadowBlur = this.radius;
        this.ctx.shadowColor = `rgba(${c},${0.2*intensity})`;
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(255,0,0,1)';
        this.ctx.arc(px-off, py-off, this.radius, 0, Math.PI*2);
        this.ctx.fill();
      }
      this.texture.needsUpdate = true;
    }
    addTouch(pt) {
      let force=0, vx=0, vy=0;
      if (this.last) {
        const dx=pt.x-this.last.x, dy=pt.y-this.last.y;
        if (!dx && !dy) return;
        const d=Math.sqrt(dx*dx+dy*dy);
        vx=dx/d; vy=dy/d;
        force=Math.min((dx*dx+dy*dy)*20000, 2.0);
      }
      this.last={x:pt.x,y:pt.y};
      this.trail.push({x:pt.x,y:pt.y,age:0,force,vx,vy});
    }
  }

  // ══════════════════════════════════════════
  // APP
  // ══════════════════════════════════════════
  const renderer = new THREE.WebGLRenderer({ antialias:true, powerPreference:'high-performance', alpha:false, stencil:false, depth:false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 10000);
  camera.position.z = 50;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2d1a22); // --drose
  const clock = new THREE.Clock();
  const touch = new TouchTexture();

  function getViewSize() {
    const fov = (camera.fov * Math.PI) / 180;
    const h = Math.abs(camera.position.z * Math.tan(fov/2) * 2);
    return { width: h * camera.aspect, height: h };
  }

  // Portfolio palette:
  // --rose   #f4c0d1 → 0.957, 0.753, 0.820
  // --petal  #e8a0bf → 0.910, 0.627, 0.749
  // --mauve  #c4789a → 0.769, 0.471, 0.604
  // --drose  #2d1a22 → 0.176, 0.102, 0.133
  // --linen  #f5f0e8 → 0.961, 0.941, 0.910
  // --parch  #ede6d8 → 0.929, 0.902, 0.847
  // --tan    #b8a090 → 0.722, 0.627, 0.565
  // --bark   #6b5040 → 0.420, 0.314, 0.251
  // --sage   #d4e8d0 → 0.831, 0.910, 0.816
  // --sage-dk #3d6b45 → 0.239, 0.420, 0.271

  const uniforms = {
    uTime:          { value: 0 },
    uResolution:    { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },

  
    uColor1:        { value: new THREE.Vector3(0.55, 0.32, 0.40) }, 
    uColor3:        { value: new THREE.Vector3(0.45, 0.25, 0.32) }, 
    uColor5:        { value: new THREE.Vector3(0.38, 0.20, 0.28) }, 
    uColor2:        { value: new THREE.Vector3(0.12, 0.07, 0.09) },
    uColor4:        { value: new THREE.Vector3(0.12, 0.07, 0.09) },
    uColor6:        { value: new THREE.Vector3(0.12, 0.07, 0.09) },
    uSpeed:         { value: 1.5 },
    uIntensity:     { value: 1.6 }, 
    uTouchTexture:  { value: touch.texture },
    uGrainIntensity:{ value: 0.02 },
    uDarkNavy:      { value: new THREE.Vector3(0.10, 0.05, 0.07) },
    uGradientSize:  { value: 0.28 },
    uGradientCount: { value: 14.0 },
    uColor1Weight:  { value: 0.2 },
    uColor2Weight:  { value: 3.2 },  
};

  const vs = getViewSize();
  let geo = new THREE.PlaneGeometry(vs.width, vs.height, 1, 1);
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: `varying vec2 vUv; void main(){ gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); vUv=uv; }`,
    fragmentShader: `
      uniform float uTime; uniform vec2 uResolution;
      uniform vec3 uColor1,uColor2,uColor3,uColor4,uColor5,uColor6;
      uniform float uSpeed,uIntensity; uniform sampler2D uTouchTexture;
      uniform float uGrainIntensity; uniform vec3 uDarkNavy;
      uniform float uGradientSize,uGradientCount,uColor1Weight,uColor2Weight;
      varying vec2 vUv;

      float grain(vec2 uv,float t){
        vec2 g=uv*uResolution*0.5;
        return fract(sin(dot(g+t,vec2(12.9898,78.233)))*43758.5453)*2.0-1.0;
      }

      vec3 getColor(vec2 uv,float t){
        float r=uGradientSize;
        vec2 c1=vec2(0.5+sin(t*uSpeed*0.4)*0.4,   0.5+cos(t*uSpeed*0.5)*0.4);
        vec2 c2=vec2(0.5+cos(t*uSpeed*0.6)*0.5,   0.5+sin(t*uSpeed*0.45)*0.5);
        vec2 c3=vec2(0.5+sin(t*uSpeed*0.35)*0.45, 0.5+cos(t*uSpeed*0.55)*0.45);
        vec2 c4=vec2(0.5+cos(t*uSpeed*0.5)*0.4,   0.5+sin(t*uSpeed*0.4)*0.4);
        vec2 c5=vec2(0.5+sin(t*uSpeed*0.7)*0.35,  0.5+cos(t*uSpeed*0.6)*0.35);
        vec2 c6=vec2(0.5+cos(t*uSpeed*0.45)*0.5,  0.5+sin(t*uSpeed*0.65)*0.5);
        vec2 c7=vec2(0.5+sin(t*uSpeed*0.55)*0.38, 0.5+cos(t*uSpeed*0.48)*0.42);
        vec2 c8=vec2(0.5+cos(t*uSpeed*0.65)*0.36, 0.5+sin(t*uSpeed*0.52)*0.44);
        vec2 c9=vec2(0.5+sin(t*uSpeed*0.42)*0.41, 0.5+cos(t*uSpeed*0.58)*0.39);
        vec2 c10=vec2(0.5+cos(t*uSpeed*0.48)*0.37,0.5+sin(t*uSpeed*0.62)*0.43);
        float i1=1.0-smoothstep(0.0,r,length(uv-c1));
        float i2=1.0-smoothstep(0.0,r,length(uv-c2));
        float i3=1.0-smoothstep(0.0,r,length(uv-c3));
        float i4=1.0-smoothstep(0.0,r,length(uv-c4));
        float i5=1.0-smoothstep(0.0,r,length(uv-c5));
        float i6=1.0-smoothstep(0.0,r,length(uv-c6));
        float i7=1.0-smoothstep(0.0,r,length(uv-c7));
        float i8=1.0-smoothstep(0.0,r,length(uv-c8));
        float i9=1.0-smoothstep(0.0,r,length(uv-c9));
        float i10=1.0-smoothstep(0.0,r,length(uv-c10));
        vec2 ru1=uv-0.5; float a1=t*uSpeed*0.15;
        ru1=vec2(ru1.x*cos(a1)-ru1.y*sin(a1),ru1.x*sin(a1)+ru1.y*cos(a1))+0.5;
        vec2 ru2=uv-0.5; float a2=-t*uSpeed*0.12;
        ru2=vec2(ru2.x*cos(a2)-ru2.y*sin(a2),ru2.x*sin(a2)+ru2.y*cos(a2))+0.5;
        float ri1=1.0-smoothstep(0.0,0.8,length(ru1-0.5));
        float ri2=1.0-smoothstep(0.0,0.8,length(ru2-0.5));
        vec3 col=vec3(0.0);
        col+=uColor1*(i1*(0.55+0.45*sin(t*uSpeed)))*uColor1Weight;
        col+=uColor2*(i2*(0.55+0.45*cos(t*uSpeed*1.2)))*uColor2Weight;
        col+=uColor3*(i3*(0.55+0.45*sin(t*uSpeed*0.8)))*uColor1Weight;
        col+=uColor4*(i4*(0.55+0.45*cos(t*uSpeed*1.3)))*uColor2Weight;
        col+=uColor5*(i5*(0.55+0.45*sin(t*uSpeed*1.1)))*uColor1Weight;
        col+=uColor6*(i6*(0.55+0.45*cos(t*uSpeed*0.9)))*uColor2Weight;
        if(uGradientCount>6.0){
          col+=uColor1*(i7*(0.55+0.45*sin(t*uSpeed*1.4)))*uColor1Weight;
          col+=uColor2*(i8*(0.55+0.45*cos(t*uSpeed*1.5)))*uColor2Weight;
          col+=uColor3*(i9*(0.55+0.45*sin(t*uSpeed*1.6)))*uColor1Weight;
          col+=uColor4*(i10*(0.55+0.45*cos(t*uSpeed*1.7)))*uColor2Weight;
        }
        col+=mix(uColor1,uColor3,ri1)*0.45*uColor1Weight;
        col+=mix(uColor2,uColor4,ri2)*0.40*uColor2Weight;
        col=clamp(col,0.0,1.0)*uIntensity;
        float lum=dot(col,vec3(0.299,0.587,0.114));
        col=mix(vec3(lum),col,1.35);
        col=pow(col,vec3(0.92));
        col = mix(uDarkNavy, col, max(length(col)*0.9, 0.08));;
        float mb=length(col); if(mb>1.0) col*=1.0/mb;
        return col;
      }

      void main(){
        vec2 uv=vUv;
        vec4 tk=texture2D(uTouchTexture,uv);
        float vx=-(tk.r*2.0-1.0), vy=-(tk.g*2.0-1.0), inten=tk.b;
        uv.x+=vx*0.8*inten; uv.y+=vy*0.8*inten;
        float d=length(uv-0.5);
        uv+=vec2(sin(d*20.0-uTime*3.0)*0.04*inten+sin(d*15.0-uTime*2.0)*0.03*inten);
        vec3 col=getColor(uv,uTime);
        col+=grain(uv,uTime)*uGrainIntensity;
        float ts=uTime*0.5;
        col.r+=sin(ts)*0.02; col.g+=cos(ts*1.4)*0.02; col.b+=sin(ts*1.2)*0.02;
        col=mix(uDarkNavy,col,max(length(col)*1.2,0.15));
        col=clamp(col,0.0,1.0);
        float mb=length(col); if(mb>1.0) col*=1.0/mb;
        gl_FragColor=vec4(col,1.0);
      }
    `
  });

  const mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  // Color schemes — DARK DOMINANT VERSION
const schemes = {
  // 1: rose/petal/mauve on drose (now darker dominant)
  1: { 
    c:[new THREE.Vector3(0.857,0.653,0.720), new THREE.Vector3(0.12,0.07,0.09)], 
    bg:0x1a0f14, 
    nav:[0.10,0.05,0.07], 
    gs:0.35, gc:14, sp:1.5, 
    w1:0.3, w2:2.6 
  },

  // 2: linen/parch on bark (muted + darker base)
  2: { 
    c:[new THREE.Vector3(0.861,0.841,0.810), new THREE.Vector3(0.25,0.18,0.14)], 
    bg:0x140c09, 
    nav:[0.10,0.05,0.07], 
    gs:0.8, gc:8, sp:1.2, 
    w1:0.6, w2:2.0 
  },

  // 3: rose + sage (dark-forward blend)
  3: { 
    c:[
      new THREE.Vector3(0.857,0.653,0.720), 
      new THREE.Vector3(0.12,0.07,0.09), 
      new THREE.Vector3(0.631,0.710,0.616)
    ], 
    bg:0x1a0f14, 
    nav:[0.10,0.05,0.07], 
    gs:0.35, gc:14, sp:1.5, 
    w1:0.3, w2:2.6 
  },

  // 4: petal/tan on linen (converted to dark mode feel)
  4: { 
    c:[
      new THREE.Vector3(0.810,0.527,0.649), 
      new THREE.Vector3(0.522,0.427,0.365), 
      new THREE.Vector3(0.761,0.741,0.710)
    ], 
    bg:0x18120e, 
    nav:[0.10,0.05,0.07], 
    gs:0.6, gc:10, sp:1.2, 
    w1:0.5, w2:2.2 
  },

  // 5: mauve/sage-dk deep rich (already dark — enhanced)
  5: { 
    c:[
      new THREE.Vector3(0.669,0.371,0.504), 
      new THREE.Vector3(0.18,0.30,0.20), 
      new THREE.Vector3(0.669,0.371,0.504), 
      new THREE.Vector3(0.10,0.05,0.07), 
      new THREE.Vector3(0.857,0.653,0.720), 
      new THREE.Vector3(0.10,0.05,0.07)
    ], 
    bg:0x140c12, 
    nav:[0.10,0.05,0.07], 
    gs:0.35, gc:16, sp:1.6, 
    w1:0.3, w2:3.0 
  },
};

  function setScheme(n) {
    const s = schemes[n]; if (!s) return;
    const cols = s.c;
    const fill = (i, v) => { const u = uniforms[`uColor${i}`]; if (u) u.value.copy(v); };
    if (cols.length >= 6) {
      for (let i=0;i<6;i++) fill(i+1, cols[i]);
    } else if (cols.length === 3) {
      fill(1,cols[0]); fill(2,cols[1]); fill(3,cols[2]);
      fill(4,cols[0]); fill(5,cols[1]); fill(6,cols[2]);
    } else {
      fill(1,cols[0]); fill(2,cols[1]); fill(3,cols[0]);
      fill(4,cols[1]); fill(5,cols[0]); fill(6,cols[1]);
    }
    scene.background = new THREE.Color(0x0f070a);
    uniforms.uDarkNavy.value.set(...s.nav);
    uniforms.uGradientSize.value = s.gs;
    uniforms.uGradientCount.value = s.gc;
    uniforms.uSpeed.value = s.sp;
    uniforms.uColor1Weight.value = s.w1;
    uniforms.uColor2Weight.value = s.w2;
  }

  setScheme(1);

  function tick() {
    const delta = Math.min(clock.getDelta(), 0.1);
    touch.update();
    uniforms.uTime.value += delta;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    const vs2 = getViewSize();
    mesh.geometry.dispose();
    mesh.geometry = new THREE.PlaneGeometry(vs2.width, vs2.height, 1, 1);
  });

  window.addEventListener('mousemove', e => {
    touch.addTouch({ x: e.clientX/window.innerWidth, y: 1-e.clientY/window.innerHeight });
  });
  window.addEventListener('touchmove', e => {
    const t = e.touches[0];
    touch.addTouch({ x: t.clientX/window.innerWidth, y: 1-t.clientY/window.innerHeight });
  });

  // ── Custom cursor
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  let mx=-200, my=-200, rx=-200, ry=-200;
  document.addEventListener('mousemove', e => {
    mx=e.clientX; my=e.clientY;
    dot.style.left=mx+'px'; dot.style.top=my+'px';
  });
  (function animRing(){
    rx+=(mx-rx)*0.13; ry+=(my-ry)*0.13;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(animRing);
  })();
  document.querySelectorAll('a,button').forEach(el=>{
    el.addEventListener('mouseenter',()=>ring.classList.add('expand'));
    el.addEventListener('mouseleave',()=>ring.classList.remove('expand'));
  });

  // Update cursor color when scheme 4 (light bg) is active
  document.querySelectorAll('.scheme-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.scheme-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setScheme(parseInt(btn.dataset.scheme));
    });
  });

  // ── Enter button — direct navigation, no wipe
  document.getElementById('enterBtn').addEventListener('click', e => {
    e.preventDefault();
    window.location.href = 'info.html';
  });

  // ── Ticker
  const phrases = [
    'UI/UX &nbsp;·&nbsp; Web Dev &nbsp;·&nbsp; Branding',
    'QA Testing &nbsp;·&nbsp; POS Systems &nbsp;·&nbsp; Deployment',
    'Figma &nbsp;·&nbsp; JavaScript &nbsp;·&nbsp; PHP &nbsp;·&nbsp; Python',
    'BS Computer Engineering &nbsp;·&nbsp; PCU Manila'
  ];
  let ti=0;
  const ticker=document.getElementById('ticker');
  setInterval(()=>{
    ticker.style.opacity='0';
    setTimeout(()=>{ ti=(ti+1)%phrases.length; ticker.innerHTML=phrases[ti]; ticker.style.opacity='1'; },420);
  },3500);
