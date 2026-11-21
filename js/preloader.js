/**
 * ==============================================================================
 * PRELOADER.JS - Cinematic Intro Animation Sequence for Kamlesh's Portfolio
 * ==============================================================================
 * Manages full-screen cinematic preloader timeline:
 * 1. Black screen lock (body.no-scroll)
 * 2. Progress bar 0% -> 100% and counter count-up
 * 3. Staggered letter slide-up reveal of "KAMLESH"
 * 4. Tagline fade-in
 * 5. Scale-up fade-out exit and 'preloaderComplete' event dispatch
 */

(function (window) {
  'use strict';

  class Preloader {
    constructor() {
      this.preloader =
        document.getElementById('preloader') ||
        document.querySelector('.preloader') ||
        document.querySelector('.loader');

      this.nameEl = null;
      this.taglineEl = null;
      this.progressBar = null;
      this.counter = null;
      this.timeline = null;
      this.letters = [];
      this.hasCompleted = false;

      if (this.preloader) {
        this.nameEl =
          this.preloader.querySelector('.preloader__name') ||
          this.preloader.querySelector('.load-name') ||
          this.preloader.querySelector('h1');

        this.taglineEl =
          this.preloader.querySelector('.preloader__tagline') ||
          this.preloader.querySelector('.loader-top span:first-child') ||
          this.preloader.querySelector('.loader-top');

        this.progressBar =
          this.preloader.querySelector('.preloader__progress-bar') ||
          this.preloader.querySelector('.loadline i') ||
          this.preloader.querySelector('.loadline');

        this.counter =
          this.preloader.querySelector('.preloader__counter') ||
          document.getElementById('loadPercent') ||
          this.preloader.querySelector('#loadPercent, .counter');
      }

      this.init = this.init.bind(this);
      this.createTimeline = this.createTimeline.bind(this);
      this.animateProgress = this.animateProgress.bind(this);
      this.reveal = this.reveal.bind(this);
      this.exit = this.exit.bind(this);
      this.finish = this.finish.bind(this);
    }

    /**
     * Start the preloader sequence
     */
    init() {
      // If no preloader in markup, complete immediately
      if (!this.preloader) {
        this.finish();
        return;
      }

      // 1. Lock screen scroll
      document.body.classList.add('no-scroll');

      // Prepare name letters for cinematic slide-up reveal
      this.prepareLetters();

      // Ensure progress bar initial state
      if (this.progressBar) {
        this.progressBar.style.width = '0%';
      }

      if (this.counter) {
        this.counter.textContent = '00';
      }

      // Check if GSAP is available
      if (window.gsap) {
        this.createTimeline();
      } else {
        // Fallback progress animation if GSAP is delayed or missing
        this.fallbackSequence();
      }
    }

    /**
     * Prepare name letters wrapped in spans for staggered translateY reveal
     */
    prepareLetters() {
      if (!this.nameEl) return;

      const existingSpans = this.nameEl.querySelectorAll('.char, .letter, span');
      if (existingSpans.length > 2) {
        this.letters = Array.from(existingSpans);
        return;
      }

      // Split text into individual character spans
      const text = this.nameEl.textContent.trim() || 'KAMLESH.';
      this.nameEl.innerHTML = '';
      this.letters = [];

      Array.from(text).forEach((char) => {
        const span = document.createElement('span');
        span.className = 'preloader__char';
        span.textContent = char;
        span.style.display = 'inline-block';
        span.style.willChange = 'transform, opacity';
        span.style.transform = 'translateY(110%)';
        span.style.opacity = '0';
        if (char === '.') {
          span.style.color = 'var(--orange, #ff5c24)';
        }
        this.nameEl.appendChild(span);
        this.letters.push(span);
      });
    }

    /**
     * Build master GSAP timeline
     */
    createTimeline() {
      const gsap = window.gsap;
      this.timeline = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        onComplete: () => {
          this.finish();
        }
      });

      // Step 2: Progress bar (0% -> 100%) and counter count-up over 2 seconds
      const counterState = { progress: 0 };
      this.timeline.to(
        counterState,
        {
          progress: 100,
          duration: 2.0,
          ease: 'power2.inOut',
          onUpdate: () => {
            const val = Math.round(counterState.progress);
            if (this.counter) {
              this.counter.textContent = String(val).padStart(2, '0');
            }
          }
        },
        0
      );

      if (this.progressBar) {
        this.timeline.to(
          this.progressBar,
          {
            width: '100%',
            duration: 2.0,
            ease: 'power2.inOut'
          },
          0
        );
      }

      // Step 3: At ~50% (~1.0s), name letters start revealing one by one with stagger
      if (this.letters.length) {
        this.timeline.to(
          this.letters,
          {
            y: '0%',
            opacity: 1,
            duration: 0.8,
            stagger: 0.06,
            ease: 'power3.out'
          },
          1.0
        );
      }

      // Step 4: At ~80% (~1.6s), tagline fades in below the name
      if (this.taglineEl) {
        this.timeline.fromTo(
          this.taglineEl,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power2.out'
          },
          1.6
        );
      }

      // Step 5: At 100% (~2.0s), brief pause (0.3s), then preloader scales up slightly and fades out
      this.timeline.to(
        this.preloader,
        {
          scale: 1.04,
          opacity: 0,
          duration: 0.85,
          ease: 'power3.inOut'
        },
        2.3
      );
    }

    /**
     * Programmatic trigger to animate progress manually
     * @param {number} target - 0 to 100
     * @param {number} duration - seconds
     */
    animateProgress(target = 100, duration = 2) {
      if (this.timeline) return;

      if (window.gsap && this.progressBar) {
        window.gsap.to(this.progressBar, { width: `${target}%`, duration, ease: 'power2.out' });
      }
    }

    /**
     * Programmatic trigger to reveal name elements
     */
    reveal() {
      if (this.letters.length && window.gsap) {
        window.gsap.to(this.letters, {
          y: '0%',
          opacity: 1,
          duration: 0.8,
          stagger: 0.05,
          ease: 'power3.out'
        });
      }
    }

    /**
     * Smooth exit transition
     */
    exit() {
      if (this.timeline && this.timeline.isActive()) {
        this.timeline.seek(2.3);
        return;
      }

      if (window.gsap && this.preloader) {
        window.gsap.to(this.preloader, {
          scale: 1.04,
          opacity: 0,
          duration: 0.8,
          ease: 'power3.inOut',
          onComplete: () => this.finish()
        });
      } else {
        this.finish();
      }
    }

    /**
     * Complete sequence, release scroll, dispatch event, hide preloader
     */
    finish() {
      if (this.hasCompleted) return;
      this.hasCompleted = true;

      // 6. Remove no-scroll from body
      document.body.classList.remove('no-scroll');
      document.body.classList.remove('loading');

      if (this.preloader) {
        // 8. Add class preloader--hidden and done, then set display none
        this.preloader.classList.add('preloader--hidden', 'done');
        setTimeout(() => {
          this.preloader.style.display = 'none';
        }, 600);
      }

      // 7. Trigger preloaderComplete event
      const event = new CustomEvent('preloaderComplete', {
        detail: { timestamp: performance.now(), status: 'ready' }
      });
      window.dispatchEvent(event);
    }

    /**
     * Fallback sequence if GSAP is unavailable
     */
    fallbackSequence() {
      let current = 0;
      const interval = setInterval(() => {
        current += 5;
        if (this.counter) {
          this.counter.textContent = String(Math.min(100, current)).padStart(2, '0');
        }
        if (this.progressBar) {
          this.progressBar.style.width = `${Math.min(100, current)}%`;
        }

        if (current >= 50 && this.letters.length) {
          this.letters.forEach((s) => {
            s.style.transform = 'translateY(0%)';
            s.style.opacity = '1';
            s.style.transition = 'all 0.6s ease';
          });
        }

        if (current >= 80 && this.taglineEl) {
          this.taglineEl.style.opacity = '1';
          this.taglineEl.style.transition = 'opacity 0.5s ease';
        }

        if (current >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (this.preloader) {
              this.preloader.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
              this.preloader.style.transform = 'scale(1.04)';
              this.preloader.style.opacity = '0';
            }
            setTimeout(() => {
              this.finish();
            }, 700);
          }, 300);
        }
      }, 70);
    }
  }

  // Expose to window namespace
  window.Preloader = Preloader;
})(window);
