/**
 * Hut scene builder - creates the interior royal chamber
 */

class HutBuilder {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.torchLights = [];
  }

  build() {
    const h = CONFIG.hut;
    const stoneMat = makeMat(0x4a3a2a, 0.95);
    const darkStoneMat = makeMat(0x2e2318, 0.98);
    const woodMat = makeMat(0x5a3010, 0.9);
    const darkWoodMat = makeMat(0x3a1a08, 0.95);
    const floorMat = makeMat(0x3a2e22, 0.92);
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xc89030, roughness: 0.3, metalness: 0.8 });

    // Floor
    const floor = box(h.width, 0.2, h.depth, floorMat, 0, h.floorY, 0);
    floor.receiveShadow = true;
    this.group.add(floor);

    // Walls
    const wallBack = box(h.width, h.wallHeight, 0.4, stoneMat, 0, 3.5, -10);
    this.group.add(wallBack);
    const wallLeft = box(0.4, h.wallHeight, h.depth, stoneMat, -10, 3.5, 0);
    this.group.add(wallLeft);
    const wallRight = box(0.4, h.wallHeight, h.depth, stoneMat, 10, 3.5, 0);
    this.group.add(wallRight);

    // Ceiling
    const ceiling = box(h.width, 0.3, h.depth, darkStoneMat, 0, h.ceilingHeight, 0);
    this.group.add(ceiling);

    // Stone texture via repeating boxes
    for (let i = 0; i < 20; i++) {
      const sb = box(0.8, 0.3, 0.1, darkStoneMat, -8 + i * 0.8 + Math.random() * 0.1, Math.random() * 8, -9.8);
      this.group.add(sb);
    }

    // Floor stone tiles
    for (let x = -6; x <= 6; x += 2) {
      for (let z = -8; z <= 4; z += 2) {
        const tile = box(1.9, 0.05, 1.9, x % 4 === 0 ? stoneMat : darkStoneMat, x, h.floorY + 0.1, z);
        this.group.add(tile);
      }
    }

    // Ceiling beams
    for (let z = -8; z <= 4; z += 3) {
      const beam = box(20, 0.4, 0.5, darkWoodMat, 0, 8.2, z);
      this.group.add(beam);
    }
    for (let x = -8; x <= 8; x += 4) {
      const beam = box(0.4, 0.3, 25, darkWoodMat, x, 8, 0);
      this.group.add(beam);
    }

    // Fireplace
    this.buildFireplace(stoneMat, darkStoneMat, woodMat, goldMat);

    // Bookshelf
    this.buildBookshelf(woodMat);

    // Table with potions
    this.buildTable(woodMat, darkWoodMat);

    // Rug
    this.buildRug();

    // Window
    this.buildWindow(darkWoodMat);

    // Wall decorations (sword and shield)
    this.buildWallDecorations(woodMat, darkWoodMat, goldMat);

    // Gate
    const gateData = this.buildGate(stoneMat, darkWoodMat, goldMat);

    // Lighting
    const ambHut = new THREE.AmbientLight(0x2a1808, 0.8);
    this.group.add(ambHut);

    this.scene.add(this.group);

    return {
      group: this.group,
      torchLights: this.torchLights,
      doorL: gateData.doorL,
      doorR: gateData.doorR,
      gateGroup: gateData.gateGroup,
    };
  }

  buildFireplace(stoneMat, darkStoneMat, woodMat, goldMat) {
    const fpBase = box(5, 4, 1, stoneMat, 0, -0.5, -9.5);
    this.group.add(fpBase);
    const fpL = box(1, 5, 1.5, stoneMat, -2.5, 0, -9);
    this.group.add(fpL);
    const fpR = box(1, 5, 1.5, stoneMat, 2.5, 0, -9);
    this.group.add(fpR);
    const fpTop = box(6, 0.6, 1.5, stoneMat, 0, 2.8, -9);
    this.group.add(fpTop);
    const fpArch = box(4, 2, 1, darkStoneMat, 0, 0.5, -8.8);
    this.group.add(fpArch);

    // Mantle
    const mantle = box(7, 0.25, 1.2, woodMat, 0, 3.15, -9);
    this.group.add(mantle);

    // Candles on mantle
    [-2, -0.5, 1, 2.5].forEach((x) => {
      const cb = cyl(0.06, 0.06, 0.4, 8, makeMat(0xf5e6c8, 0.9), x, 3.55, -9);
      this.group.add(cb);
    });

    // Torches
    const torchPositions = [
      [-8, 3, -6], [-8, 3, 0], [-8, 3, 4],
      [8, 3, -6], [8, 3, 0], [8, 3, 4],
      [0, 3, -9.2],
    ];

    torchPositions.forEach(([x, y, z]) => {
      const stick = cyl(0.05, 0.05, 0.6, 6, makeMat(0x5a3010), x, y - 0.1, z);
      this.group.add(stick);

      const cup = cyl(0.15, 0.08, 0.2, 8, makeMat(0x8b4513, 0.8), x, y + 0.2, z);
      this.group.add(cup);

      const fl = cyl(
        0.12,
        0,
        0.3,
        8,
        new THREE.MeshStandardMaterial({ color: 0xff8800, emissive: 0xff6600, emissiveIntensity: 3 }),
        x,
        y + 0.4,
        z
      );
      this.group.add(fl);

      const light = new THREE.PointLight(0xff9944, CONFIG.hut.torchIntensity, CONFIG.hut.torchRange);
      light.position.set(x, y + 0.5, z);
      this.group.add(light);

      this.torchLights.push({
        light,
        fl,
        baseIntensity: CONFIG.hut.torchIntensity,
        t: Math.random() * 100,
      });
    });

    // Fireplace glow
    const fpLight = new THREE.PointLight(0xff6600, CONFIG.hut.fireplaceIntensity, CONFIG.hut.fireplaceRange);
    fpLight.position.set(0, 0.5, -8);
    this.group.add(fpLight);
    this.torchLights.push({ light: fpLight, fl: null, baseIntensity: CONFIG.hut.fireplaceIntensity, t: 50 });
  }

  buildBookshelf(woodMat) {
    const shelfGroup = new THREE.Group();
    shelfGroup.position.set(-9, 0, -7);

    const shelfBack = box(4, 6, 0.1, makeMat(0x3a1a08), 0, 2, -0.8);
    shelfGroup.add(shelfBack);

    const shelfSide1 = box(0.15, 6, 0.8, woodMat, -2, 2, -0.4);
    shelfGroup.add(shelfSide1);
    const shelfSide2 = box(0.15, 6, 0.8, woodMat, 2, 2, -0.4);
    shelfGroup.add(shelfSide2);

    [0, 1.5, 3, 4.5].forEach((y) => {
      const shelf = box(4, 0.12, 0.8, woodMat, 0, y - 0.3, -0.4);
      shelfGroup.add(shelf);
    });

    const bookColors = [0x8b1a1a, 0x1a4a8b, 0x2a6a2a, 0x6a4a1a, 0x4a1a6a, 0x6a2a2a, 0x2a5a5a, 0x8b6a1a];
    for (let row = 0; row < 3; row++) {
      let bx = -1.6;
      for (let b = 0; b < 7; b++) {
        const bw = 0.2 + Math.random() * 0.15;
        const bh = 0.6 + Math.random() * 0.4;
        const book = box(bw, bh, 0.6, makeMat(bookColors[b % bookColors.length], 0.9), bx + bw / 2, row * 1.5 + bh / 2, -0.4);
        shelfGroup.add(book);
        bx += bw + 0.02;
      }
    }

    this.group.add(shelfGroup);
  }

  buildTable(woodMat, darkWoodMat) {
    const tableGroup = new THREE.Group();
    tableGroup.position.set(-4, -1, 0);

    const tabletop = box(3.5, 0.15, 1.8, woodMat, 0, 0.8, 0);
    tableGroup.add(tabletop);

    [[-1.4, 0, -0.7], [1.4, 0, -0.7], [-1.4, 0, 0.7], [1.4, 0, 0.7]].forEach(([lx, ly, lz]) => {
      tableGroup.add(box(0.12, 1.8, 0.12, darkWoodMat, lx, ly, lz));
    });

    // Potion bottles
    const colors = [0x4a0a6a, 0x0a4a3a, 0x4a3a0a];
    const glows = [0xcc44ee, 0x22ee88, 0xeeee22];
    [[-0.8, 0.95, 0], [0, 0.95, 0.1], [0.7, 0.95, -0.1]].forEach(([bx, by, bz], i) => {
      const bottle = cyl(
        0.08,
        0.1,
        0.35,
        8,
        new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.1, transparent: true, opacity: 0.8 }),
        bx,
        by,
        bz
      );
      tableGroup.add(bottle);

      const glow = new THREE.PointLight(glows[i], 1, 1.5);
      glow.position.set(bx, by + 0.3, bz);
      tableGroup.add(glow);
    });

    this.group.add(tableGroup);
  }

  buildRug() {
    const rugGeo = new THREE.PlaneGeometry(6, 3);
    const rugMat = new THREE.MeshStandardMaterial({ color: 0x8b2020, roughness: 0.95 });
    const rug = new THREE.Mesh(rugGeo, rugMat);
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(0, CONFIG.hut.floorY + 0.01, 1);
    rug.receiveShadow = true;
    this.group.add(rug);
  }

  buildWindow(darkWoodMat) {
    const winGroup = new THREE.Group();
    winGroup.position.set(9, 4, -4);

    const winFrame = box(0.3, 3.5, 0.3, darkWoodMat, 0, 0, 0);
    winGroup.add(winFrame);

    const winTop = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.15, 8, 12, Math.PI), darkWoodMat.clone());
    winTop.position.y = 0.85;
    winGroup.add(winTop);

    const winPane = box(0.05, 2.8, 1.4, new THREE.MeshStandardMaterial({ color: 0x0d1a3a, transparent: true, opacity: 0.6, roughness: 0.1 }), -0.2, -0.2, 0);
    winGroup.add(winPane);

    // Stars in window
    for (let i = 0; i < 15; i++) {
      const sg = new THREE.Mesh(new THREE.SphereGeometry(0.03, 4, 4), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      sg.position.set(-0.1, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 1.2);
      winGroup.add(sg);
    }

    this.group.add(winGroup);
  }

  buildWallDecorations(woodMat, darkWoodMat, goldMat) {
    // Sword
    const swordGroup = new THREE.Group();
    swordGroup.position.set(7, 5, -9.2);

    const blade = box(0.06, 3, 0.04, new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.1, metalness: 0.9 }), 0, 0, 0);
    swordGroup.add(blade);

    const guard = box(0.6, 0.12, 0.08, goldMat, 0, -1.4, 0);
    swordGroup.add(guard);

    const handle = box(0.08, 0.8, 0.08, woodMat, 0, -1.9, 0);
    swordGroup.add(handle);

    this.group.add(swordGroup);

    // Shield
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(5.5, 5, -9.2);

    const shield = box(0.08, 1.8, 1.4, makeMat(0x8b1a1a, 0.7), 0, 0, 0);
    shieldGroup.add(shield);

    const shieldRim = box(0.1, 1.9, 1.5, goldMat, -0.05, 0, 0);
    shieldRim.scale.set(1, 0.98, 0.98);
    shieldGroup.add(shieldRim);

    this.group.add(shieldGroup);
  }

  buildGate(stoneMat, woodMat, goldMat) {
    const gateGroup = new THREE.Group();
    gateGroup.position.set(0, 0, 5);

    // Gate arch frame
    const archMat = makeMat(0x5a4030, 0.9);
    const archL = box(0.6, 7, 0.6, archMat, -2, 2, 0);
    gateGroup.add(archL);
    const archR = box(0.6, 7, 0.6, archMat, 2, 2, 0);
    gateGroup.add(archR);
    const archTop = box(4.6, 0.6, 0.6, archMat, 0, 5.7, 0);
    gateGroup.add(archTop);

    // Arch curve segments
    for (let a = 0; a <= Math.PI; a += Math.PI / 8) {
      const seg = box(0.5, 0.5, 0.5, archMat, Math.cos(a) * 2, 5.3 + Math.sin(a) * 1.8, 0);
      gateGroup.add(seg);
    }

    // Door panels
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x4a2808, roughness: 0.9 });
    const doorL = box(1.9, 6.8, 0.15, doorMat, -1, 2.4, 0);
    doorL.userData = { isDoor: 'left', closed: true };
    gateGroup.add(doorL);

    const doorR = box(1.9, 6.8, 0.15, doorMat, 1, 2.4, 0);
    doorR.userData = { isDoor: 'right', closed: true };
    gateGroup.add(doorR);

    // Door rings
    const ringGeo = new THREE.TorusGeometry(0.18, 0.04, 8, 16);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xc89030, roughness: 0.2, metalness: 0.9 });
    const ringL = new THREE.Mesh(ringGeo, ringMat);
    ringL.position.set(-0.6, 2.4, 0.12);
    gateGroup.add(ringL);

    const ringR = new THREE.Mesh(ringGeo, ringMat);
    ringR.position.set(0.6, 2.4, 0.12);
    gateGroup.add(ringR);

    // Door planks detail
    for (let y = -0.5; y < 3; y += 0.8) {
      const plank = box(3.6, 0.12, 0.02, makeMat(0x3a1808, 0.95), 0, y + 2.4, 0.14);
      gateGroup.add(plank);
    }

    this.group.add(gateGroup);

    return { doorL, doorR, gateGroup };
  }
}

window.HutBuilder = HutBuilder;
