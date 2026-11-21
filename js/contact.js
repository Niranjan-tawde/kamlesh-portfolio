/* ============================================================
   CONTACT.JS — Contact Form & Social Link Interactions
   Cinematic Portfolio — KAMLESH
   ============================================================ */

// Easy-to-edit contact info
const CONTACT_INFO = {
  whatsapp: '',
  email: '',
  instagram: '',
  linkedin: '',
  youtube: ''
};

window.ContactForm = {
  form: null,
  submitBtn: null,
  inputs: null,
  notificationContainer: null,

  /**
   * Initialize all contact form functionality.
   */
  init() {
    this.initForm();
    this.initSocialLinks();
    this.initFloatingLabels();
    this.createNotificationContainer();
  },

  /**
   * Create a container for toast notifications.
   */
  createNotificationContainer() {
    if (document.getElementById('notification-container')) {
      this.notificationContainer = document.getElementById('notification-container');
      return;
    }

    this.notificationContainer = document.createElement('div');
    this.notificationContainer.id = 'notification-container';
    Object.assign(this.notificationContainer.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '10000',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    });
    document.body.appendChild(this.notificationContainer);
  },

  /**
   * Initialize the contact form with submit and input listeners.
   */
  initForm() {
    this.form = document.querySelector('.contact__form') || document.getElementById('contactForm');
    if (!this.form) return;

    this.submitBtn = this.form.querySelector('button[type="submit"]') || this.form.querySelector('.btn--submit');
    this.inputs = this.form.querySelectorAll('input, textarea, select');

    // Submit handler
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Real-time validation on input
    this.inputs.forEach(input => {
      input.addEventListener('input', () => {
        this.validateField(input);
      });

      input.addEventListener('blur', () => {
        this.validateField(input);
      });

      // Remove error on focus
      input.addEventListener('focus', () => {
        input.classList.remove('input--error');
        const errorMsg = input.parentElement.querySelector('.input-error-msg');
        if (errorMsg) {
          errorMsg.remove();
        }
      });
    });
  },

  /**
   * Validate a single form field.
   * @param {HTMLElement} input - The input element to validate.
   * @returns {boolean} - Whether the field is valid.
   */
  validateField(input) {
    const value = input.value.trim();
    const type = input.type;
    const isRequired = input.hasAttribute('required');
    let isValid = true;
    let errorMessage = '';

    // Remove existing error
    input.classList.remove('input--error');
    const existingError = input.parentElement.querySelector('.input-error-msg');
    if (existingError) existingError.remove();

    // Required check
    if (isRequired && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    // Email format check
    if (isValid && type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
      }
    }

    // Phone format check (basic)
    if (isValid && (type === 'tel' || input.name === 'phone') && value) {
      const phoneRegex = /^[\+\d\s\-\(\)]{7,20}$/;
      if (!phoneRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid phone number';
      }
    }

    // Apply error styling
    if (!isValid) {
      input.classList.add('input--error');

      const errorEl = document.createElement('span');
      errorEl.className = 'input-error-msg';
      Object.assign(errorEl.style, {
        color: '#ff4444',
        fontSize: '0.75rem',
        marginTop: '4px',
        display: 'block',
        fontFamily: "'Inter', sans-serif"
      });
      errorEl.textContent = errorMessage;
      input.parentElement.appendChild(errorEl);
    } else if (value) {
      input.classList.add('input--valid');
    }

    return isValid;
  },

  /**
   * Handle form submission.
   * @param {Event} e - Submit event.
   */
  handleSubmit(e) {
    e.preventDefault();

    // Validate all fields
    let allValid = true;
    this.inputs.forEach(input => {
      if (!this.validateField(input)) {
        allValid = false;
      }
    });

    if (!allValid) {
      this.showNotification('Please fill in all required fields correctly.', 'error');
      this.shakeButton();
      return;
    }

    // Collect form data
    const formData = new FormData(this.form);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Construct mailto link
    const name = data.name || data.firstName || '';
    const email = data.email || '';
    const phone = data.phone || '';
    const service = data.service || data.subject || '';
    const message = data.message || '';

    const subject = encodeURIComponent(`Portfolio Inquiry from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      (phone ? `Phone: ${phone}\n` : '') +
      (service ? `Service: ${service}\n` : '') +
      `\nMessage:\n${message}`
    );

    const mailtoLink = `mailto:${CONTACT_INFO.email}?subject=${subject}&body=${body}`;

    if (!CONTACT_INFO.email) {
      this.showNotification('Contact email is not configured yet. Add it in js/contact.js.', 'error');
      return;
    }

    // Animate submit button
    this.animateSubmitSuccess();

    // Open mailto
    window.location.href = mailtoLink;

    // Show success notification
    this.showNotification('Opening your email client! Thank you for reaching out.', 'success');

    // Reset form after a delay
    setTimeout(() => {
      this.form.reset();
      this.inputs.forEach(input => {
        input.classList.remove('input--valid');
        const label = input.parentElement.querySelector('label');
        if (label) {
          label.classList.remove('label--floated');
        }
      });
    }, 1000);
  },

  /**
   * Brief shake animation on the submit button for errors.
   */
  shakeButton() {
    if (!this.submitBtn) return;

    if (!window.gsap) return;
    window.gsap.timeline()
      .to(this.submitBtn, { x: -8, duration: 0.08 })
      .to(this.submitBtn, { x: 8, duration: 0.08 })
      .to(this.submitBtn, { x: -6, duration: 0.08 })
      .to(this.submitBtn, { x: 6, duration: 0.08 })
      .to(this.submitBtn, { x: 0, duration: 0.08 });
  },

  /**
   * Success animation on the submit button.
   */
  animateSubmitSuccess() {
    if (!this.submitBtn) return;

    const originalText = this.submitBtn.textContent;
    const originalBg = this.submitBtn.style.background;

    if (!window.gsap) return;
    window.gsap.timeline()
      .to(this.submitBtn, {
        scale: 0.95,
        duration: 0.15,
        ease: 'power2.in'
      })
      .to(this.submitBtn, {
        scale: 1.05,
        duration: 0.2,
        ease: 'back.out(3)',
        onStart: () => {
          this.submitBtn.textContent = '✓ Sent!';
          this.submitBtn.style.background = 'linear-gradient(135deg, #11998e, #38ef7d)';
        }
      })
      .to(this.submitBtn, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      })
      .call(() => {
        // Restore original text after delay
        setTimeout(() => {
          this.submitBtn.textContent = originalText;
          this.submitBtn.style.background = originalBg;
        }, 2000);
      }, null, '+=0.5');
  },

  /**
   * Update social link hrefs from CONTACT_INFO and wire up interactions.
   */
  initSocialLinks() {
    // WhatsApp link
    const whatsappLinks = document.querySelectorAll('a[data-social="whatsapp"]');
    const whatsappMessage = encodeURIComponent("Hi Kamlesh! I'd like to discuss a project.");
    whatsappLinks.forEach(link => {
      if (!CONTACT_INFO.whatsapp) { this.disableSocialLink(link); return; }
      link.href = `https://wa.me/${CONTACT_INFO.whatsapp.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`;
      const handle = link.querySelector('.contact__social-handle');
      if (handle) handle.textContent = CONTACT_INFO.whatsapp;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });

    // Email link
    const emailLinks = document.querySelectorAll('a[data-social="email"]');
    emailLinks.forEach(link => {
      if (!CONTACT_INFO.email) { this.disableSocialLink(link); return; }
      link.href = `mailto:${CONTACT_INFO.email}`;
      const handle = link.querySelector('.contact__social-handle');
      if (handle) handle.textContent = CONTACT_INFO.email;
    });

    // Instagram link
    const instaLinks = document.querySelectorAll('a[data-social="instagram"]');
    instaLinks.forEach(link => {
      if (!CONTACT_INFO.instagram) { this.disableSocialLink(link); return; }
      link.href = CONTACT_INFO.instagram;
      const handle = link.querySelector('.contact__social-handle');
      if (handle) handle.textContent = CONTACT_INFO.instagram.replace(/^https?:\/\/(www\.)?instagram\.com\//, '@').replace(/\/$/, '');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });

    // LinkedIn link
    const linkedinLinks = document.querySelectorAll('a[data-social="linkedin"]');
    linkedinLinks.forEach(link => {
      if (!CONTACT_INFO.linkedin) { this.disableSocialLink(link); return; }
      link.href = CONTACT_INFO.linkedin;
      const handle = link.querySelector('.contact__social-handle');
      if (handle) handle.textContent = CONTACT_INFO.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\//, '').replace(/\/$/, '');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });

    // YouTube link
    const youtubeLinks = document.querySelectorAll('a[data-social="youtube"]');
    youtubeLinks.forEach(link => {
      if (!CONTACT_INFO.youtube) { this.disableSocialLink(link); return; }
      link.href = CONTACT_INFO.youtube;
      const handle = link.querySelector('.contact__social-handle');
      if (handle) handle.textContent = CONTACT_INFO.youtube.replace(/^https?:\/\/(www\.)?youtube\.com\//, '@');
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    });

    // Add hover animations to all social links
    const allSocialLinks = document.querySelectorAll('.social-link, .contact__social-link, [data-social]');
    allSocialLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        if (!window.gsap) return;
        window.gsap.to(link, {
          scale: 1.15,
          y: -3,
          duration: 0.3,
          ease: 'back.out(2)'
        });
      });

      link.addEventListener('mouseleave', () => {
        if (!window.gsap) return;
        window.gsap.to(link, {
          scale: 1,
          y: 0,
          duration: 0.3,
          ease: 'power2.out'
        });
      });
    });
  },

  disableSocialLink(link) {
    link.removeAttribute('href');
    link.removeAttribute('target');
    link.setAttribute('aria-disabled', 'true');
    link.tabIndex = -1;
    link.hidden = true;
  },

  /**
   * Display a temporary toast notification.
   * @param {string} message - Notification message.
   * @param {string} type - 'success' or 'error'.
   */
  showNotification(message, type) {
    if (!this.notificationContainer) {
      this.createNotificationContainer();
    }

    const notification = document.createElement('div');
    notification.className = `toast-notification toast-notification--${type}`;

    const bgColor = type === 'success'
      ? 'linear-gradient(135deg, #11998e, #38ef7d)'
      : 'linear-gradient(135deg, #ff416c, #ff4b2b)';

    Object.assign(notification.style, {
      background: bgColor,
      color: '#ffffff',
      padding: '14px 24px',
      borderRadius: '12px',
      fontSize: '0.9rem',
      fontWeight: '500',
      fontFamily: "'Inter', sans-serif",
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      pointerEvents: 'auto',
      cursor: 'pointer',
      maxWidth: '380px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transform: 'translateX(120%)',
      opacity: '0'
    });

    // Icon
    const icon = type === 'success' ? '✓' : '✕';
    notification.innerHTML = `
      <span style="font-size:1.2rem; font-weight:700;">${icon}</span>
      <span>${message}</span>
    `;

    this.notificationContainer.appendChild(notification);

    // Animate in
    if (window.gsap) {
      window.gsap.to(notification, { x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' });
    } else {
      notification.style.transform = 'translateX(0)';
      notification.style.opacity = '1';
    }

    // Click to dismiss
    notification.addEventListener('click', () => {
      this.dismissNotification(notification);
    });

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      this.dismissNotification(notification);
    }, 3000);
  },

  /**
   * Dismiss a toast notification with animation.
   * @param {HTMLElement} notification - The notification element.
   */
  dismissNotification(notification) {
    if (!notification || notification._dismissed) return;
    notification._dismissed = true;

    if (!window.gsap) {
      notification.remove();
      return;
    }
    window.gsap.to(notification, {
      x: 120,
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }
    });
  },

  /**
   * Handle floating label behavior — detect autofilled inputs and keep labels floated.
   */
  initFloatingLabels() {
    const formGroups = document.querySelectorAll('.form-group, .contact__form-group');

    formGroups.forEach(group => {
      const input = group.querySelector('input, textarea');
      const label = group.querySelector('label');
      if (!input || !label) return;

      // Check if input already has a value (e.g. autofill)
      const checkValue = () => {
        if (input.value && input.value.trim() !== '') {
          label.classList.add('label--floated');
          input.classList.add('input--has-value');
        } else {
          label.classList.remove('label--floated');
          input.classList.remove('input--has-value');
        }
      };

      // Initial check
      checkValue();

      // Also check after a brief delay (autofill detection)
      setTimeout(checkValue, 100);
      setTimeout(checkValue, 500);
      setTimeout(checkValue, 1500);

      // On focus, float label
      input.addEventListener('focus', () => {
        label.classList.add('label--floated');
      });

      // On blur, check if should stay floated
      input.addEventListener('blur', () => {
        checkValue();
      });

      // On input change
      input.addEventListener('input', () => {
        checkValue();
      });

      // Detect autofill via animation (Chrome-specific but widely applicable)
      input.addEventListener('animationstart', (e) => {
        if (e.animationName === 'onAutoFillStart' || e.animationName.includes('autofill')) {
          label.classList.add('label--floated');
          input.classList.add('input--has-value');
        }
      });
    });
  }
};
