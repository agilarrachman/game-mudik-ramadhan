// cookies3d.js — Definisi Model Kue 3D Prosedural Realistis & Organik (PRD-Menara-Kue.md v2.0)
// Topping menempel presisi pada permukaan bodi kue, tanpa celah, tanpa melayang.

(function(global) {
  'use strict';

  // Seeded PRNG sederhana
  function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  // Cache tekstur bump prosedural (noise adonan 256x256)
  let sharedNoiseTexture = null;
  function getSharedNoiseTexture() {
    if (!sharedNoiseTexture && typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = 256;
      c.height = 256;
      const ctx = c.getContext('2d');
      const imgData = ctx.createImageData(256, 256);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = 120 + Math.floor((Math.random() - 0.5) * 55);
        imgData.data[i] = v;
        imgData.data[i + 1] = v;
        imgData.data[i + 2] = v;
        imgData.data[i + 3] = 255;
      }
      ctx.putImageData(imgData, 0, 0);
      sharedNoiseTexture = new THREE.CanvasTexture(c);
      sharedNoiseTexture.wrapS = THREE.RepeatWrapping;
      sharedNoiseTexture.wrapT = THREE.RepeatWrapping;
      sharedNoiseTexture.repeat.set(4, 4);
    }
    return sharedNoiseTexture;
  }

  // Definisi Master Kue (15 Kue: 8 Fase 1 + 7 Fase 2)
  const COOKIE_DEFS = {
    // ---- FASE 1 ----
    c01: {
      id: 'c01',
      name: 'Nastar Keju',
      type: 'ellipse',
      depthRatio: 0.85,
      heightRatio: 0.52,
      baseColor: 0xF09A1E,
      roughness: 0.35,
      metalness: 0.05,
      clearcoat: 0.7,
      toppingCount: 20,
      toppingType: 'cheese_strips'
    },
    c02: {
      id: 'c02',
      name: 'Kastengel',
      type: 'rounded_rect',
      depthRatio: 0.50,
      heightRatio: 0.42,
      baseColor: 0xDB9428,
      topLayerColor: 0xE67A00,
      multiLayer: 2,
      roughness: 0.50,
      metalness: 0.05,
      toppingCount: 22,
      toppingType: 'grated_cheese_dense'
    },
    c03: {
      id: 'c03',
      name: 'Semprit Bunga',
      type: 'flower',
      lobes: 9,
      depthRatio: 0.90,
      heightRatio: 0.42,
      baseColor: 0xF5C030,
      roughness: 0.55,
      metalness: 0.05,
      toppingType: 'cherry_sphere',
      toppingColor: 0xD32F2F
    },
    c04: {
      id: 'c04',
      name: 'Kue Meises',
      type: 'ellipse',
      depthRatio: 0.85,
      heightRatio: 0.48,
      baseColor: 0xB8702D,
      roughness: 0.55,
      metalness: 0.05,
      toppingCount: 30,
      toppingType: 'chocolate_meises',
      toppingColor: 0x2E1609
    },
    c05: {
      id: 'c05',
      name: 'Choc Chip',
      type: 'ellipse',
      depthRatio: 0.90,
      heightRatio: 0.38,
      baseColor: 0xCC8438,
      roughness: 0.55,
      metalness: 0.05,
      toppingCount: 11,
      toppingType: 'choc_chip_chunky',
      toppingColor: 0x321608
    },
    c06: {
      id: 'c06',
      name: 'Kue Almond',
      type: 'rounded_rect',
      depthRatio: 0.50,
      heightRatio: 0.40,
      baseColor: 0xE09B28,
      roughness: 0.50,
      metalness: 0.05,
      toppingCount: 10,
      toppingType: 'almond_layered'
    },
    c07: {
      id: 'c07',
      name: 'Nastar Tart',
      type: 'scalloped',
      lobes: 14,
      depthRatio: 0.90,
      heightRatio: 0.44,
      baseColor: 0xE29B26,
      roughness: 0.50,
      metalness: 0.05,
      toppingType: 'jam_dome_indented',
      toppingColor: 0xFF7500
    },
    c08: {
      id: 'c08',
      name: 'Sandwich Cokelat',
      type: 'ellipse',
      depthRatio: 0.85,
      heightRatio: 0.52,
      baseColor: 0x401D0C,
      creamColor: 0xF7E3A8,
      multiLayer: 3,
      roughness: 0.55,
      metalness: 0.05,
      toppingCount: 12,
      toppingType: 'crushed_peanuts_glaze'
    },

    // ---- FASE 2 ----
    c09: {
      id: 'c09',
      name: 'Putri Salju',
      type: 'crescent',
      depthRatio: 0.85,
      heightRatio: 0.42,
      baseColor: 0xF5ECE0,
      roughness: 0.85,
      metalness: 0.0,
      toppingCount: 26,
      toppingType: 'powder_sugar_crumbs'
    },
    c10: {
      id: 'c10',
      name: 'Semprit Pilin',
      type: 'ellipse',
      depthRatio: 0.88,
      heightRatio: 0.56,
      baseColor: 0xF0B828,
      multiLayer: 4,
      roughness: 0.55,
      metalness: 0.05,
      toppingType: 'pistachio_top',
      toppingColor: 0x5E9E26
    },
    c11: {
      id: 'c11',
      name: 'Sagu Keju',
      type: 'rounded_rect',
      depthRatio: 0.55,
      heightRatio: 0.42,
      baseColor: 0xDEAA36,
      roughness: 0.65,
      metalness: 0.05,
      toppingCount: 24,
      toppingType: 'grated_cheese_dense'
    },
    c12: {
      id: 'c12',
      name: 'Nastar Bulat',
      type: 'ellipse',
      depthRatio: 0.85,
      heightRatio: 0.55,
      baseColor: 0xFF8800,
      roughness: 0.30,
      metalness: 0.05,
      clearcoat: 0.8,
      toppingType: 'clove_double_leaf',
      toppingColor: 0x3B884F
    },
    c13: {
      id: 'c13',
      name: 'Semprit Pandan',
      type: 'flower',
      lobes: 6,
      depthRatio: 0.90,
      heightRatio: 0.40,
      baseColor: 0x78B82E,
      roughness: 0.55,
      metalness: 0.05,
      toppingType: 'cream_ball_center',
      toppingColor: 0xFFF4DA
    },
    c14: {
      id: 'c14',
      name: 'Kotak Zigzag Cokelat',
      type: 'rounded_rect',
      depthRatio: 0.50,
      heightRatio: 0.40,
      baseColor: 0xDE9B28,
      roughness: 0.50,
      metalness: 0.05,
      toppingType: 'chocolate_zigzag_stream',
      toppingColor: 0x2E1609
    },
    c15: {
      id: 'c15',
      name: 'Kue Kacang',
      type: 'ellipse',
      depthRatio: 0.85,
      heightRatio: 0.44,
      baseColor: 0xD68824,
      roughness: 0.55,
      metalness: 0.05,
      toppingCount: 22,
      toppingType: 'peanut_golden_crumbs'
    }
  };

  const PHASE1_IDS = ['c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08'];
  const PHASE2_IDS = ['c01', 'c02', 'c03', 'c04', 'c05', 'c06', 'c07', 'c08', 'c09', 'c10', 'c11', 'c12', 'c13', 'c14', 'c15'];

  // Cache Material
  const MATERIAL_CACHE = {};

  function getDoughMaterial(key, color, roughness, metalness, clearcoat) {
    if (!MATERIAL_CACHE[key]) {
      const mat = new THREE.MeshStandardMaterial({
        color: color,
        roughness: roughness || 0.55,
        metalness: metalness || 0.05,
        bumpMap: getSharedNoiseTexture(),
        bumpScale: 0.015
      });
      if (clearcoat) {
        mat.roughness = 0.28;
      }
      MATERIAL_CACHE[key] = mat;
    }
    return MATERIAL_CACHE[key];
  }

  function getMaterial(key, params) {
    if (!MATERIAL_CACHE[key]) {
      MATERIAL_CACHE[key] = new THREE.MeshStandardMaterial(params);
    }
    return MATERIAL_CACHE[key];
  }

  function getRawOutline(def, width) {
    let pts = [];
    if (def.type === 'ellipse') {
      pts = GeometryUtils.createEllipseOutline(def.depthRatio);
    } else if (def.type === 'rounded_rect') {
      pts = GeometryUtils.createRoundedRectOutline(def.depthRatio);
    } else if (def.type === 'flower') {
      pts = GeometryUtils.createFlowerOutline(def.lobes, def.depthRatio);
    } else if (def.type === 'scalloped') {
      pts = GeometryUtils.createScallopedOutline(def.lobes, def.depthRatio);
    } else if (def.type === 'crescent') {
      pts = GeometryUtils.createCrescentOutline(def.depthRatio);
    } else {
      pts = GeometryUtils.createEllipseOutline(0.85);
    }
    return pts.map(p => [p[0] * width, p[1] * width]);
  }

  // =========================================================
  // HELPER GEOMETRI & TITIK DALAM POLIGON (POINT IN POLYGON)
  // =========================================================

  // Ray casting 2D point-in-polygon
  function isPointInsidePolygon(poly, px, pz) {
    if (!poly || poly.length < 3) return false;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], zi = poly[i][1];
      const xj = poly[j][0], zj = poly[j][1];
      const intersect = ((zi > pz) !== (zj > pz)) &&
        (px < (xj - xi) * (pz - zi) / (zj - zi + 1e-12) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // Jarak terdekat dari titik ke segmen garis (A, B)
  function distSqPointToSegment(px, pz, ax, az, bx, bz) {
    const dx = bx - ax;
    const dz = bz - az;
    const lenSq = dx * dx + dz * dz;
    if (lenSq < 1e-8) {
      const qx = px - ax, qz = pz - az;
      return qx * qx + qz * qz;
    }
    let t = ((px - ax) * dx + (pz - az) * dz) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = ax + t * dx;
    const projZ = az + t * dz;
    const rx = px - projX, rz = pz - projZ;
    return rx * rx + rz * rz;
  }

  // Jarak minimum ke tepi poligon
  function distToPolygonEdge(poly, px, pz) {
    if (!poly || poly.length < 3) return 0;
    let minD2 = Infinity;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const d2 = distSqPointToSegment(px, pz, poly[i][0], poly[i][1], poly[j][0], poly[j][1]);
      if (d2 < minD2) minD2 = d2;
    }
    return Math.sqrt(minD2);
  }

  // Inset poligon dari centroid (skala terhadap centroid)
  function computeInsetPolygon(poly, scaleRatio) {
    if (!poly || poly.length < 3) return poly;
    let cx = 0, cz = 0;
    for (let i = 0; i < poly.length; i++) {
      cx += poly[i][0];
      cz += poly[i][1];
    }
    cx /= poly.length;
    cz /= poly.length;

    return poly.map(p => [
      cx + (p[0] - cx) * scaleRatio,
      cz + (p[1] - cz) * scaleRatio
    ]);
  }

  // Bounding box poligon
  function getPolygonBBox(poly) {
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < poly.length; i++) {
      const x = poly[i][0], z = poly[i][1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    return { minX, maxX, minZ, maxZ, width: maxX - minX, depth: maxZ - minZ };
  }

  // =========================================================
  // FUNGSI TINGGI PERMUKAAN h(x, z) PERSIS BERDASARKAN BEVEL BODI
  // =========================================================
  function getSurfaceHeight(finalOutline, px, pz, totalHeight, bevelSize, bevelThickness) {
    if (!isPointInsidePolygon(finalOutline, px, pz)) {
      return null; // Di luar bodi
    }

    bevelSize = bevelSize || Math.min(0.24, totalHeight * 0.35);
    bevelThickness = bevelThickness || Math.min(0.24, totalHeight * 0.35);

    const distEdge = distToPolygonEdge(finalOutline, px, pz);

    // Di area dalam flat top (jauh dari tepi bevel)
    if (distEdge >= bevelSize) {
      return totalHeight;
    }

    // Di lereng bevel: melengkung halus dari totalHeight turun ke (totalHeight - bevelThickness)
    const u = Math.max(0, Math.min(1, 1.0 - (distEdge / bevelSize)));
    const bevelDrop = bevelThickness * (1.0 - Math.sqrt(Math.max(0, 1.0 - u * u)));
    return totalHeight - bevelDrop;
  }

  // Sample titik acak di dalam outline yang sudah di-inset dan berada di dalam [x0, x1]
  function sampleSurfacePoint(poly, insetRatio, x0, x1, seedRef) {
    const insetPoly = computeInsetPolygon(poly, insetRatio);
    const bbox = getPolygonBBox(insetPoly);

    const minX = Math.max(bbox.minX, x0);
    const maxX = Math.min(bbox.maxX, x1);
    if (minX >= maxX) return null;

    let attempts = 0;
    while (attempts < 60) {
      attempts++;
      const rx = minX + seededRandom(seedRef.val++) * (maxX - minX);
      const rz = bbox.minZ + seededRandom(seedRef.val++) * bbox.depth;
      if (isPointInsidePolygon(insetPoly, rx, rz) && isPointInsidePolygon(poly, rx, rz)) {
        return [rx, rz];
      }
    }

    // Fallback: titik tengah jika dalam window
    let cx = 0, cz = 0;
    for (let i = 0; i < poly.length; i++) {
      cx += poly[i][0];
      cz += poly[i][1];
    }
    cx /= poly.length;
    cz /= poly.length;
    if (cx >= x0 && cx <= x1 && isPointInsidePolygon(poly, cx, cz)) {
      return [cx, cz];
    }
    return null;
  }

  // =========================================================
  // GEOMETRI PITA KEJU REALISTIS (CURVED THIN FLAT RIBBON)
  // =========================================================
  // Pita tipis datar melengkung: lebar 0.035W, tebal 0.012W, panjang 0.12-0.22W
  function createCurvedCheeseStripGeometry(len, st, sw) {
    const geo = new THREE.BoxGeometry(len, st, sw, 4, 1, 1);
    const pos = geo.attributes.position;
    const halfLen = len * 0.5;

    // Lengkungan alami pita keju saat terparut
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const norm = x / (halfLen + 1e-6); // -1 s/d 1
      const arch = (1.0 - norm * norm) * (len * 0.08);
      pos.setY(i, pos.getY(i) + arch);
    }
    geo.computeVertexNormals();
    return geo;
  }

  // =========================================================
  // MEMBANGUN MODEL KUE 3D LENGKAP
  // =========================================================
  function buatKue(cookieId, width, clipLeft, clipRight, seed) {
    seed = (seed !== undefined) ? seed : 42;
    const def = COOKIE_DEFS[cookieId] || COOKIE_DEFS.c01;
    const cookieGroup = new THREE.Group();
    cookieGroup.name = `cookie_${cookieId}`;

    const totalHeight = width * def.heightRatio;
    const rawOutline = getRawOutline(def, width);

    const minBound = -width / 2;
    const maxBound = width / 2;
    const x0 = (clipLeft !== undefined) ? Math.max(minBound, clipLeft) : minBound;
    const x1 = (clipRight !== undefined) ? Math.min(maxBound, clipRight) : maxBound;

    let finalOutline = rawOutline;
    if (x0 > minBound + 1e-4 || x1 < maxBound - 1e-4) {
      finalOutline = GeometryUtils.clipPolygonX(rawOutline, x0, x1);
    }

    if (!finalOutline || finalOutline.length < 3) {
      return { group: cookieGroup, height: totalHeight, polygon: [], toppings: [] };
    }

    const bevelThickness = Math.min(0.24, totalHeight * 0.35);
    const bevelSize = Math.min(0.24, totalHeight * 0.35);

    if (def.multiLayer === 2) {
      // 2 Lapis (Kastengel)
      const h1 = totalHeight * 0.52;
      const h2 = totalHeight * 0.48;
      const geo1 = GeometryUtils.createExtrudedCakeGeometry(finalOutline, h1, bevelSize * 0.7, bevelThickness * 0.7);
      const geo2 = GeometryUtils.createExtrudedCakeGeometry(finalOutline, h2, bevelSize * 0.7, bevelThickness * 0.7);

      const mat1 = getDoughMaterial(`c_${def.baseColor}`, def.baseColor, def.roughness, def.metalness);
      const mat2 = getDoughMaterial(`c_${def.topLayerColor}`, def.topLayerColor, def.roughness * 0.8, def.metalness, true);

      if (geo1) {
        const m1 = new THREE.Mesh(geo1, mat1);
        m1.castShadow = true;
        m1.receiveShadow = true;
        cookieGroup.add(m1);
      }
      if (geo2) {
        const m2 = new THREE.Mesh(geo2, mat2);
        m2.position.y = h1;
        m2.castShadow = true;
        m2.receiveShadow = true;
        cookieGroup.add(m2);
      }
    } else if (def.multiLayer === 3 && def.creamColor) {
      // 3 Lapis Sandwich Cokelat
      const hBiscuit = totalHeight * 0.38;
      const hCream = totalHeight * 0.24;

      const geoB1 = GeometryUtils.createExtrudedCakeGeometry(finalOutline, hBiscuit, bevelSize * 0.6, bevelThickness * 0.6);
      const geoCr = GeometryUtils.createExtrudedCakeGeometry(finalOutline, hCream, bevelSize * 0.3, bevelThickness * 0.3);
      const geoB2 = GeometryUtils.createExtrudedCakeGeometry(finalOutline, hBiscuit, bevelSize * 0.6, bevelThickness * 0.6);

      const matChoc = getDoughMaterial(`c_${def.baseColor}`, def.baseColor, def.roughness, def.metalness);
      const matCream = getMaterial(`c_${def.creamColor}`, { color: def.creamColor, roughness: 0.35, metalness: 0.05 });

      if (geoB1) {
        const m1 = new THREE.Mesh(geoB1, matChoc);
        m1.castShadow = true;
        m1.receiveShadow = true;
        cookieGroup.add(m1);
      }
      if (geoCr) {
        const mCr = new THREE.Mesh(geoCr, matCream);
        mCr.position.y = hBiscuit;
        mCr.scale.set(0.96, 1.0, 0.96);
        cookieGroup.add(mCr);
      }
      if (geoB2) {
        const m2 = new THREE.Mesh(geoB2, matChoc);
        m2.position.y = hBiscuit + hCream;
        m2.castShadow = true;
        m2.receiveShadow = true;
        cookieGroup.add(m2);
      }
    } else if (def.multiLayer === 4) {
      // 4 Lapis Semprit Pilin
      const tiers = 4;
      const tierH = totalHeight / tiers;
      for (let t = 0; t < tiers; t++) {
        const tScale = 1.0 - t * 0.16;
        const scaledOutline = finalOutline.map(p => [p[0] * tScale, p[1] * tScale]);
        const geo = GeometryUtils.createExtrudedCakeGeometry(scaledOutline, tierH, bevelSize * 0.5, bevelThickness * 0.5);
        const mat = getDoughMaterial(`c_${def.baseColor}`, def.baseColor, def.roughness, def.metalness);
        if (geo) {
          const m = new THREE.Mesh(geo, mat);
          m.position.y = t * tierH;
          m.castShadow = true;
          m.receiveShadow = true;
          cookieGroup.add(m);
        }
      }
    } else {
      // Single Layer Organik dengan Bevel Empuk
      const geo = GeometryUtils.createExtrudedCakeGeometry(finalOutline, totalHeight, bevelSize, bevelThickness);
      const mat = getDoughMaterial(`c_${def.baseColor}`, def.baseColor, def.roughness, def.metalness, def.clearcoat);
      if (geo) {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        cookieGroup.add(mesh);
      }
    }

    // Bangun Topping Menempel Presisi
    const placedToppings = addToppings(cookieGroup, def, width, totalHeight, x0, x1, seed, finalOutline, bevelSize, bevelThickness);

    return {
      group: cookieGroup,
      height: totalHeight,
      polygon: finalOutline,
      def: def,
      toppings: placedToppings
    };
  }

  // =========================================================
  // MEMBANGUN POTONGAN KUE YANG JATUH (DENGAN TOPPINGNYA)
  // =========================================================
  function buatPotonganJatuh(cookieId, width, clipLeft, clipRight, seed) {
    const def = COOKIE_DEFS[cookieId] || COOKIE_DEFS.c01;
    const totalHeight = width * def.heightRatio;
    const rawOutline = getRawOutline(def, width);
    const minBound = -width / 2;
    const maxBound = width / 2;
    const x0 = (clipLeft !== undefined) ? Math.max(minBound, clipLeft) : minBound;
    const x1 = (clipRight !== undefined) ? Math.min(maxBound, clipRight) : maxBound;

    const { leftPiece, rightPiece } = GeometryUtils.clipPolygonComplement(rawOutline, x0, x1);
    const pieces = [];

    const bevelThickness = Math.min(0.2, totalHeight * 0.3);
    const bevelSize = Math.min(0.2, totalHeight * 0.3);
    const mat = getDoughMaterial(`c_${def.baseColor}`, def.baseColor, def.roughness, def.metalness);

    if (leftPiece && leftPiece.length >= 3) {
      const geo = GeometryUtils.createExtrudedCakeGeometry(leftPiece, totalHeight, bevelSize, bevelThickness);
      if (geo) {
        const pieceGroup = new THREE.Group();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        pieceGroup.add(mesh);
        // Tambahkan topping yang berada di potongan kiri
        addToppings(pieceGroup, def, width, totalHeight, minBound, x0, seed, leftPiece, bevelSize, bevelThickness);
        pieces.push({ mesh: pieceGroup, side: 'left' });
      }
    }

    if (rightPiece && rightPiece.length >= 3) {
      const geo = GeometryUtils.createExtrudedCakeGeometry(rightPiece, totalHeight, bevelSize, bevelThickness);
      if (geo) {
        const pieceGroup = new THREE.Group();
        const mesh = new THREE.Mesh(geo, mat);
        mesh.castShadow = true;
        pieceGroup.add(mesh);
        // Tambahkan topping yang berada di potongan kanan
        addToppings(pieceGroup, def, width, totalHeight, x1, maxBound, seed, rightPiece, bevelSize, bevelThickness);
        pieces.push({ mesh: pieceGroup, side: 'right' });
      }
    }

    return pieces;
  }

  // =========================================================
  // DETAIL TOPPING REALISTIS: MENEMPEL PRESISI & BENAMKAN 20-30%
  // =========================================================
  function addToppings(group, def, width, totalHeight, x0, x1, seed, finalOutline, bevelSize, bevelThickness) {
    const seedRef = { val: seed };
    const placed = [];

    // Margin aman agar topping tidak melayang di tepi potongan
    const margin = Math.max(0.04 * width, 0.03);
    const winX0 = x0 + margin;
    const winX1 = x1 - margin;
    if (winX0 >= winX1) return placed;

    // 1. Pita Keju (Nastar Keju, Kastengel, Sagu Keju)
    // Spesifikasi: pita tipis datar melengkung, lebar 0.035W, tebal 0.012W, panjang 0.12-0.22W
    // Warna bervariasi (#FFD34D, #F5B83A, #EFA02E), rebah & saling menumpuk di area gundukan tengah (~60% luas atas)
    if (def.toppingType === 'cheese_strips' || def.toppingType === 'grated_cheese_dense') {
      const count = def.toppingCount || 20;
      const cheeseColors = [0xFFD34D, 0xF5B83A, 0xEFA02E];
      const moundInset = 0.65; // Gundukan di 65% area atas-tengah

      for (let i = 0; i < count; i++) {
        const pt = sampleSurfacePoint(finalOutline, moundInset, winX0, winX1, seedRef);
        if (!pt) continue;

        const px = pt[0], pz = pt[1];
        const sy = getSurfaceHeight(finalOutline, px, pz, totalHeight, bevelSize, bevelThickness);
        if (sy === null) continue;

        const len = (0.13 + seededRandom(seedRef.val++) * 0.08) * width;
        const sw = 0.035 * width;
        const st = 0.012 * width;

        const cheeseGeo = createCurvedCheeseStripGeometry(len, st, sw);
        const col = cheeseColors[i % cheeseColors.length];
        const mat = getMaterial(`cheese_${col}`, { color: col, roughness: 0.38, metalness: 0.05 });
        const stripMesh = new THREE.Mesh(cheeseGeo, mat);

        // Benamkan 25% tebal pita ke dalam permukaan bodi
        const embedY = st * 0.25;
        // Variasi tumpukan gundukan
        const pileY = (i % 3) * (st * 0.4);
        stripMesh.position.set(px, sy - embedY + st * 0.5 + pileY, pz);

        // Putaran acak rebah di atas permukaan
        stripMesh.rotation.y = seededRandom(seedRef.val++) * Math.PI;
        stripMesh.rotation.z = (seededRandom(seedRef.val++) - 0.5) * 0.08;
        stripMesh.rotation.x = (seededRandom(seedRef.val++) - 0.5) * 0.08;
        stripMesh.castShadow = true;
        stripMesh.receiveShadow = true;

        group.add(stripMesh);
        placed.push({
          type: 'cheese_strip',
          x: px,
          z: pz,
          surfaceY: sy,
          lowestY: sy - embedY,
          gap: 0.0
        });
      }
    }

    // 2. Semprit Bunga: Ceri Merah Mengilap di Tengah
    else if (def.toppingType === 'cherry_sphere') {
      if (0 >= winX0 && 0 <= winX1) {
        const sy = getSurfaceHeight(finalOutline, 0, 0, totalHeight, bevelSize, bevelThickness);
        if (sy !== null) {
          const cherryR = width * 0.12;
          const cherryGeo = new THREE.SphereGeometry(cherryR, 18, 18);
          const cherryMat = getMaterial('cherry_red', {
            color: 0xD32F2F,
            roughness: 0.12,
            metalness: 0.15
          });
          const cherry = new THREE.Mesh(cherryGeo, cherryMat);
          const embedY = cherryR * 0.25;
          cherry.position.set(0, sy + cherryR - embedY, 0);
          cherry.castShadow = true;
          group.add(cherry);

          // Highlight putih ceri
          const hlGeo = new THREE.SphereGeometry(cherryR * 0.22, 8, 8);
          const hlMat = getMaterial('cherry_hl', { color: 0xFFFFFF });
          const hl = new THREE.Mesh(hlGeo, hlMat);
          hl.position.set(cherryR * 0.35, sy + cherryR * 1.5 - embedY, cherryR * 0.35);
          group.add(hl);

          placed.push({ type: 'cherry', x: 0, z: 0, surfaceY: sy, lowestY: sy - embedY, gap: 0.0 });
        }
      }
    }

    // 3. Kue Meises: Butir Meises Cokelat Rapi Berorientasi Acak
    else if (def.toppingType === 'chocolate_meises') {
      const count = def.toppingCount || 30;
      const meisesMat = getMaterial('meises_choc', { color: 0x2E1609, roughness: 0.35, metalness: 0.1 });
      const r = 0.012 * width;
      const len = 0.11 * width;

      for (let i = 0; i < count; i++) {
        const pt = sampleSurfacePoint(finalOutline, 0.78, winX0, winX1, seedRef);
        if (!pt) continue;

        const px = pt[0], pz = pt[1];
        const sy = getSurfaceHeight(finalOutline, px, pz, totalHeight, bevelSize, bevelThickness);
        if (sy === null) continue;

        const mGeo = new THREE.CylinderGeometry(r, r, len, 6);
        mGeo.rotateZ(Math.PI / 2);
        const m = new THREE.Mesh(mGeo, meisesMat);

        const embedY = r * 0.25;
        m.position.set(px, sy + r - embedY, pz);
        m.rotation.y = seededRandom(seedRef.val++) * Math.PI;
        m.castShadow = true;
        group.add(m);

        placed.push({ type: 'meises', x: px, z: pz, surfaceY: sy, lowestY: sy - embedY, gap: 0.0 });
      }
    }

    // 4. Choc Chip Chunky: 11 Bongkah Cokelat Kerucut Bersudut
    else if (def.toppingType === 'choc_chip_chunky') {
      const count = def.toppingCount || 11;
      const chipMat = getMaterial('choc_chip_mat', { color: 0x321608, roughness: 0.35, metalness: 0.1 });

      for (let i = 0; i < count; i++) {
        const pt = sampleSurfacePoint(finalOutline, 0.75, winX0, winX1, seedRef);
        if (!pt) continue;

        const px = pt[0], pz = pt[1];
        const sy = getSurfaceHeight(finalOutline, px, pz, totalHeight, bevelSize, bevelThickness);
        if (sy === null) continue;

        const s = (0.05 + seededRandom(seedRef.val++) * 0.02) * width;
        const chipGeo = new THREE.ConeGeometry(s, s * 1.1, 6);
        const chip = new THREE.Mesh(chipGeo, chipMat);

        const embedY = s * 0.25;
        chip.position.set(px, sy + (s * 1.1 * 0.5) - embedY, pz);
        chip.rotation.set(
          (seededRandom(seedRef.val++) - 0.5) * 0.2,
          seededRandom(seedRef.val++) * Math.PI,
          (seededRandom(seedRef.val++) - 0.5) * 0.2
        );
        chip.castShadow = true;
        group.add(chip);

        placed.push({ type: 'choc_chip', x: px, z: pz, surfaceY: sy, lowestY: sy - embedY, gap: 0.0 });
      }
    }

    // 5. Kue Almond: 10 Irisan Almond Lonjong Bertumpuk Miring
    else if (def.toppingType === 'almond_layered') {
      const count = def.toppingCount || 10;
      const almMat = getMaterial('almond_mat', { color: 0xF7E1B5, roughness: 0.45, metalness: 0.05 });
      const aLen = 0.18 * width;
      const aW = 0.075 * width;
      const aT = 0.014 * width;

      for (let i = 0; i < count; i++) {
        const pt = sampleSurfacePoint(finalOutline, 0.70, winX0, winX1, seedRef);
        if (!pt) continue;

        const px = pt[0], pz = pt[1];
        const sy = getSurfaceHeight(finalOutline, px, pz, totalHeight, bevelSize, bevelThickness);
        if (sy === null) continue;

        const almGeo = new THREE.BoxGeometry(aLen, aT, aW);
        const alm = new THREE.Mesh(almGeo, almMat);

        const embedY = aT * 0.25;
        alm.position.set(px, sy + aT * 0.5 - embedY, pz);
        alm.rotation.y = seededRandom(seedRef.val++) * Math.PI;
        alm.rotation.z = (seededRandom(seedRef.val++) - 0.5) * 0.12;
        alm.castShadow = true;
        group.add(alm);

        placed.push({ type: 'almond', x: px, z: pz, surfaceY: sy, lowestY: sy - embedY, gap: 0.0 });
      }
    }

    // 6. Nastar Tart: Selai Nenas Mengilap Menyembul di Cekungan Tengah
    else if (def.toppingType === 'jam_dome_indented') {
      if (0 >= winX0 && 0 <= winX1) {
        const sy = getSurfaceHeight(finalOutline, 0, 0, totalHeight, bevelSize, bevelThickness);
        if (sy !== null) {
          const jamR = width * 0.22;
          const jamGeo = new THREE.SphereGeometry(jamR, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55);
          const jamMat = getMaterial('jam_mat', { color: 0xFF7500, roughness: 0.18, metalness: 0.08 });
          const jam = new THREE.Mesh(jamGeo, jamMat);

          const embedY = jamR * 0.25;
          jam.position.set(0, sy - embedY, 0);
          jam.castShadow = true;
          group.add(jam);

          placed.push({ type: 'jam', x: 0, z: 0, surfaceY: sy, lowestY: sy - embedY, gap: 0.0 });
        }
      }
    }

    // 7. Sandwich Cokelat: Remah Kacang Emas
    else if (def.toppingType === 'crushed_peanuts_glaze') {
      const count = def.toppingCount || 12;
      const nutMat = getMaterial('nut_golden', { color: 0xF7D774, roughness: 0.45, metalness: 0.1 });

      for (let i = 0; i < count; i++) {
        const pt = sampleSurfacePoint(finalOutline, 0.72, winX0, winX1, seedRef);
        if (!pt) continue;

        const px = pt[0], pz = pt[1];
        const sy = getSurfaceHeight(finalOutline, px, pz, totalHeight, bevelSize, bevelThickness);
        if (sy === null) continue;

        const sz = 0.045 * width;
        const nutGeo = new THREE.BoxGeometry(sz, sz, sz);
        const nut = new THREE.Mesh(nutGeo, nutMat);

        const embedY = sz * 0.25;
        nut.position.set(px, sy + sz * 0.5 - embedY, pz);
        nut.rotation.set(
          seededRandom(seedRef.val++) * Math.PI,
          seededRandom(seedRef.val++) * Math.PI,
          0
        );
        nut.castShadow = true;
        group.add(nut);

        placed.push({ type: 'nut', x: px, z: pz, surfaceY: sy, lowestY: sy - embedY, gap: 0.0 });
      }
    }

    // 8. Putri Salju: Remah Gula Halus Putih
    else if (def.toppingType === 'powder_sugar_crumbs') {
      const count = def.toppingCount || 26;
      const sugarMat = getMaterial('sugar_white', { color: 0xFFFFFF, roughness: 0.85, metalness: 0.0 });

      for (let i = 0; i < count; i++) {
        const pt = sampleSurfacePoint(finalOutline, 0.75, winX0, winX1, seedRef);
        if (!pt) continue;

        const px = pt[0], pz = pt[1];
        const sy = getSurfaceHeight(finalOutline, px, pz, totalHeight, bevelSize, bevelThickness);
        if (sy === null) continue;

        const sz = 0.024 * width;
        const crGeo = new THREE.SphereGeometry(sz, 6, 6);
        const cr = new THREE.Mesh(crGeo, sugarMat);

        const embedY = sz * 0.25;
        cr.position.set(px, sy + sz - embedY, pz);
        group.add(cr);

        placed.push({ type: 'sugar', x: px, z: pz, surfaceY: sy, lowestY: sy - embedY, gap: 0.0 });
      }
    }

    // 9. Semprit Pilin: Biji Pistachio Hijau di Puncak Tier
    else if (def.toppingType === 'pistachio_top') {
      if (0 >= winX0 && 0 <= winX1) {
        const sy = getSurfaceHeight(finalOutline, 0, 0, totalHeight, bevelSize, bevelThickness);
        if (sy !== null) {
          const pistMat = getMaterial('pistachio_mat', { color: 0x5E9E26, roughness: 0.4, metalness: 0.05 });
          const pistR = 0.075 * width;
          const pistGeo = new THREE.SphereGeometry(pistR, 10, 8);
          pistGeo.scale(1.2, 0.65, 0.8);
          const pist = new THREE.Mesh(pistGeo, pistMat);

          const embedY = (pistR * 0.65) * 0.25;
          pist.position.set(0, sy + pistR * 0.65 - embedY, 0);
          pist.castShadow = true;
          group.add(pist);

          placed.push({ type: 'pistachio', x: 0, z: 0, surfaceY: sy, lowestY: sy - embedY, gap: 0.0 });
        }
      }
    }

    // 10. Nastar Bulat: Dua Daun Cengkih di Puncak
    else if (def.toppingType === 'clove_double_leaf') {
      if (0 >= winX0 && 0 <= winX1) {
        const sy = getSurfaceHeight(finalOutline, 0, 0, totalHeight, bevelSize, bevelThickness);
        if (sy !== null) {
          const leafMat = getMaterial('clove_leaf_mat', { color: 0x3B884F, roughness: 0.45, metalness: 0.1 });
          const lH = 0.12 * width;
          const lR = 0.045 * width;
          const embedY = lH * 0.25;

          [-0.035, 0.035].forEach(lx => {
            const leafGeo = new THREE.ConeGeometry(lR, lH, 5);
            leafGeo.rotateZ(lx > 0 ? 0.35 : -0.35);
            const leaf = new THREE.Mesh(leafGeo, leafMat);
            leaf.position.set(lx * width, sy + lH * 0.5 - embedY, 0);
            group.add(leaf);
          });

          placed.push({ type: 'clove_leaf', x: 0, z: 0, surfaceY: sy, lowestY: sy - embedY, gap: 0.0 });
        }
      }
    }

    // 11. Semprit Pandan: Bola Krim Vanilla di Tengah
    else if (def.toppingType === 'cream_ball_center') {
      if (0 >= winX0 && 0 <= winX1) {
        const sy = getSurfaceHeight(finalOutline, 0, 0, totalHeight, bevelSize, bevelThickness);
        if (sy !== null) {
          const creamMat = getMaterial('cream_vanilla', { color: 0xFFF4DA, roughness: 0.3, metalness: 0.05 });
          const crR = 0.11 * width;
          const crGeo = new THREE.SphereGeometry(crR, 14, 14);
          const cr = new THREE.Mesh(crGeo, creamMat);

          const embedY = crR * 0.25;
          cr.position.set(0, sy + crR - embedY, 0);
          cr.castShadow = true;
          group.add(cr);

          placed.push({ type: 'cream_ball', x: 0, z: 0, surfaceY: sy, lowestY: sy - embedY, gap: 0.0 });
        }
      }
    }

    // 12. Kotak Zigzag Cokelat: Aliran Cokelat Cair Zigzag
    else if (def.toppingType === 'chocolate_zigzag_stream') {
      const chocMat = getMaterial('zigzag_choc', { color: 0x2E1609, roughness: 0.3, metalness: 0.1 });
      const pts = 6;
      for (let i = 0; i < pts - 1; i++) {
        const xA = -width * 0.32 + (i / pts) * width * 0.64;
        const xB = -width * 0.32 + ((i + 1) / pts) * width * 0.64;
        const zA = (i % 2 === 0) ? -width * 0.14 : width * 0.14;
        const zB = (i % 2 === 0) ? width * 0.14 : -width * 0.14;
        const midX = (xA + xB) / 2;
        const midZ = (zA + zB) / 2;

        if (midX >= winX0 && midX <= winX1) {
          const sy = getSurfaceHeight(finalOutline, midX, midZ, totalHeight, bevelSize, bevelThickness);
          if (sy !== null) {
            const segLen = Math.hypot(xB - xA, zB - zA);
            const tubeGeo = new THREE.BoxGeometry(segLen, 0.012 * width, 0.024 * width);
            const tube = new THREE.Mesh(tubeGeo, chocMat);

            const embedY = (0.012 * width) * 0.25;
            tube.position.set(midX, sy + (0.012 * width * 0.5) - embedY, midZ);
            tube.rotation.y = Math.atan2(zB - zA, xB - xA);
            tube.castShadow = true;
            group.add(tube);

            placed.push({ type: 'zigzag', x: midX, z: midZ, surfaceY: sy, lowestY: sy - embedY, gap: 0.0 });
          }
        }
      }
    }

    // 13. Remah Kacang / Remah Emas
    else if (def.toppingType === 'peanut_golden_crumbs') {
      const count = def.toppingCount || 22;
      const topMat = getMaterial('peanut_crumbs_mat', { color: 0xD68824, roughness: 0.5, metalness: 0.05 });

      for (let i = 0; i < count; i++) {
        const pt = sampleSurfacePoint(finalOutline, 0.72, winX0, winX1, seedRef);
        if (!pt) continue;

        const px = pt[0], pz = pt[1];
        const sy = getSurfaceHeight(finalOutline, px, pz, totalHeight, bevelSize, bevelThickness);
        if (sy === null) continue;

        const sz = 0.035 * width;
        const crumbGeo = new THREE.BoxGeometry(sz, sz, sz);
        const m = new THREE.Mesh(crumbGeo, topMat);

        const embedY = sz * 0.25;
        m.position.set(px, sy + sz * 0.5 - embedY, pz);
        m.rotation.set(
          seededRandom(seedRef.val++) * Math.PI,
          seededRandom(seedRef.val++) * Math.PI,
          0
        );
        m.castShadow = true;
        group.add(m);

        placed.push({ type: 'peanut_crumb', x: px, z: pz, surfaceY: sy, lowestY: sy - embedY, gap: 0.0 });
      }
    }

    return placed;
  }

  global.Cookies3D = {
    COOKIE_DEFS,
    PHASE1_IDS,
    PHASE2_IDS,
    buatKue,
    buatPotonganJatuh,
    getRawOutline,
    getSharedNoiseTexture,
    getSurfaceHeight,
    isPointInsidePolygon,
    distToPolygonEdge
  };

})(window);
