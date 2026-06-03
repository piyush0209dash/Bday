/**
 * Utility functions for Birthday Experience
 */

// ─── TIME UTILITIES ──────────────────────────────────────────
function getIST() {
  const now = new Date();
  return new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5.5 * 3600000);
}

function isBirthday(t) {
  return t.getMonth() === CONFIG.birthday.month && t.getDate() === CONFIG.birthday.day;
}

function timeWindow(t) {
  const h = t.getHours();
  if (h >= 0 && h < 4) return 'midnight';
  if (h >= 4 && h < 10) return 'morning';
  return 'day';
}

function countdown() {
  const t = getIST();
  let bd = new Date(t.getFullYear(), CONFIG.birthday.month, CONFIG.birthday.day);
  if (t >= bd) bd = new Date(t.getFullYear() + 1, CONFIG.birthday.month, CONFIG.birthday.day);
  const d = bd - t;
  return {
    days: Math.floor(d / 86400000),
    h: Math.floor((d % 86400000) / 3600000),
    m: Math.floor((d % 3600000) / 60000),
    s: Math.floor((d % 60000) / 1000),
  };
}

// ─── THREE.JS MATERIAL HELPERS ──────────────────────────────
function makeMat(color, roughness = 0.85, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

// ─── GEOMETRY HELPERS ───────────────────────────────────────
function box(w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(rt, rb, h, seg, mat, x, y, z) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// ─── PARTICLE HELPERS ───────────────────────────────────────
function makeParticles(count, spread, color, size, y = 0) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * spread;
    pos[i * 3 + 1] = y + (Math.random() - 0.5) * spread * 0.3;
    pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color,
    size,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
  });
  return new THREE.Points(geo, mat);
}

// ─── DOM MANIPULATION ────────────────────────────────────────
function updateProgressBar(percent) {
  document.getElementById('progress-fill').style.width = percent + '%';
}

function fakeProgress(target, cb) {
  let progress = 0;
  const iv = setInterval(() => {
    progress = Math.min(target, progress + CONFIG.ui.progressIncrementPerTick);
    updateProgressBar(progress);
    if (progress >= target) {
      clearInterval(iv);
      cb && cb();
    }
  }, CONFIG.ui.progressUpdateInterval);
}

function fadeElement(element, opacity, duration) {
  element.style.transition = `opacity ${duration}ms ease`;
  element.style.opacity = opacity;
}

// ─── ANIMATION HELPERS ──────────────────────────────────────
function animateValue(startVal, endVal, duration, onUpdate, onComplete) {
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    onUpdate(startVal + (endVal - startVal) * progress);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      onComplete && onComplete();
    }
  }
  
  requestAnimationFrame(update);
}

// ─── CAMERA HELPERS ─────────────────────────────────────────
function positionCamera(camera, x, y, z) {
  camera.position.set(x, y, z);
}

function lookAtTarget(camera, x, y, z) {
  camera.lookAt(x, y, z);
}

// ─── MOBILE DETECTION ───────────────────────────────────────
function isMobileDevice() {
  return CONFIG.isMobile;
}

function isSmallScreen() {
  return window.innerWidth < 768;
}

// ─── ACCESSIBILITY HELPERS ──────────────────────────────────
function getReducedMotionPreference() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getHighContrastPreference() {
  return window.matchMedia('(prefers-contrast: more)').matches;
}

// ─── RANDOM HELPERS ─────────────────────────────────────────
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function randomIntInRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── DEBUG HELPERS ──────────────────────────────────────────
function log(message, data = null) {
  if (window.DEBUG_MODE) {
    console.log(`[Bday] ${message}`, data || '');
  }
}

function warn(message, data = null) {
  console.warn(`[Bday] ${message}`, data || '');
}

function error(message, data = null) {
  console.error(`[Bday] ${message}`, data || '');
}
