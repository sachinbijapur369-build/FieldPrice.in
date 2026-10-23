document.documentElement.classList.add('js');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function qs(selector, scope = document) {
    return scope.querySelector(selector);
}

function qsa(selector, scope = document) {
    return Array.from(scope.querySelectorAll(selector));
}

/* ══════════════════════════════════════
   Progress Bar — Cinematic scroll indicator
   ══════════════════════════════════════ */
function initProgressBar() {
    const progressBar = qs('#progress-bar');
    if (!progressBar) return;

    const update = () => {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = `${pct}%`;
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
}

/* ══════════════════════════════════════
   Navigation — Frosted glass with scroll
   ══════════════════════════════════════ */
function initNav() {
    const nav = qs('#mainNav');
    const hamburger = qs('#hamburger');
    const navLinks = qs('#navLinks');

    if (nav) {
        const updateNav = () => nav.classList.toggle('scrolled', window.scrollY > 18);
        updateNav();
        window.addEventListener('scroll', updateNav, { passive: true });
    }

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            const isOpen = hamburger.classList.toggle('active');
            navLinks.classList.toggle('open', isOpen);
            hamburger.setAttribute('aria-expanded', String(isOpen));
        });

        navLinks.addEventListener('click', (event) => {
            if (event.target.closest('a')) {
                hamburger.classList.remove('active');
                navLinks.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    const page = window.location.pathname.split('/').pop() || 'index.html';
    qsa('.nav-links a').forEach((link) => {
        const href = link.getAttribute('href') || '';
        const isHome = page === '' || page === 'index.html';
        const isCurrent = href === page || (isHome && href === 'index.html');
        link.classList.toggle('active', isCurrent);
        if (isCurrent) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

/* ══════════════════════════════════════
   Reveal Animations — Scroll-triggered
   ══════════════════════════════════════ */
function initReveal() {
    const revealEls = qsa('.reveal');
    if (!revealEls.length) return;

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
        revealEls.forEach((el) => el.classList.add('in'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const delay = Number(el.dataset.delay || 0);
            window.setTimeout(() => el.classList.add('in'), delay);
            observer.unobserve(el);
        });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });

    revealEls.forEach((el, index) => {
        // Check if parent has stagger-reveal
        const parentStagger = el.closest('.stagger-reveal');
        if (parentStagger) {
            const siblings = qsa('.reveal', parentStagger);
            const siblingIndex = siblings.indexOf(el);
            el.dataset.delay = String(siblingIndex * 80);
        } else if (!el.dataset.delay) {
            el.dataset.delay = String(Math.min(index * 40, 200));
        }
        observer.observe(el);
    });
}

/* ══════════════════════════════════════
   Metrics — Counting animation
   ══════════════════════════════════════ */
function initMetrics() {
    const metrics = qs('.metrics');
    const nums = qsa('.metric-num[data-target]');
    if (!metrics || !nums.length) return;

    let played = false;
    const animate = () => {
        if (played) return;
        played = true;

        nums.forEach((el) => {
            const target = Number(el.dataset.target);
            const suffix = el.dataset.suffix || '';
            if (!Number.isFinite(target)) return;

            if (prefersReducedMotion) {
                el.textContent = `${target}${suffix}`;
                return;
            }

            const start = performance.now();
            const duration = 1400;
            const tick = (now) => {
                const progress = Math.min((now - start) / duration, 1);
                // Ease out quart for premium feel
                const eased = 1 - Math.pow(1 - progress, 4);
                el.textContent = `${Math.round(target * eased)}${suffix}`;
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    };

    if (!('IntersectionObserver' in window)) {
        animate();
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
            animate();
            observer.disconnect();
        }
    }, { threshold: 0.25 });
    observer.observe(metrics);
}

/* ══════════════════════════════════════
   GSAP — Premium scroll animations
   ══════════════════════════════════════ */
function initGsap() {
    if (prefersReducedMotion || !window.gsap) return;

    const gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    // Hero entrance — cinematic stagger
    const heroParts = qsa('.hero-kicker, .hero h1, .hero-body, .hero-btns, .hero-proof, .hero-console');
    if (heroParts.length) {
        gsap.from(heroParts, {
            y: 40,
            opacity: 0,
            duration: 1.1,
            stagger: .1,
            ease: 'power3.out'
        });
    }

    // Product page hero entrance
    const phParts = qsa('.ph-tag, .ph h1, .ph p, .ph-btns');
    if (phParts.length) {
        gsap.from(phParts, {
            y: 35,
            opacity: 0,
            duration: 1,
            stagger: .09,
            ease: 'power3.out'
        });
    }

    if (window.ScrollTrigger) {
        // Float-up parallax for cards
        qsa('.why-card, .how-card, .prod-card, .brand-cell, .intel-card, .detail-card, .buying-step').forEach((el) => {
            gsap.to(el, {
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%',
                    end: 'bottom 8%',
                    scrub: 1.2
                },
                y: -12,
                ease: 'none'
            });
        });

        // Section headings — fade in with slide
        qsa('.sec h2, .detail-section h2, .how-sec h2').forEach((el) => {
            gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                y: 30,
                opacity: 0,
                duration: .9,
                ease: 'power3.out'
            });
        });

        // Eyebrows — slide from left
        qsa('.eyebrow').forEach((el) => {
            gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                x: -20,
                opacity: 0,
                duration: .7,
                ease: 'power2.out'
            });
        });

        // Rules — width animation
        qsa('.rule-dk, .rule-lt').forEach((el) => {
            gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start: 'top 92%',
                    toggleActions: 'play none none none'
                },
                width: 0,
                duration: .8,
                ease: 'power2.out'
            });
        });

        // Console bars — width grow
        qsa('.console-bar span:nth-child(2)').forEach((bar) => {
            gsap.from(bar, {
                scrollTrigger: {
                    trigger: bar,
                    start: 'top 90%',
                    toggleActions: 'play none none none'
                },
                scaleX: 0,
                transformOrigin: 'left center',
                duration: 1,
                ease: 'power2.out'
            });
        });

        // Inline CTA — scale entrance
        qsa('.inline-cta').forEach((el) => {
            gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                y: 30,
                opacity: 0,
                scale: .96,
                duration: .9,
                ease: 'power3.out'
            });
        });

        // Metric cells — stagger pop
        const metricCells = qsa('.metric-cell');
        if (metricCells.length) {
            gsap.from(metricCells, {
                scrollTrigger: {
                    trigger: '.metrics',
                    start: 'top 80%',
                    toggleActions: 'play none none none'
                },
                y: 20,
                opacity: 0,
                stagger: .1,
                duration: .7,
                ease: 'power2.out'
            });
        }

        // Trust banner items
        const trustItems = qsa('.trust-item');
        if (trustItems.length) {
            gsap.from(trustItems, {
                scrollTrigger: {
                    trigger: '.trust-banner',
                    start: 'top 85%',
                    toggleActions: 'play none none none'
                },
                y: 15,
                opacity: 0,
                stagger: .08,
                duration: .6,
                ease: 'power2.out'
            });
        }
    }
}

/* ══════════════════════════════════════
   Magnetic Hover Effect — For buttons
   ══════════════════════════════════════ */
function initMagneticButtons() {
    if (prefersReducedMotion) return;

    qsa('.wa-float, .quote-float').forEach((btn) => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px) scale(1.05)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });
}

/* ══════════════════════════════════════
   Parallax Methods — Mouse, Scroll & Tilt
   ══════════════════════════════════════ */
function initParallax() {
    if (prefersReducedMotion) return;

    // 1. Hero Multi-Layer Mouse Parallax
    const hero = qs('.hero');
    if (hero && window.innerWidth >= 768) {
        const bg = qs('.hero-bg', hero);
        const overlay = qs('.hero-overlay', hero);
        const consolePanel = qs('.hero-console', hero);
        const copy = qs('.hero-copy', hero);

        hero.addEventListener('mousemove', (e) => {
            const rect = hero.getBoundingClientRect();
            const normX = (e.clientX - rect.left) / rect.width - 0.5;
            const normY = (e.clientY - rect.top) / rect.height - 0.5;

            if (bg) bg.style.transform = `translate3d(${normX * -24}px, ${normY * -18}px, 0) scale(1.03)`;
            if (overlay) overlay.style.transform = `translate3d(${normX * 12}px, ${normY * 10}px, 0)`;
            if (consolePanel) {
                consolePanel.style.transform = `perspective(1000px) rotateY(${normX * 8}deg) rotateX(${-normY * 8}deg) translate3d(${normX * 14}px, ${normY * 12}px, 12px)`;
            }
            if (copy) copy.style.transform = `translate3d(${normX * 6}px, ${normY * 6}px, 0)`;
        }, { passive: true });

        hero.addEventListener('mouseleave', () => {
            [bg, overlay, consolePanel, copy].forEach((el) => {
                if (el) {
                    el.style.transform = '';
                    el.style.transition = 'transform 0.65s var(--ease-out)';
                    setTimeout(() => { el.style.transition = ''; }, 650);
                }
            });
        });
    }

    // 2. Interactive Card Spotlight & 3D Tilt Parallax
    const cards = qsa('.prod-card, .intel-card, .why-card, .how-card, .console-panel, .detail-card, .buying-step, .industry-card');
    cards.forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);

            if (window.innerWidth >= 768) {
                const normX = (x / rect.width) - 0.5;
                const normY = (y / rect.height) - 0.5;
                const tiltX = -normY * 6.5;
                const tiltY = normX * 6.5;
                card.style.transform = `perspective(850px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateZ(6px)`;
            }
        }, { passive: true });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.transition = 'transform 0.5s var(--ease-out)';
            setTimeout(() => { card.style.transition = ''; }, 500);
        });
    });

    // 3. Scroll Velocity Parallax for Brand Marquee
    const marqueeTrack = qs('.marquee-track');
    if (marqueeTrack) {
        let lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            const delta = Math.abs(currentScrollY - lastScrollY);
            lastScrollY = currentScrollY;
            const speedBoost = Math.min(delta * 0.12, 1.8);
            marqueeTrack.style.animationDuration = `${Math.max(16 - speedBoost * 5, 8)}s`;
        }, { passive: true });
    }
}

/* ══════════════════════════════════════
   Contact Form — WhatsApp integration
   ══════════════════════════════════════ */
function initContactForm() {
    const form = qs('.quote-form');
    if (!form) return;

    const status = qs('.form-status', form);
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const data = new FormData(form);
        const message = [
            'Hi FieldPrice.in, I need a verified quote.',
            `Company: ${data.get('company') || ''}`,
            `Contact: ${data.get('name') || ''}`,
            `Email: ${data.get('email') || ''}`,
            `WhatsApp: ${data.get('phone') || ''}`,
            `Category: ${data.get('category') || ''}`,
            `Requirement: ${data.get('specification') || ''}`
        ].join('\n');

        if (status) status.textContent = 'Opening WhatsApp with your requirement...';
        window.open(`https://wa.me/919535657931?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    });
}

/* ══════════════════════════════════════
   Smooth Scrolling Enhancement
   ══════════════════════════════════════ */
function initSmoothScroll() {
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

/* ══════════════════════════════════════
   Init Everything
   ══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    initProgressBar();
    initNav();
    initReveal();
    initMetrics();
    initGsap();
    initMagneticButtons();
    initParallax();
    initContactForm();
    initSmoothScroll();
});
