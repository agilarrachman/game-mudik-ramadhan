// geometry.js — Outline Poligon, Pemotongan Sutherland-Hodgman, dan ExtrudeGeometry
// Spesifikasi: PRD-Menara-Kue.md v2.0 (Revisi Presisi & Organik)

(function(global) {
  'use strict';

  // Pastikan bounding box outline tepat berpusat di (0, 0) dan selebar 1.0
  function normalizeAndCenterPolygon(pts) {
    if (!pts || pts.length === 0) return pts;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (let i = 0; i < pts.length; i++) {
      if (pts[i][0] < minX) minX = pts[i][0];
      if (pts[i][0] > maxX) maxX = pts[i][0];
      if (pts[i][1] < minY) minY = pts[i][1];
      if (pts[i][1] > maxY) maxY = pts[i][1];
    }

    const currentWidth = maxX - minX;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const scale = currentWidth > 0 ? 1.0 / currentWidth : 1.0;

    return pts.map(p => [
      (p[0] - centerX) * scale,
      (p[1] - centerY) * scale
    ]);
  }

  // =========================================================
  // 1. GENERATOR OUTLINE POLIGON 2D (Array of [x, y])
  // =========================================================

  // Elips (Nastar, Kue meises, Choc chip, Sandwich, Kue kacang)
  function createEllipseOutline(depthRatio, segments) {
    depthRatio = depthRatio || 0.85;
    segments = segments || 56;
    const pts = [];
    const rx = 0.5;
    const ry = (0.5 * depthRatio);
    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      // Ketidakteraturan organik halus +-2%
      const jitter = 1.0 + Math.sin(theta * 5) * 0.015;
      pts.push([Math.cos(theta) * rx * jitter, Math.sin(theta) * ry * jitter]);
    }
    return normalizeAndCenterPolygon(pts);
  }

  // Persegi Membulat (Kastengel, Kue almond, Sagu keju, Kotak zigzag)
  function createRoundedRectOutline(depthRatio, cornerRadiusRatio, segmentsPerCorner) {
    depthRatio = depthRatio || 0.50;
    cornerRadiusRatio = cornerRadiusRatio || 0.18;
    segmentsPerCorner = segmentsPerCorner || 10;

    const w = 1.0;
    const h = depthRatio;
    const r = Math.min(cornerRadiusRatio, Math.min(w, h) * 0.45);
    const halfW = w / 2;
    const halfH = h / 2;

    const pts = [];
    const corners = [
      { cx: halfW - r, cy: halfH - r, start: 0, end: Math.PI / 2 },
      { cx: -halfW + r, cy: halfH - r, start: Math.PI / 2, end: Math.PI },
      { cx: -halfW + r, cy: -halfH + r, start: Math.PI, end: (3 * Math.PI) / 2 },
      { cx: halfW - r, cy: -halfH + r, start: (3 * Math.PI) / 2, end: 2 * Math.PI }
    ];

    corners.forEach(c => {
      for (let i = 0; i < segmentsPerCorner; i++) {
        const theta = c.start + (i / segmentsPerCorner) * (c.end - c.start);
        pts.push([c.cx + Math.cos(theta) * r, c.cy + Math.sin(theta) * r]);
      }
    });

    return normalizeAndCenterPolygon(pts);
  }

  // Bunga N-Cuping (Semprit bunga 8-10 cuping, Semprit pandan 6 cuping)
  function createFlowerOutline(lobes, depthRatio, lobeDepth, segments) {
    lobes = lobes || 8;
    depthRatio = depthRatio || 0.90;
    lobeDepth = lobeDepth || 0.22; // Kelopak bunga tegas & dalam
    segments = segments || 80;

    const baseRx = 0.5;
    const baseRy = 0.5 * depthRatio;
    const pts = [];

    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const mod = 1.0 - lobeDepth * (0.5 + 0.5 * Math.cos(lobes * theta));
      pts.push([Math.cos(theta) * baseRx * mod, Math.sin(theta) * baseRy * mod]);
    }
    return normalizeAndCenterPolygon(pts);
  }

  // Bergerigi N-Cuping (Nastar tart 14 cuping)
  function createScallopedOutline(lobes, depthRatio, scallopedDepth, segments) {
    lobes = lobes || 14;
    depthRatio = depthRatio || 0.90;
    scallopedDepth = scallopedDepth || 0.14; // Gerigi tart tegas
    segments = segments || 84;

    const baseRx = 0.5;
    const baseRy = 0.5 * depthRatio;
    const pts = [];

    for (let i = 0; i < segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const mod = 1.0 - scallopedDepth * (0.5 + 0.5 * Math.sin(lobes * theta));
      pts.push([Math.cos(theta) * baseRx * mod, Math.sin(theta) * baseRy * mod]);
    }
    return normalizeAndCenterPolygon(pts);
  }

  // Bulan Sabit (Putri salju — Bounding box strictly centered)
  function createCrescentOutline(depthRatio, innerOffset, segments) {
    depthRatio = depthRatio || 0.85;
    innerOffset = innerOffset || 0.32;
    segments = segments || 48;

    const pts = [];
    const rOuterX = 0.5;
    const rOuterY = 0.5 * depthRatio;
    const rInnerX = 0.42;
    const rInnerY = 0.42 * depthRatio;

    // Busur luar (dari -PI/2 ke PI/2)
    for (let i = 0; i <= segments; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / segments;
      pts.push([Math.cos(a) * rOuterX, Math.sin(a) * rOuterY]);
    }
    // Busur dalam (dari PI/2 ke -PI/2 berbalik ke titik awal)
    for (let i = segments; i >= 0; i--) {
      const a = -Math.PI / 2 + (Math.PI * i) / segments;
      pts.push([Math.cos(a) * rInnerX - innerOffset, Math.sin(a) * rInnerY]);
    }
    return normalizeAndCenterPolygon(pts);
  }

  // =========================================================
  // 2. PEMOTONGAN SUTHERLAND-HODGMAN TERHADAP JENDELA X [x0, x1]
  // =========================================================

  function clipPolygonAgainstVerticalLine(polygon, edgeX, isInsideFn) {
    if (!polygon || polygon.length < 3) return [];

    const output = [];
    let s = polygon[polygon.length - 1];

    for (let i = 0; i < polygon.length; i++) {
      const p = polygon[i];
      const pInside = isInsideFn(p[0], edgeX);
      const sInside = isInsideFn(s[0], edgeX);

      if (pInside) {
        if (!sInside) {
          const t = (edgeX - s[0]) / (p[0] - s[0]);
          const iy = s[1] + t * (p[1] - s[1]);
          output.push([edgeX, iy]);
        }
        output.push(p);
      } else if (sInside) {
        const t = (edgeX - s[0]) / (p[0] - s[0]);
        const iy = s[1] + t * (p[1] - s[1]);
        output.push([edgeX, iy]);
      }
      s = p;
    }

    return output;
  }

  function clipPolygonX(polygon, x0, x1) {
    let clipped = clipPolygonAgainstVerticalLine(polygon, x0, (x, edge) => x >= edge - 1e-6);
    clipped = clipPolygonAgainstVerticalLine(clipped, x1, (x, edge) => x <= edge + 1e-6);
    return clipped;
  }

  function clipPolygonComplement(polygon, x0, x1) {
    const leftPiece = clipPolygonAgainstVerticalLine(polygon, x0, (x, edge) => x <= edge + 1e-6);
    const rightPiece = clipPolygonAgainstVerticalLine(polygon, x1, (x, edge) => x >= edge - 1e-6);

    return {
      leftPiece: (leftPiece.length >= 3) ? leftPiece : null,
      rightPiece: (rightPiece.length >= 3) ? rightPiece : null
    };
  }

  // =========================================================
  // 3. PEMBUATAN THREE.ExtrudeGeometry DARI POLIGON
  // =========================================================
  function polygonToShape(pts) {
    if (!pts || pts.length < 3) return null;
    const shape = new THREE.Shape();
    shape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i][0], pts[i][1]);
    }
    shape.closePath();
    return shape;
  }

  function createExtrudedCakeGeometry(polygonPts, totalHeight, bevelSize, bevelThickness) {
    const shape = polygonToShape(polygonPts);
    if (!shape) return null;

    bevelThickness = (bevelThickness !== undefined) ? bevelThickness : Math.min(0.24, totalHeight * 0.36);
    bevelSize = (bevelSize !== undefined) ? bevelSize : Math.min(0.24, totalHeight * 0.36);
    const extrudeDepth = Math.max(0.01, totalHeight - (bevelThickness * 2));

    const settings = {
      depth: extrudeDepth,
      bevelEnabled: true,
      bevelSegments: 5, // Bevel membulat lembut
      steps: 1,
      bevelSize: bevelSize,
      bevelThickness: bevelThickness
    };

    const geo = new THREE.ExtrudeGeometry(shape, settings);
    geo.rotateX(Math.PI / 2);
    geo.computeBoundingBox();
    geo.translate(0, -geo.boundingBox.min.y, 0);

    return geo;
  }

  global.GeometryUtils = {
    normalizeAndCenterPolygon,
    createEllipseOutline,
    createRoundedRectOutline,
    createFlowerOutline,
    createScallopedOutline,
    createCrescentOutline,
    clipPolygonX,
    clipPolygonComplement,
    polygonToShape,
    createExtrudedCakeGeometry
  };

})(window);
