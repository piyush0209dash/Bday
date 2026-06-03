/**
 * Three.js scene initialization and management
 */

class SceneManager {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.currentScene = 'hut';
    this.hutObjects = [];
    this.outdoorObjects = [];
  }

  initialize() {
    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('canvas'),
      antialias: CONFIG.renderer.antialias,
      alpha: false,
    });

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, CONFIG.renderer.pixelRatioCap));
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    if (CONFIG.renderer.shadowMapEnabled) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = CONFIG.renderer.toneMappingExposure;

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    // Camera setup
    const cam = CONFIG.camera;
    this.camera = new THREE.PerspectiveCamera(
      cam.fov,
      window.innerWidth / window.innerHeight,
      cam.near,
      cam.far
    );
    this.camera.position.set(cam.initialPosition.x, cam.initialPosition.y, cam.initialPosition.z);
    this.camera.lookAt(cam.initialLookAt.x, cam.initialLookAt.y, cam.initialLookAt.z);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    log('SceneManager initialized');
    return { scene: this.scene, camera: this.camera, renderer: this.renderer };
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  clear() {
    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
  }

  switchScene(sceneName) {
    this.currentScene = sceneName;
    log(`Switched to scene: ${sceneName}`);
  }

  addToScene(object) {
    this.scene.add(object);
  }

  removeFromScene(object) {
    this.scene.remove(object);
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }
}

// ─── CAMERA CONTROLLER ──────────────────────────────────────
class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.yaw = 0;
    this.pitch = 0;
    this.targetYaw = 0;
    this.targetPitch = 0;
    this.isDragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.dragSensitivity = { x: 0.003, y: 0.002 };

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse controls
    document.addEventListener('mousedown', (e) => this.onMouseDown(e));
    document.addEventListener('mouseup', () => this.onMouseUp());
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // Touch controls (excluding joystick zone)
    document.addEventListener(
      'touchstart',
      (e) => this.onTouchStart(e),
      { passive: true }
    );
    document.addEventListener('touchend', () => this.onTouchEnd());
    document.addEventListener(
      'touchmove',
      (e) => this.onTouchMove(e),
      { passive: true }
    );
  }

  onMouseDown(e) {
    this.isDragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onMouseMove(e) {
    if (!this.isDragging) return;

    this.targetYaw -= (e.clientX - this.lastX) * this.dragSensitivity.x;
    this.targetPitch -= (e.clientY - this.lastY) * this.dragSensitivity.y;
    this.targetPitch = Math.max(-0.5, Math.min(0.5, this.targetPitch));

    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  onTouchStart(e) {
    if (e.target.closest('#joystick-zone')) return;
    this.isDragging = true;
    this.lastX = e.touches[0].clientX;
    this.lastY = e.touches[0].clientY;
  }

  onTouchEnd() {
    this.isDragging = false;
  }

  onTouchMove(e) {
    if (!this.isDragging) return;

    this.targetYaw -= (e.touches[0].clientX - this.lastX) * (this.dragSensitivity.x * 1.33);
    this.targetPitch -= (e.touches[0].clientY - this.lastY) * (this.dragSensitivity.y * 1.5);
    this.targetPitch = Math.max(-0.5, Math.min(0.5, this.targetPitch));

    this.lastX = e.touches[0].clientX;
    this.lastY = e.touches[0].clientY;
  }

  update() {
    // Smooth camera movement
    this.yaw += (this.targetYaw - this.yaw) * 0.1;
    this.pitch += (this.targetPitch - this.pitch) * 0.1;

    // Apply rotation to camera
    const x = Math.sin(this.yaw) * Math.cos(this.pitch);
    const y = Math.sin(this.pitch);
    const z = Math.cos(this.yaw) * Math.cos(this.pitch);

    this.camera.position.addScaledVector(new THREE.Vector3(x, y, z).normalize(), 0.01);
  }

  setTarget(yaw, pitch) {
    this.targetYaw = yaw;
    this.targetPitch = pitch;
  }

  getPosition() {
    return this.camera.position.clone();
  }

  setPosition(x, y, z) {
    this.camera.position.set(x, y, z);
  }
}

// ─── VIRTUAL JOYSTICK ───────────────────────────────────────
class VirtualJoystick {
  constructor() {
    this.zone = document.getElementById('joystick-zone');
    this.knob = document.getElementById('joystick-knob');
    this.moveAxis = { x: 0, y: 0 };
    this.active = false;
    this.center = { x: 0, y: 0 };
    this.maxDistance = 40;

    this.setupEventListeners();

    // Show joystick only on mobile
    if (CONFIG.isMobile && CONFIG.mobile.enableJoystick) {
      this.zone.style.display = 'block';
    }
  }

  setupEventListeners() {
    this.zone.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.zone.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.zone.addEventListener('touchend', () => this.onTouchEnd());
  }

  onTouchStart(e) {
    this.active = true;
    const rect = this.zone.getBoundingClientRect();
    this.center = { x: rect.left + 60, y: rect.top + 60 };
    this.updateJoystick(e.touches[0]);
  }

  onTouchMove(e) {
    if (!this.active) return;
    e.preventDefault();
    this.updateJoystick(e.touches[0]);
  }

  onTouchEnd() {
    this.active = false;
    this.moveAxis = { x: 0, y: 0 };
    this.knob.style.transform = 'translate(0px, 0px)';
  }

  updateJoystick(touch) {
    let dx = touch.clientX - this.center.x;
    let dy = touch.clientY - this.center.y;
    const distance = Math.min(Math.hypot(dx, dy), this.maxDistance);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * distance;
    const knobY = Math.sin(angle) * distance;

    this.knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    this.moveAxis.x = knobX / this.maxDistance;
    this.moveAxis.y = knobY / this.maxDistance;
  }

  getAxis() {
    return this.moveAxis;
  }

  reset() {
    this.moveAxis = { x: 0, y: 0 };
    this.knob.style.transform = 'translate(0px, 0px)';
  }
}

// Export for use in other modules
window.SceneManager = SceneManager;
window.CameraController = CameraController;
window.VirtualJoystick = VirtualJoystick;
