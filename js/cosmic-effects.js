// 3D Background Effects for Liquid Glass / Interstellar Theme

class CosmicBackground {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.stars = [];
    this.nebula = [];
    this.mouse = { x: 0, y: 0 };
    this.animationId = null;

    // Performance settings
    this.isMobile = this.detectMobile();
    this.isTablet = this.detectTablet();
    this.shouldDisableEffects = this.isMobile || this.isTablet;

    this.init();
  }

  detectMobile() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ) || window.innerWidth <= 768
    );
  }

  detectTablet() {
    return (
      window.innerWidth > 768 &&
      window.innerWidth <= 1024 &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0)
    );
  }

  init() {
    // Skip heavy effects on mobile/tablet for performance
    if (this.shouldDisableEffects) {
      console.log("Cosmic effects disabled for mobile/tablet performance");
      return;
    }

    this.createCanvas();
    this.setupEventListeners();
    this.createParticles();
    this.createStars();
    this.createNebula();
    this.animate();
  }

  createCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "cosmic-canvas";
    this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -2;
            pointer-events: none;
        `;

    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.resize();
  }

  setupEventListeners() {
    window.addEventListener("resize", () => this.resize(), { passive: true });
    window.addEventListener("mousemove", (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    }, { passive: true });
  }

  resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 1.5);
    this.canvas.width = Math.floor(window.innerWidth * scale);
    this.canvas.height = Math.floor(window.innerHeight * scale);
    this.ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  createParticles() {
    const particleCount = Math.min(window.innerWidth / 10, 100);

    for (let i = 0; i < particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        z: Math.random() * 1000,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        speedZ: Math.random() * 2 + 1,
        color: this.getRandomColor(),
        opacity: Math.random() * 0.8 + 0.2,
        pulse: Math.random() * 0.02 + 0.01,
      });
    }
  }

  createStars() {
    const starCount = Math.min(window.innerWidth / 5, 200);

    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 1.5 + 0.5,
        twinkle: Math.random() * 0.02 + 0.01,
        brightness: Math.random() * 0.8 + 0.2,
        color: Math.random() > 0.7 ? "#4dabf7" : "#ffffff",
      });
    }
  }

  createNebula() {
    // Disabled canvas nebula - using pure CSS nebula for better organic effect
    // The CSS nebula provides much better organic cloud shapes
    this.nebula = [];
  }

  getRandomColor() {
    const colors = [
      "#4dabf7", // Aurora blue
      "#9775fa", // Aurora purple
      "#ff6b9d", // Aurora pink
      "#22d3ee", // Aurora cyan
      "#51cf66", // Aurora green
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  drawParticles() {
    this.particles.forEach((particle, index) => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      particle.z -= particle.speedZ;

      // Mouse interaction
      const dx = this.mouse.x - particle.x;
      const dy = this.mouse.y - particle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 100) {
        const force = (100 - distance) / 100;
        particle.x -= dx * force * 0.01;
        particle.y -= dy * force * 0.01;
      }

      // Reset particle if it goes off screen or too far
      if (
        particle.z <= 0 ||
        particle.x < 0 ||
        particle.x > this.canvas.width ||
        particle.y < 0 ||
        particle.y > this.canvas.height
      ) {
        particle.x = Math.random() * this.canvas.width;
        particle.y = Math.random() * this.canvas.height;
        particle.z = 1000;
      }

      // Calculate 3D projection
      const scale = 200 / (200 + particle.z);
      const x2d =
        (particle.x - this.canvas.width / 2) * scale + this.canvas.width / 2;
      const y2d =
        (particle.y - this.canvas.height / 2) * scale + this.canvas.height / 2;

      // Pulse effect
      particle.opacity += particle.pulse;
      if (particle.opacity >= 1 || particle.opacity <= 0.2) {
        particle.pulse = -particle.pulse;
      }

      // Draw particle
      this.ctx.save();
      this.ctx.globalAlpha = particle.opacity * scale;
      this.ctx.fillStyle = particle.color;
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(x2d, y2d, particle.size * scale, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  drawStars() {
    this.stars.forEach((star) => {
      // Twinkling effect
      star.brightness += star.twinkle;
      if (star.brightness >= 1 || star.brightness <= 0.2) {
        star.twinkle = -star.twinkle;
      }

      this.ctx.save();
      this.ctx.globalAlpha = star.brightness;
      this.ctx.fillStyle = star.color;
      this.ctx.shadowBlur = 5;
      this.ctx.shadowColor = star.color;
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  drawNebula() {
    // Nebula now handled entirely by CSS for better organic effects
    // This avoids the rectangular rotation issue from canvas-based nebula
    return;
  }

  drawConnections() {
    // Connect nearby particles with lines
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          this.ctx.save();
          this.ctx.globalAlpha = ((150 - distance) / 150) * 0.3;
          this.ctx.strokeStyle = "#4dabf7";
          this.ctx.lineWidth = 0.5;
          this.ctx.beginPath();
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
          this.ctx.restore();
        }
      }
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, "#0a0a23");
    gradient.addColorStop(0.5, "#1a1a3a");
    gradient.addColorStop(1, "#0a0a23");
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawNebula();
    this.drawStars();
    this.drawConnections();
    this.drawParticles();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}

// Floating 3D Geometric Shapes
class FloatingGeometry {
  constructor() {
    this.shapes = [];
    this.container = null;
    this.init();
  }

  init() {
    this.createContainer();
    this.createShapes();
    this.animate();
  }

  createContainer() {
    this.container = document.createElement("div");
    this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        `;
    document.body.appendChild(this.container);
  }

  createShapes() {
    const shapeCount = Math.min(window.innerWidth / 200, 8);
    const shapes = ["cube", "pyramid", "sphere", "torus"];

    for (let i = 0; i < shapeCount; i++) {
      const shape = document.createElement("div");
      const shapeType = shapes[Math.floor(Math.random() * shapes.length)];

      shape.className = `floating-geometry ${shapeType}`;
      shape.style.cssText = `
                position: absolute;
                width: ${30 + Math.random() * 40}px;
                height: ${30 + Math.random() * 40}px;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                background: linear-gradient(135deg, 
                    rgba(77, 171, 247, 0.3), 
                    rgba(151, 117, 250, 0.3));
                border: 1px solid rgba(255, 255, 255, 0.2);
                backdrop-filter: blur(10px);
                border-radius: ${shapeType === "sphere" ? "50%" : "8px"};
                animation: floatingGeometry ${8 + Math.random() * 4}s ease-in-out infinite;
                animation-delay: ${Math.random() * 5}s;
                transform-style: preserve-3d;
            `;

      this.container.appendChild(shape);
      this.shapes.push(shape);
    }
  }

  animate() {
    // Add CSS keyframes for floating geometry animation
    if (!document.getElementById("geometry-styles")) {
      const style = document.createElement("style");
      style.id = "geometry-styles";
      style.textContent = `
                @keyframes floatingGeometry {
                    0%, 100% {
                        transform: translateY(0px) rotateX(0deg) rotateY(0deg);
                    }
                    25% {
                        transform: translateY(-20px) rotateX(90deg) rotateY(90deg);
                    }
                    50% {
                        transform: translateY(-40px) rotateX(180deg) rotateY(180deg);
                    }
                    75% {
                        transform: translateY(-20px) rotateX(270deg) rotateY(270deg);
                    }
                }
            `;
      document.head.appendChild(style);
    }
  }
}

// Aurora Wave Effect
class AuroraWaves {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.waves = [];
    this.animationId = null;

    this.init();
  }

  init() {
    this.createCanvas();
    this.createWaves();
    this.animate();
  }

  createCanvas() {
    this.canvas = document.createElement("canvas");
    this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -3;
            pointer-events: none;
            opacity: 0.6;
        `;

    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    this.resize();

    window.addEventListener("resize", () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createWaves() {
    for (let i = 0; i < 3; i++) {
      this.waves.push({
        y: this.canvas.height * (0.3 + i * 0.2),
        amplitude: 50 + Math.random() * 30,
        frequency: 0.002 + Math.random() * 0.001,
        phase: Math.random() * Math.PI * 2,
        speed: 0.01 + Math.random() * 0.01,
        color: ["#4dabf7", "#9775fa", "#ff6b9d"][i],
        opacity: 0.1 + Math.random() * 0.1,
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.waves.forEach((wave) => {
      wave.phase += wave.speed;

      this.ctx.save();
      this.ctx.globalAlpha = wave.opacity;
      this.ctx.strokeStyle = wave.color;
      this.ctx.lineWidth = 2;
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = wave.color;

      this.ctx.beginPath();
      for (let x = 0; x <= this.canvas.width; x += 5) {
        const y =
          wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
        if (x === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.stroke();
      this.ctx.restore();
    });

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

// Initialize all background effects
window.addEventListener("load", () => {
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const startEffects = () => {
    if (!prefersReducedMotion) {
      const bg = new CosmicBackground();
      // Pause when tab is hidden
      document.addEventListener(
        "visibilitychange",
        () => {
          if (document.hidden && bg.animationId) {
            cancelAnimationFrame(bg.animationId);
            bg.animationId = null;
          } else if (!document.hidden && !bg.animationId) {
            bg.animate();
          }
        },
        { passive: true },
      );
      new FloatingGeometry();
      new AuroraWaves();
    }
  };

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(startEffects, { timeout: 1000 });
  } else {
    setTimeout(startEffects, 150);
  }
});

// Export for potential cleanup
window.CosmicEffects = {
  CosmicBackground,
  FloatingGeometry,
  AuroraWaves,
};
