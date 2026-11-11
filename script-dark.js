/* ==========================================================================
   MOHAMED ELSAYED ALY - ENGINEERING PORTFOLIO JAVASCRIPT
   Interactive Behaviors, 3D Canvas, Lightbox, Counters, and Filters
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initBackgroundCanvas();
  initNavbarScroll();
  initStatsCounters();
  initProjectFiltering();
  initLightbox();
  initCfdSwitchers();
  initDeferredThreeRocketViewer();
  initCadDownloads();
  initClipboardButtons();
  initContactForm();
  initMobileMenu();
});

/* ==========================================================================
   1. HIGH-TECH CONSTELLATION / PARTICLE BACKGROUND CANVAS
   ========================================================================== */
function initBackgroundCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
  const LINK_DIST = 130;
  const LINK_DIST_SQ = LINK_DIST * LINK_DIST;

  let width = 0, height = 0;
  let particles = [];
  let rafId = null;

  function build() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const density = isMobile ? 26000 : 16000;
    const count = Math.min(Math.floor((width * height) / density), isMobile ? 40 : 75);
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.5 + 0.5,
        baseAlpha: Math.random() * 0.4 + 0.2
      });
    }
  }

  function step() {
    ctx.clearRect(0, 0, width, height);

    const n = particles.length;
    for (let i = 0; i < n; i++) {
      const a = particles[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0) a.x = width;
      else if (a.x > width) a.x = 0;
      if (a.y < 0) a.y = height;
      else if (a.y > height) a.y = 0;
    }

    ctx.lineWidth = 0.75;
    for (let i = 0; i < n; i++) {
      const a = particles[i];
      for (let j = i + 1; j < n; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        if (dx > LINK_DIST || dx < -LINK_DIST) continue;
        const dy = a.y - b.y;
        if (dy > LINK_DIST || dy < -LINK_DIST) continue;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST_SQ) {
          const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.15;
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (let i = 0; i < n; i++) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${p.baseAlpha})`;
      ctx.fill();
    }

    rafId = requestAnimationFrame(step);
  }

  build();

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 150);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(step);
    }
  });

  rafId = requestAnimationFrame(step);
}

/* ==========================================================================
   2. NAVBAR SCROLL & ACTIVE STATE
   ========================================================================== */
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  if (!navbar) return;

  let offsets = [];
  function measure() {
    offsets = Array.from(sections).map((section) => ({
      id: section.getAttribute('id'),
      top: section.offsetTop - 120,
      height: section.offsetHeight
    }));
  }
  measure();

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      navbar.classList.toggle('scrolled', y > 40);

      let current = '';
      for (let i = 0; i < offsets.length; i++) {
        const o = offsets[i];
        if (y >= o.top && y < o.top + o.height) {
          current = o.id;
          break;
        }
      }

      navLinks.forEach((link) => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
      });

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measure);
}

/* ==========================================================================
   3. ANIMATED METRIC COUNTERS (MOBILE + DESKTOP VIEWPORT & STALL SAFE)
   ========================================================================== */
function initStatsCounters() {
  const counters = Array.from(document.querySelectorAll('[data-target]'));
  if (!counters.length) return;

  function formatCounterHtml(val, decimals, prefix, suffix) {
    const formatted = Number(val).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return prefix + formatted + (suffix ? '<span>' + suffix + '</span>' : '');
  }

  function animateCounter(counter, customDuration) {
    const target = parseFloat(counter.getAttribute('data-target'));
    if (isNaN(target)) return;

    const suffix = counter.getAttribute('data-suffix') || '';
    const prefix = counter.getAttribute('data-prefix') || '';
    const decimals = parseInt(counter.getAttribute('data-decimals') || '0', 10);
    const duration = customDuration || 2000;
    const card = counter.closest('.stat-item, .spec-card');

    if (counter._rafId) {
      cancelAnimationFrame(counter._rafId);
      counter._rafId = null;
    }
    if (counter._doneTimer) {
      clearTimeout(counter._doneTimer);
      counter._doneTimer = null;
    }

    counter.dataset.animated = 'true';
    counter.innerHTML = formatCounterHtml(0, decimals, prefix, suffix);

    if (card) {
      card.classList.remove('counted-done');
      card.classList.add('is-counting');
    }

    let startTime = null;
    let lastFrameTime = null;

    function updateCounter(now) {
      if (startTime === null) {
        startTime = now;
        lastFrameTime = now;
      } else {
        const delta = now - lastFrameTime;
        if (delta > 100) {
          startTime += (delta - 16.67);
        }
        lastFrameTime = now;
      }

      const elapsed = Math.max(0, now - startTime);
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const currentVal = progress === 1 ? target : target * ease;

      counter.innerHTML = formatCounterHtml(currentVal, decimals, prefix, suffix);

      if (progress < 1) {
        counter._rafId = requestAnimationFrame(updateCounter);
      } else {
        counter._rafId = null;
        if (card) {
          card.classList.remove('is-counting');
          card.classList.add('counted-done');
          counter._doneTimer = setTimeout(() => {
            card.classList.remove('counted-done');
          }, 900);
        }
      }
    }

    counter._rafId = requestAnimationFrame(updateCounter);
  }

  counters.forEach((counter) => {
    const decimals = parseInt(counter.getAttribute('data-decimals') || '0', 10);
    const prefix = counter.getAttribute('data-prefix') || '';
    const suffix = counter.getAttribute('data-suffix') || '';
    counter.dataset.animated = 'false';
    counter.innerHTML = formatCounterHtml(0, decimals, prefix, suffix);

    const card = counter.closest('.stat-item, .spec-card');
    if (card) {
      card.addEventListener('click', () => {
        animateCounter(counter, 1600);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          animateCounter(counter, 1600);
        }
      });
    }
  });

  const replayBtn = document.getElementById('btn-replay-stats');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      const heroCounters = document.querySelectorAll('#hero-stats [data-target]');
      heroCounters.forEach((c) => animateCounter(c, 1800));
    });
  }

  function checkVisibleCounters() {
    const vh = window.innerHeight || document.documentElement.clientHeight;
    counters.forEach((counter) => {
      const rect = counter.getBoundingClientRect();
      const inView = rect.top < vh * 0.94 && rect.bottom > vh * 0.04;
      const completelyOutOfView = rect.bottom < -60 || rect.top > vh + 60;

      if (inView && counter.dataset.animated !== 'true') {
        animateCounter(counter, 2000);
      } else if (completelyOutOfView && counter.dataset.animated === 'true') {
        counter.dataset.animated = 'false';
      }
    });
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const counter = entry.target;
        if (entry.isIntersecting && counter.dataset.animated !== 'true') {
          animateCounter(counter, 2000);
        } else if (!entry.isIntersecting) {
          const rect = counter.getBoundingClientRect();
          const vh = window.innerHeight || document.documentElement.clientHeight;
          if (rect.bottom < -40 || rect.top > vh + 40) {
            counter.dataset.animated = 'false';
          }
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -10px 0px'
    });

    counters.forEach((counter) => observer.observe(counter));
  }

  let scrollTick = false;
  function onScrollOrResize() {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      checkVisibleCounters();
      scrollTick = false;
    });
  }

  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
  window.addEventListener('orientationchange', onScrollOrResize, { passive: true });

  requestAnimationFrame(() => {
    setTimeout(checkVisibleCounters, 120);
  });
}

/* ==========================================================================
   4. PROJECT FILTERING
   ========================================================================== */
function initProjectFiltering() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectBlocks = document.querySelectorAll('.project-detail-block');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      if (typeof btn.scrollIntoView === 'function' && window.innerWidth <= 768) {
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }

      const filterValue = btn.getAttribute('data-filter');

      projectBlocks.forEach((block) => {
        const category = block.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          block.style.display = 'block';
          setTimeout(() => {
            block.style.opacity = '1';
            block.style.transform = 'translateY(0)';
          }, 20);
        } else {
          block.style.opacity = '0';
          block.style.transform = 'translateY(20px)';
          setTimeout(() => {
            block.style.display = 'none';
          }, 300);
        }
      });
    });
  });
}

/* ==========================================================================
   5. FULLSCREEN LIGHTBOX MODAL (WITH MOBILE TOUCH SWIPE)
   ========================================================================== */
let currentLightboxIndex = 0;
let galleryImagesList = [];

function initLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;

  const closeBtn = document.querySelector('.lightbox-close');
  const prevBtn = document.querySelector('.lightbox-prev');
  const nextBtn = document.querySelector('.lightbox-next');
  const modalImg = document.querySelector('.lightbox-img');
  const modalTitle = document.querySelector('.lightbox-title');
  const modalDesc = document.querySelector('.lightbox-desc');

  const galleryItems = document.querySelectorAll('.gallery-item');
  galleryImagesList = Array.from(galleryItems).map((item) => {
    const img = item.querySelector('.gallery-item-img');
    const title = item.querySelector('.gallery-caption h4');
    const desc = item.querySelector('.gallery-caption p');
    return {
      src: img ? img.getAttribute('src') : '',
      title: title ? title.innerText : '',
      desc: desc ? desc.innerText : '',
    };
  });

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      openLightbox(index);
    });
  });

  function openLightbox(index) {
    currentLightboxIndex = index;
    updateLightboxContent();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function updateLightboxContent() {
    const data = galleryImagesList[currentLightboxIndex];
    if (!data) return;
    modalImg.src = data.src;
    modalTitle.innerText = data.title;
    modalDesc.innerText = data.desc;
  }

  function showPrev() {
    currentLightboxIndex = (currentLightboxIndex - 1 + galleryImagesList.length) % galleryImagesList.length;
    updateLightboxContent();
  }

  function showNext() {
    currentLightboxIndex = (currentLightboxIndex + 1) % galleryImagesList.length;
    updateLightboxContent();
  }

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn) prevBtn.addEventListener('click', showPrev);
  if (nextBtn) nextBtn.addEventListener('click', showNext);

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.classList.contains('lightbox-content')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrev();
    if (e.key === 'ArrowRight') showNext();
  });

  let touchStartX = 0;
  let touchStartY = 0;
  modal.addEventListener('touchstart', (e) => {
    if (!e.touches || !e.touches.length) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  modal.addEventListener('touchend', (e) => {
    if (!e.changedTouches || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) showNext();
      else showPrev();
    }
  }, { passive: true });
}

/* ==========================================================================
   6. CFD INTERACTIVE CONTOUR SWITCHER
   ========================================================================== */
function initCfdSwitchers() {
  const cfdContainers = document.querySelectorAll('[data-cfd-group]');

  cfdContainers.forEach((container) => {
    const tabBtns = container.querySelectorAll('.cfd-tab-btn');
    const previewImg = container.querySelector('.cfd-preview-img');
    const legendText = container.querySelector('.cfd-legend-info');

    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        tabBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const newSrc = btn.getAttribute('data-img');
        const newLegend = btn.getAttribute('data-legend');

        if (previewImg && newSrc) {
          previewImg.style.opacity = '0';
          setTimeout(() => {
            previewImg.src = newSrc;
            previewImg.style.opacity = '1';
          }, 200);
        }

        if (legendText && newLegend) {
          legendText.innerHTML = newLegend;
        }
      });
    });
  });
}

/* ==========================================================================
   7. PHOTOREALISTIC MULTI-ALLOY 3D CAD VIEWER (CREASE-SMOOTHED + STUDIO HDRI)
   ========================================================================== */
function initDeferredThreeRocketViewer() {
  const section = document.getElementById('rocket-3d');
  if (!section) return;

  let started = false;
  function startViewer() {
    if (started) return;
    started = true;
    initThreeRocketViewer();
  }

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        obs.disconnect();
        startViewer();
      }
    }, { rootMargin: '350px 0px' });
    obs.observe(section);
  }

  setTimeout(startViewer, 2300);
}

// Procedural Studio HDRI Environment Generator (PMREM) for realistic metallic reflections
function buildStudioEnvironmentMap(renderer) {
  if (typeof THREE.PMREMGenerator === 'undefined') return null;
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x090a0f);

  const addPanel = (w, h, colorHex, intensity, x, y, z, rx, ry, rz) => {
    const geo = new THREE.PlaneGeometry(w, h);
    const col = new THREE.Color(colorHex).multiplyScalar(intensity);
    const mat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rx, ry, rz);
    envScene.add(mesh);
  };

  // Overhead studio softbox
  addPanel(16, 16, 0xffffff, 2.3, 0, 12, 0, Math.PI / 2, 0, 0);
  // Front-right key vertical softbox strip (sleek vertical reflection ribbon along chamber & nozzle bell)
  addPanel(7, 18, 0xf8fafc, 2.7, 9, 2, 8, 0, -Math.PI / 4, 0);
  // Cool aerospace silver-blue fill strip (left)
  addPanel(8, 16, 0xdbeafe, 1.85, -10, 3, 5, 0, Math.PI / 3, 0);
  // Warm rim strip (back-right)
  addPanel(6, 16, 0xffedd5, 2.0, 8, 2, -9, 0, -Math.PI * 0.75, 0);
  // Crisp back-left silhouette rim strip
  addPanel(7, 16, 0xffffff, 2.4, -8, 4, -9, 0, Math.PI * 0.75, 0);
  // Lower bounce reflector
  addPanel(18, 18, 0x3f3f46, 1.1, 0, -10, 0, -Math.PI / 2, 0, 0);

  const envRT = pmrem.fromScene(envScene, 0.035);
  pmrem.dispose();
  return envRT.texture;
}

// Procedural CNC Circumferential Lathe Micro-Grain Bump Texture
function buildLatheMachinedBumpMap() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(256, 512);
  for (let y = 0; y < 512; y++) {
    const groove = Math.sin(y * 1.35) * 12 + Math.sin(y * 0.27) * 6;
    for (let x = 0; x < 256; x++) {
      const idx = (y * 256 + x) * 4;
      const microNoise = (Math.random() - 0.5) * 6;
      const v = Math.max(0, Math.min(255, Math.round(128 + groove + microNoise)));
      img.data[idx] = v;
      img.data[idx + 1] = v;
      img.data[idx + 2] = v;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 14);
  return tex;
}

async function initThreeRocketViewer() {
  const canvas = document.getElementById('three-rocket-canvas');
  const container = document.getElementById('three-viewer-container');
  const loaderOverlay = document.getElementById('three-loading-overlay');
  if (!canvas || !container) return;

  if (typeof THREE === 'undefined') {
    console.warn('Three.js library not loaded yet');
    return;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050507, 0.055);

  const w = container.clientWidth || 800;
  const h = canvas.clientHeight || container.clientHeight || 480;
  const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
  camera.position.set(2.65, 1.35, 3.05);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.matchMedia('(max-width: 768px)').matches ? 1.75 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.localClippingEnabled = false;

  const studioEnvMap = buildStudioEnvironmentMap(renderer);
  if (studioEnvMap) {
    scene.environment = studioEnvMap;
  }

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.35;
  controls.minDistance = 1.15;
  controls.maxDistance = 10;
  controls.target.set(0, -0.05, 0);

  const isTouchDevice = window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
  const btnTouch = document.getElementById('btn-toggle-touch');
  let touchOrbitEnabled = !isTouchDevice;

  function applyTouchMode() {
    if (!isTouchDevice) return;
    controls.enableRotate = touchOrbitEnabled;
    controls.enableZoom = touchOrbitEnabled;
    controls.enablePan = touchOrbitEnabled;
    canvas.style.touchAction = touchOrbitEnabled ? 'none' : 'pan-y';
    if (btnTouch) {
      btnTouch.innerText = touchOrbitEnabled ? '3D Touch: Orbit Active' : '3D Touch: Scroll Safe';
      btnTouch.classList.toggle('active', touchOrbitEnabled);
    }
  }
  applyTouchMode();

  if (btnTouch) {
    btnTouch.addEventListener('click', () => {
      touchOrbitEnabled = !touchOrbitEnabled;
      applyTouchMode();
      showToast(touchOrbitEnabled ? '3D Touch Orbit enabled — drag model to rotate' : 'Scroll-safe mode enabled — swipe to scroll page');
    });
  }

  const ambientLight = new THREE.AmbientLight(0xd4d4d8, 0.55);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(6, 9, 7);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0xdbeafe, 1.15);
  fillLight.position.set(-7, 3, 4);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffffff, 1.85);
  rimLight.position.set(-4, 6, -7);
  scene.add(rimLight);

  const throatLight = new THREE.PointLight(0xffedd5, 1.25, 2.8);
  throatLight.position.set(0, 0.15, 0);
  scene.add(throatLight);

  const bottomBellLight = new THREE.DirectionalLight(0xfed7aa, 0.85);
  bottomBellLight.position.set(0, -8, 2);
  scene.add(bottomBellLight);

  const gridHelper = new THREE.GridHelper(5.5, 22, 0x52525b, 0x1f1f23);
  gridHelper.position.y = -1.72;
  scene.add(gridHelper);

  const ringGeo = new THREE.RingGeometry(0.95, 0.97, 64);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x71717a, side: THREE.DoubleSide, transparent: true, opacity: 0.45 });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.y = -1.715;
  scene.add(ringMesh);

  const cutawayPlane = new THREE.Plane(new THREE.Vector3(-0.96, 0, 0.28).normalize(), 0.0);
  const latheBumpTex = buildLatheMachinedBumpMap();

  const materials = [
    // 0: Outer Regenerative Cooling Jacket & de Laval Nozzle Bell (Brushed 6061-T6 / 7075 Aerospace Aluminum)
    new THREE.MeshStandardMaterial({
      color: 0xdce4ee,
      metalness: 0.88,
      roughness: 0.20,
      bumpMap: latheBumpTex,
      bumpScale: 0.0022,
      envMapIntensity: 1.35,
      clippingPlanes: [cutawayPlane],
      side: THREE.DoubleSide
    }),
    // 1: Inner Combustion Chamber & Supersonic Throat Liner (CuCrZr Copper-Zirconium Alloy)
    new THREE.MeshStandardMaterial({
      color: 0xd98a5c,
      metalness: 0.87,
      roughness: 0.24,
      emissive: 0x260c03,
      emissiveIntensity: 0.32,
      bumpMap: latheBumpTex,
      bumpScale: 0.0018,
      envMapIntensity: 1.25,
      polygonOffset: true,
      polygonOffsetFactor: 2,
      polygonOffsetUnits: 2,
      clippingPlanes: [cutawayPlane],
      side: THREE.DoubleSide
    }),
    // 2: Central Radial Pintle Injector Core (Mirror-Polished Inconel 718 Superalloy)
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      metalness: 0.96,
      roughness: 0.12,
      envMapIntensity: 1.55,
      side: THREE.DoubleSide
    }),
    // 3: Injector Head Dome Flange & 36-Bolt Manifold Plate (Anodized Aerospace Titanium Ti-6Al-4V)
    new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      metalness: 0.86,
      roughness: 0.26,
      envMapIntensity: 1.25,
      clippingPlanes: [cutawayPlane],
      side: THREE.DoubleSide
    }),
    // 4: Upper Cryogenic Propellant Feed Ports / Bosses (Polished 316L Cryogenic Stainless Steel)
    new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.94,
      roughness: 0.14,
      envMapIntensity: 1.45,
      side: THREE.DoubleSide
    })
  ];

  const assemblyGroup = new THREE.Group();
  scene.add(assemblyGroup);
  const partMeshes = [];
  const explodeOffsetsY = [-0.10, -0.10, 0.22, 0.42, 0.68];
  let currentExplodeProgress = 0;
  let targetExplodeProgress = 0;

  await new Promise((r) => requestAnimationFrame(r));

  let loaded = false;
  try {
    if (window.JAHHAR_CAD_BIN_GZ_B64 && typeof DecompressionStream !== 'undefined') {
      const binary = atob(window.JAHHAR_CAD_BIN_GZ_B64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const stream = new Response(bytes).body.pipeThrough(new DecompressionStream('gzip'));
      const buf = await new Response(stream).arrayBuffer();
      await new Promise((r) => requestAnimationFrame(r));

      const dv = new DataView(buf);
      let offset = 0;
      const numGroups = dv.getUint32(offset, true); offset += 4;
      const minX = dv.getFloat32(offset, true); offset += 4;
      const minY = dv.getFloat32(offset, true); offset += 4;
      const minZ = dv.getFloat32(offset, true); offset += 4;
      const maxX = dv.getFloat32(offset, true); offset += 4;
      const maxY = dv.getFloat32(offset, true); offset += 4;
      const maxZ = dv.getFloat32(offset, true); offset += 4;

      const spanX = (maxX - minX) || 1;
      const spanY = (maxY - minY) || 1;
      const spanZ = (maxZ - minZ) || 1;
      const centerX = (minX + maxX) * 0.5;
      const centerY = (minY + maxY) * 0.5;
      const centerZ = (minZ + maxZ) * 0.5;
      const maxDim = Math.max(spanX, spanY, spanZ) || 1;
      const normScale = 3.15 / maxDim;
      const minYNorm = (minY - centerY) * normScale;
      const spanYNorm = (spanY * normScale) || 1;
      const invTwoPi = 1.0 / (Math.PI * 2);

      window._decodedCadParts = [];

      for (let g = 0; g < numGroups; g++) {
        const nV = dv.getUint32(offset, true); offset += 4;
        const nF = dv.getUint32(offset, true); offset += 4;

        const vQ = new Uint16Array(buf, offset, nV * 3);
        offset += nV * 6;
        const fQ = new Uint16Array(buf, offset, nF * 3);
        offset += nF * 6;
        const nQ = new Int8Array(buf, offset, nV * 3);
        offset += nV * 3;
        const pad = (4 - ((nV * 3) % 4)) % 4;
        offset += pad;

        const vCoords = new Float32Array(nV * 3);
        const vNorms = new Float32Array(nV * 3);
        const vUvs = new Float32Array(nV * 2);

        for (let i = 0; i < nV; i++) {
          const i3 = i * 3;
          const i2 = i * 2;
          const vx = ((minX + (vQ[i3] / 65535.0) * spanX) - centerX) * normScale;
          const vy = ((minY + (vQ[i3 + 1] / 65535.0) * spanY) - centerY) * normScale;
          const vz = ((minZ + (vQ[i3 + 2] / 65535.0) * spanZ) - centerZ) * normScale;
          vCoords[i3] = vx;
          vCoords[i3 + 1] = vy;
          vCoords[i3 + 2] = vz;

          const nx = nQ[i3] / 127.0;
          const ny = nQ[i3 + 1] / 127.0;
          const nz = nQ[i3 + 2] / 127.0;
          const nLen = Math.hypot(nx, ny, nz) || 1.0;
          vNorms[i3] = nx / nLen;
          vNorms[i3 + 1] = ny / nLen;
          vNorms[i3 + 2] = nz / nLen;

          vUvs[i2] = Math.atan2(vz, vx) * invTwoPi + 0.5;
          vUvs[i2 + 1] = (vy - minYNorm) / spanYNorm;
        }

        window._decodedCadParts.push({ vCoords, fQ, nV, nF });

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(vCoords, 3));
        geo.setAttribute('normal', new THREE.BufferAttribute(vNorms, 3));
        geo.setAttribute('uv', new THREE.BufferAttribute(vUvs, 2));
        geo.setIndex(new THREE.BufferAttribute(new Uint16Array(fQ), 1));

        const mat = materials[g] || materials[0];
        const mesh = new THREE.Mesh(geo, mat);
        mesh.userData.baseY = 0;
        mesh.userData.explodeOffsetY = explodeOffsetsY[g] || 0;
        assemblyGroup.add(mesh);
        partMeshes.push(mesh);
      }

      if (loaderOverlay) {
        loaderOverlay.classList.add('hidden');
      }
      loaded = true;
    }
  } catch (err) {
    console.warn('Decoding 5-part CAD binary failed:', err);
  }

  if (!loaded && loaderOverlay) {
    loaderOverlay.classList.add('hidden');
  }

  function onWindowResize() {
    if (!container) return;
    const hud = container.querySelector('.model-controls-hud');
    const hudH = (hud && window.innerWidth <= 768) ? hud.offsetHeight : 0;
    const width = container.clientWidth;
    const height = Math.max(280, (container.clientHeight - hudH) || 420);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onWindowResize);
  setTimeout(onWindowResize, 60);

  let viewerVisible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      viewerVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 }).observe(container);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!viewerVisible) return;

    // Smoothly interpolate Exploded CAD Assembly state
    if (Math.abs(currentExplodeProgress - targetExplodeProgress) > 0.001) {
      currentExplodeProgress += (targetExplodeProgress - currentExplodeProgress) * 0.1;
      for (let i = 0; i < partMeshes.length; i++) {
        partMeshes[i].position.y = partMeshes[i].userData.explodeOffsetY * currentExplodeProgress;
      }
    }

    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // HUD Controls
  const btnRotate = document.getElementById('btn-toggle-rotate');
  if (btnRotate) {
    btnRotate.addEventListener('click', () => {
      controls.autoRotate = !controls.autoRotate;
      btnRotate.innerText = controls.autoRotate ? 'Pause Spin' : 'Auto Spin';
      showToast(controls.autoRotate ? 'Auto-spin enabled' : 'Auto-spin paused');
    });
  }

  const btnCutaway = document.getElementById('btn-toggle-cutaway');
  if (btnCutaway) {
    let cutawayActive = false;
    btnCutaway.addEventListener('click', () => {
      cutawayActive = !cutawayActive;
      renderer.localClippingEnabled = cutawayActive;
      btnCutaway.innerText = cutawayActive ? 'Full Shell' : 'Cutaway Slice';
      btnCutaway.classList.toggle('active', cutawayActive);
      showToast(cutawayActive ? 'Internal cross-section cutaway active (Pintle & CuCrZr Liner visible)' : 'Full exterior cooling jacket restored');
    });
  }

  const btnExplode = document.getElementById('btn-toggle-explode');
  if (btnExplode) {
    let exploded = false;
    btnExplode.addEventListener('click', () => {
      exploded = !exploded;
      targetExplodeProgress = exploded ? 1.0 : 0.0;
      btnExplode.innerText = exploded ? 'Assemble CAD' : 'Explode CAD';
      btnExplode.classList.toggle('active', exploded);
      showToast(exploded ? 'Exploded assembly view: Pintle Injector, 36-Bolt Manifold & Chamber separated' : 'Assembly collapsed to nominal bolt torque positions');
    });
  }

  const btnWire = document.getElementById('btn-toggle-wire');
  if (btnWire) {
    let wire = false;
    btnWire.addEventListener('click', () => {
      wire = !wire;
      materials.forEach((m) => { m.wireframe = wire; });
      btnWire.innerText = wire ? 'Solid Shading' : 'Wireframe';
      btnWire.classList.toggle('active', wire);
      showToast(wire ? 'Precision CAD wireframe mesh activated' : 'Multi-alloy studio PBR shading restored');
    });
  }

  const btnLight = document.getElementById('btn-toggle-light');
  if (btnLight) {
    let boosted = false;
    btnLight.addEventListener('click', () => {
      boosted = !boosted;
      keyLight.intensity = boosted ? 3.2 : 2.2;
      rimLight.intensity = boosted ? 2.6 : 1.85;
      throatLight.intensity = boosted ? 2.2 : 1.25;
      renderer.toneMappingExposure = boosted ? 1.55 : 1.25;
      btnLight.innerText = boosted ? 'Normal Light' : 'Boost Light';
      btnLight.classList.toggle('active', boosted);
      showToast(boosted ? 'Studio HDRI & internal combustion throat lighting boosted' : 'Default studio lighting restored');
    });
  }

  const btnReset = document.getElementById('btn-reset-cam');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      camera.position.set(2.65, 1.35, 3.05);
      controls.target.set(0, -0.05, 0);
      targetExplodeProgress = 0.0;
      renderer.localClippingEnabled = false;
      if (btnCutaway) { btnCutaway.innerText = 'Cutaway Slice'; btnCutaway.classList.remove('active'); }
      if (btnExplode) { btnExplode.innerText = 'Explode CAD'; btnExplode.classList.remove('active'); }
      controls.update();
      showToast('Camera & assembly reset to default engineering perspective');
    });
  }
}

/* ==========================================================================
   8. CAD & TELEMETRY EXPORT DOWNLOADS
   ========================================================================== */
function initCadDownloads() {
  const cadBtns = document.querySelectorAll('[data-download-cad]');
  cadBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const kind = btn.getAttribute('data-download-cad');
      if (kind === 'obj') {
        try {
          showToast('Exporting Jahhar-0.2 RPA multi-part CAD (.OBJ)...');
          if (window._decodedCadParts && window._decodedCadParts.length) {
            const groupNames = [
              'Outer_Cooling_Jacket_6061Al',
              'Inner_Combustion_Liner_CuCrZr',
              'Radial_Pintle_Injector_Inconel718',
              'Injector_Manifold_Flange_Ti6Al4V',
              'Cryogenic_Feed_Ports_SS316L'
            ];
            const chunks = ['# Jahhar-0.2 RPA Rocket Engine Assembly - Mohamed Elsayed Aly\n'];
            let vOffset = 1;
            for (let g = 0; g < window._decodedCadParts.length; g++) {
              const part = window._decodedCadParts[g];
              chunks.push(`o ${groupNames[g] || ('Part_' + g)}\n`);
              const vc = part.vCoords;
              for (let i = 0; i < part.nV; i++) {
                const i3 = i * 3;
                chunks.push(`v ${vc[i3].toFixed(5)} ${vc[i3 + 1].toFixed(5)} ${vc[i3 + 2].toFixed(5)}\n`);
              }
              const fq = part.fQ;
              for (let f = 0; f < part.nF; f++) {
                const f3 = f * 3;
                chunks.push(`f ${fq[f3] + vOffset} ${fq[f3 + 1] + vOffset} ${fq[f3 + 2] + vOffset}\n`);
              }
              vOffset += part.nV;
            }
            const blob = new Blob(chunks, { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Jahhar-0.2_RPA_Assembly.obj';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 5000);
            showToast('Jahhar-0.2 RPA Assembly (.OBJ) download started');
            return;
          }
        } catch (err) {
          console.warn('OBJ export error:', err);
        }
        showToast('Jahhar-0.2 CAD assembly ready');
      } else if (kind === 'telemetry') {
        const telemetry = {
          engine: 'Jahhar-0.2 / R-0.1 Cryogenic Rocket Engine',
          engineer: 'Mohamed Elsayed Aly — Ain Shams University',
          propellant: 'Liquid H2 / Liquid O2 (Bipropellant)',
          chamberPressure_bar: 70.0,
          mixtureRatio_OF: 4.0,
          singleEngineThrust_N: 164170.14,
          analyticalDesignThrust_N: 196200,
          clusterEngines: 5,
          clusterTotalThrust_N: 981000,
          peakCombustionTemp_K: 3807,
          specificImpulse_s: 389.87,
          massFlowRate_kg_s: 51.30,
          chamberNozzleMass_kg: 12.0,
          targetPayload_kg: 10000
        };
        const blob = new Blob([JSON.stringify(telemetry, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Jahhar-0.2_Engine_Telemetry.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        showToast('Exported Jahhar-0.2 Engine Telemetry (.JSON)');
      }
    });
  });
}

/* ==========================================================================
   9. CLIPBOARD & TOAST NOTIFICATION
   ========================================================================== */
function initClipboardButtons() {
  const copyBtns = document.querySelectorAll('[data-copy]');
  copyBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (!textToCopy) return;
      const fallbackCopy = () => {
        const temp = document.createElement('textarea');
        temp.value = textToCopy;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        showToast(`Copied: ${textToCopy}`);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`Copied to clipboard: ${textToCopy}`);
        }).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }
    });
  });
}

function showToast(message) {
  let toast = document.getElementById('toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-msg';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> ${message}`;
  toast.classList.add('show');

  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/* ==========================================================================
   10. CONTACT FORM INTERACTION
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('form-name');
    const name = nameInput ? nameInput.value : '';
    showToast(`Thank you, ${name || 'colleague'}! Message prepared for Mohamed.`);
    form.reset();
  });
}

/* ==========================================================================
   11. MOBILE NAVIGATION MENU (HAMBURGER TOGGLE & OUTSIDE CLICK)
   ========================================================================== */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const navbar = document.querySelector('.navbar');
  if (!toggle || !navbar) return;

  const iconHamburger = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
  const iconClose = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

  function setMenuState(open) {
    navbar.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.innerHTML = open ? iconClose : iconHamburger;
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navbar.classList.contains('menu-open');
    setMenuState(!isOpen);
  });

  navbar.querySelectorAll('.nav-links a, .nav-actions a').forEach((link) => {
    link.addEventListener('click', () => {
      setMenuState(false);
    });
  });

  document.addEventListener('click', (e) => {
    if (navbar.classList.contains('menu-open') && !navbar.contains(e.target)) {
      setMenuState(false);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbar.classList.contains('menu-open')) {
      setMenuState(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 768 && navbar.classList.contains('menu-open')) {
      setMenuState(false);
    }
  });
}
