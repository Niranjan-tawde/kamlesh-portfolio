/* ============================================================
   THREE-SCENE.JS — Three.js Particle Background for Hero
   Cinematic Portfolio — KAMLESH
   ============================================================ */

window.ThreeScene = {
  scene: null,
  camera: null,
  renderer: null,
  particles: null,
  accentParticles: null,
  mouse: { x: 0, y: 0 },
  targetMouse: { x: 0, y: 0 },
  animationId: null,
  container: null,
  isMobile: false,

  /**
   * Initialize the Three.js scene.
   * Must be called explicitly by app.js — not auto-invoked.
   */
  init() {
    // Check WebGL support
    if (!this.isWebGLAvailable()) {
      console.warn('ThreeScene: WebGL not available, skipping particle background.');
      return;
    }

    this.container = document.querySelector('.hero__canvas-container');
    if (!this.container) {
      console.warn('ThreeScene: .hero__canvas-container not found.');
      return;
    }

    this.isMobile = window.innerWidth < 768;

    this.createScene();
    this.createParticles();
    this.handleResize();
    this.handleMouseMove();
    this.animate();
  },

  /**
   * Check if WebGL is available in the current browser.
   */
  isWebGLAvailable() {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  },

  /**
   * Create the Three.js scene, camera, and renderer.
   */
  createScene() {
    // Scene
    this.scene = new THREE.Scene();

    // Camera
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    this.camera.position.z = 500;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });

    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);

    this.container.appendChild(this.renderer.domElement);
  },

  /**
   * Create dual-layer particle systems — primary (white) and accent (orange).
   */
  createParticles() {
    // Determine particle counts based on device
    const primaryCount = this.isMobile ? 600 : 1800;
    const accentCount = this.isMobile ? 200 : 500;

    // ---- Primary white particles ----
    const primaryGeometry = new THREE.BufferGeometry();
    const primaryPositions = new Float32Array(primaryCount * 3);

    for (let i = 0; i < primaryCount; i++) {
      const i3 = i * 3;
      primaryPositions[i3] = (Math.random() - 0.5) * 1600;      // x: ±800
      primaryPositions[i3 + 1] = (Math.random() - 0.5) * 1600;  // y: ±800
      primaryPositions[i3 + 2] = Math.random() * 1000 - 500;     // z: -500 to 500
    }

    primaryGeometry.setAttribute('position', new THREE.BufferAttribute(primaryPositions, 3));

    const primaryMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: this.isMobile ? 1.2 : 1.8,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.particles = new THREE.Points(primaryGeometry, primaryMaterial);
    this.scene.add(this.particles);

    // ---- Accent orange particles ----
    const accentGeometry = new THREE.BufferGeometry();
    const accentPositions = new Float32Array(accentCount * 3);

    for (let i = 0; i < accentCount; i++) {
      const i3 = i * 3;
      accentPositions[i3] = (Math.random() - 0.5) * 1600;
      accentPositions[i3 + 1] = (Math.random() - 0.5) * 1600;
      accentPositions[i3 + 2] = Math.random() * 1000 - 500;
    }

    accentGeometry.setAttribute('position', new THREE.BufferAttribute(accentPositions, 3));

    const accentMaterial = new THREE.PointsMaterial({
      color: 0xFF6B2B,
      size: this.isMobile ? 0.8 : 1.0,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    this.accentParticles = new THREE.Points(accentGeometry, accentMaterial);
    this.scene.add(this.accentParticles);
  },

  /**
   * Handle window resize — update camera aspect and renderer size.
   */
  handleResize() {
    const onResize = () => {
      if (!this.container || !this.camera || !this.renderer) return;

      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);

      // Re-check mobile flag
      this.isMobile = window.innerWidth < 768;
    };

    window.addEventListener('resize', onResize);
    this._onResize = onResize;
  },

  /**
   * Track mouse movement for parallax camera offset.
   */
  handleMouseMove() {
    const onMouseMove = (e) => {
      // Normalize mouse to -1 ... +1
      this.targetMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.targetMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', onMouseMove);
    this._onMouseMove = onMouseMove;
  },

  /**
   * Main animation loop.
   */
  animate() {
    const loop = () => {
      this.animationId = requestAnimationFrame(loop);

      // Rotate particle systems slowly
      if (this.particles) {
        this.particles.rotation.y += 0.0002;
        this.particles.rotation.x += 0.0001;
      }

      if (this.accentParticles) {
        this.accentParticles.rotation.y += 0.00025;
        this.accentParticles.rotation.x += 0.00015;
      }

      // Lerp mouse for smooth camera movement
      this.mouse.x += (this.targetMouse.x - this.mouse.x) * 0.05;
      this.mouse.y += (this.targetMouse.y - this.mouse.y) * 0.05;

      // Apply mouse offset to camera (max ±30px)
      if (this.camera) {
        this.camera.position.x = this.mouse.x * 30;
        this.camera.position.y = this.mouse.y * 30;
        this.camera.lookAt(this.scene.position);
      }

      // Render
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    loop();
  },

  /**
   * Destroy the scene — cancel animation, dispose geometry/materials, remove canvas.
   */
  destroy() {
    // Cancel animation frame
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Remove event listeners
    if (this._onResize) {
      window.removeEventListener('resize', this._onResize);
      this._onResize = null;
    }
    if (this._onMouseMove) {
      window.removeEventListener('mousemove', this._onMouseMove);
      this._onMouseMove = null;
    }

    // Dispose primary particles
    if (this.particles) {
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.scene.remove(this.particles);
      this.particles = null;
    }

    // Dispose accent particles
    if (this.accentParticles) {
      this.accentParticles.geometry.dispose();
      this.accentParticles.material.dispose();
      this.scene.remove(this.accentParticles);
      this.accentParticles = null;
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    this.scene = null;
    this.camera = null;
  }
};
