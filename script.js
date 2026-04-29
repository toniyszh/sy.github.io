/* ── TYPEWRITER ── */
const typeTarget = document.getElementById('typeTarget');
const phrases = [
    'Graphic Designer',
    'Software Engineer',
    'UI/UX Designer',
    'Brand Creator',
    'Web Developer'
];
let phraseIdx = 0, charIdx = 0, deleting = false;

function typeWrite() {
    const phrase = phrases[phraseIdx];
    if (!deleting) {
        typeTarget.textContent = phrase.slice(0, ++charIdx);
        if (charIdx === phrase.length) {
            deleting = true;
            setTimeout(typeWrite, 1800);
            return;
        }
    } else {
        typeTarget.textContent = phrase.slice(0, --charIdx);
        if (charIdx === 0) {
            deleting = false;
            phraseIdx = (phraseIdx + 1) % phrases.length;
        }
    }
    setTimeout(typeWrite, deleting ? 55 : 90);
}
typeWrite();

/* ── MOBILE MENU ── */
const menuIcon = document.querySelector('.menu-icon');
const navlist  = document.querySelector('.navlist');
const overlay  = document.querySelector('.overlay');

function toggleMenu() {
    menuIcon.classList.toggle('active');
    navlist.classList.toggle('open');
    document.body.classList.toggle('menu-open');
}
menuIcon.addEventListener('click', toggleMenu);
overlay.addEventListener('click', toggleMenu);
navlist.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    if (navlist.classList.contains('open')) toggleMenu();
}));

/* ── ACTIVE NAV ON SCROLL ── */
const sections = document.querySelectorAll('section[id], .home[id]');
const navLinks = document.querySelectorAll('.navlist a');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(sec => {
        if (window.scrollY >= sec.offsetTop - 80) current = sec.id;
    });
    navLinks.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
}, { passive: true });

/* ── ABOUT TABS ── */
document.querySelectorAll('.about-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.about-tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.about-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById('tab-' + btn.dataset.tab);
        if (panel) panel.classList.add('active');
    });
});

/* ── PORTFOLIO FILTER + LOAD MORE ── */
const MOBILE_INITIAL = 4;
const MOBILE_STEP    = 6;
const MOBILE_BP      = 768;

function isMobile() { return window.innerWidth <= MOBILE_BP; }

let currentFilter = 'all';
let shownCount    = MOBILE_INITIAL;

function renderGallery() {
    const allBoxes = [...document.querySelectorAll('#portfolioGallery .pbox')];

    // split into matched and unmatched
    const matched   = allBoxes.filter(b => currentFilter === 'all' || b.dataset.cat === currentFilter);
    const unmatched = allBoxes.filter(b => currentFilter !== 'all' && b.dataset.cat !== currentFilter);

    // always hide unmatched
    unmatched.forEach(b => {
        b.classList.add('hidden');
        b.style.visibility = '';
        b.style.opacity    = '';
        b.style.transform  = '';
    });

    const wrap    = document.getElementById('loadMoreWrap');
    const btn     = document.getElementById('loadMoreBtn');
    const lessBtn = document.getElementById('loadLessBtn');
    const note    = document.getElementById('loadMoreNote');
    const countEl = document.getElementById('loadMoreCount');

    if (matched.length <= MOBILE_INITIAL) {
        // too few items — show all matched, hide load more UI
        matched.forEach(b => b.classList.remove('hidden'));
        if (wrap) wrap.style.display = 'none';
        return;
    }

    // show only up to shownCount
    matched.forEach((b, i) => {
        const hide = i >= shownCount;
        b.classList.toggle('hidden', hide);
        if (!hide) {
            // force visibility in case ScrollReveal locked it
            b.style.visibility = 'visible';
            b.style.opacity    = '1';
            b.style.transform  = 'none';
        }
    });

    const visibleCount = Math.min(shownCount, matched.length);
    const remaining = matched.length - visibleCount;

    wrap.style.display  = 'flex';
    note.textContent    = `Showing ${visibleCount} of ${matched.length} projects`;

    if (remaining > 0) {
        btn.style.display   = '';
        countEl.textContent = `· ${remaining} more`;
    } else {
        btn.style.display = 'none';
    }

    lessBtn.style.display = shownCount > MOBILE_INITIAL ? '' : 'none';
}

function renderFeatured() {
    const featured  = document.getElementById('portfolioFeatured');
    const featLabel = featured?.previousElementSibling;
    if (!featured) return;

    const boxes = [...featured.querySelectorAll('.pbox')];
    const anyMatch = boxes.some(b => currentFilter === 'all' || b.dataset.cat === currentFilter);

    boxes.forEach(b => {
        b.classList.toggle('hidden', currentFilter !== 'all' && b.dataset.cat !== currentFilter);
    });

    featured.style.display        = anyMatch ? '' : 'none';
    if (featLabel) featLabel.style.display = anyMatch ? '' : 'none';
}

// filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        shownCount    = MOBILE_INITIAL; // reset count on filter change
        renderFeatured();
        renderGallery();
    });
});

// load more
document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
    shownCount = Number.MAX_SAFE_INTEGER;
    renderGallery();
});

// show less
document.getElementById('loadLessBtn')?.addEventListener('click', () => {
    shownCount = MOBILE_INITIAL;
    renderGallery();
    document.getElementById('portfolioGallery')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

// re-evaluate on resize
window.addEventListener('resize', renderGallery, { passive: true });

// init
renderFeatured();
renderGallery();

/* ── PBOX CAROUSEL ── */
document.querySelectorAll('.pbox-carousel').forEach(carousel => {
    const slides = carousel.querySelector('.pbox-slides');
    const dots = Array.from(carousel.querySelectorAll('.pbox-dot'));

    if (!slides || dots.length < 2) return;

    let current = 0;
    const total = dots.length;

    function goTo(index) {
        dots[current]?.classList.remove('active');
        current = ((index % total) + total) % total;
        slides.style.transform = `translateX(-${current * 100}%)`;
        dots[current]?.classList.add('active');
    }

    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));

    let timer = setInterval(() => goTo(current + 1), 3000);
    carousel.addEventListener('mouseenter', () => clearInterval(timer));
    carousel.addEventListener('mouseleave', () => {
        timer = setInterval(() => goTo(current + 1), 3000);
    });
});

/* ── CUSTOM LIGHTBOX ── */
(function() {
    // Build overlay once
    const overlay = document.createElement('div');
    overlay.id = 'customLB';
    overlay.innerHTML = `
        <div id="customLB-bg"></div>
        <button id="customLB-close">✕</button>
        <button id="customLB-prev">❮</button>
        <button id="customLB-next">❯</button>
        <div id="customLB-img-wrap">
            <img id="customLB-img" src="" alt="">
        </div>
        <div id="customLB-counter"></div>
    `;
    document.body.appendChild(overlay);

    let images = [], current = 0;

    function open(imgs, startIndex) {
        images = imgs;
        current = startIndex || 0;
        show();
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function close() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function show() {
        const img = document.getElementById('customLB-img');
        const counter = document.getElementById('customLB-counter');
        img.src = images[current].src;
        img.alt = images[current].alt || '';
        counter.textContent = `${current + 1} / ${images.length}`;
        document.getElementById('customLB-prev').style.display = current === 0 ? 'none' : 'flex';
        document.getElementById('customLB-next').style.display = current === images.length - 1 ? 'none' : 'flex';
    }

    document.getElementById('customLB-close').addEventListener('click', close);
    document.getElementById('customLB-bg').addEventListener('click', close);
    document.getElementById('customLB-prev').addEventListener('click', () => { current--; show(); });
    document.getElementById('customLB-next').addEventListener('click', () => { current++; show(); });
    document.addEventListener('keydown', e => {
        if (!overlay.classList.contains('active')) return;
        if (e.key === 'ArrowLeft' && current > 0) { current--; show(); }
        if (e.key === 'ArrowRight' && current < images.length - 1) { current++; show(); }
        if (e.key === 'Escape') close();
    });

    // Hook into explore buttons
    document.querySelectorAll('.pbox-explore-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const pbox = btn.closest('.pbox');
            const anchors = Array.from(pbox.querySelectorAll('.pbox-gallery-anchor'));
            if (!anchors.length) return;

            const imgs = anchors.map(a => ({ src: a.href, alt: a.getAttribute('data-alt') || '' }));
            open(imgs, 0);
        });
    });

    // Expose globally if needed
    window.customLB = { open, close };
})();

/* ── SWIPER ── */
const swiper = new Swiper('.mySwiper', {
    slidesPerView: 1,
    loop: true,
    spaceBetween: 16,
    slidesPerGroup: 1,
    observer: true,
    observeParents: true,
    watchOverflow: true,

    pagination: { 
        el: '.swiper-pagination', 
        clickable: true 
    },

   breakpoints: {
        600:  { slidesPerView: 2 },
        900: { slidesPerView: 3 }
    },

    on: {
        init: function() {
            this.update();
        },
        resize: function() {
            this.update();
        }
    }
});

// Reveal on scroll
const reveals = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
reveals.forEach(el => revealObserver.observe(el));

// Tool bars animation
const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.tool-bar-fill').forEach(bar => {
        bar.style.width = bar.dataset.width + '%';
      });
    }
  });
}, { threshold: 0.3 });
document.querySelectorAll('.tools-section').forEach(el => barObserver.observe(el));

/* ── SKILL CIRCLE ANIMATION ── */
const scFills = document.querySelectorAll('.sc-fill');
const scObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('animated');
            scObs.unobserve(e.target);
        }
    });
}, { threshold: .3 });
scFills.forEach(f => scObs.observe(f));

/* ── SCROLL REVEAL ── */
if (typeof ScrollReveal !== 'undefined') {
    const sr = ScrollReveal({
        origin: 'bottom',
        distance: '24px',
        duration: 700,
        delay: 80,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        reset: false
    });
    sr.reveal('.section-head', { delay: 0 });
    sr.reveal('.service-card', { interval: 80 });
    sr.reveal('.pbox:not(.hidden)', { interval: 40 });
    sr.reveal('.about-photo-col', { origin: 'left' });
    sr.reveal('.about-content', { origin: 'right', delay: 120 });
    sr.reveal('.contact-card', { origin: 'left' });
    sr.reveal('.contact-form-wrap', { delay: 80 });
    sr.reveal('.skills-wrap', { origin: 'right', delay: 120 });
    sr.reveal('.home-left', { origin: 'left', delay: 0 });
    sr.reveal('.home-right', { origin: 'right', delay: 100 });
    sr.reveal('.recent-card', { interval: 100 });
}

/* ── SCROLL TO TOP ── */
const scrollTop = document.getElementById('scroll-top');
window.addEventListener('scroll', () => {
    scrollTop.classList.toggle('show', window.scrollY > 400);
}, { passive: true });
scrollTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ── HEADER shadow on scroll ── */
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    header.style.borderBottomColor = window.scrollY > 10
        ? 'rgba(196,120,154,0.15)'
        : '';
}, { passive: true });

/* ── PROJECT CAROUSEL ── */

const PROJECTS = [

    {
        tag: 'Frontend · Design',
        title: 'Personal Portfolio',
        desc: 'Built this responsive portfolio from scratch — scroll-snapped pages, custom CSS animations, a 3D project carousel, and a cohesive pink-denim brand identity.',
        pills: [{ label: 'HTML/CSS', color: 'blue' }, { label: 'JavaScript', color: 'blue' }, { label: 'UI/UX', color: 'pink' }],
    },
    {
        tag: 'QA · Testing',
        title: 'System Validation Suite',
        desc: 'Wrote and executed comprehensive test cases for a POS and inventory management system, producing detailed UAT reports that cut post-launch defects significantly.',
        pills: [{ label: 'UAT', color: 'pink' }, { label: 'QA Testing', color: 'blue' }, { label: 'Documentation', color: 'pink' }],
    },
    {
        tag: 'UI/UX · Web',
        title: 'Multi-Client Kiosk System',
        desc: 'Designed and developed a full-stack kiosk platform serving multiple clients, covering everything from UI prototyping in Figma to PHP/MySQL backend integration and on-site deployment.',
        pills: [{ label: 'Figma', color: 'pink' }, { label: 'PHP', color: 'blue' }, { label: 'MySQL', color: 'blue' }],
    },
    {
        tag: 'Branding · Print',
        title: 'Brand Identity Design',
        desc: 'Created cohesive visual brand packages — logos, color palettes, typography systems, and print-ready collateral — for several small businesses using Canva and Photoshop.',
        pills: [{ label: 'Canva', color: 'pink' }, { label: 'Photoshop', color: 'blue' }, { label: 'Branding', color: 'pink' }],
    },
    {
        tag: 'Technical Support',
        title: 'POS Rollout & Training',
        desc: 'Led on-site configuration of POS terminals and PSC software across multiple client locations, conducted end-user training sessions, and handled OS reimaging for deployment.',
        pills: [{ label: 'POS Systems', color: 'blue' }, { label: 'Client Training', color: 'pink' }, { label: 'IT Support', color: 'blue' }],
    },
];

const MAX_VIS = 3;

(function () {
    const scene   = document.getElementById('carouselScene');
    const dotsEl  = document.getElementById('p6Dots');
    const prevBtn = document.getElementById('p6Prev');
    const nextBtn = document.getElementById('p6Next');

    if (!scene || !dotsEl) return; // safety check

    let active = Math.floor(PROJECTS.length / 2);

    const containers = PROJECTS.map((proj) => {
        const wrap = document.createElement('div');
        wrap.className = 'p6-card-container';

        const card = document.createElement('div');
        card.className = 'p6-card';

        card.innerHTML = `
            <span class="p6-card-tag">${proj.tag}</span>
            <h2>${proj.title}</h2>
            <p>${proj.desc}</p>
            <div class="p6-card-pills">
                ${proj.pills.map(p => `<span class="p6-pill ${p.color}">${p.label}</span>`).join('')}
            </div>
        `;

        wrap.appendChild(card);
        scene.appendChild(wrap);
        return wrap;
    });

    const dots = PROJECTS.map((_, i) => {
        const d = document.createElement('button');
        d.className = 'p6-dot';
        d.setAttribute('aria-label', `Go to project ${i + 1}`);
        d.addEventListener('click', () => setActive(i));
        dotsEl.appendChild(d);
        return d;
    });

    function render() {
        containers.forEach((wrap, i) => {
            const offset    = (active - i) / 3;
            const absOffset = Math.abs(active - i) / 3;
            const direction = Math.sign(active - i);
            const isActive  = i === active ? 1 : 0;
            const hidden    = Math.abs(active - i) > MAX_VIS;

            wrap.style.setProperty('--offset',     offset);
            wrap.style.setProperty('--abs-offset', absOffset);
            wrap.style.setProperty('--direction',  direction);
            wrap.style.setProperty('--active',     isActive);
            wrap.style.opacity       = Math.abs(active - i) >= MAX_VIS ? '0' : '1';
            wrap.style.display       = hidden ? 'none' : 'block';
            wrap.style.pointerEvents = isActive ? 'auto' : 'none';
        });

        dots.forEach((d, i) => d.classList.toggle('active', i === active));

        prevBtn.style.display = active > 0                   ? 'flex' : 'none';
        nextBtn.style.display = active < PROJECTS.length - 1 ? 'flex' : 'none';
    }

    function setActive(i) {
        active = Math.max(0, Math.min(PROJECTS.length - 1, i));
        render();
    }

    prevBtn.addEventListener('click', () => setActive(active - 1));
    nextBtn.addEventListener('click', () => setActive(active + 1));


    document.addEventListener('keydown', e => {
        const section = document.getElementById('portfolio');
        const rect = section.getBoundingClientRect();
        const inView = rect.top < window.innerHeight && rect.bottom > 0;
        if (inView) {
            if (e.key === 'ArrowLeft')  setActive(active - 1);
            if (e.key === 'ArrowRight') setActive(active + 1);
        }
    });

    render();
})();

/* ── THEME TOGGLE ── */

const themeBtn = document.getElementById('theme-toggle-btn');
 function applyTheme(dark) {
   document.documentElement.classList.toggle('dark', dark);
   themeBtn.setAttribute('aria-checked', dark);
   try { localStorage.setItem('app-theme', dark ? 'dark' : 'light'); } catch(e) {}
 }
 themeBtn.addEventListener('click', () => {
   applyTheme(!document.documentElement.classList.contains('dark'));
 });
 applyTheme(localStorage.getItem('app-theme') === 'dark');

/* ── CONTACT CARD ── */

function openBizCard() {
  const overlay = document.getElementById('bizOverlay');
  const card    = document.getElementById('bizCard');
  overlay.classList.add('visible');
  gsap.fromTo(card,
    { y: 40, opacity: 0, scale: 0.96 },
    { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'power3.out' }
  );
  gsap.fromTo('.biz-icon',
    { strokeDashoffset: 60 },
    { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out', stagger: 0.12, delay: 0.3 }
  );
  gsap.fromTo('.biz-name-line span',
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.1, delay: 0.1 }
  );
  gsap.fromTo('.biz-item',
    { x: -12, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.45, ease: 'power2.out', stagger: 0.08, delay: 0.4 }
  );
}

function closeBizCard() {
  const overlay = document.getElementById('bizOverlay');
  const card    = document.getElementById('bizCard');
  gsap.to(card, {
    y: 20, opacity: 0, scale: 0.96,
    duration: 0.28, ease: 'power2.in',
    onComplete: () => overlay.classList.remove('visible')
  });
}

document.getElementById('contactCard').addEventListener('click', () => {
  const overlay = document.getElementById('bizOverlay');
  overlay.classList.contains('visible') ? closeBizCard() : openBizCard();
});

document.getElementById('bizOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeBizCard();
});

/* ── CUSTOM CURSOR ── */
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