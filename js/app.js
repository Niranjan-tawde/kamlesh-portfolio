/**
 * ==============================================================================
 * APP.JS - Main Application Orchestrator for Kamlesh's Cinematic Portfolio
 * ==============================================================================
 * Coordinates GSAP ScrollTrigger plugins, preloader synchronization, custom cursor,
 * navigation states, smooth scrolling, scroll progress, magnetic buttons, 3D tilt,
 * scroll-triggered section reveals, and auxiliary interactive modules.
 * Loaded LAST after all other scripts.
 */

(function () {
  'use strict';

  const App = {
    isPreloaded: false,
    preloaderInstance: null,
    cursorInstance: null,

    /**
     * Master Initialization
     */
    init() {
      // 1. Initialize GSAP and register plugins
      this.initGSAP();

      // 2. Initialize Custom Cursor immediately so it tracks during intro
      try {
        if (window.CustomCursor) {
          this.cursorInstance = new window.CustomCursor();
          this.cursorInstance.init();
        }
      } catch (err) {
        console.warn('[App] CustomCursor initialization warning:', err);
      }

      // 3. Set up preloader completion handler
      let postPreloadTriggered = false;
      const onPreloaderDone = () => {
        if (postPreloadTriggered) return;
        postPreloadTriggered = true;
        this.isPreloaded = true;
        this.initPostPreloader();
      };

      window.addEventListener('preloaderComplete', onPreloaderDone, { once: true });

      // Fallback timeout in case preloader is disabled or suppressed
      setTimeout(() => {
        if (!postPreloadTriggered) {
          onPreloaderDone();
        }
      }, 4500);

      // 4. Initialize Preloader and begin intro sequence
      try {
        if (window.Preloader) {
          this.preloaderInstance = new window.Preloader();
          this.preloaderInstance.init();
        } else {
          onPreloaderDone();
        }
      } catch (err) {
        console.warn('[App] Preloader initialization warning:', err);
        onPreloaderDone();
      }

      // 5. Setup window resize listener
      window.addEventListener('resize', this.handleResize.bind(this), { passive: true });
    },

    /**
     * Initializes all interactive modules and animations once the preloader completes
     */
    initPostPreloader() {
      // Core UI & Scroll modules
      this.tryExecute('initNavigation', () => this.initNavigation());
      this.tryExecute('initSmoothScroll', () => this.initSmoothScroll());
      this.tryExecute('initScrollProgress', () => this.initScrollProgress());
      this.tryExecute('initMagneticButtons', () => this.initMagneticButtons());
      this.tryExecute('initTiltCards', () => this.initTiltCards());
      this.tryExecute('initScrollReveals', () => this.initScrollReveals());
      this.tryExecute('initMobileMenu', () => this.initMobileMenu());
      this.tryExecute('initBackToTop', () => this.initBackToTop());
      this.tryExecute('initSectionAnimations', () => this.initSectionAnimations());
      this.tryExecute('initLazyLoading', () => this.initLazyLoading());
      this.tryExecute('initTestimonials', () => this.initTestimonials());

      // Auxiliary feature modules loaded via other scripts
      this.initExternalModules();

      // Refresh ScrollTrigger to account for loaded DOM geometry
      if (window.ScrollTrigger) {
        window.ScrollTrigger.refresh();
      }
    },

    /**
     * Helper to safely execute a function with error isolation
     */
    tryExecute(label, fn) {
      try {
        fn();
      } catch (err) {
        console.warn(`[App] Error in ${label}:`, err);
      }
    },

    /**
     * Initialize external feature modules if defined on window
     */
    initExternalModules() {
      const modules = [
        { name: 'HeroSection', ref: window.HeroSection },
        { name: 'ShowcaseManager', ref: window.ShowcaseManager },
        { name: 'MotionShowcase', ref: window.MotionShowcase },
        { name: 'ContactForm', ref: window.ContactForm },
        { name: 'ThreeScene', ref: window.ThreeScene }
      ];

      modules.forEach(({ name, ref }) => {
        if (!ref) return;
        try {
          if (typeof ref === 'function') {
            const instance = new ref();
            if (typeof instance.init === 'function') {
              instance.init();
            }
          } else if (typeof ref.init === 'function') {
            ref.init();
          }
        } catch (err) {
          console.warn(`[App] Error initializing ${name}:`, err);
        }
      });
    },

    /**
     * Initialize GSAP and register ScrollTrigger plugin
     */
    initGSAP() {
      if (window.gsap) {
        if (window.ScrollTrigger) {
          window.gsap.registerPlugin(window.ScrollTrigger);
        }
        window.gsap.defaults({
          ease: 'power2.out',
          duration: 0.8
        });
      }
    },

    /**
     * Setup navigation sticky state, section active highlighting, and smooth clicking
     */
    initNavigation() {
      const navbar = document.getElementById('navbar') || document.querySelector('.nav') || document.querySelector('nav');
      const navLinks = document.querySelectorAll('#navLinks a, .nav-links a, .navbar__links a');
      const sections = document.querySelectorAll('section[id], main > [id], header[id]');

      if (!navbar) return;

      // Sticky scrolled state
      const updateNavbar = () => {
        if (window.scrollY > 50) {
          navbar.classList.add('navbar--scrolled');
        } else {
          navbar.classList.remove('navbar--scrolled');
        }
      };

      window.addEventListener('scroll', updateNavbar, { passive: true });
      updateNavbar();

      // Active nav link highlight using IntersectionObserver
      if (sections.length && 'IntersectionObserver' in window) {
        const observerOptions = {
          root: null,
          rootMargin: '-20% 0px -60% 0px',
          threshold: 0
        };

        const sectionObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const id = entry.target.getAttribute('id');
              navLinks.forEach((link) => {
                const href = link.getAttribute('href');
                if (href === `#${id}`) {
                  link.classList.add('active');
                } else {
                  link.classList.remove('active');
                }
              });
            }
          });
        }, observerOptions);

        sections.forEach((section) => sectionObserver.observe(section));
      }
    },

    /**
     * Smooth scrolling with header offset compensation
     */
    initSmoothScroll() {
      const links = document.querySelectorAll('a[href^="#"]');
      const navbar = document.getElementById('navbar') || document.querySelector('.nav');

      links.forEach((link) => {
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (!href || href === '#') return;

          const target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            const navHeight = navbar ? navbar.offsetHeight : 80;
            const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;

            window.scrollTo({
              top: Math.max(0, targetPos),
              behavior: 'smooth'
            });

            // Update URL hash without jumping
            if (history.pushState) {
              history.pushState(null, null, href);
            }
          }
        });
      });
    },

    /**
     * Real-time scroll progress indicator (0% at top -> 100% at bottom)
     */
    initScrollProgress() {
      let progressBar = document.querySelector('.scroll-progress');

      if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.className = 'scroll-progress';
        progressBar.style.position = 'fixed';
        progressBar.style.top = '0px';
        progressBar.style.left = '0px';
        progressBar.style.height = '2px';
        progressBar.style.width = '0%';
        progressBar.style.backgroundColor = 'var(--orange, #ff5c24)';
        progressBar.style.zIndex = '99999';
        progressBar.style.pointerEvents = 'none';
        progressBar.style.transition = 'width 0.08s linear';
        document.body.appendChild(progressBar);
      }

      const updateProgress = () => {
        const scrollY = window.scrollY || window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      };

      window.addEventListener('scroll', updateProgress, { passive: true });
      updateProgress();
    },

    /**
     * Setup magnetic hover effect on buttons and CTAs
     */
    initMagneticButtons() {
      if (!window.AnimUtils) return;
      const magneticElements = document.querySelectorAll('.magnetic-wrap, .magnet');
      magneticElements.forEach((el) => {
        window.AnimUtils.createMagneticButton(el);
      });
    },

    /**
     * Setup 3D perspective tilt effect on cards
     */
    initTiltCards() {
      if (!window.AnimUtils) return;
      const tiltCards = document.querySelectorAll('.tilt-card');
      tiltCards.forEach((card) => {
        window.AnimUtils.createTiltEffect(card, 12);
      });
    },

    /**
     * Setup general scroll reveal triggers
     */
    initScrollReveals() {
      if (window.AnimUtils && typeof window.AnimUtils.setupScrollReveals === 'function') {
        window.AnimUtils.setupScrollReveals();
      }
    },

    /**
     * Mobile hamburger menu controller
     */
    initMobileMenu() {
      const hamburger =
        document.getElementById('navbarToggle') ||
        document.getElementById('menuBtn') ||
        document.querySelector('.navbar__hamburger') ||
        document.querySelector('.menu-btn');

      const mobileMenu =
        document.querySelector('.navbar__mobile-menu') ||
        document.getElementById('navLinks') ||
        document.querySelector('.nav-links');

      if (!hamburger || !mobileMenu) return;

      const toggleMenu = (forceClose = false) => {
        const isOpen = forceClose ? false : !mobileMenu.classList.contains('navbar__mobile-menu--open') && !mobileMenu.classList.contains('open');

        mobileMenu.classList.toggle('navbar__mobile-menu--open', isOpen);
        mobileMenu.classList.toggle('open', isOpen);
        hamburger.classList.toggle('is-active', isOpen);
        hamburger.classList.toggle('navbar__toggle--active', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
        document.body.classList.toggle('no-scroll', isOpen);

        // Animate hamburger lines if present
        const lines = hamburger.querySelectorAll('span, i');
        if (lines.length >= 2 && window.gsap) {
          if (isOpen) {
            window.gsap.to(lines[0], { rotation: 45, y: 4, duration: 0.3 });
            if (lines[1]) window.gsap.to(lines[1], { rotation: -45, y: -4, duration: 0.3 });
          } else {
            window.gsap.to(lines, { rotation: 0, y: 0, duration: 0.3 });
          }
        }
      };

      hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMenu();
      });

      // Close menu when any menu link is clicked
      const menuLinks = mobileMenu.querySelectorAll('a');
      menuLinks.forEach((link) => {
        link.addEventListener('click', () => {
          toggleMenu(true);
        });
      });

      // Close menu on Escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          toggleMenu(true);
        }
      });
    },

    /**
     * Back to top button controller
     */
    initBackToTop() {
      const backToTopBtn =
        document.querySelector('.footer__back-to-top') ||
        document.querySelector('.back-to-top') ||
        document.querySelector('footer a[href="#top"], .contact-footer a[href="#top"]');

      if (!backToTopBtn) return;

      backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    },

    initTestimonials() {
      const track = document.getElementById('testimonialsTrack');
      const cards = track ? Array.from(track.querySelectorAll('.testimonial-card')) : [];
      const prev = document.getElementById('prevTestimonial');
      const next = document.getElementById('nextTestimonial');
      if (!track || cards.length < 2 || !prev || !next) return;

      let index = 0;
      const update = () => {
        const cardWidth = cards[0].getBoundingClientRect().width;
        track.style.transform = `translateX(${-index * cardWidth}px)`;
      };
      prev.addEventListener('click', () => {
        index = (index - 1 + cards.length) % cards.length;
        update();
      });
      next.addEventListener('click', () => {
        index = (index + 1) % cards.length;
        update();
      });
      window.addEventListener('resize', update, { passive: true });
      update();
    },

    /**
     * Staggered section-specific animations using GSAP and ScrollTrigger
     */
    initSectionAnimations() {
      if (!window.gsap || !window.ScrollTrigger) return;
      const gsap = window.gsap;
      const ScrollTrigger = window.ScrollTrigger;

      // 1. About Section Animations
      const aboutSection = document.getElementById('about');
      if (aboutSection) {
        const bioParagraphs = aboutSection.querySelectorAll('.about-copy p, .about__text p');
        if (bioParagraphs.length) {
          gsap.from(bioParagraphs, {
            scrollTrigger: {
              trigger: aboutSection,
              start: 'top 75%',
              once: true
            },
            y: 40,
            opacity: 0,
            duration: 0.9,
            stagger: 0.18,
            ease: 'power3.out'
          });
        }

        // Animate stat counters
        const statElements = aboutSection.querySelectorAll('.stat strong, [data-count]');
        statElements.forEach((statEl) => {
          if (window.AnimUtils) {
            window.AnimUtils.animateCounter(statEl);
          }
        });

        // Portrait photo reveal
        const photo = aboutSection.querySelector('.about-photo img, .about__photo img');
        if (photo) {
          gsap.from(photo, {
            scrollTrigger: {
              trigger: photo,
              start: 'top 80%',
              once: true
            },
            scale: 1.15,
            opacity: 0.4,
            duration: 1.2,
            ease: 'power2.out'
          });
        }
      }

      // 2. Showreel / Work Section Animations
      const showreelSection = document.getElementById('work') || document.getElementById('showreel');
      if (showreelSection) {
        const cards = showreelSection.querySelectorAll('.showreel__card, .project, .featured');
        if (cards.length) {
          gsap.from(cards, {
            scrollTrigger: {
              trigger: showreelSection.querySelector('.grid, .showreel__grid, .work-toolbar') || showreelSection,
              start: 'top 80%',
              once: true
            },
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out'
          });
        }
      }

      // 3. Services Section Animations
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        const serviceCards = servicesSection.querySelectorAll('.service-card, .service');
        if (serviceCards.length) {
          gsap.from(serviceCards, {
            scrollTrigger: {
              trigger: servicesSection,
              start: 'top 75%',
              once: true
            },
            y: 40,
            opacity: 0,
            duration: 0.7,
            stagger: 0.08,
            ease: 'power2.out'
          });
        }
      }

      // 4. Process Section Animations (Connecting line + Steps)
      const processSection = document.getElementById('process');
      if (processSection) {
        const processLine = processSection.querySelector('.process-line i, .process__line i, #processLine i');
        const steps = processSection.querySelectorAll('.step, .process__step');

        const processTl = gsap.timeline({
          scrollTrigger: {
            trigger: processSection,
            start: 'top 75%',
            once: true
          }
        });

        if (processLine) {
          processTl.fromTo(
            processLine,
            { width: '0%' },
            { width: '100%', duration: 1.4, ease: 'power2.inOut' }
          );
        }

        if (steps.length) {
          processTl.from(
            steps,
            {
              y: 35,
              opacity: 0,
              duration: 0.7,
              stagger: 0.12,
              ease: 'power3.out'
            },
            '-=0.8'
          );
        }
      }

      // 5. Experience Section Animations
      const expSection = document.querySelector('.experience') || document.getElementById('experience');
      if (expSection) {
        const timelineItems = expSection.querySelectorAll('.exp-row, .experience__item');
        if (timelineItems.length) {
          gsap.from(timelineItems, {
            scrollTrigger: {
              trigger: expSection,
              start: 'top 75%',
              once: true
            },
            x: -30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
            ease: 'power2.out'
          });
        }

        const quote = expSection.querySelector('.quote, .experience__quote');
        if (quote) {
          gsap.from(quote, {
            scrollTrigger: {
              trigger: quote,
              start: 'top 80%',
              once: true
            },
            y: 30,
            opacity: 0,
            duration: 1.0,
            ease: 'power3.out'
          });
        }
      }

      // 6. Contact Section Animations (Headline words + Form/Bottom)
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        const headline = contactSection.querySelector('h2, .contact__headline');
        const contactBottom = contactSection.querySelector('.contact-bottom, #contactForm, .project-form');

        const contactTl = gsap.timeline({
          scrollTrigger: {
            trigger: contactSection,
            start: 'top 75%',
            once: true
          }
        });

        if (headline) {
          // If AnimUtils splitText exists, split headline words for cinematic staggering
          let words = [];
          if (window.AnimUtils) {
            words = window.AnimUtils.splitText(headline, 'words');
          }

          if (words.length) {
            contactTl.from(words, {
              y: 40,
              opacity: 0,
              duration: 0.8,
              stagger: 0.08,
              ease: 'power3.out'
            });
          } else {
            contactTl.from(headline, {
              y: 40,
              opacity: 0,
              duration: 0.9,
              ease: 'power3.out'
            });
          }
        }

        if (contactBottom) {
          contactTl.from(
            contactBottom,
            {
              y: 30,
              opacity: 0,
              duration: 0.8,
              ease: 'power2.out'
            },
            '-=0.4'
          );
        }
      }
    },

    /**
     * Image progressive lazy loading
     */
    initLazyLoading() {
      const lazyImages = document.querySelectorAll('img[data-src]');
      if (!lazyImages.length) return;

      if ('IntersectionObserver' in window) {
        const imgObserver = new IntersectionObserver((entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src;
              img.classList.add('loaded');
              obs.unobserve(img);
            }
          });
        });

        lazyImages.forEach((img) => imgObserver.observe(img));
      } else {
        lazyImages.forEach((img) => {
          img.src = img.dataset.src;
        });
      }
    },

    /**
     * Debounced window resize handler
     */
    handleResize() {
      const debounceFn = window.AnimUtils && window.AnimUtils.debounce
        ? window.AnimUtils.debounce
        : (fn, ms) => {
            let t;
            return (...args) => {
              clearTimeout(t);
              t = setTimeout(() => fn(...args), ms);
            };
          };

      const debouncedRefresh = debounceFn(() => {
        if (window.ScrollTrigger) {
          window.ScrollTrigger.refresh();
        }
      }, 250);

      debouncedRefresh();
    }
  };

  // Run initialization once DOM is loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      App.init();
    });
  } else {
    App.init();
  }
})();
