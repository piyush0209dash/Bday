/**
 * Global configuration for Birthday Experience
 * Centralized place for all tunable parameters
 */

const CONFIG = {
  // ─── BIRTHDAY INFO ──────────────────────────────────────
  birthday: {
    name: 'Princess Tanya',
    month: 5, // June (0-indexed)
    day: 12,
    location: 'khordha, odisha',
  },

  // ─── CAMERA ─────────────────────────────────────────────
  camera: {
    fov: 75,
    near: 0.1,
    far: 2000,
    initialPosition: { x: 0, y: 1.5, z: 4 },
    initialLookAt: { x: 0, y: 1.5, z: -5 },
  },

  // ─── RENDERER ────────────────────────────────────────────
  renderer: {
    antialias: true,
    pixelRatioCap: 2,
    shadowMapEnabled: true,
    shadowMapType: 'PCFSoftShadowMap', // or 'BasicShadowMap'
    toneMapping: 'ACESFilmicToneMapping',
    toneMappingExposure: 1.0,
  },

  // ─── HUT DIMENSIONS ─────────────────────────────────────
  hut: {
    width: 30,
    depth: 30,
    wallHeight: 10,
    ceilingHeight: 8.5,
    floorY: -1.5,
    torchIntensity: 2.5,
    torchRange: 8,
    fireplaceIntensity: 3,
    fireplaceRange: 12,
  },

  // ─── OUTDOOR ────────────────────────────────────────────
  outdoor: {
    groundSize: 600,
    skyRadius: 900,
    fogNear: 200,
    fogFar: 900,
    grassCount: 3000,
    flowerCount: 200,
    treePositions: [
      [-30, 30], [-25, 45], [-40, 60], [-35, 80],
      [25, 35], [30, 55], [40, 70],
      [-50, 90], [50, 90],
    ],
    mountainPositions: {
      far: [
        [-180, 320, 80, 55, 0x8aaab8], [0, 350, 95, 70, 0x6a8a9a], [180, 310, 70, 50, 0x8aaab8],
        [-80, 340, 60, 42, 0x9ab0be], [90, 360, 55, 38, 0x9ab0be],
        [-250, 330, 65, 45, 0x8aaab8], [250, 320, 72, 48, 0x7a9aaa],
      ],
      mid: [
        [-120, 250, 55, 38, 0x6a8a7a], [60, 230, 45, 32, 0x5a7a8a],
        [-200, 240, 50, 35, 0x607080], [200, 260, 60, 40, 0x5a7080],
      ],
      near: [
        [-80, 160, 35, 25, 0x4a6a5a], [20, 180, 40, 28, 0x3a5a6a],
        [150, 170, 30, 20, 0x4a5a6a], [-160, 165, 38, 26, 0x405060],
      ],
    },
    celestial: {
      sunSize: 18,
      moonSize: 12,
      sunGlowSize: 30,
    },
    cloudCount: 8,
    stormCloudCount: 12,
  },

  // ─── WEATHER ────────────────────────────────────────────
  weather: {
    stormLikelihood: 0.55, // 55% chance during storm hours
    stormHours: { start: 14, end: 19 }, // 2 PM - 7 PM
    stormNightHours: { start: 0, end: 4 }, // Midnight - 4 AM
    rainParticles: 4000,
    petalCount: 60,
    breezeParticles: 300,
  },

  // ─── TIMING & ANIMATIONS ────────────────────────────────
  timing: {
    loadingFadeDuration: 1500, // ms
    gateOpenDuration: 600, // ms (angle animation duration)
    doorOpenAngle: Math.PI * 0.65, // radians
    cameraApproachDuration: 1000, // ms
    transitionDuration: 1500, // ms
    flashDuration: 600, // ms
    messageShowDelay: 2000, // ms
    countdownUpdateInterval: 1000, // ms
  },

  // ─── UI/UX ──────────────────────────────────────────────
  ui: {
    progressUpdateInterval: 20, // ms
    progressIncrementPerTick: 2, // percent
    progressStages: [
      { target: 40, label: 'Building Hut...' },
      { target: 80, label: 'Preparing Outdoors...' },
      { target: 100, label: 'Loading Complete...' },
    ],
  },

  // ─── MOBILE OPTIMIZATION ────────────────────────────────
  mobile: {
    grassCountMobile: 1500, // Reduced for mobile
    cloudCountMobile: 4,
    stormCloudCountMobile: 6,
    particleReduceFactor: 0.5, // 50% of desktop particles on mobile
    enableJoystick: true,
    joystickSize: 120,
    joystickKnobRadius: 40,
  },

  // ─── PERFORMANCE ────────────────────────────────────────
  performance: {
    enableLOD: true,
    lodDistances: { near: 50, mid: 150, far: 300 },
    enableInstancing: true,
    shadowMapSize: 2048,
    maxBoneInfluence: 4,
  },

  // ─── ACCESSIBILITY ──────────────────────────────────────
  accessibility: {
    reduceMotion: false, // Detect via prefers-reduced-motion
    highContrast: false, // Detect via prefers-contrast
    enableKeyboardControls: true,
  },

  // ─── MESSAGES ────────────────────────────────────────────
  messages: {
    midnight: {
      greeting: 'tu abhi tak soi nahi🤨??',
      subtext: 'Apne tabyat ka to khayal rakh.',
    },
    morning: {
      greeting: 'tu uth gayi🤨??',
    },
    default: {
      greeting: 'Happy Birthday',
    },
  },

  // ─── COLORS & MATERIALS ─────────────────────────────────
  materials: {
    colors: {
      primary: 0xe8c060, // Gold
      secondary: 0xffffff, // White
      stone: 0x4a3a2a,
      darkStone: 0x2e2318,
      wood: 0x5a3010,
      darkWood: 0x3a1a08,
      floor: 0x3a2e22,
    },
    roughness: {
      stone: 0.95,
      wood: 0.9,
      metal: 0.3,
      glass: 0.1,
    },
  },

  // ─── AUDIO ──────────────────────────────────────────────
  audio: {
    enabled: true,
    masterVolume: 0.5,
    ambient: { volume: 0.3, loop: true },
    gateOpen: { volume: 0.6, loop: false },
    doorCreak: { volume: 0.4, loop: false },
    chime: { volume: 0.5, loop: false },
  },
};

// Detect mobile
CONFIG.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// Detect reduced motion preference
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  CONFIG.accessibility.reduceMotion = true;
}

// Detect high contrast preference
if (window.matchMedia('(prefers-contrast: more)').matches) {
  CONFIG.accessibility.highContrast = true;
}

// Apply mobile optimizations
if (CONFIG.isMobile) {
  CONFIG.outdoor.grassCount = CONFIG.mobile.grassCountMobile;
  CONFIG.outdoor.cloudCount = CONFIG.mobile.cloudCountMobile;
  CONFIG.outdoor.flowerCount = Math.floor(CONFIG.weather.petalCount * CONFIG.mobile.particleReduceFactor);
  CONFIG.weather.rainParticles = Math.floor(CONFIG.weather.rainParticles * CONFIG.mobile.particleReduceFactor);
}
