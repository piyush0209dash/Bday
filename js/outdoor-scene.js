/**
 * Outdoor scene builder - creates the expansive kingdom landscape
 */

class OutdoorBuilder {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
  }

  build() {
    const ist = getIST();
    const hour = ist.getHours();

    // Sky setup
    this.buildSky(hour);

    // Ground
    this.buildGround();

    // Grass
    this.buildGrass();

    // Mountains
    this.buildMountains();

    // Trees
    this.buildTrees();

    // Wildflowers
    this.buildWildflowers();

    // Path
    this.buildPath();

    // Stars
    if (hour < 6 || hour >= 18) {
      this.buildStars();
    }

    // Sun/Moon
    this.buildCelestial(hour);

    // Lighting
    this.buildLighting(hour);

    // Weather
    this.buildWeather(hour);

    // Particles (breeze, petals)
    this.buildParticles();

    this.scene.add(this.group);
    return { group: this.group };
  }

  buildSky(hour) {
    const skyColors = {
      night: [0x050a18, 0x0d1a35],
      dawn: [0x1a1040, 0xe8702a],
      morning: [0x4a90d9, 0xc8e6f5],
      noon: [0x1a6ab8, 0x87ceeb],
      afternoon: [0x2a5a9a, 0xe8c870],
      evening: [0x1a1040, 0xf5a623],
    };

    const getSkyColors = (h) => {
      if (h < 4) return skyColors.night;
      if (h < 6) return skyColors.dawn;
      if (h < 10) return skyColors.morning;
      if (h < 14) return skyColors.noon;
      if (h < 18) return skyColors.afternoon;
      if (h < 20) return skyColors.evening;
      return skyColors.night;
    };

    const [skyTop, skyBot] = getSkyColors(hour);

    const skySphere = new THREE.Mesh(
      new THREE.SphereGeometry(CONFIG.outdoor.skyRadius, 32, 32),
      new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: skyTop })
    );
    this.group.add(skySphere);

    this.scene.background = new THREE.Color(skyTop);
    this.scene.fog = new THREE.Fog(new THREE.Color(skyBot), CONFIG.outdoor.fogNear, CONFIG.outdoor.fogFar);
  }

  buildGround() {
    const geo = new THREE.PlaneGeometry(CONFIG.outdoor.groundSize, CONFIG.outdoor.groundSize, 80, 80);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3a6a1a, roughness: 0.95 });

    // Add gentle undulation
    const verts = geo.attributes.position;
    for (let i = 0; i < verts.count; i++) {
      verts.setY(i, (Math.random() - 0.5) * 0.5);
    }
    geo.computeVertexNormals();

    const ground = new THREE.Mesh(geo, mat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    this.group.add(ground);
  }

  buildGrass() {
    const geo = new THREE.ConeGeometry(0.05, 0.4, 4);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a8a20, roughness: 1 });
    const count = CONFIG.outdoor.grassCount;

    const dummy = new THREE.Object3D();
    const grassMesh = new THREE.InstancedMesh(geo, mat, count);

    for (let i = 0; i < count; i++) {
      const gx = (Math.random() - 0.5) * 500;
      const gz = -30 + Math.random() * 480;
      dummy.position.set(gx, -1.8 + Math.random() * 0.1, gz);
      dummy.rotation.set(0, Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.3);
      dummy.updateMatrix();
      grassMesh.setMatrixAt(i, dummy.matrix);
    }

    grassMesh.receiveShadow = true;
    this.group.add(grassMesh);
  }

  buildMountains() {
    const makeMountain = (x, z, h, w, color) => {
      const mg = new THREE.Group();
      const geo = new THREE.ConeGeometry(w, h, 7 + Math.floor(Math.random() * 5));

      const vv = geo.attributes.position;
      for (let i = 0; i < vv.count; i++) {
        if (vv.getY(i) < h * 0.3) {
          vv.setX(i, vv.getX(i) * (1 + (Math.random() - 0.5) * 0.4));
          vv.setZ(i, vv.getZ(i) * (1 + (Math.random() - 0.5) * 0.4));
        }
      }
      geo.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
      const peak = new THREE.Mesh(geo, mat);
      peak.castShadow = true;
      peak.position.set(x, h / 2 - 2, z);
      mg.add(peak);

      if (h > 40) {
        const scap = new THREE.Mesh(
          new THREE.ConeGeometry(w * 0.25, h * 0.18, 6),
          new THREE.MeshStandardMaterial({ color: 0xeeeeff, roughness: 0.7 })
        );
        scap.position.set(x, h - 2, z);
        mg.add(scap);
      }

      return mg;
    };

    CONFIG.outdoor.mountainPositions.far.forEach((args) => this.group.add(makeMountain(...args)));
    CONFIG.outdoor.mountainPositions.mid.forEach((args) => this.group.add(makeMountain(...args)));
    CONFIG.outdoor.mountainPositions.near.forEach((args) => this.group.add(makeMountain(...args)));
  }

  buildTrees() {
    const makeTree = (x, z) => {
      const tg = new THREE.Group();
      const trunk = cyl(0.18, 0.22, 1.4, 7, makeMat(0x5a3010), x, -1.3, z);
      tg.add(trunk);

      const f1 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 2.5, 7), makeMat(0x2a5a1a, 0.9));
      f1.position.set(x, 0.8, z);
      tg.add(f1);

      const f2 = new THREE.Mesh(new THREE.ConeGeometry(1.0, 2, 7), makeMat(0x3a6a2a, 0.9));
      f2.position.set(x, 2, z);
      tg.add(f2);

      const f3 = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.5, 7), makeMat(0x4a7a2a, 0.9));
      f3.position.set(x, 3, z);
      tg.add(f3);

      return tg;
    };

    CONFIG.outdoor.treePositions.forEach(([x, z]) => this.group.add(makeTree(x, z)));
  }

  buildWildflowers() {
    const flowerColors = [0xff6b9d, 0xffd700, 0xff8c42, 0xffffff, 0xcc44ff];
    const count = CONFIG.outdoor.flowerCount;

    for (let i = 0; i < count; i++) {
      const fc = flowerColors[Math.floor(Math.random() * flowerColors.length)];
      const stem = cyl(0.015, 0.015, 0.2 + Math.random() * 0.2, 4, makeMat(0x4a8a20), (Math.random() - 0.5) * 100, -1.8 + Math.random() * 0.1, Math.random() * 80 + 5);
      this.group.add(stem);

      const bloom = new THREE.Mesh(
        new THREE.SphereGeometry(0.06 + Math.random() * 0.06, 6, 6),
        new THREE.MeshStandardMaterial({ color: fc, roughness: 0.6, emissive: fc, emissiveIntensity: 0.1 })
      );
      bloom.position.set(stem.position.x, -1.5 + Math.random() * 0.2, stem.position.z);
      this.group.add(bloom);
    }
  }

  buildPath() {
    const geo = new THREE.PlaneGeometry(3, 200);
    const mat = new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.98 });
    const path = new THREE.Mesh(geo, mat);
    path.rotation.x = -Math.PI / 2;
    path.position.set(0, -1.99, 80);
    path.receiveShadow = true;
    this.group.add(path);
  }

  buildStars() {
    const geo = new THREE.BufferGeometry();
    const sp = new Float32Array(2000 * 3);

    for (let i = 0; i < 2000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.9);
      sp[i * 3] = Math.sin(phi) * Math.cos(theta) * CONFIG.outdoor.skyRadius;
      sp[i * 3 + 1] = Math.cos(phi) * CONFIG.outdoor.skyRadius;
      sp[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * CONFIG.outdoor.skyRadius;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: true });
    const stars = new THREE.Points(geo, mat);
    this.group.add(stars);
  }

  buildCelestial(hour) {
    const isNight = hour < 6 || hour >= 18;
    const size = isNight ? CONFIG.outdoor.celestial.moonSize : CONFIG.outdoor.celestial.sunSize;

    const mat = isNight
      ? new THREE.MeshStandardMaterial({
          color: 0xe8e8d0,
          emissive: 0xc8c8a0,
          emissiveIntensity: 0.8,
          roughness: 0.9,
        })
      : new THREE.MeshStandardMaterial({
          color: 0xfff5c8,
          emissive: 0xffee88,
          emissiveIntensity: 1.5,
          roughness: 1,
        });

    const celestial = new THREE.Mesh(new THREE.SphereGeometry(size, 16, 16), mat);

    let t;
    if (!isNight) {
      t = (hour - 6) / 13;
    } else {
      t = hour >= 18 ? (hour - 18) / 11 : (hour + 5) / 11;
    }

    celestial.position.set(-300 + t * 600, 80 + Math.sin(Math.PI * t) * 250, isNight ? 300 : 200);
    this.group.add(celestial);

    // Sun glow
    if (!isNight) {
      const glowGeo = new THREE.SphereGeometry(CONFIG.outdoor.celestial.sunGlowSize, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.15 });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.copy(celestial.position);
      this.group.add(glow);
    }
  }

  buildLighting(hour) {
    const isNight = hour < 6 || hour >= 18;
    const ambColor = isNight ? 0x102030 : hour < 10 ? 0xffe8c8 : 0xffffff;
    const ambIntensity = isNight ? 0.4 : hour < 10 ? 0.9 : 1.1;

    const amb = new THREE.AmbientLight(ambColor, ambIntensity);
    this.group.add(amb);

    // Get celestial position (similar logic as buildCelestial)
    let t;
    if (!(hour < 6 || hour >= 18)) {
      t = (hour - 6) / 13;
    } else {
      t = hour >= 18 ? (hour - 18) / 11 : (hour + 5) / 11;
    }
    const celestialPos = new THREE.Vector3(-300 + t * 600, 80 + Math.sin(Math.PI * t) * 250, hour < 6 || hour >= 18 ? 300 : 200);

    const sun = new THREE.DirectionalLight(isNight ? 0x304060 : 0xfff0d0, isNight ? 0.3 : 1.2);
    sun.position.copy(celestialPos);
    sun.castShadow = true;
    sun.shadow.mapSize.set(CONFIG.performance.shadowMapSize, CONFIG.performance.shadowMapSize);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 800;
    sun.shadow.camera.left = -200;
    sun.shadow.camera.right = 200;
    sun.shadow.camera.top = 200;
    sun.shadow.camera.bottom = -200;
    this.group.add(sun);
  }

  buildWeather(hour) {
    const stormLikely = (hour >= CONFIG.weather.stormHours.start && hour < CONFIG.weather.stormHours.end) ||
      (hour >= CONFIG.weather.stormNightHours.start && hour < CONFIG.weather.stormNightHours.end);
    const doStorm = stormLikely && Math.random() > (1 - CONFIG.weather.stormLikelihood);

    if (doStorm) {
      // Rain particles
      const rainGeo = new THREE.BufferGeometry();
      const rp = new Float32Array(CONFIG.weather.rainParticles * 3);
      for (let i = 0; i < CONFIG.weather.rainParticles; i++) {
        rp[i * 3] = (Math.random() - 0.5) * 200;
        rp[i * 3 + 1] = Math.random() * 100;
        rp[i * 3 + 2] = (Math.random() - 0.5) * 200;
      }
      rainGeo.setAttribute('position', new THREE.BufferAttribute(rp, 3));
      const rainMat = new THREE.PointsMaterial({ color: 0xaabbd0, size: 0.3, transparent: true, opacity: 0.6 });
      const rain = new THREE.Points(rainGeo, rainMat);
      rain.userData.isRain = true;
      this.group.add(rain);

      // Dark storm clouds
      const cloudCount = CONFIG.isMobile ? CONFIG.outdoor.stormCloudCountMobile : CONFIG.outdoor.stormCloudCount;
      for (let i = 0; i < cloudCount; i++) {
        const cg = new THREE.SphereGeometry(20 + Math.random() * 15, 8, 8);
        const cm = new THREE.MeshStandardMaterial({ color: 0x303040, transparent: true, opacity: 0.7, roughness: 1 });
        const cloud = new THREE.Mesh(cg, cm);
        cloud.position.set((Math.random() - 0.5) * 300, 80 + Math.random() * 40, Math.random() * 200 - 50);
        cloud.scale.set(1 + Math.random(), 0.4 + Math.random() * 0.3, 1 + Math.random());
        this.group.add(cloud);
      }
      this.group.userData.storm = true;
    } else {
      // Light fluffy clouds
      const cloudCount = CONFIG.isMobile ? CONFIG.outdoor.cloudCountMobile : CONFIG.outdoor.cloudCount;
      for (let i = 0; i < cloudCount; i++) {
        const cg = new THREE.SphereGeometry(15 + Math.random() * 10, 8, 8);
        const cm = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 1 });
        const cloud = new THREE.Mesh(cg, cm);
        cloud.position.set((Math.random() - 0.5) * 400, 60 + Math.random() * 30, Math.random() * 300 - 50);
        cloud.scale.set(1.5 + Math.random(), 0.35 + Math.random() * 0.2, 1 + Math.random());
        this.group.add(cloud);
      }
    }
  }

  buildParticles() {
    // Breeze particles
    const breezeGeo = new THREE.BufferGeometry();
    const bp = new Float32Array(CONFIG.weather.breezeParticles * 3);
    for (let i = 0; i < CONFIG.weather.breezeParticles; i++) {
      bp[i * 3] = (Math.random() - 0.5) * 100;
      bp[i * 3 + 1] = -1 + Math.random() * 12;
      bp[i * 3 + 2] = Math.random() * 80;
    }
    breezeGeo.setAttribute('position', new THREE.BufferAttribute(bp, 3));
    const breezeMat = new THREE.PointsMaterial({ color: 0xd0e8f8, size: 0.18, transparent: true, opacity: 0.45 });
    const breeze = new THREE.Points(breezeGeo, breezeMat);
    breeze.userData.isBreeze = true;
    this.group.add(breeze);

    // Petals
    const petalColors = [0xff9eb5, 0xffcce0, 0xffd700];
    const petalData = [];
    for (let i = 0; i < CONFIG.weather.petalCount; i++) {
      const pGeo = new THREE.PlaneGeometry(0.15, 0.1);
      const pMat = new THREE.MeshStandardMaterial({ color: petalColors[i % 3], side: THREE.DoubleSide, transparent: true, opacity: 0.8 });
      const petal = new THREE.Mesh(pGeo, pMat);
      petal.position.set((Math.random() - 0.5) * 80, 2 + Math.random() * 8, Math.random() * 40);
      petal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      petal.userData = {
        vx: (Math.random() - 0.5) * 0.02,
        vy: -0.005 - Math.random() * 0.01,
        vz: (Math.random() - 0.5) * 0.02,
        spin: Math.random() * 0.05,
      };
      petalData.push(petal);
      this.group.add(petal);
    }
    this.group.userData.petals = petalData;
  }
}

window.OutdoorBuilder = OutdoorBuilder;
