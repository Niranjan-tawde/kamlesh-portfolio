/* ============================================================
   MOTION-GRAPHICS.JS — Live Motion Graphics Demos
   Cinematic Portfolio — KAMLESH
   ============================================================ */

window.MotionShowcase = {
  canvases: {},
  animationIds: {},
  contexts: {},
  observer: null,
  isMobile: window.innerWidth < 768,

  /**
   * Initialize all motion graphics demos.
   */
  init() {
    this.isMobile = window.innerWidth < 768;
    this.initIntersectionObserver();
    this.handleResize();

    // Register each demo
    const demos = [
      { id: 'motionKinetic', type: 'canvas', initFn: 'initKineticTypography' },
      { id: 'motionParticles', type: 'canvas', initFn: 'initParticleSystem' },
      { id: 'motionGlitch', type: 'element', initFn: 'initGlitchEffect' },
      { id: 'motionGeometric', type: 'canvas', initFn: 'initGeometricComposition' },
      { id: 'motionLightTrails', type: 'canvas', initFn: 'initLightTrails' },
      { id: 'motionLiquid', type: 'element', initFn: 'initLiquidMorph' }
    ];

    demos.forEach(demo => {
      const el = document.getElementById(demo.id);
      if (!el) return;

      if (demo.type === 'canvas') {
        this.canvases[demo.id] = el;
        this.contexts[demo.id] = el.getContext('2d');
        this._sizeCanvas(el);
      }

      // Store init function reference
      el._demoInit = demo.initFn;
      el._demoId = demo.id;
      el._initialized = false;

      // Observe for visibility
      this.observer.observe(el);
    });
  },

  /**
   * Size a canvas to its parent container.
   */
  _sizeCanvas(canvas) {
    const parent = canvas.parentElement;
    if (!parent) return;
    canvas.width = parent.clientWidth || 400;
    canvas.height = parent.clientHeight || 300;
  },

  /**
   * IntersectionObserver — only animate demos when visible.
   */
  initIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const id = entry.target._demoId;
        if (!id) return;

        if (entry.isIntersecting) {
          // Initialize on first view, then start
          if (!entry.target._initialized) {
            const initFn = entry.target._demoInit;
            if (this[initFn]) {
              this[initFn](entry.target);
              entry.target._initialized = true;
            }
          }
          this.startAnimation(id);
        } else {
          this.stopAnimation(id);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '50px'
    });
  },

  // =====================================================
  // 1. KINETIC TYPOGRAPHY
  // =====================================================

  initKineticTypography(canvas) {
    const ctx = this.contexts[canvas._demoId];
    if (!ctx) return;

    const words = ['CREATE', 'DESIGN', 'ANIMATE', 'INSPIRE'];
    let currentWordIndex = 0;
    let phase = 'scaleIn'; // scaleIn, hold, dissolve
    let phaseProgress = 0;
    let particles = [];
    const targetFps = this.isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFps;
    let lastFrameTime = 0;

    const getWordMetrics = (word) => {
      const fontSize = Math.min(canvas.width * 0.15, 60);
      ctx.font = `bold ${fontSize}px 'Inter', 'Arial', sans-serif`;
      return {
        width: ctx.measureText(word).width,
        fontSize: fontSize
      };
    };

    const createDissolveParticles = (word) => {
      const metrics = getWordMetrics(word);
      particles = [];

      // Render word to offscreen canvas for pixel sampling
      const offscreen = document.createElement('canvas');
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      const offCtx = offscreen.getContext('2d');

      offCtx.fillStyle = '#ffffff';
      offCtx.font = `bold ${metrics.fontSize}px 'Inter', 'Arial', sans-serif`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillText(word, canvas.width / 2, canvas.height / 2);

      const imageData = offCtx.getImageData(0, 0, canvas.width, canvas.height);
      const step = this.isMobile ? 6 : 4;

      for (let y = 0; y < canvas.height; y += step) {
        for (let x = 0; x < canvas.width; x += step) {
          const idx = (y * canvas.width + x) * 4;
          if (imageData.data[idx + 3] > 128) {
            particles.push({
              x: x,
              y: y,
              origX: x,
              origY: y,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4 - 2,
              alpha: 1,
              size: 1 + Math.random() * 1.5
            });
          }
        }
      }
    };

    const animate = (timestamp) => {
      this.animationIds[canvas._demoId] = requestAnimationFrame(animate);

      if (timestamp - lastFrameTime < frameInterval) return;
      lastFrameTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const word = words[currentWordIndex];
      phaseProgress += 1 / targetFps;

      if (phase === 'scaleIn') {
        const metrics = getWordMetrics(word);
        const progress = Math.min(phaseProgress / 0.6, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const scale = 0.3 + eased * 0.7;
        const alpha = eased;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${metrics.fontSize}px 'Inter', 'Arial', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(word, 0, 0);
        ctx.restore();

        if (phaseProgress >= 0.6) {
          phase = 'hold';
          phaseProgress = 0;
        }
      } else if (phase === 'hold') {
        const metrics = getWordMetrics(word);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${metrics.fontSize}px 'Inter', 'Arial', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(word, canvas.width / 2, canvas.height / 2);

        if (phaseProgress >= 1.5) {
          phase = 'dissolve';
          phaseProgress = 0;
          createDissolveParticles(word);
        }
      } else if (phase === 'dissolve') {
        let alive = 0;
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.015;
          if (p.alpha > 0) {
            alive++;
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(p.x, p.y, p.size, p.size);
          }
        });
        ctx.globalAlpha = 1;

        if (alive === 0 || phaseProgress >= 1.5) {
          phase = 'scaleIn';
          phaseProgress = 0;
          currentWordIndex = (currentWordIndex + 1) % words.length;
          particles = [];
        }
      }
    };

    this.animationIds[canvas._demoId] = requestAnimationFrame(animate);
  },

  // =====================================================
  // 2. PARTICLE SYSTEM
  // =====================================================

  initParticleSystem(canvas) {
    const ctx = this.contexts[canvas._demoId];
    if (!ctx) return;

    const particleCount = this.isMobile ? 100 : 220;
    let particles = [];
    let mouse = { x: -1000, y: -1000 };
    const targetFps = this.isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFps;
    let lastFrameTime = 0;

    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -Math.random() * 1.2 - 0.3,
        size: 1 + Math.random() * 3,
        color: Math.random() > 0.65 ? '#FF6B2B' : '#ffffff',
        alpha: 0.3 + Math.random() * 0.7
      });
    }

    // Mouse tracking
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    canvas.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    const animate = (timestamp) => {
      this.animationIds[canvas._demoId] = requestAnimationFrame(animate);

      if (timestamp - lastFrameTime < frameInterval) return;
      lastFrameTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connecting lines first
      if (!this.isMobile) {
        ctx.lineWidth = 0.3;
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
              const lineAlpha = (1 - dist / 80) * 0.15;
              ctx.strokeStyle = `rgba(255, 255, 255, ${lineAlpha})`;
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Update and draw particles
      particles.forEach(p => {
        // Mouse repulsion
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100 && dist > 0) {
          const force = (100 - dist) / 100;
          p.vx += (dx / dist) * force * 0.3;
          p.vy += (dy / dist) * force * 0.3;
        }

        // Apply velocity with damping
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Reset upward drift
        p.vy -= 0.01;

        // Calculate fade based on vertical position
        let verticalAlpha = 1;
        if (p.y < canvas.height * 0.1) {
          verticalAlpha = p.y / (canvas.height * 0.1);
        }
        if (p.y > canvas.height * 0.9) {
          verticalAlpha = (canvas.height - p.y) / (canvas.height * 0.1);
        }

        // Wrap around
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
          p.vy = -Math.random() * 1.2 - 0.3;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        // Draw
        ctx.globalAlpha = p.alpha * Math.max(verticalAlpha, 0);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;
    };

    this.animationIds[canvas._demoId] = requestAnimationFrame(animate);
  },

  // =====================================================
  // 3. GLITCH EFFECT
  // =====================================================

  initGlitchEffect(element) {
    if (!element) return;

    const text = 'GLITCH';

    // Build the glitch HTML structure
    element.innerHTML = `
      <div class="glitch-container" style="position:relative; width:100%; height:100%; display:flex; align-items:center; justify-content:center; overflow:hidden; background:#0a0a0a;">
        <span class="glitch-text glitch-text--main" style="font-size:clamp(32px, 8vw, 60px); font-weight:900; color:#fff; letter-spacing:4px; font-family:'Inter','Arial',sans-serif; position:relative; z-index:2;">${text}</span>
        <span class="glitch-text glitch-text--r" style="position:absolute; font-size:clamp(32px, 8vw, 60px); font-weight:900; color:#ff0040; letter-spacing:4px; font-family:'Inter','Arial',sans-serif; z-index:1; opacity:0.7; left:50%; top:50%; transform:translate(-50%,-50%);">${text}</span>
        <span class="glitch-text glitch-text--b" style="position:absolute; font-size:clamp(32px, 8vw, 60px); font-weight:900; color:#00d4ff; letter-spacing:4px; font-family:'Inter','Arial',sans-serif; z-index:1; opacity:0.7; left:50%; top:50%; transform:translate(-50%,-50%);">${text}</span>
        <div class="glitch-scanlines" style="position:absolute; top:0; left:0; width:100%; height:100%; background:repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px); pointer-events:none; z-index:3;"></div>
      </div>
    `;

    const redLayer = element.querySelector('.glitch-text--r');
    const blueLayer = element.querySelector('.glitch-text--b');
    const mainText = element.querySelector('.glitch-text--main');

    // Glitch burst function
    const triggerGlitch = () => {
      const burstDuration = 200;
      const steps = 6;
      const stepTime = burstDuration / steps;

      let step = 0;
      const glitchInterval = setInterval(() => {
        if (step >= steps) {
          clearInterval(glitchInterval);
          // Reset to normal
          gsap.set(redLayer, { x: '-50%', y: '-50%', clipPath: 'none', opacity: 0 });
          gsap.set(blueLayer, { x: '-50%', y: '-50%', clipPath: 'none', opacity: 0 });
          gsap.set(mainText, { x: 0, skewX: 0 });
          return;
        }

        // Random offsets for RGB split
        const rx = (Math.random() - 0.5) * 20;
        const ry = (Math.random() - 0.5) * 8;
        const bx = (Math.random() - 0.5) * 20;
        const by = (Math.random() - 0.5) * 8;

        // Random clip-path slices
        const clipTop = Math.random() * 80;
        const clipBottom = clipTop + 10 + Math.random() * 20;

        gsap.set(redLayer, {
          x: `calc(-50% + ${rx}px)`,
          y: `calc(-50% + ${ry}px)`,
          clipPath: `inset(${clipTop}% 0 ${100 - clipBottom}% 0)`,
          opacity: 0.8
        });

        gsap.set(blueLayer, {
          x: `calc(-50% + ${bx}px)`,
          y: `calc(-50% + ${by}px)`,
          clipPath: `inset(${100 - clipBottom}% 0 ${clipTop}% 0)`,
          opacity: 0.8
        });

        gsap.set(mainText, {
          x: (Math.random() - 0.5) * 6,
          skewX: (Math.random() - 0.5) * 5
        });

        step++;
      }, stepTime);
    };

    // Randomly trigger glitch every 2-4 seconds
    const scheduleGlitch = () => {
      const delay = 2000 + Math.random() * 2000;
      element._glitchTimer = setTimeout(() => {
        triggerGlitch();
        scheduleGlitch();
      }, delay);
    };

    scheduleGlitch();

    // Store for animation lifecycle
    this.animationIds[element._demoId] = { type: 'glitch', element: element };
  },

  // =====================================================
  // 4. GEOMETRIC COMPOSITION
  // =====================================================

  initGeometricComposition(canvas) {
    const ctx = this.contexts[canvas._demoId];
    if (!ctx) return;

    const targetFps = this.isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFps;
    let lastFrameTime = 0;
    let time = 0;

    // Define geometric shapes
    const shapes = [];
    const shapeCount = this.isMobile ? 8 : 14;

    for (let i = 0; i < shapeCount; i++) {
      shapes.push({
        type: ['circle', 'triangle', 'hexagon', 'line'][Math.floor(Math.random() * 4)],
        orbitRadius: 30 + Math.random() * (Math.min(canvas.width, canvas.height) * 0.35),
        orbitSpeed: 0.001 + Math.random() * 0.003,
        orbitOffset: Math.random() * Math.PI * 2,
        rotationSpeed: 0.005 + Math.random() * 0.02,
        rotation: Math.random() * Math.PI * 2,
        size: 10 + Math.random() * 30,
        color: Math.random() > 0.5 ? '#ffffff' : '#FF6B2B',
        alpha: 0.3 + Math.random() * 0.5
      });
    }

    const drawTriangle = (cx, cy, size, rotation) => {
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = rotation + (i * Math.PI * 2) / 3 - Math.PI / 2;
        const x = cx + Math.cos(angle) * size;
        const y = cy + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const drawHexagon = (cx, cy, size, rotation) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = rotation + (i * Math.PI * 2) / 6;
        const x = cx + Math.cos(angle) * size;
        const y = cy + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    };

    const animate = (timestamp) => {
      this.animationIds[canvas._demoId] = requestAnimationFrame(animate);

      if (timestamp - lastFrameTime < frameInterval) return;
      lastFrameTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      time += 0.016;

      ctx.lineWidth = 1.2;

      shapes.forEach(shape => {
        // Calculate orbiting position
        const angle = time * shape.orbitSpeed * 100 + shape.orbitOffset;
        const x = centerX + Math.cos(angle) * shape.orbitRadius;
        const y = centerY + Math.sin(angle) * shape.orbitRadius;

        shape.rotation += shape.rotationSpeed;

        ctx.strokeStyle = shape.color;
        ctx.globalAlpha = shape.alpha;

        switch (shape.type) {
          case 'circle':
            ctx.beginPath();
            ctx.arc(x, y, shape.size, 0, Math.PI * 2);
            ctx.stroke();
            break;

          case 'triangle':
            drawTriangle(x, y, shape.size, shape.rotation);
            break;

          case 'hexagon':
            drawHexagon(x, y, shape.size, shape.rotation);
            break;

          case 'line':
            ctx.beginPath();
            const lx = Math.cos(shape.rotation) * shape.size;
            const ly = Math.sin(shape.rotation) * shape.size;
            ctx.moveTo(x - lx, y - ly);
            ctx.lineTo(x + lx, y + ly);
            ctx.stroke();
            break;
        }
      });

      // Draw subtle center crosshair
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(centerX - 20, centerY);
      ctx.lineTo(centerX + 20, centerY);
      ctx.moveTo(centerX, centerY - 20);
      ctx.lineTo(centerX, centerY + 20);
      ctx.stroke();

      // Outer ring
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.min(canvas.width, canvas.height) * 0.42, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 1;
    };

    this.animationIds[canvas._demoId] = requestAnimationFrame(animate);
  },

  // =====================================================
  // 5. LIGHT TRAILS
  // =====================================================

  initLightTrails(canvas) {
    const ctx = this.contexts[canvas._demoId];
    if (!ctx) return;

    const targetFps = this.isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFps;
    let lastFrameTime = 0;
    let time = 0;

    const colors = ['#ffffff', '#FF6B2B', '#6BB5FF', '#ffffff', '#FF6B2B', '#88ddff', '#FF6B2B', '#ffffff'];
    const trailCount = this.isMobile ? 5 : 8;

    // Create light points with different path parameters
    const lights = [];
    for (let i = 0; i < trailCount; i++) {
      lights.push({
        color: colors[i % colors.length],
        // Parametric curve coefficients for variety
        freqX: 0.5 + Math.random() * 1.5,
        freqY: 0.5 + Math.random() * 1.5,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
        ampX: 0.25 + Math.random() * 0.2,
        ampY: 0.25 + Math.random() * 0.2,
        speed: 0.3 + Math.random() * 0.5,
        size: 2 + Math.random() * 2
      });
    }

    // Fill with black initially
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const animate = (timestamp) => {
      this.animationIds[canvas._demoId] = requestAnimationFrame(animate);

      if (timestamp - lastFrameTime < frameInterval) return;
      lastFrameTime = timestamp;

      // Fade effect — draw semi-transparent black over previous frame
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.016;

      lights.forEach(light => {
        // Smooth sinusoidal/circular path
        const t = time * light.speed;
        const x = canvas.width * (0.5 + light.ampX * Math.sin(t * light.freqX + light.phaseX));
        const y = canvas.height * (0.5 + light.ampY * Math.cos(t * light.freqY + light.phaseY));

        // Draw glow
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, light.size * 4);
        gradient.addColorStop(0, light.color);
        gradient.addColorStop(0.4, light.color + '80');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, light.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw bright core
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(x, y, light.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    };

    this.animationIds[canvas._demoId] = requestAnimationFrame(animate);
  },

  // =====================================================
  // 6. LIQUID MORPH
  // =====================================================

  initLiquidMorph(element) {
    if (!element) return;

    // Create SVG blob
    const svgNS = 'http://www.w3.org/2000/svg';
    const size = Math.min(element.clientWidth || 300, element.clientHeight || 300);

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '0 0 200 200');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.display = 'block';

    // Create gradient definition
    const defs = document.createElementNS(svgNS, 'defs');
    const gradient = document.createElementNS(svgNS, 'linearGradient');
    gradient.setAttribute('id', 'liquidGrad_' + element._demoId);
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');

    const stop1 = document.createElementNS(svgNS, 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#FF6B2B');

    const stop2 = document.createElementNS(svgNS, 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#ee0979');

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    svg.appendChild(defs);

    // Create the morphing path
    const path = document.createElementNS(svgNS, 'path');
    path.setAttribute('fill', `url(#liquidGrad_${element._demoId})`);
    path.setAttribute('opacity', '0.85');
    svg.appendChild(path);

    // Add a subtle second blob
    const path2 = document.createElementNS(svgNS, 'path');
    path2.setAttribute('fill', `url(#liquidGrad_${element._demoId})`);
    path2.setAttribute('opacity', '0.3');
    svg.appendChild(path2);

    element.innerHTML = '';
    element.style.display = 'flex';
    element.style.alignItems = 'center';
    element.style.justifyContent = 'center';
    element.style.background = '#0a0a0a';
    element.appendChild(svg);

    // Morph animation using control point variation
    let time = 0;
    const targetFps = this.isMobile ? 24 : 40;
    const frameInterval = 1000 / targetFps;
    let lastFrameTime = 0;

    const generateBlobPath = (t, cx, cy, baseRadius, variation) => {
      const points = 8;
      const angleStep = (Math.PI * 2) / points;
      let d = '';

      const controlPoints = [];
      for (let i = 0; i <= points; i++) {
        const angle = i * angleStep;
        const radiusVar = baseRadius + Math.sin(t * 1.2 + i * 1.5) * variation
          + Math.cos(t * 0.8 + i * 2.3) * (variation * 0.5);
        const x = cx + Math.cos(angle) * radiusVar;
        const y = cy + Math.sin(angle) * radiusVar;
        controlPoints.push({ x, y });
      }

      // Smooth bezier through points
      d = `M ${controlPoints[0].x} ${controlPoints[0].y}`;
      for (let i = 0; i < points; i++) {
        const curr = controlPoints[i];
        const next = controlPoints[(i + 1) % points];
        const cpx1 = curr.x + (next.x - controlPoints[(i - 1 + points) % points].x) * 0.25;
        const cpy1 = curr.y + (next.y - controlPoints[(i - 1 + points) % points].y) * 0.25;
        const cpx2 = next.x - (controlPoints[(i + 2) % points].x - curr.x) * 0.25;
        const cpy2 = next.y - (controlPoints[(i + 2) % points].y - curr.y) * 0.25;
        d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${next.x} ${next.y}`;
      }
      d += ' Z';

      return d;
    };

    const animate = (timestamp) => {
      this.animationIds[element._demoId] = requestAnimationFrame(animate);

      if (timestamp - lastFrameTime < frameInterval) return;
      lastFrameTime = timestamp;

      time += 0.016;

      // Main blob
      const d1 = generateBlobPath(time, 100, 100, 55, 20);
      path.setAttribute('d', d1);

      // Secondary smaller blob
      const d2 = generateBlobPath(time * 0.7 + 3, 100, 100, 65, 15);
      path2.setAttribute('d', d2);
    };

    this.animationIds[element._demoId] = requestAnimationFrame(animate);
  },

  // =====================================================
  // LIFECYCLE
  // =====================================================

  /**
   * Start animation for a specific demo by ID.
   */
  startAnimation(id) {
    const el = document.getElementById(id);
    if (!el || !el._initialized) return;

    // If it's a glitch timer that was stopped, reschedule
    const anim = this.animationIds[id];
    if (anim && anim.type === 'glitch') {
      // Re-trigger glitch scheduling
      return;
    }

    // For canvas-based animations, they self-register in animationIds
    // No explicit restart needed since IntersectionObserver handles init
  },

  /**
   * Stop animation for a specific demo by ID.
   */
  stopAnimation(id) {
    const anim = this.animationIds[id];
    if (!anim) return;

    if (typeof anim === 'number') {
      cancelAnimationFrame(anim);
      this.animationIds[id] = null;
    } else if (anim.type === 'glitch' && anim.element) {
      clearTimeout(anim.element._glitchTimer);
    }
  },

  /**
   * Handle window resize — re-size all canvases.
   */
  handleResize() {
    const onResize = () => {
      this.isMobile = window.innerWidth < 768;
      Object.keys(this.canvases).forEach(id => {
        const canvas = this.canvases[id];
        if (canvas) {
          this._sizeCanvas(canvas);
        }
      });
    };

    window.addEventListener('resize', onResize);
    this._onResize = onResize;
  }
};
