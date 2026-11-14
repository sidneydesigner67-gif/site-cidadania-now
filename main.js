(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WA = '554791732039';

  /* WhatsApp: mensagem pré-preenchida por contexto */
  document.querySelectorAll('[data-wa]').forEach((a) => {
    a.href = `https://wa.me/${WA}?text=${encodeURIComponent(a.dataset.wa)}`;
  });

  /* Ano no rodapé */
  const y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();

  /* Header: compacta ao rolar, esconde ao descer e reaparece ao subir */
  const header = document.querySelector('[data-header]');
  const wa = document.querySelector('.wa-float');
  let lastY = window.scrollY;
  let ticking = false;
  const onScroll = () => {
    const sy = window.scrollY;
    header.classList.toggle('is-scrolled', sy > 24);
    const menuOpen = header.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !menuOpen && sy > 600 && sy > lastY + 4);
    if (sy < lastY - 4) header.classList.remove('is-hidden');
    wa.classList.toggle('is-visible', sy > window.innerHeight * 0.6);
    lastY = sy;
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* Menu mobile */
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Fechar menu' : 'Abrir menu';
    nav.classList.toggle('is-open', open);
    header.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

  /* Revelação na entrada (com escalonamento dentro do mesmo grupo) */
  const targets = document.querySelectorAll('.reveal, .hero-figure, [data-steps]');
  const groups = new Map();
  document.querySelectorAll('.reveal').forEach((el) => {
    const p = el.parentElement;
    const i = groups.get(p) || 0;
    el.style.setProperty('--d', `${Math.min(i, 5) * 0.08}s`);
    groups.set(p, i + 1);
  });
  if (reduce || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    targets.forEach((el) => io.observe(el));
  }

  /* Link ativo na navegação */
  const links = [...document.querySelectorAll('.nav ul a')];
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => {
          if (a.getAttribute('href') === `#${en.target.id}`) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => so.observe(s));
  }

  /* Depoimentos: carrega o vídeo só perto da tela; um toca por vez */
  const videos = [...document.querySelectorAll('.reel video')];
  const loadVideo = (v) => {
    if (v.src) return;
    v.src = `${v.dataset.src}#t=0.6`;
    v.preload = 'metadata';
  };
  if ('IntersectionObserver' in window) {
    const vo = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { loadVideo(en.target); vo.unobserve(en.target); } });
    }, { rootMargin: '200px 400px' });
    videos.forEach((v) => vo.observe(v));
  } else videos.forEach(loadVideo);
  videos.forEach((v) => v.addEventListener('play', () => videos.forEach((o) => o !== v && o.pause())));

  /* A empresa: palavra do texto ↔ carimbo no passaporte */
  const stampEls = document.querySelectorAll('[data-stamp-id]');
  const setStamp = (id) => stampEls.forEach((s) => s.classList.toggle('is-active', s.dataset.stampId === id));
  document.querySelectorAll('[data-stamp]').forEach((w) => {
    const on = () => setStamp(w.dataset.stamp);
    const off = () => setStamp(null);
    w.addEventListener('mouseenter', on);
    w.addEventListener('focus', on);
    w.addEventListener('mouseleave', off);
    w.addEventListener('blur', off);
  });

  /* Números animados */
  const counters = document.querySelectorAll('[data-count]');
  const render = (el, v) => { el.textContent = `${v}${el.dataset.suffix || ''}`; };
  const countUp = (el) => {
    const target = Number(el.dataset.count);
    const dur = 1400 + target * 40;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 4);
      render(el, Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (!reduce && 'IntersectionObserver' in window) {
    counters.forEach((el) => render(el, 0));
    const co = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.querySelectorAll('[data-count]').forEach((el, i) => setTimeout(() => countUp(el), i * 180));
        co.unobserve(en.target);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.facts').forEach((f) => co.observe(f));
  }

  /* Vídeos de fundo (hero e CTA final): carregam perto da tela, tocam só quando visíveis */
  const hd = window.matchMedia('(min-width: 1200px) and (min-resolution: 1.5dppx), (min-width: 1600px)').matches;
  if (!reduce && 'IntersectionObserver' in window) document.querySelectorAll('[data-bg-video]').forEach((bg) => {
    let visible = false;
    bg.muted = true;
    bg.addEventListener('playing', () => bg.classList.add('is-playing'));
    bg.addEventListener('canplay', () => { if (visible) bg.play().catch(() => {}); });
    const vo2 = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        visible = en.isIntersecting;
        if (visible) {
          if (!bg.src) { bg.src = hd ? bg.dataset.srcHd : bg.dataset.src; bg.preload = 'auto'; bg.load(); }
          bg.play().catch(() => {});
        } else {
          bg.pause();
        }
      });
    }, { rootMargin: '200px 0px' });
    vo2.observe(bg);
  });

  const track = document.querySelector('[data-track]');
  document.querySelectorAll('[data-scroll]').forEach((b) => {
    b.addEventListener('click', () => {
      const card = track.querySelector('.reel');
      const step = card ? card.getBoundingClientRect().width + 20 : 300;
      track.scrollBy({ left: step * Number(b.dataset.scroll), behavior: reduce ? 'auto' : 'smooth' });
    });
  });
})();
