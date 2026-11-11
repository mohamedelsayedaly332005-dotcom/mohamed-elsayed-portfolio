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
  initThreeRocketViewer();
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

    // Area-based density, capped lower on phones (a 360x800 screen only needs ~11)
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

    // Lines: cheap bounding-box reject first, sqrt only for surviving pairs
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

  // Debounced rebuild so the mobile URL-bar collapse doesn't respawn particles per frame
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 150);
  });

  // Pause rendering when the tab is hidden (battery/CPU)
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

  // Measure section geometry once and refresh on resize, NOT on every scroll event
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
   3. ANIMATED METRIC COUNTERS
   ========================================================================== */
function initStatsCounters() {
  const counters = Array.from(document.querySelectorAll('.stat-num[data-target]'));
  if (!counters.length) return;

  // Count up as the page opens on every device, phone included: these numbers
  // sit below the fold on small screens, where a scroll-triggered start left
  // them showing 0.
  counters.forEach((counter) => {
    const target = parseFloat(counter.getAttribute('data-target'));
    const suffix = counter.getAttribute('data-suffix') || '';
    const prefix = counter.getAttribute('data-prefix') || '';
    const decimals = parseInt(counter.getAttribute('data-decimals') || '0', 10);
    const duration = 1800;
    const start = performance.now();

    function updateCounter(time) {
      const progress = Math.min((time - start) / duration, 1);
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentVal = target * ease;

      counter.innerHTML = prefix + currentVal.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }) + '<span>' + suffix + '</span>';

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    }

    requestAnimationFrame(updateCounter);
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
   5. FULLSCREEN LIGHTBOX MODAL
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

  // Collect all gallery items
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

  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', showPrev);
  nextBtn.addEventListener('click', showNext);

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
   7. 3D MODEL VIEWER CONTROLS
   ========================================================================== */

/* ==========================================================================
   7. THREE.JS 3D CAD VIEWER (Jahhar-0.2 RPA OBJ Assembly)
   ========================================================================== */
async function initThreeRocketViewer() {
  const canvas = document.getElementById('three-rocket-canvas');
  const container = document.getElementById('three-viewer-container');
  const loaderOverlay = document.getElementById('three-loading-overlay');
  if (!canvas || !container) return;

  if (typeof THREE === 'undefined') {
    console.warn('Three.js library not loaded yet');
    return;
  }

  // 1. Scene & Environment (Monochrome Obsidian Studio)
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.08);

  // 2. Camera Setup
  const w = container.clientWidth || 800;
  const h = container.clientHeight || 540;
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
  camera.position.set(2.8, 1.8, 3.2);

  // 3. WebGL Renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance'
  });
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.matchMedia('(max-width: 768px)').matches ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;

  // 4. OrbitControls
  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.6;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    controls.autoRotate = false;
  }
  controls.minDistance = 1.2;
  controls.maxDistance = 12;
  controls.target.set(0, 0, 0);

  // 5. Studio Monochrome & High-Contrast Lighting
  // Soft Neutral Ambient
  const ambientLight = new THREE.AmbientLight(0x27272a, 1.3);
  scene.add(ambientLight);

  // Key Studio Spotlight (Crisp Pure White 5500K)
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
  keyLight.position.set(7, 10, 6);
  scene.add(keyLight);

  // Fill Light (Diffused Titanium Neutral)
  const fillLight = new THREE.DirectionalLight(0xa1a1aa, 1.4);
  fillLight.position.set(-6, 4, 3);
  scene.add(fillLight);

  // High-Contrast Pure White Rim Light (Dramatic Silhouette on Engine Bell & Manifold)
  const rimLight = new THREE.DirectionalLight(0xffffff, 2.2);
  rimLight.position.set(-5, 5, -6);
  scene.add(rimLight);

  // Specular Top Accent Light
  const topLight = new THREE.DirectionalLight(0xffffff, 1.5);
  topLight.position.set(0, 12, 0);
  scene.add(topLight);

  // Bottom Fill Light (Illuminates Inner Bell Throat)
  const bottomLight = new THREE.DirectionalLight(0x71717a, 1.0);
  bottomLight.position.set(0, -7, 2);
  scene.add(bottomLight);

  // Ground Grid (Charcoal / Titanium)
  const gridHelper = new THREE.GridHelper(6, 20, 0x71717a, 0x27272a);
  gridHelper.position.y = -1.75;
  scene.add(gridHelper);

  // 6. Cast Aluminum Surface Shader
  // Procedural Micro-Bump Map for Sand-Cast Pitting
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = 128;
  bumpCanvas.height = 128;
  const bCtx = bumpCanvas.getContext('2d');
  const bData = bCtx.createImageData(128, 128);
  for (let i = 0; i < bData.data.length; i += 4) {
    const val = 120 + Math.floor(Math.random() * 45);
    bData.data[i] = val;
    bData.data[i+1] = val;
    bData.data[i+2] = val;
    bData.data[i+3] = 255;
  }
  bCtx.putImageData(bData, 0, 0);
  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.RepeatWrapping;
  bumpTex.repeat.set(12, 12);

  const castAluminumMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0, // Silvery-gray cast aluminum alloy
    metalness: 0.92, // True metallic specular response
    roughness: 0.38, // Micro-textured sand-cast surface
    bumpMap: bumpTex,
    bumpScale: 0.015,
    side: THREE.DoubleSide
  });

  let rocketMesh = null;

  function setupLoadedMesh(object) {
    rocketMesh = object;
    // Compute bounding box to center and scale
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    object.position.sub(center);

    // Normalize so engine height is ~3.2 units
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const s = 3.2 / maxDim;
      object.scale.set(s, s, s);
    }

    // Apply material to all meshes and compute smooth normals
    object.traverse(child => {
      if (child.isMesh) {
        child.material = castAluminumMaterial;
        if (child.geometry) {
          child.geometry.computeVertexNormals();
        }
      }
    });

    scene.add(object);

    if (loaderOverlay) {
      loaderOverlay.classList.add('hidden');
    }
  }

  // 7. Load Jahhar-0.2 RPA Assembly (OBJ)
  let loaded = false;
  try {
    if (window.JAHHAR_OBJ_GZIP_B64 && typeof DecompressionStream !== 'undefined') {
      const binary = atob(window.JAHHAR_OBJ_GZIP_B64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const stream = new Response(bytes).body.pipeThrough(new DecompressionStream('gzip'));
      const objText = await new Response(stream).text();
      const loader = new THREE.OBJLoader();
      const obj = loader.parse(objText);
      setupLoadedMesh(obj);
      loaded = true;
    }
  } catch (err) {
    console.warn('Decompressing bundled OBJ failed, falling back to direct load:', err);
  }

  if (!loaded) {
    const loader = new THREE.OBJLoader();
    loader.load(
      'assets/jahhar_02.obj',
      setupLoadedMesh,
      (xhr) => {
        if (xhr.lengthComputable && loaderOverlay) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          const txt = loaderOverlay.querySelector('.loader-text');
          if (txt) txt.innerText = `Loading Jahhar-0.2 OBJ (${pct}%)...`;
        }
      },
      (err) => {
        console.warn('jahhar_02.obj load failed, trying Jahhar-0.2 RPA assembly.obj:', err);
        loader.load('assets/Jahhar-0.2 RPA assembly.obj', setupLoadedMesh, undefined, (e2) => {
          console.error('All OBJ loads failed:', e2);
          if (loaderOverlay) {
            loaderOverlay.innerHTML = '<div style="color:#ffffff; padding:1.5rem; text-align:center;">Failed to load OBJ. Please inspect local assets.</div>';
          }
        });
      }
    );
  }

  // Resize Listener
  function onWindowResize() {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onWindowResize);

  // Render Loop: only draw while the viewer is on screen (big battery/CPU win on phones)
  let viewerVisible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      viewerVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 }).observe(container);
  }

  function animate() {
    requestAnimationFrame(animate);
    if (!viewerVisible) return;
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // Controls HUD Events
  const btnRotate = document.getElementById('btn-toggle-rotate');
  if (btnRotate) {
    btnRotate.addEventListener('click', () => {
      controls.autoRotate = !controls.autoRotate;
      btnRotate.innerText = controls.autoRotate ? 'Pause Spin' : 'Auto Spin';
      showToast(controls.autoRotate ? 'Auto-spin enabled' : 'Auto-spin paused');
    });
  }

  const btnWire = document.getElementById('btn-toggle-wire');
  if (btnWire) {
    let wire = false;
    btnWire.addEventListener('click', () => {
      wire = !wire;
      castAluminumMaterial.wireframe = wire;
      btnWire.innerText = wire ? 'Solid Shading' : 'Wireframe';
      showToast(wire ? 'Wireframe mesh activated' : 'Cast aluminum shading restored');
    });
  }

  const btnLight = document.getElementById('btn-toggle-light');
  if (btnLight) {
    let boosted = false;
    btnLight.addEventListener('click', () => {
      boosted = !boosted;
      keyLight.intensity = boosted ? 3.5 : 2.2;
      rimLight.intensity = boosted ? 2.5 : 1.6;
      renderer.toneMappingExposure = boosted ? 1.8 : 1.3;
      btnLight.innerText = boosted ? 'Normal Light' : 'Boost Light';
      showToast(boosted ? 'Lighting exposure boosted' : 'Default lighting restored');
    });
  }

  const btnReset = document.getElementById('btn-reset-cam');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      camera.position.set(2.8, 1.8, 3.2);
      controls.target.set(0, 0, 0);
      controls.update();
      showToast('Camera reset to default engineering perspective');
    });
  }
}


/* ==========================================================================
   8. CLIPBOARD & TOAST NOTIFICATION
   ========================================================================== */
function initClipboardButtons() {
  const copyBtns = document.querySelectorAll('[data-copy]');
  copyBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-copy');
      if (navigator.clipboard && textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`Copied to clipboard: ${textToCopy}`);
        });
      } else {
        // Fallback
        const temp = document.createElement('textarea');
        temp.value = textToCopy;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
        showToast(`Copied: ${textToCopy}`);
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

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3200);
}

/* ==========================================================================
   9. CONTACT FORM INTERACTION
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('form-name').value;
    showToast(`Thank you, ${name || 'colleague'}! Message prepared for Mohamed.`);
    form.reset();
  });
}


/* ==========================================================================
   10. MOBILE NAVIGATION MENU (hamburger toggle)
   ========================================================================== */
function initMobileMenu() {
  const toggle = document.getElementById('mobile-toggle');
  const navbar = document.querySelector('.navbar');
  if (!toggle || !navbar) return;

  toggle.addEventListener('click', () => {
    const open = navbar.classList.toggle('menu-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // Close the panel after tapping any link
  navbar.querySelectorAll('.nav-links a, .nav-actions a').forEach((link) => {
    link.addEventListener('click', () => {
      navbar.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
}
