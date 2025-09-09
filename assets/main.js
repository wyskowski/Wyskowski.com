// main.js — cleaned & consolidated

document.addEventListener('DOMContentLoaded', () => {
  // === Reveal on scroll ===
  (function setupReveal(){
    const sections = document.querySelectorAll('section');
    if (!('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting){
          e.target.classList.add('reveal');
          io.unobserve(e.target);
        }
      });
    }, {threshold:0.1});
    sections.forEach(s=>io.observe(s));
  })();

  // === NAV ===
  const header = document.querySelector('#site-header');
  const nav = header ? header.querySelector('nav') : document.querySelector('nav');
  const navContainer = nav ? nav.querySelector('.nav-container') : null;
  const navList = navContainer ? navContainer.querySelector('ul') : null;

  if (nav && navContainer && navList) {
    // Burger inside the container
    let burger = nav.querySelector('.burger');
    if (!burger) {
      burger = document.createElement('button');
      burger.type = 'button';
      burger.className = 'burger';
      burger.innerHTML = '<span></span><span></span><span></span>';
      navContainer.appendChild(burger);
    } else if (burger.parentElement !== navContainer) {
      navContainer.appendChild(burger);
    }

    if (!navList.id) navList.id = 'primary-nav';
    burger.setAttribute('aria-controls', navList.id);
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');

    const openMenu = () => {
      navList.classList.add('active');
      burger.classList.add('active');
      document.body.classList.add('nav-open');
      burger.setAttribute('aria-expanded', 'true');
      burger.setAttribute('aria-label', 'Close menu');
    };
    const closeMenu = () => {
      navList.classList.remove('active');
      burger.classList.remove('active');
      document.body.classList.remove('nav-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Open menu');
    };
    const toggleMenu = () => (navList.classList.contains('active') ? closeMenu() : openMenu());

    burger.addEventListener('click', toggleMenu);
    document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeMenu(); });
    document.addEventListener('click', (e)=>{ if(!nav.contains(e.target) && navList.classList.contains('active')) closeMenu(); });

    // Close on nav link + smooth scroll
    navList.querySelectorAll('a[href^="#"]').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({behavior:'smooth', block:'start'});
        closeMenu();
      });
    });

    // Reset to desktop state on resize
    const mq = window.matchMedia('(min-width: 769px)');
    const applyResize = () => { if (mq.matches) closeMenu(); };
    mq.addEventListener ? mq.addEventListener('change', applyResize) : window.addEventListener('resize', applyResize);
  }

  // === Progress bar + scroll spy ===
  (function setupScrollUI(){
    const progressBar = document.createElement('div');
    Object.assign(progressBar.style, {
      position:'fixed',top:'0',left:'0',height:'4px',backgroundColor:'var(--accent)',
      width:'0%',zIndex:'999',transition:'width .25s ease'
    });
    document.body.appendChild(progressBar);

    const navItems = document.querySelectorAll('nav ul li a');
    const navBar = document.querySelector('nav');

    window.addEventListener('scroll', () => {
      const fromTop = window.scrollY + 80;
      navItems.forEach(link => {
        const sec = document.querySelector(link.getAttribute('href'));
        if (!sec) return;
        const hit = sec.offsetTop <= fromTop && (sec.offsetTop + sec.offsetHeight) > fromTop;
        link.classList.toggle('active', hit);
      });

      const scrollTop = window.scrollY;
      const docHeight = document.body.scrollHeight - window.innerHeight;
      progressBar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';

      if (navBar) navBar.style.boxShadow = scrollTop > 10 ? '0 2px 12px rgba(0,0,0,.08)' : 'none';
    });
  })();

  // === Typewriter (stable width, no reflow) ===
  (function typewriter(){
    const tw = document.querySelector('.typewriter');
    if (!tw) return;

    const words = ['Business Student', 'Data Explorer', 'Future Strategist'];
    let i = 0;

    // Reserve width for the longest phrase after fonts load
    const reserveWidth = async () => {
      if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch(_){} }
      const probe = document.createElement('span');
      const cs = getComputedStyle(tw);
      Object.assign(probe.style, {
        visibility:'hidden', whiteSpace:'nowrap', position:'absolute', left:'-9999px',
        font: cs.font,
        letterSpacing: cs.letterSpacing,
        fontKerning: cs.fontKerning,
        fontFeatureSettings: cs.fontFeatureSettings
      });
      document.body.appendChild(probe);

      let maxW = 0;
      for (const p of words) {
        probe.textContent = p;
        maxW = Math.max(maxW, probe.getBoundingClientRect().width);
      }
      document.body.removeChild(probe);

      tw.style.setProperty('--tw-width', Math.ceil(maxW) + 'px');
      tw.textContent = '';
    };

    const startTyping = () => {
      const type = () => {
        let word = words[i].split('');
        const stepType = () => {
          if (word.length) { tw.textContent += word.shift(); setTimeout(stepType, 120); }
          else { setTimeout(erase, 1400); }
        };
        const erase = () => {
          let word = words[i].split('');
          const stepErase = () => {
            if (word.length) { word.pop(); tw.textContent = word.join(''); setTimeout(stepErase, 60); }
            else { i = (i + 1) % words.length; type(); }
          };
          stepErase();
        };
        stepType();
      };
      type();
    };

    reserveWidth().then(startTyping);
  })();

  // Keep --nav-h updated
  function setNavHeight() {
    const header = document.getElementById('site-header');
    if (!header) return;
    const h = header.offsetHeight;
    document.documentElement.style.setProperty('--nav-h', h + 'px');
  }
  window.addEventListener('load', setNavHeight);
  window.addEventListener('resize', setNavHeight);
});


// Smooth scroll with fixed-nav offset fallback (older mobile Safari)
(function () {
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 72;

  function smoothTo(hash) {
    const el = document.querySelector(hash);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.pageYOffset - navH;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  // Intercept local anchor clicks
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (href.length > 1) {
      e.preventDefault();
      history.pushState(null, '', href);
      smoothTo(href);
    }
  });

  // Handle direct loads with hashes
  if (location.hash) {
    setTimeout(() => smoothTo(location.hash), 0);
  }
})();