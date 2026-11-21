/**
 * ==============================================================================
 * ANIMATIONS.JS - Core Animation Utilities for Kamlesh's Cinematic Portfolio
 * ==============================================================================
 * Shared animation helper functions, mathematical utilities, magnetic buttons,
 * 3D tilt effects, parallax controllers, and scroll reveal systems.
 * Loaded before dependent modules.
 */

(function (window) {
  'use strict';

  const AnimUtils = {
    /**
     * Linear interpolation between two values
     * @param {number} start - Initial value
     * @param {number} end - Target value
     * @param {number} factor - Interpolation factor (0 - 1)
     * @returns {number} Interpolated value
     */
    lerp(start, end, factor) {
      return start + (end - start) * factor;
    },

    /**
     * Map a number from one range to another
     * @param {number} value - Input value
     * @param {number} inMin - Source range minimum
     * @param {number} inMax - Source range maximum
     * @param {number} outMin - Target range minimum
     * @param {number} outMax - Target range maximum
     * @returns {number} Mapped value
     */
    mapRange(value, inMin, inMax, outMin, outMax) {
      if (inMin === inMax) return outMin;
      return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    },

    /**
     * Clamp a number between a minimum and maximum limit
     * @param {number} value - Input value
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @returns {number} Clamped value
     */
    clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    },

    /**
     * Check if current client device is mobile or touch-primary
     * @returns {boolean} True if mobile/touch device
     */
    isMobile() {
      return (
        window.innerWidth <= 768 ||
        window.matchMedia('(max-width: 768px)').matches ||
        window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0
      );
    },

    /**
     * Debounce utility to rate-limit expensive computations
     * @param {Function} func - Function to execute
     * @param {number} wait - Wait duration in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 100) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    /**
     * Split text into characters, words, or lines for cinematic staggered reveals
     * Preserves whitespace and structure to prevent awkward layout breaks.
     * @param {HTMLElement|string} target - Element or selector string
     * @param {string} type - 'chars' | 'words' | 'lines'
     * @returns {Array<HTMLElement>} Array of created span elements
     */
    splitText(target, type = 'chars') {
      const element = typeof target === 'string' ? document.querySelector(target) : target;
      if (!element) return [];

      // Avoid re-splitting an already split element
      if (element.dataset.splitApplied === 'true') {
        if (type === 'chars') return Array.from(element.querySelectorAll('.char'));
        if (type === 'words') return Array.from(element.querySelectorAll('.word'));
        if (type === 'lines') return Array.from(element.querySelectorAll('.line'));
      }

      const rawText = element.textContent.trim();
      element.setAttribute('data-split-applied', 'true');
      element.setAttribute('data-original-text', rawText);
      element.innerHTML = '';

      const createdSpans = [];

      if (type === 'chars') {
        const words = rawText.split(/\s+/);
        words.forEach((wordText, wordIndex) => {
          const wordSpan = document.createElement('span');
          wordSpan.className = 'word';
          wordSpan.style.display = 'inline-block';
          wordSpan.style.whiteSpace = 'nowrap';

          const chars = Array.from(wordText);
          chars.forEach((char) => {
            const charSpan = document.createElement('span');
            charSpan.className = 'char';
            charSpan.style.display = 'inline-block';
            charSpan.textContent = char;
            wordSpan.appendChild(charSpan);
            createdSpans.push(charSpan);
          });

          element.appendChild(wordSpan);

          if (wordIndex < words.length - 1) {
            const spaceSpan = document.createElement('span');
            spaceSpan.className = 'char-space';
            spaceSpan.innerHTML = '&nbsp;';
            spaceSpan.style.display = 'inline-block';
            element.appendChild(spaceSpan);
          }
        });
      } else if (type === 'words') {
        const words = rawText.split(/\s+/);
        words.forEach((wordText, wordIndex) => {
          const wordSpan = document.createElement('span');
          wordSpan.className = 'word';
          wordSpan.style.display = 'inline-block';
          wordSpan.textContent = wordText;
          element.appendChild(wordSpan);
          createdSpans.push(wordSpan);

          if (wordIndex < words.length - 1) {
            const spaceNode = document.createTextNode(' ');
            element.appendChild(spaceNode);
          }
        });
      } else if (type === 'lines') {
        // Line splitting grouping by visual baseline
        const words = rawText.split(/\s+/);
        const tempSpans = words.map((w) => {
          const s = document.createElement('span');
          s.style.display = 'inline-block';
          s.textContent = w + ' ';
          element.appendChild(s);
          return s;
        });

        const linesMap = new Map();
        tempSpans.forEach((span) => {
          const top = Math.round(span.offsetTop);
          if (!linesMap.has(top)) linesMap.set(top, []);
          linesMap.get(top).push(span.textContent.trim());
        });

        element.innerHTML = '';
        linesMap.forEach((lineWords) => {
          const lineSpan = document.createElement('span');
          lineSpan.className = 'line';
          lineSpan.style.display = 'block';
          lineSpan.style.overflow = 'hidden';

          const innerSpan = document.createElement('span');
          innerSpan.className = 'line-inner';
          innerSpan.style.display = 'block';
          innerSpan.textContent = lineWords.join(' ');

          lineSpan.appendChild(innerSpan);
          element.appendChild(lineSpan);
          createdSpans.push(innerSpan);
        });
      }

      return createdSpans;
    },

    /**
     * Animate numeric counters from 0 to target value with easing
     * Triggered by ScrollTrigger when entering viewport.
     * @param {HTMLElement|string} targetEl - Element or selector
     * @param {number|null} targetVal - Optional explicit target number
     * @param {number} duration - Animation duration in seconds
     * @param {string} suffix - Optional suffix e.g. '+' or '%'
     */
    animateCounter(targetEl, targetVal = null, duration = 2, suffix = '') {
      const element = typeof targetEl === 'string' ? document.querySelector(targetEl) : targetEl;
      if (!element) return;

      const rawCount = element.getAttribute('data-count') || element.textContent;
      const parsedNum = targetVal !== null ? Number(targetVal) : parseFloat(rawCount) || 0;
      const detectedSuffix = suffix || (rawCount.includes('+') ? '+' : rawCount.includes('%') ? '%' : '');

      element.textContent = '0' + detectedSuffix;

      const runAnimation = () => {
        if (window.gsap) {
          const counterObj = { value: 0 };
          window.gsap.to(counterObj, {
            value: parsedNum,
            duration: duration,
            ease: 'power2.out',
            onUpdate: () => {
              element.textContent = Math.round(counterObj.value) + detectedSuffix;
            }
          });
        } else {
          // Fallback RAF ease-out animation if GSAP is not present
          const startTime = performance.now();
          const msDuration = duration * 1000;

          const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / msDuration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(parsedNum * ease);
            element.textContent = current + detectedSuffix;

            if (progress < 1) {
              requestAnimationFrame(step);
            }
          };
          requestAnimationFrame(step);
        }
      };

      if (window.ScrollTrigger && window.gsap) {
        window.ScrollTrigger.create({
          trigger: element,
          start: 'top 85%',
          once: true,
          onEnter: runAnimation
        });
      } else if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(
          (entries, obs) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                runAnimation();
                obs.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.2 }
        );
        observer.observe(element);
      } else {
        runAnimation();
      }
    },

    /**
     * Create magnetic attraction effect on buttons and interactive pills
     * Applies subtle smooth movement following cursor up to 15px.
     * @param {HTMLElement|string} wrapper - Parent magnetic container
     */
    createMagneticButton(wrapper) {
      const el = typeof wrapper === 'string' ? document.querySelector(wrapper) : wrapper;
      if (!el || this.isMobile()) return;

      const child =
        el.querySelector('button, a, .magnetic-target, .pill, .nav-cta, .social') ||
        el.firstElementChild ||
        el;

      const state = {
        targetX: 0,
        targetY: 0,
        currentX: 0,
        currentY: 0,
        isHovered: false,
        rafId: null
      };

      const maxDistance = 15; // 15px toward cursor
      const lerpFactor = 0.18;

      const render = () => {
        state.currentX = AnimUtils.lerp(state.currentX, state.targetX, lerpFactor);
        state.currentY = AnimUtils.lerp(state.currentY, state.targetY, lerpFactor);

        if (window.gsap) {
          window.gsap.set(child, {
            x: state.currentX,
            y: state.currentY,
            overwrite: 'auto'
          });
        } else {
          child.style.transform = `translate3d(${state.currentX.toFixed(2)}px, ${state.currentY.toFixed(2)}px, 0)`;
        }

        const delta = Math.abs(state.targetX - state.currentX) + Math.abs(state.targetY - state.currentY);
        if (state.isHovered || delta > 0.1) {
          state.rafId = requestAnimationFrame(render);
        } else {
          state.rafId = null;
        }
      };

      const onMouseMove = (e) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        // Scale offset to max distance
        const normalizedX = (deltaX / (rect.width / 2)) * maxDistance;
        const normalizedY = (deltaY / (rect.height / 2)) * maxDistance;

        state.targetX = AnimUtils.clamp(normalizedX, -maxDistance, maxDistance);
        state.targetY = AnimUtils.clamp(normalizedY, -maxDistance, maxDistance);

        if (!state.rafId) {
          state.rafId = requestAnimationFrame(render);
        }
      };

      const onMouseEnter = () => {
        state.isHovered = true;
        if (!state.rafId) {
          state.rafId = requestAnimationFrame(render);
        }
      };

      const onMouseLeave = () => {
        state.isHovered = false;
        state.targetX = 0;
        state.targetY = 0;

        if (window.gsap) {
          window.gsap.to(child, {
            x: 0,
            y: 0,
            duration: 0.6,
            ease: 'elastic.out(1, 0.4)',
            overwrite: 'auto'
          });
          if (state.rafId) {
            cancelAnimationFrame(state.rafId);
            state.rafId = null;
          }
          state.currentX = 0;
          state.currentY = 0;
        } else {
          if (!state.rafId) {
            state.rafId = requestAnimationFrame(render);
          }
        }
      };

      el.addEventListener('mouseenter', onMouseEnter, { passive: true });
      el.addEventListener('mousemove', onMouseMove, { passive: true });
      el.addEventListener('mouseleave', onMouseLeave, { passive: true });
    },

    /**
     * Create interactive 3D perspective tilt effect on cards
     * @param {HTMLElement|string} targetCard - Card element or selector
     * @param {number} maxTilt - Maximum rotation degrees (default: 10)
     */
    createTiltEffect(targetCard, maxTilt = 10) {
      const card = typeof targetCard === 'string' ? document.querySelector(targetCard) : targetCard;
      if (!card || this.isMobile()) return;

      card.style.transformStyle = 'preserve-3d';
      card.style.willChange = 'transform';

      const onMouseMove = (e) => {
        const rect = card.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        const xCenter = rect.width / 2;
        const yCenter = rect.height / 2;

        const rotateX = ((clientY - yCenter) / yCenter) * -maxTilt;
        const rotateY = ((clientX - xCenter) / xCenter) * maxTilt;

        if (window.gsap) {
          window.gsap.to(card, {
            rotateX: rotateX,
            rotateY: rotateY,
            transformPerspective: 1000,
            duration: 0.35,
            ease: 'power1.out',
            overwrite: 'auto'
          });
        } else {
          card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
        }
      };

      const onMouseLeave = () => {
        if (window.gsap) {
          window.gsap.to(card, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.7,
            ease: 'power2.out',
            overwrite: 'auto'
          });
        } else {
          card.style.transition = 'transform 0.5s ease-out';
          card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
          setTimeout(() => {
            card.style.transition = '';
          }, 500);
        }
      };

      card.addEventListener('mousemove', onMouseMove, { passive: true });
      card.addEventListener('mouseleave', onMouseLeave, { passive: true });
    },

    /**
     * Create smooth vertical parallax scroll effect on an element
     * @param {HTMLElement|string} targetEl - Element or selector
     * @param {number} speed - Parallax speed multiplier (positive or negative)
     */
    createParallax(targetEl, speed = 0.5) {
      const element = typeof targetEl === 'string' ? document.querySelector(targetEl) : targetEl;
      if (!element) return;

      if (window.gsap && window.ScrollTrigger) {
        const distance = speed * (AnimUtils.isMobile() ? 40 : 100);
        window.gsap.fromTo(
          element,
          { y: -distance },
          {
            y: distance,
            ease: 'none',
            scrollTrigger: {
              trigger: element,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          }
        );
      }
    },

    /**
     * Setup scroll-triggered reveal animations for .fade-up, .scale-in, .fade-in elements
     * Adds --visible, is-visible and respective modifier classes when entering viewport.
     */
    setupScrollReveals() {
      const revealElements = document.querySelectorAll(
        '.fade-up, .scale-in, .fade-in, .reveal, .stagger-children'
      );
      if (!revealElements.length) return;

      revealElements.forEach((el) => {
        const hasStagger = el.classList.contains('stagger-children');
        const children = hasStagger ? Array.from(el.children) : [];

        const activateClasses = () => {
          el.classList.add('--visible', 'is-visible', 'visible');
          if (el.classList.contains('fade-up')) el.classList.add('fade-up--visible');
          if (el.classList.contains('scale-in')) el.classList.add('scale-in--visible');
          if (el.classList.contains('fade-in')) el.classList.add('fade-in--visible');

          if (hasStagger && children.length && window.gsap) {
            window.gsap.fromTo(
              children,
              { y: 30, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                stagger: 0.1,
                ease: 'power2.out',
                overwrite: 'auto'
              }
            );
          }
        };

        if (window.gsap && window.ScrollTrigger) {
          window.ScrollTrigger.create({
            trigger: el,
            start: 'top 82%',
            once: true,
            onEnter: () => {
              activateClasses();
            }
          });
        } else if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver(
            (entries, obs) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  activateClasses();
                  obs.unobserve(entry.target);
                }
              });
            },
            { threshold: 0.18 }
          );
          observer.observe(el);
        } else {
          activateClasses();
        }
      });
    }
  };

  // Expose to window namespace
  window.AnimUtils = AnimUtils;
})(window);
