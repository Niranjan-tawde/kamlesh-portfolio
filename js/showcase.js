/* ============================================================
   SHOWCASE.JS — Portfolio Showcase, Filtering & Video Modal
   Cinematic Portfolio — KAMLESH
   ============================================================ */

// Easy-to-edit project data
const PROJECTS_DATA = [
  {
    id: 1,
    title: 'Cinematic Brand Film',
    category: 'cinematic',
    description: 'A stunning visual journey for a luxury fashion brand.',
    videoUrl: '',
    gradient: 'linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)'
  },
  {
    id: 2,
    title: 'Product Launch Reel',
    category: 'reels',
    description: 'Dynamic Instagram reel for a tech product launch.',
    videoUrl: '',
    gradient: 'linear-gradient(135deg, #2d1b69, #11998e)'
  },
  {
    id: 3,
    title: 'Documentary Short',
    category: 'youtube',
    description: 'Award-nominated short documentary about urban artists.',
    videoUrl: '',
    gradient: 'linear-gradient(135deg, #434343, #000000)'
  },
  {
    id: 4,
    title: 'Luxury Brand Advertisement',
    category: 'brand',
    description: 'Premium commercial for an international luxury brand.',
    videoUrl: '',
    gradient: 'linear-gradient(135deg, #c94b4b, #4b134f)'
  },
  {
    id: 5,
    title: 'Logo Animation Pack',
    category: 'motion',
    description: 'Collection of premium logo reveal animations.',
    videoUrl: '',
    gradient: 'linear-gradient(135deg, #FF6B2B, #ee0979)'
  },
  {
    id: 6,
    title: 'Wedding Highlight Film',
    category: 'wedding',
    description: 'Emotional cinematic wedding highlight reel.',
    videoUrl: '',
    gradient: 'linear-gradient(135deg, #ddd6f3, #faaca8)'
  }
];

window.ShowcaseManager = {
  projects: PROJECTS_DATA,
  currentFilter: 'all',
  modal: null,
  modalIframe: null,
  modalClose: null,
  cards: null,
  filterButtons: null,

  /**
   * Initialize the showcase manager.
   */
  init() {
    this.cards = document.querySelectorAll('.showreel__card');
    this.filterButtons = document.querySelectorAll('.showreel__filter-btn, .btn--filter');
    this.modal = document.getElementById('videoModal');

    if (this.modal) {
      this.modalIframe = this.modal.querySelector('iframe');
      this.modalClose = this.modal.querySelector('.video-modal__close');
    }

    this.renderProjects();
    this.initFilters();
    this.initVideoModal();
    this.initShowreel();
    this.initHoverEffects();
  },

  /**
   * Setup event listeners on existing cards.
   * Cards are pre-rendered in HTML; this wires up interactions.
   */
  renderProjects() {
    // Apply gradient backgrounds from project data to matching cards
    this.cards.forEach(card => {
      const category = card.dataset.category;
      const projectData = this.projects.find(p => p.category === category);
      if (projectData && !card.dataset.gradientApplied) {
        const thumbnail = card.querySelector('.showreel__card-thumbnail, .showreel__card-image');
        if (thumbnail && projectData.gradient) {
          thumbnail.style.background = projectData.gradient;
        }
        card.dataset.gradientApplied = 'true';
      }
    });
  },

  /**
   * Initialize filter button click handlers.
   */
  initFilters() {
    if (!this.filterButtons || this.filterButtons.length === 0) return;

    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.filter || btn.textContent.trim().toLowerCase();

        // Update active state
        this.filterButtons.forEach(b => {
          b.classList.remove('showreel__filter-btn--active', 'active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('showreel__filter-btn--active', 'active');
        btn.setAttribute('aria-selected', 'true');

        this.filterProjects(category);
      });
    });
  },

  /**
   * Filter projects with GSAP animated transitions.
   * @param {string} category - Category to filter by, or 'all'.
   */
  filterProjects(category) {
    this.currentFilter = category;
    this.cards.forEach(card => {
      const visible = category === 'all' || card.dataset.category === category;
      card.hidden = !visible;
      card.style.display = visible ? '' : 'none';
      card.setAttribute('aria-hidden', String(!visible));
    });
  },

  /**
   * Initialize video modal functionality.
   */
  initVideoModal() {
    if (!this.modal) return;

    // Click on cards to open their video
    this.cards.forEach(card => {
      card.addEventListener('click', () => {
        const videoUrl = card.dataset.video;
        if (videoUrl) {
          this.openModal(videoUrl);
        } else {
          // Fall back to project data
          const category = card.dataset.category;
          const project = this.projects.find(p => p.category === category);
          if (project && project.videoUrl) {
            this.openModal(project.videoUrl);
          } else {
            this.showVideoUnavailable();
          }
        }
      });
    });

    // Close button
    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => {
        this.closeModal();
      });
    }

    // Click outside modal content to close
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal || e.target.classList.contains('video-modal__overlay') || e.target.classList.contains('video-modal__backdrop')) {
        this.closeModal();
      }
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('video-modal--active')) {
        this.closeModal();
      }
    });
  },

  /**
   * Open the video modal with the given URL.
   * @param {string} videoUrl - Embeddable video URL.
   */
  openModal(videoUrl) {
    if (!this.modal || !this.modalIframe) return;

    // Set iframe source with autoplay parameter
    const separator = videoUrl.includes('?') ? '&' : '?';
    this.modalIframe.src = videoUrl + separator + 'autoplay=1';

    // Show modal
    this.modal.classList.add('video-modal--active');

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Animate in
    this.modal.setAttribute('aria-hidden', 'false');
    if (window.gsap) {
      window.gsap.fromTo(this.modal.querySelector('.video-modal__content') || this.modal, {
        opacity: 0, scale: 0.9
      }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' });
    }
  },

  /**
   * Close the video modal and stop playback.
   */
  closeModal() {
    if (!this.modal) return;

    // Animate out
    const content = this.modal.querySelector('.video-modal__content') || this.modal;

    const finishClose = () => {
      if (this.modalIframe) this.modalIframe.src = '';
      this.modal.classList.remove('video-modal--active');
      this.modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    if (!window.gsap) {
      finishClose();
      return;
    }
    window.gsap.to(content, {
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        finishClose();
      }
    });
  },

  /**
   * Initialize the showreel play button.
   */
  initShowreel() {
    const playBtn = document.querySelector('.showreel__play-btn');
    if (!playBtn) return;

    // Default showreel video URL
    const showreelUrl = playBtn.dataset.video;

    playBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (showreelUrl) this.openModal(showreelUrl);
      else this.showVideoUnavailable();
    });

    // Pulsing ring animation on play button
    if (!window.gsap) return;
    window.gsap.to(playBtn, {
      boxShadow: '0 0 0 20px rgba(255, 107, 43, 0)',
      duration: 1.5,
      repeat: -1,
      ease: 'power2.out'
    });
  },

  showVideoUnavailable() {
    let notice = document.getElementById('videoLinkNotice');
    if (!notice) {
      notice = document.createElement('div');
      notice.id = 'videoLinkNotice';
      notice.setAttribute('role', 'status');
      Object.assign(notice.style, {
        position: 'fixed', right: '20px', bottom: '20px', zIndex: '10001',
        maxWidth: 'min(360px, calc(100vw - 40px))', padding: '14px 18px',
        background: '#171717', color: '#f4f1ec', border: '1px solid #ff5c24',
        font: '12px/1.5 sans-serif', boxShadow: '0 12px 36px #0009'
      });
      document.body.appendChild(notice);
    }
    notice.textContent = 'Add a real video URL to this project in index.html to enable playback.';
    notice.hidden = false;
    clearTimeout(this._noticeTimer);
    this._noticeTimer = setTimeout(() => { notice.hidden = true; }, 3200);
  },

  /**
   * Initialize enhanced hover effects on showcase cards.
   */
  initHoverEffects() {
    if (!window.gsap) return;
    const gsap = window.gsap;
    this.cards.forEach(card => {
      const overlay = card.querySelector('.showreel__card-overlay');
      const title = card.querySelector('.showreel__card-title');
      const description = card.querySelector('.showreel__card-description');
      const playIcon = card.querySelector('.showreel__card-play');

      // Set initial states for overlay elements
      if (overlay) {
        gsap.set(overlay, { opacity: 0 });
      }
      if (title) {
        gsap.set(title, { y: 20, opacity: 0 });
      }
      if (description) {
        gsap.set(description, { y: 20, opacity: 0 });
      }
      if (playIcon) {
        gsap.set(playIcon, { scale: 0, opacity: 0 });
      }

      card.addEventListener('mouseenter', () => {
        const tl = gsap.timeline();

        // Scale card slightly
        tl.to(card, {
          scale: 1.03,
          duration: 0.4,
          ease: 'power2.out'
        }, 0);

        // Show overlay
        if (overlay) {
          tl.to(overlay, {
            opacity: 1,
            duration: 0.3
          }, 0);
        }

        // Slide in title
        if (title) {
          tl.to(title, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: 'power3.out'
          }, 0.1);
        }

        // Slide in description
        if (description) {
          tl.to(description, {
            y: 0,
            opacity: 1,
            duration: 0.4,
            ease: 'power3.out'
          }, 0.15);
        }

        // Pop in play icon
        if (playIcon) {
          tl.to(playIcon, {
            scale: 1,
            opacity: 1,
            duration: 0.3,
            ease: 'back.out(2)'
          }, 0.2);
        }

        card._hoverTl = tl;
      });

      card.addEventListener('mouseleave', () => {
        // Kill any in-progress hover timeline
        if (card._hoverTl) {
          card._hoverTl.kill();
        }

        const tl = gsap.timeline();

        tl.to(card, {
          scale: 1,
          duration: 0.3,
          ease: 'power2.inOut'
        }, 0);

        if (overlay) {
          tl.to(overlay, { opacity: 0, duration: 0.25 }, 0);
        }
        if (title) {
          tl.to(title, { y: 20, opacity: 0, duration: 0.25 }, 0);
        }
        if (description) {
          tl.to(description, { y: 20, opacity: 0, duration: 0.25 }, 0);
        }
        if (playIcon) {
          tl.to(playIcon, { scale: 0, opacity: 0, duration: 0.2 }, 0);
        }
      });

      // 3D tilt effect on mouse move
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        gsap.to(card, {
          rotateX: rotateX,
          rotateY: rotateY,
          duration: 0.3,
          ease: 'power2.out',
          transformPerspective: 800
        });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, {
          rotateX: 0,
          rotateY: 0,
          duration: 0.5,
          ease: 'power2.out'
        });
      });
    });
  }
};
