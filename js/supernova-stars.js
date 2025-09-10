// Supernova Star Animation Feature
// This script adds a supernova effect to a random star every few seconds and respawns a new star in its place.

(function () {
  const STAR_COUNT = 40;
  const SUPERNOVA_INTERVAL = 3000; // ms
  const SUPERNOVA_DURATION = 1200; // ms
  const STAR_COLORS = [
    "rgba(255,255,255,0.85)",
    "rgba(77,171,247,0.85)",
    "rgba(151,117,250,0.85)",
    "rgba(255,107,157,0.85)",
    "rgba(34,211,238,0.85)",
  ];

  let container = null;
  let stars = [];
  let supernovaScheduled = false;
  let initialized = false;

  // Device check: skip on mobile or tablet
  function isMobileOrTablet() {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ) || window.innerWidth <= 1024
    );
  }

  // Initialize or cleanup based on device type
  function handleDeviceChange() {
    if (isMobileOrTablet()) {
      // Clean up stars on mobile/tablet
      if (container) {
        container.style.display = "none";
        stars.forEach((star) => {
          if (star.parentNode) {
            star.parentNode.removeChild(star);
          }
        });
        stars = [];
      }
      return false; // Don't initialize
    } else {
      // Show stars on desktop
      if (container) {
        container.style.display = "";
        // Reinitialize stars if they were cleared
        if (stars.length === 0) {
          initializeStars();
        }
      }
      return true; // Can initialize
    }
  }

  // Create container
  function createContainer() {
    if (!container) {
      container = document.createElement("div");
      container.id = "supernova-starfield";
      container.style.cssText = `
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        pointer-events: none;
        z-index: -4; /* keep well behind nebula and content */
        opacity: 0; transition: opacity 400ms ease;
      `;
      document.body.appendChild(container);
    }
  }

  // Helper to create a star at a random position
  function createStar() {
    const star = document.createElement("div");
    const size = Math.random() < 0.7 ? 2 : 3;
    const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
    star.className = "js-star";
    star.style.cssText = `
      position: absolute;
      left: ${Math.random() * 100}vw;
      top: ${Math.random() * 100}vh;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: ${color};
      box-shadow: 0 0 6px 2px ${color};
      opacity: 0.85;
      transition: box-shadow 0.5s, opacity 0.5s, background 0.5s;
    `;
    container.appendChild(star);
    return star;
  }

  // Initialize stars
  function initializeStars() {
    stars = [];
    // Gradually ramp up stars to avoid main-thread spike
    const target = STAR_COUNT;
    let created = 0;
    const batch = 8;

    const addBatch = () => {
      const count = Math.min(batch, target - created);
      for (let i = 0; i < count; i++) {
        stars.push(createStar());
      }
      created += count;
      if (created < target) {
        if (typeof requestIdleCallback === "function") {
          requestIdleCallback(addBatch, { timeout: 200 });
        } else {
          setTimeout(addBatch, 50);
        }
      } else {
        // Fade in once initial stars are ready
        requestAnimationFrame(() => {
          if (container) container.style.opacity = "1";
        });
      }
    };

    addBatch();
  }

  // Initial setup
  function initialize() {
    if (initialized) return;
    // Respect Low Detail Mode if available
    if (window.LowDetailMode && window.LowDetailMode.isLowDetailActive()) {
      return;
    }

    createContainer();
    if (handleDeviceChange()) {
      initializeStars();
      startSupernova();
      initialized = true;
    }
  }

  // Handle window resize
  function handleResize() {
    handleDeviceChange();
  }

  // Defer initialization until after full page load to reduce pop-in
  const onLoad = () => {
    if (!isMobileOrTablet()) {
      // Small delay to allow above-the-fold paint to settle
      setTimeout(initialize, 250);
    }
  };
  if (document.readyState === "complete") {
    onLoad();
  } else {
    window.addEventListener("load", onLoad);
  }

  // Supernova effect
  function supernova(star) {
    star.style.transition = "box-shadow 0.3s, opacity 0.3s, background 0.3s";
    star.style.boxShadow =
      "0 0 60px 20px #fff, 0 0 120px 40px #fffa, 0 0 200px 80px #fff8";
    star.style.background = "#fff";
    star.style.opacity = "1";
    // Fade out after the initial flash
    setTimeout(() => {
      star.style.transition = "opacity 1.2s";
      star.style.opacity = "0";
      // Remove after fade out
      setTimeout(() => {
        if (star.parentNode) star.parentNode.removeChild(star);
        // Spawn new star only if we're still on desktop
        if (!isMobileOrTablet()) {
          const newStar = createStar();
          // Replace in array
          const idx = stars.indexOf(star);
          if (idx !== -1) stars[idx] = newStar;
        }
      }, 1200);
    }, SUPERNOVA_DURATION);
  }

  // Helper to trigger a supernova at a random interval
  function scheduleSupernova() {
    if (isMobileOrTablet()) return; // Don't schedule on mobile/tablet

    const minDelay = 30000; // 30 seconds
    const maxDelay = 300000; // 300 seconds
    const delay = Math.random() * (maxDelay - minDelay) + minDelay;
    setTimeout(() => {
      // Double check we're still on desktop before triggering
      if (!isMobileOrTablet() && stars.length > 0) {
        const star = stars[Math.floor(Math.random() * stars.length)];
        if (star) supernova(star);
      }
      scheduleSupernova();
    }, delay);
  }

  // Start supernova scheduling
  function startSupernova() {
    if (!supernovaScheduled) {
      supernovaScheduled = true;
      scheduleSupernova();
    }
  }

  // Add resize listener
  window.addEventListener("resize", handleResize);
})();
