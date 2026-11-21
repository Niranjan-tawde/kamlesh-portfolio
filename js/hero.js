/* ============================================================
   HERO.JS — Hero Section Entrance Animations & Interactions
   Cinematic Portfolio — KAMLESH
   ============================================================ */

window.HeroSection = {

  /**
   * Initialize all hero section functionality.
   */
  init() {
    this.animateGradientOrbs();
    this.initParallax();
    this.initScrollFade();
  },

  /**
   * Animate the hero entrance after preloader completes.
   * Called externally by the preloader/app when loading is done.
   */
  animateEntrance() {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    // Grab hero elements
    const heroLabel = document.querySelector('.hero__label');
    const heroTitle = document.querySelector('.hero__title');
    const heroSubtitle = document.querySelector('.hero__subtitle');
    const ctaButtons = document.querySelectorAll('.hero__cta .btn');
    const scrollIndicator = document.querySelector('.hero__scroll-indicator');

    // Set initial states
    gsap.set([heroLabel, heroSubtitle, scrollIndicator], {
      opacity: 0,
      y: 30
    });
    gsap.set(ctaButtons, {
      opacity: 0,
      y: 40
    });

    // 1) Hero label fades in and slides up
    tl.to(heroLabel, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out'
    });

    // 2) Hero title — word-by-word reveal
    if (heroTitle) {
      const words = this._splitTitleIntoWords(heroTitle);
      gsap.set(words, { opacity: 0, y: 80, rotateX: 20 });

      tl.to(words, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 1,
        stagger: 0.08,
        ease: 'expo.out'
      }, '-=0.4');
    }

    // 3) Subtitle fades in
    tl.to(heroSubtitle, {
      opacity: 1,
      y: 0,
      duration: 0.6,
      ease: 'power3.out'
    }, '-=0.5');

    // 4) CTA buttons slide up with stagger
    tl.to(ctaButtons, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      stagger: 0.15,
      ease: 'power3.out'
    }, '-=0.3');

    // 5) Scroll indicator
    if (scrollIndicator) {
      tl.to(scrollIndicator, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out'
      }, '-=0.2');
    }

    return tl;
  },

  /**
   * Split title text into individually animatable word spans.
   * Uses AnimUtils.splitText if available, otherwise does inline splitting.
   */
  _splitTitleIntoWords(titleEl) {
    // Use AnimUtils if available
    if (window.AnimUtils && typeof window.AnimUtils.splitText === 'function') {
      return window.AnimUtils.splitText(titleEl);
    }

    // Inline word splitting
    const lines = titleEl.querySelectorAll('.hero__title-line');
    const wordSpans = [];

    if (lines.length > 0) {
      // If the title is already broken into lines
      lines.forEach(line => {
        const text = line.textContent;
        line.innerHTML = '';
        line.style.overflow = 'hidden';
        line.style.display = 'block';

        const wordsInLine = text.trim().split(/\s+/);
        wordsInLine.forEach((word, idx) => {
          const span = document.createElement('span');
          span.textContent = word;
          span.style.display = 'inline-block';
          span.style.willChange = 'transform, opacity';
          if (idx < wordsInLine.length - 1) {
            span.innerHTML += '&nbsp;';
          }
          line.appendChild(span);
          wordSpans.push(span);
        });
      });
    } else {
      // Single title element
      const text = titleEl.textContent;
      titleEl.innerHTML = '';

      const words = text.trim().split(/\s+/);
      words.forEach((word, idx) => {
        const span = document.createElement('span');
        span.textContent = word;
        span.style.display = 'inline-block';
        span.style.willChange = 'transform, opacity';
        if (idx < words.length - 1) {
          span.innerHTML += '&nbsp;';
        }
        titleEl.appendChild(span);
        wordSpans.push(span);
      });
    }

    return wordSpans;
  },

  /**
   * Mouse-move parallax on hero content.
   * Creates depth layers by moving elements at different rates.
   */
  initParallax() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    const title = document.querySelector('.hero__title');
    const subtitle = document.querySelector('.hero__subtitle');
    const label = document.querySelector('.hero__label');
    const cta = document.querySelector('.hero__cta');

    // Depth multipliers (larger = more movement)
    const layers = [
      { el: label, depth: 0.015 },
      { el: title, depth: 0.02 },
      { el: subtitle, depth: 0.03 },
      { el: cta, depth: 0.025 }
    ].filter(l => l.el);

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let rafId = null;

    const lerp = (start, end, factor) => start + (end - start) * factor;

    const updateParallax = () => {
      currentX = lerp(currentX, targetX, 0.08);
      currentY = lerp(currentY, targetY, 0.08);

      layers.forEach(layer => {
        const moveX = currentX * layer.depth * 100;
        const moveY = currentY * layer.depth * 100;
        gsap.set(layer.el, {
          x: moveX,
          y: moveY
        });
      });

      rafId = requestAnimationFrame(updateParallax);
    };

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    });

    hero.addEventListener('mouseleave', () => {
      targetX = 0;
      targetY = 0;
    });

    rafId = requestAnimationFrame(updateParallax);

    // Store for potential cleanup
    this._parallaxRafId = rafId;
  },

  /**
   * Fade out hero content as the user scrolls down.
   * Uses GSAP ScrollTrigger with scrub for smooth, scroll-linked fading.
   */
  initScrollFade() {
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero__content');
    if (!hero || !heroContent) return;

    // Register ScrollTrigger if not done
    if (typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);
    }

    gsap.to(heroContent, {
      opacity: 0,
      scale: 0.95,
      y: -40,
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: '70% top',
        scrub: 1,
        toggleActions: 'play none none reverse'
      }
    });

    // Also fade the canvas container
    const canvasContainer = document.querySelector('.hero__canvas-container');
    if (canvasContainer) {
      gsap.to(canvasContainer, {
        opacity: 0.3,
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: '70% top',
          scrub: 1
        }
      });
    }
  },

  /**
   * Animate gradient orb elements with slow, organic floating motion.
   * Creates a living, breathing ambient background.
   */
  animateGradientOrbs() {
    const orbs = document.querySelectorAll('.hero__gradient > div, .hero__gradient .hero__orb');

    // Fallback: also try direct children
    const gradientContainer = document.querySelector('.hero__gradient');
    let targets = orbs.length > 0 ? orbs : [];

    if (targets.length === 0 && gradientContainer) {
      targets = gradientContainer.children;
    }

    if (!targets || targets.length === 0) return;

    Array.from(targets).forEach((orb, index) => {
      // Random parameters for each orb
      const duration = 8 + Math.random() * 7; // 8-15 seconds
      const xRange = 40 + Math.random() * 60;
      const yRange = 30 + Math.random() * 50;
      const scaleMin = 0.85 + Math.random() * 0.1;
      const scaleMax = 1.1 + Math.random() * 0.15;
      const delay = index * 1.5;

      // Create infinite yoyo animation
      gsap.to(orb, {
        x: `random(-${xRange}, ${xRange})`,
        y: `random(-${yRange}, ${yRange})`,
        scale: `random(${scaleMin}, ${scaleMax})`,
        rotation: `random(-10, 10)`,
        duration: duration,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: delay
      });

      // Secondary subtle opacity pulse
      gsap.to(orb, {
        opacity: 0.4 + Math.random() * 0.3,
        duration: duration * 0.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        delay: delay + 1
      });
    });
  }
};
