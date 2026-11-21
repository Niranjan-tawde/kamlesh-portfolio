/**
 * ==============================================================================
 * CURSOR.JS - Cinematic Custom Cursor & Ambient Glow for Kamlesh's Portfolio
 * ==============================================================================
 * High-performance mouse follower with lerped smoothing, ambient radial glow,
 * interactive state morphing (hover, text, click), and mobile touch detection.
 */

(function (window) {
  'use strict';

  class CustomCursor {
    constructor() {
      // Find or create primary cursor element
      this.cursor = document.getElementById('customCursor') || document.querySelector('.custom-cursor') || document.querySelector('.cursor');
      // Find or create ambient glow element
      this.glow = document.getElementById('cursorGlow') || document.querySelector('.cursor-glow') || document.querySelector('.glow');

      this.dot = null;
      this.ring = null;

      // Position vectors
      this.target = { x: -100, y: -100 };
      this.pos = { x: -100, y: -100 };       // Outer ring position (lerp 0.15)
      this.dotPos = { x: -100, y: -100 };    // Inner dot position (instant / fast lerp 0.75)
      this.glowPos = { x: -100, y: -100 };   // Ambient glow position (slow lerp 0.05)

      // State tracking
      this.currentState = 'default';
      this.isVisible = false;
      this.isMouseDown = false;
      this.isHoveringInteractive = false;
      this.isHoveringText = false;
      this.rafId = null;
      this.isTouch = false;

      // Bind methods
      this.updatePosition = this.updatePosition.bind(this);
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onMouseDown = this.onMouseDown.bind(this);
      this.onMouseUp = this.onMouseUp.bind(this);
      this.onMouseLeave = this.onMouseLeave.bind(this);
      this.onMouseEnter = this.onMouseEnter.bind(this);
      this.onElementOver = this.onElementOver.bind(this);
      this.onElementOut = this.onElementOut.bind(this);
    }

    /**
     * Check if client is a touch device
     */
    checkIsTouch() {
      return (
        window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (window.AnimUtils && window.AnimUtils.isMobile())
      );
    }

    /**
     * Ensure DOM elements exist with proper internal sub-structure
     */
    ensureElements() {
      if (!this.cursor) {
        this.cursor = document.createElement('div');
        this.cursor.id = 'customCursor';
        this.cursor.className = 'custom-cursor';
        document.body.appendChild(this.cursor);
      }

      // Check for or construct inner ring & dot
      this.ring = this.cursor.querySelector('.custom-cursor__ring') || this.cursor.querySelector('.ring');
      this.dot = this.cursor.querySelector('.custom-cursor__dot') || this.cursor.querySelector('.dot');

      if (!this.ring && !this.cursor.classList.contains('cursor')) {
        this.ring = document.createElement('div');
        this.ring.className = 'custom-cursor__ring';
        this.cursor.appendChild(this.ring);
      }

      if (!this.dot && !this.cursor.classList.contains('cursor')) {
        this.dot = document.createElement('div');
        this.dot.className = 'custom-cursor__dot';
        this.cursor.appendChild(this.dot);
      }

      // If existing simple cursor from markup, use it as ring
      if (!this.ring) {
        this.ring = this.cursor;
      }

      if (!this.glow) {
        this.glow = document.createElement('div');
        this.glow.id = 'cursorGlow';
        this.glow.className = 'cursor-glow';
        document.body.appendChild(this.glow);
      }

      // Style ambient glow to ensure 600px radial gradient if not styled by external CSS
      if (!this.glow.style.width) {
        this.glow.style.width = '600px';
        this.glow.style.height = '600px';
        this.glow.style.borderRadius = '50%';
        this.glow.style.position = 'fixed';
        this.glow.style.top = '0px';
        this.glow.style.left = '0px';
        this.glow.style.pointerEvents = 'none';
        this.glow.style.zIndex = '0';
        this.glow.style.background = 'radial-gradient(circle, rgba(255, 92, 36, 0.08) 0%, rgba(255, 92, 36, 0.02) 40%, transparent 70%)';
        this.glow.style.filter = 'blur(20px)';
        this.glow.style.opacity = '0';
        this.glow.style.transition = 'opacity 0.4s ease';
      }

      // Ensure cursor initial styling
      this.cursor.style.position = 'fixed';
      this.cursor.style.top = '0px';
      this.cursor.style.left = '0px';
      this.cursor.style.pointerEvents = 'none';
      this.cursor.style.zIndex = '9999';
      this.cursor.style.opacity = '0';
      this.cursor.style.willChange = 'transform, opacity';
    }

    /**
     * Initialize cursor events and render loop
     */
    init() {
      this.isTouch = this.checkIsTouch();
      if (this.isTouch) {
        this.hide();
        return;
      }

      this.ensureElements();
      this.addEventListeners();
      this.addHoverListeners();

      // Start render loop
      if (!this.rafId) {
        this.rafId = requestAnimationFrame(this.updatePosition);
      }
    }

    /**
     * Attach core window and document listeners
     */
    addEventListeners() {
      window.addEventListener('mousemove', this.onMouseMove, { passive: true });
      window.addEventListener('mousedown', this.onMouseDown, { passive: true });
      window.addEventListener('mouseup', this.onMouseUp, { passive: true });
      document.addEventListener('mouseleave', this.onMouseLeave);
      document.addEventListener('mouseenter', this.onMouseEnter);

      // Listen for window resize to check for touch/desktop transitions
      window.addEventListener(
        'resize',
        () => {
          this.isTouch = this.checkIsTouch();
          if (this.isTouch) {
            this.hide();
          } else {
            this.show();
          }
        },
        { passive: true }
      );
    }

    /**
     * Smooth render loop updating ring, dot, and ambient glow
     */
    updatePosition() {
      if (this.isTouch) return;

      const lerp = (start, end, factor) =>
        window.AnimUtils ? window.AnimUtils.lerp(start, end, factor) : start + (end - start) * factor;

      // Outer ring follows with smooth factor ~0.15
      this.pos.x = lerp(this.pos.x, this.target.x, 0.15);
      this.pos.y = lerp(this.pos.y, this.target.y, 0.15);

      // Inner dot is fast / instant ~0.75
      this.dotPos.x = lerp(this.dotPos.x, this.target.x, 0.75);
      this.dotPos.y = lerp(this.dotPos.y, this.target.y, 0.75);

      // Ambient radial glow follows very slowly ~0.05
      this.glowPos.x = lerp(this.glowPos.x, this.target.x, 0.05);
      this.glowPos.y = lerp(this.glowPos.y, this.target.y, 0.05);

      // Render positions using translate3d for GPU acceleration
      if (this.ring && this.dot && this.ring !== this.cursor) {
        this.ring.style.transform = `translate3d(${this.pos.x.toFixed(2)}px, ${this.pos.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
        this.dot.style.transform = `translate3d(${this.dotPos.x.toFixed(2)}px, ${this.dotPos.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
      } else if (this.cursor) {
        this.cursor.style.transform = `translate3d(${this.pos.x.toFixed(2)}px, ${this.pos.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
      }

      if (this.glow) {
        this.glow.style.transform = `translate3d(${this.glowPos.x.toFixed(2)}px, ${this.glowPos.y.toFixed(2)}px, 0) translate(-50%, -50%)`;
      }

      this.rafId = requestAnimationFrame(this.updatePosition);
    }

    /**
     * Mouse move handler
     */
    onMouseMove(e) {
      if (this.isTouch) return;

      if (!this.isVisible) {
        this.pos.x = e.clientX;
        this.pos.y = e.clientY;
        this.dotPos.x = e.clientX;
        this.dotPos.y = e.clientY;
        this.glowPos.x = e.clientX;
        this.glowPos.y = e.clientY;
        this.show();
      }

      this.target.x = e.clientX;
      this.target.y = e.clientY;
    }

    /**
     * Mouse down handler
     */
    onMouseDown() {
      if (this.isTouch) return;
      this.isMouseDown = true;
      this.setState('click');
    }

    /**
     * Mouse up handler
     */
    onMouseUp() {
      if (this.isTouch) return;
      this.isMouseDown = false;
      if (this.isHoveringText) {
        this.setState('text');
      } else if (this.isHoveringInteractive) {
        this.setState('hover');
      } else {
        this.setState('default');
      }
    }

    /**
     * Window mouse leave handler
     */
    onMouseLeave() {
      this.hide();
    }

    /**
     * Window mouse enter handler
     */
    onMouseEnter() {
      if (!this.isTouch) {
        this.show();
      }
    }

    /**
     * Add delegated hover listeners for interactive and text elements
     */
    addHoverListeners() {
      document.addEventListener('mouseover', this.onElementOver, { passive: true });
      document.addEventListener('mouseout', this.onElementOut, { passive: true });
    }

    onElementOver(e) {
      if (this.isTouch) return;

      const interactiveTarget = e.target.closest(
        'a, button, [role="button"], .showreel__card, .service-card, .tools__item-icon, .featured, .project, .pill, .filter, .social, .magnet, .tilt-card, .service, .step, .review-controls button, #menuBtn'
      );

      const textTarget = e.target.closest('input, textarea, [contenteditable="true"]');

      if (textTarget) {
        this.isHoveringText = true;
        this.isHoveringInteractive = false;
        if (!this.isMouseDown) this.setState('text');
      } else if (interactiveTarget) {
        this.isHoveringInteractive = true;
        this.isHoveringText = false;
        if (!this.isMouseDown) this.setState('hover');
      }
    }

    onElementOut(e) {
      if (this.isTouch) return;

      const interactiveTarget = e.target.closest(
        'a, button, [role="button"], .showreel__card, .service-card, .tools__item-icon, .featured, .project, .pill, .filter, .social, .magnet, .tilt-card, .service, .step, .review-controls button, #menuBtn'
      );

      const textTarget = e.target.closest('input, textarea, [contenteditable="true"]');

      if (interactiveTarget || textTarget) {
        this.isHoveringInteractive = false;
        this.isHoveringText = false;
        if (!this.isMouseDown) {
          this.setState('default');
        }
      }
    }

    /**
     * Update visual state of cursor
     * @param {'default'|'hover'|'click'|'text'} state
     */
    setState(state) {
      if (this.isTouch || !this.cursor) return;

      this.currentState = state;

      // Clear modifier classes
      this.cursor.classList.remove(
        'custom-cursor--hover',
        'custom-cursor--click',
        'custom-cursor--text',
        'big'
      );

      switch (state) {
        case 'hover':
          this.cursor.classList.add('custom-cursor--hover', 'big');
          break;
        case 'click':
          this.cursor.classList.add('custom-cursor--click');
          break;
        case 'text':
          this.cursor.classList.add('custom-cursor--text');
          break;
        case 'default':
        default:
          break;
      }
    }

    /**
     * Show cursor and ambient glow
     */
    show() {
      if (this.isTouch) return;
      this.isVisible = true;
      if (this.cursor) {
        this.cursor.style.opacity = '1';
        this.cursor.style.display = 'block';
      }
      if (this.glow) {
        this.glow.style.opacity = '1';
        this.glow.style.display = 'block';
      }
    }

    /**
     * Hide cursor and ambient glow
     */
    hide() {
      this.isVisible = false;
      if (this.cursor) {
        this.cursor.style.opacity = '0';
      }
      if (this.glow) {
        this.glow.style.opacity = '0';
      }
    }

    /**
     * Clean up listeners and stop RAF loop
     */
    destroy() {
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('mousedown', this.onMouseDown);
      window.removeEventListener('mouseup', this.onMouseUp);
      document.removeEventListener('mouseleave', this.onMouseLeave);
      document.removeEventListener('mouseenter', this.onMouseEnter);
      document.removeEventListener('mouseover', this.onElementOver);
      document.removeEventListener('mouseout', this.onElementOut);
    }
  }

  // Expose to window namespace
  window.CustomCursor = CustomCursor;
})(window);
