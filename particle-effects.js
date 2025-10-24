/* particle-effects.js - Canvas-based Particle System for Premium Elements */

(()=>{
  'use strict';

  // Configuration
  const PARTICLE_CONFIG = {
    count: 7, // Number of particles per emission
    minSpeed: 1.5,
    maxSpeed: 3.0,
    minSize: 2,
    maxSize: 4,
    lifetime: 1500, // milliseconds
    color: 'rgba(0, 212, 255, 0.8)',
    fadeOutDuration: 500 // milliseconds
  };

  let canvas = null;
  let ctx = null;
  let particles = [];
  let animationId = null;
  let isHovering = false;
  let lastEmissionTime = 0;
  const EMISSION_INTERVAL = 150; // milliseconds between emissions

  // Wait for DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    setupCanvas();
    attachLoginButtonListeners();
    console.log('[particle-effects] Particle system initialized');
  }

  /**
   * Create and setup canvas overlay
   */
  function setupCanvas() {
    canvas = document.createElement('canvas');
    canvas.id = 'particle-canvas';
    canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(canvas);

    ctx = canvas.getContext('2d');
    resizeCanvas();

    window.addEventListener('resize', resizeCanvas);
  }

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  /**
   * Attach hover listeners to login button
   */
  function attachLoginButtonListeners() {
    const loginBtn = document.querySelector('.login-btn');
    if (!loginBtn) {
      console.warn('[particle-effects] Login button not found');
      return;
    }

    loginBtn.addEventListener('mouseenter', () => {
      isHovering = true;
      lastEmissionTime = 0;
      startAnimation();
    });

    loginBtn.addEventListener('mouseleave', () => {
      isHovering = false;
    });
  }

  /**
   * Start animation loop
   */
  function startAnimation() {
    if (animationId) return; // Already running

    function loop(timestamp) {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Emit new particles if hovering
      if (isHovering && timestamp - lastEmissionTime > EMISSION_INTERVAL) {
        emitParticles();
        lastEmissionTime = timestamp;
      }

      // Update and draw particles
      particles = particles.filter(particle => {
        updateParticle(particle, timestamp);
        drawParticle(particle);
        return particle.life > 0;
      });

      // Continue loop if particles exist or still hovering
      if (particles.length > 0 || isHovering) {
        animationId = requestAnimationFrame(loop);
      } else {
        animationId = null;
      }
    }

    animationId = requestAnimationFrame(loop);
  }

  /**
   * Emit a burst of particles from login button
   */
  function emitParticles() {
    const loginBtn = document.querySelector('.login-btn');
    if (!loginBtn) return;

    const rect = loginBtn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < PARTICLE_CONFIG.count; i++) {
      const angle = (Math.PI / 4) + (Math.random() * Math.PI / 2); // Upward cone
      const speed = PARTICLE_CONFIG.minSpeed + Math.random() * (PARTICLE_CONFIG.maxSpeed - PARTICLE_CONFIG.minSpeed);

      particles.push({
        x: centerX + (Math.random() - 0.5) * rect.width * 0.8,
        y: centerY + (Math.random() - 0.5) * rect.height * 0.4,
        vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? 1 : -1),
        vy: -Math.sin(angle) * speed,
        size: PARTICLE_CONFIG.minSize + Math.random() * (PARTICLE_CONFIG.maxSize - PARTICLE_CONFIG.minSize),
        life: PARTICLE_CONFIG.lifetime,
        maxLife: PARTICLE_CONFIG.lifetime,
        birthTime: performance.now()
      });
    }
  }

  /**
   * Update particle position and lifetime
   */
  function updateParticle(particle, timestamp) {
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += 0.05; // Gentle gravity

    const elapsed = timestamp - particle.birthTime;
    particle.life = particle.maxLife - elapsed;
  }

  /**
   * Draw particle on canvas
   */
  function drawParticle(particle) {
    const lifeRatio = particle.life / particle.maxLife;
    const alpha = lifeRatio < 0.3 ? lifeRatio / 0.3 : 1; // Fade out in last 30%

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);

    // Gradient fill
    const gradient = ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, particle.size
    );
    gradient.addColorStop(0, `rgba(0, 212, 255, ${alpha * 0.8})`);
    gradient.addColorStop(0.5, `rgba(0, 153, 255, ${alpha * 0.5})`);
    gradient.addColorStop(1, `rgba(0, 100, 200, ${alpha * 0.2})`);

    ctx.fillStyle = gradient;
    ctx.fill();

    // Glow effect
    ctx.shadowBlur = 8;
    ctx.shadowColor = `rgba(0, 212, 255, ${alpha * 0.6})`;
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });

  // Export for debugging
  window.particleEffects = {
    version: '1.0.0',
    particleCount: () => particles.length,
    config: PARTICLE_CONFIG
  };
})();
