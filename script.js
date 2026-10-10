(() => {
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
    const lerp = (a, b, t) => a + (b - a) * t;

    /* ---------- Intro ---------- */
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('loaded')));

    /* ---------- Mobile menu ---------- */
    const navbar = $('.navbar');
    const hamburger = $('.hamburger');
    const navLinks = $('.nav-links');
    const closeMenu = () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        document.body.classList.remove('menu-open');
    };
    hamburger.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        hamburger.classList.toggle('open', open);
        document.body.classList.toggle('menu-open', open);
    });
    $$('.nav-links a').forEach(a => a.addEventListener('click', closeMenu));
    addEventListener('resize', () => { if (innerWidth > 768) closeMenu(); });

    /* ---------- Scroll progress + navbar + scroll spy ---------- */
    const progress = $('.scroll-progress');
    const sections = $$('section[id]');
    const links = $$('.nav-links a');
    let scrollY = window.scrollY;

    function onScroll() {
        scrollY = window.scrollY;
        const max = document.documentElement.scrollHeight - innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
        navbar.classList.toggle('scrolled', scrollY > 30);

        let current = sections[0].id;
        sections.forEach(s => { if (scrollY + innerHeight * 0.4 >= s.offsetTop) current = s.id; });
        if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = sections[sections.length - 1].id;
        links.forEach(l => l.classList.toggle('active', l.getAttribute('href').slice(1) === current));
    }
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Typing line ---------- */
    const typingEl = $('.typing');
    const phrase = 'Building the future, one line of code at a time...';
    if (typingEl) {
        if (reduce) {
            typingEl.textContent = phrase;
        } else {
            let i = 0, del = false;
            const tick = () => {
                if (!del) {
                    typingEl.textContent = phrase.slice(0, ++i);
                    if (i === phrase.length) { del = true; return setTimeout(tick, 2400); }
                    return setTimeout(tick, 50);
                }
                typingEl.textContent = phrase.slice(0, --i);
                if (i === 0) { del = false; return setTimeout(tick, 500); }
                setTimeout(tick, 24);
            };
            setTimeout(tick, 1400);
        }
    }

    /* ---------- Marquee (duplicate for seamless loop) ---------- */
    const track = $('.marquee-track');
    if (track) track.innerHTML += track.innerHTML;

    /* ---------- Reveal on scroll + count-up ---------- */
    function countUp(el) {
        const target = parseInt(el.dataset.count, 10);
        if (reduce || isNaN(target)) return;
        const start = performance.now(), dur = 1400;
        (function step(now) {
            const p = Math.min((now - start) / dur, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(step);
        })(start);
    }
    $$('[data-count]').forEach(el => { if (!reduce) el.textContent = '0'; });

    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            const el = e.target;
            el.classList.add('visible');
            const num = el.matches('[data-count]') ? el : $('[data-count]', el);
            if (num) countUp(num);
            io.unobserve(el);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

    $$('.reveal').forEach(el => {
        const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
        el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 5) * 0.1}s`);
        io.observe(el);
    });

    /* ---------- 3D tilt cards + spotlight ---------- */
    if (fine && !reduce) {
        $$('[data-tilt]').forEach(card => {
            card.addEventListener('pointermove', e => {
                const r = card.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width;
                const py = (e.clientY - r.top) / r.height;
                card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 10}deg) rotateY(${(px - 0.5) * 12}deg) translateZ(8px)`;
                card.style.setProperty('--mx', `${px * 100}%`);
                card.style.setProperty('--my', `${py * 100}%`);
            });
            card.addEventListener('pointerleave', () => { card.style.transform = ''; });
        });

        /* Magnetic buttons */
        $$('.magnetic').forEach(btn => {
            btn.addEventListener('pointermove', e => {
                const r = btn.getBoundingClientRect();
                const dx = e.clientX - (r.left + r.width / 2);
                const dy = e.clientY - (r.top + r.height / 2);
                btn.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
            });
            btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
        });
    }

    /* ---------- Custom cursor ---------- */
    if (fine && !reduce) {
        const dot = $('.cursor-dot'), ring = $('.cursor-ring');
        let tx = 0, ty = 0, rx = 0, ry = 0;
        addEventListener('pointermove', e => {
            tx = e.clientX; ty = e.clientY;
            dot.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
            dot.classList.add('cursor-on'); ring.classList.add('cursor-on');
        }, { passive: true });
        document.addEventListener('pointerleave', () => { dot.classList.remove('cursor-on'); ring.classList.remove('cursor-on'); });
        $$('a, button, [data-tilt]').forEach(el => {
            el.addEventListener('pointerenter', () => ring.classList.add('hover'));
            el.addEventListener('pointerleave', () => ring.classList.remove('hover'));
        });
        (function loop() {
            rx = lerp(rx, tx, 0.16); ry = lerp(ry, ty, 0.16);
            ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
            requestAnimationFrame(loop);
        })();
    }

    /* ---------- 3D scene (Three.js) ---------- */
    const canvas = $('#scene');
    if (!canvas || !window.THREE) return;

    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (err) { return; }

    const noise = `
    vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
    vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
    float snoise(vec3 v){
      const vec2 C=vec2(1.0/6.0,1.0/3.0);
      const vec4 D=vec4(0.0,0.5,1.0,2.0);
      vec3 i=floor(v+dot(v,C.yyy));
      vec3 x0=v-i+dot(i,C.xxx);
      vec3 g=step(x0.yzx,x0.xyz);
      vec3 l=1.0-g;
      vec3 i1=min(g.xyz,l.zxy);
      vec3 i2=max(g.xyz,l.zxy);
      vec3 x1=x0-i1+C.xxx;
      vec3 x2=x0-i2+C.yyy;
      vec3 x3=x0-D.yyy;
      i=mod289(i);
      vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
      float n_=0.142857142857;
      vec3 ns=n_*D.wyz-D.xzx;
      vec4 j=p-49.0*floor(p*ns.z*ns.z);
      vec4 x_=floor(j*ns.z);
      vec4 y_=floor(j-7.0*x_);
      vec4 x=x_*ns.x+ns.yyyy;
      vec4 y=y_*ns.x+ns.yyyy;
      vec4 h=1.0-abs(x)-abs(y);
      vec4 b0=vec4(x.xy,y.xy);
      vec4 b1=vec4(x.zw,y.zw);
      vec4 s0=floor(b0)*2.0+1.0;
      vec4 s1=floor(b1)*2.0+1.0;
      vec4 sh=-step(h,vec4(0.0));
      vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
      vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
      vec3 p0=vec3(a0.xy,h.x);
      vec3 p1=vec3(a0.zw,h.y);
      vec3 p2=vec3(a1.xy,h.z);
      vec3 p3=vec3(a1.zw,h.w);
      vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
      p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
      vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
      m=m*m;
      return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
    }`;

    const vertex = `
    uniform float uTime;
    uniform float uAmp;
    varying vec3 vNormal;
    varying vec3 vView;
    varying float vN;
    ${noise}
    void main(){
      float n = snoise(position * 0.85 + vec3(uTime * 0.18));
      n += 0.35 * snoise(position * 1.9 - vec3(uTime * 0.25));
      vN = n;
      vec3 p = position + normal * n * uAmp;
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vView = -mv.xyz;
      gl_Position = projectionMatrix * mv;
    }`;

    const fragSolid = `
    uniform vec3 uGold;
    uniform vec3 uViolet;
    varying vec3 vNormal;
    varying vec3 vView;
    varying float vN;
    void main(){
      vec3 V = normalize(vView);
      vec3 N = normalize(vNormal);
      float fres = pow(1.0 - max(dot(N, V), 0.0), 2.4);
      float t = smoothstep(-0.7, 0.9, vN);
      vec3 col = mix(uViolet * 0.30, uGold * 0.85, t);
      col += mix(uViolet, uGold, 0.5 + 0.5 * vN) * fres * 1.25;
      gl_FragColor = vec4(col, 0.9);
    }`;

    const fragWire = `
    varying float vN;
    void main(){
      gl_FragColor = vec4(vec3(0.95, 0.92, 0.86), 0.10 + 0.08 * (0.5 + 0.5 * vN));
    }`;

    const uniforms = {
        uTime: { value: 0 },
        uAmp: { value: 0.34 },
        uGold: { value: new THREE.Color('#d9bb8c') },
        uViolet: { value: new THREE.Color('#9b87d6') }
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 6;
    const group = new THREE.Group();
    scene.add(group);

    const orb = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.5, 48),
        new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragSolid, transparent: true })
    );
    const wire = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.56, 7),
        new THREE.ShaderMaterial({ uniforms, vertexShader: vertex, fragmentShader: fragWire, transparent: true, wireframe: true, depthWrite: false })
    );
    group.add(orb, wire);

    // Orbit rings
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xd9bb8c, transparent: true, opacity: 0.35 });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.006, 8, 220), ringMat);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(2.9, 0.004, 8, 220), new THREE.MeshBasicMaterial({ color: 0x9b87d6, transparent: true, opacity: 0.3 }));
    ring1.rotation.x = 1.15; ring1.rotation.y = 0.3;
    ring2.rotation.x = 0.6; ring2.rotation.y = -0.5;
    group.add(ring1, ring2);

    // Small satellite on ring 1
    const sat = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshBasicMaterial({ color: 0xf4e3c3 }));
    ring1.add(sat);

    // Dust field
    const count = 900;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = 3.4 + Math.random() * 5.5;
        const th = Math.random() * Math.PI * 2;
        const ph = Math.acos(2 * Math.random() - 1);
        pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
        pos[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
        pos[i * 3 + 2] = r * Math.cos(ph) - 2;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0xf2ede3, size: 0.018, transparent: true, opacity: 0.55, depthWrite: false }));
    scene.add(dust);

    /* Layout + resize */
    let baseX = 1.9, baseY = 0, baseScale = 1;
    function resize() {
        const w = innerWidth, h = innerHeight;
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        const mobile = w < 900;
        baseX = mobile ? 0 : 1.9;
        baseY = mobile ? 1.5 : 0;
        baseScale = mobile ? 0.7 : 1;
        if (reduce) render(0);
    }
    addEventListener('resize', resize);

    /* Interaction state */
    const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
    addEventListener('pointermove', e => {
        mouse.x = (e.clientX / innerWidth - 0.5) * 2;
        mouse.y = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });

    const cur = { x: baseX, y: baseY, s: baseScale, rot: 0, op: 1 };
    const clock = new THREE.Clock();
    let spin = 0;

    function render(dt) {
        const docMax = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
        const s = Math.min(scrollY / docMax, 1);

        // Orb flows left and right as you move down the page
        const tx = baseX * Math.cos(s * Math.PI * 3.2);
        const ty = baseY - s * 0.9;
        const ts = baseScale * (1 - s * 0.22);
        const heroFade = Math.min(scrollY / (innerHeight * 0.9), 1);
        const top = 1 - heroFade * 0.72;

        const k = reduce ? 1 : 0.06;
        cur.x = lerp(cur.x, tx, k);
        cur.y = lerp(cur.y, ty, k);
        cur.s = lerp(cur.s, ts, k);
        cur.op = lerp(cur.op, top, k);

        mouse.sx = lerp(mouse.sx, mouse.x, 0.05);
        mouse.sy = lerp(mouse.sy, mouse.y, 0.05);

        spin += dt * 0.12;
        group.position.set(cur.x, cur.y, 0);
        group.scale.setScalar(cur.s);
        group.rotation.y = spin + s * Math.PI * 4 + mouse.sx * 0.5;
        group.rotation.x = mouse.sy * 0.35 + s * 0.8;
        ring1.rotation.z += dt * 0.25;
        ring2.rotation.z -= dt * 0.18;
        sat.position.set(2.45 * Math.cos(spin * 6), 2.45 * Math.sin(spin * 6), 0);
        dust.rotation.y = spin * 0.4 + s * 1.5;
        dust.rotation.x = s * 0.6;

        uniforms.uAmp.value = lerp(uniforms.uAmp.value, 0.34 + Math.hypot(mouse.sx, mouse.sy) * 0.12, 0.05);
        canvas.style.opacity = cur.op.toFixed(3);
        renderer.render(scene, camera);
    }

    resize();

    if (reduce) {
        render(0);
        addEventListener('scroll', () => render(0), { passive: true });
    } else {
        (function loop() {
            requestAnimationFrame(loop);
            if (document.hidden) return;
            const dt = Math.min(clock.getDelta(), 0.05);
            uniforms.uTime.value += dt;
            render(dt);
        })();
    }
})();
