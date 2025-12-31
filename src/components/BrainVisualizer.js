import React, { useRef, useEffect, useMemo } from 'react';
import './BrainVisualizer.css';

class SimplexNoise {
  constructor(seed = Math.random() * 10000) {
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    
    
    for (let i = 0; i < 256; i++) {
      this.p[i] = i;
    }
    
    
    let n = 256;
    const seededRandom = this.mulberry32(seed);
    while (n > 1) {
      const k = Math.floor(seededRandom() * n);
      n--;
      [this.p[n], this.p[k]] = [this.p[k], this.p[n]];
    }
    
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
    
    
    this.grad3 = [
      [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
    ];
    
    
    this.F3 = 1.0 / 3.0;
    this.G3 = 1.0 / 6.0;
  }
  
  mulberry32(seed) {
    return function() {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  
  dot3(g, x, y, z) {
    return g[0] * x + g[1] * y + g[2] * z;
  }
  
  noise3D(x, y, z) {
    const { perm, permMod12, grad3, F3, G3 } = this;
    
    
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    const z0 = z - Z0;
    
    
    let i1, j1, k1, i2, j2, k2;
    if (x0 >= y0) {
      if (y0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if (x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if (y0 < z0) { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if (x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }
    
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3;
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3;
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;
    
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    
    
    let n0, n1, n2, n3;
    
    let t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if (t0 < 0) n0 = 0.0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot3(grad3[permMod12[ii + perm[jj + perm[kk]]]], x0, y0, z0);
    }
    
    let t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if (t1 < 0) n1 = 0.0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot3(grad3[permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]]], x1, y1, z1);
    }
    
    let t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if (t2 < 0) n2 = 0.0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot3(grad3[permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]]], x2, y2, z2);
    }
    
    let t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if (t3 < 0) n3 = 0.0;
    else {
      t3 *= t3;
      n3 = t3 * t3 * this.dot3(grad3[permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]]], x3, y3, z3);
    }
    
    
    return 32.0 * (n0 + n1 + n2 + n3);
  }
  
  
  fbm(x, y, z, octaves = 4, lacunarity = 2.0, persistence = 0.5) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;
    
    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise3D(x * frequency, y * frequency, z * frequency);
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    
    return value / maxValue;
  }

  
  ridgedFbm(x, y, z, octaves = 4, lacunarity = 2.0, gain = 0.5) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let prev = 1;

    for (let i = 0; i < octaves; i++) {
      const n = this.noise3D(x * frequency, y * frequency, z * frequency);
      const ridged = 1 - Math.abs(n); // [0..1]
      const weighted = ridged * ridged * prev;
      value += weighted * amplitude;
      prev = Math.max(0.15, Math.min(1, weighted * 2.0));
      frequency *= lacunarity;
      amplitude *= gain;
    }

    // Roughly normalize to [0..1]
    return Math.max(0, Math.min(1, value));
  }
}

const createIcosahedronGeometry = (detail = 12) => {
  const t = (1 + Math.sqrt(5)) / 2; // Golden ratio
  
  
  const baseVertices = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
  ];
  
  
  const baseFaces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];
  
  let vertices = baseVertices.map(v => {
    const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / len, v[1] / len, v[2] / len];
  });
  
  let faces = [...baseFaces];
  
  
  const midpointCache = new Map();
  
  const getMidpoint = (i1, i2) => {
    const key = i1 < i2 ? `${i1}_${i2}` : `${i2}_${i1}`;
    if (midpointCache.has(key)) return midpointCache.get(key);
    
    const v1 = vertices[i1];
    const v2 = vertices[i2];
    const mid = [
      (v1[0] + v2[0]) / 2,
      (v1[1] + v2[1]) / 2,
      (v1[2] + v2[2]) / 2
    ];
    
    
    const len = Math.sqrt(mid[0] * mid[0] + mid[1] * mid[1] + mid[2] * mid[2]);
    mid[0] /= len;
    mid[1] /= len;
    mid[2] /= len;
    
    const idx = vertices.length;
    vertices.push(mid);
    midpointCache.set(key, idx);
    return idx;
  };
  
  
  for (let d = 0; d < detail; d++) {
    const newFaces = [];
    midpointCache.clear();
    
    for (const [a, b, c] of faces) {
      const ab = getMidpoint(a, b);
      const bc = getMidpoint(b, c);
      const ca = getMidpoint(c, a);
      
      newFaces.push([a, ab, ca]);
      newFaces.push([b, bc, ab]);
      newFaces.push([c, ca, bc]);
      newFaces.push([ab, bc, ca]);
    }
    
    faces = newFaces;
  }
  
  return { vertices, faces };
};

const createBrainGeometry = (baseRadius = 75, detail = 5) => {
  const noise = new SimplexNoise(42);
  const { vertices: icoVertices, faces } = createIcosahedronGeometry(detail);
  
  const vertices = [];
  const edges = new Set();
  
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smoothstep = (a, b, x) => {
    const t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  
  const brainScaleX = 1.16;  // lateral width
  const brainScaleY = 0.98;  // taller vault (avoid flat top)
  const brainScaleZ = 1.30;  // front-back elongation

  
  const fissureGap = 3.8;     // pixels of separation (visual only)
  const fissureWidth = 0.18;  // how wide the top fissure region is
  const fissureDepth = 0.18;  // how deep the valley is
  const basePlane = -baseRadius * 0.70; // soft-clamped inferior surface

  
  const foldFreqPrimary = 2.6;
  const foldFreqSecondary = 5.2;
  const foldFreqFine = 10.5;
  const foldAmpPrimary = 0.10;
  const foldAmpSecondary = 0.06;
  const foldAmpFine = 0.018;
  
  for (const [x, y, z] of icoVertices) {
    
    const ux = x;
    const uy = y;
    const uz = z;

    
    const crown = smoothstep(0.02, 0.92, uy);
    const rXZ = Math.sqrt(ux * ux + uz * uz); // 0 at top, ~1 at equator
    
    const dome = Math.pow(1 - Math.min(1, rXZ), 1.55);
    const vault = 1 - 0.22 * Math.pow(Math.abs(uz), 1.25); // preserve a rounded front/back
    const temporalUndercut =
      smoothstep(0.08, 0.75, 1 - Math.abs(uy)) *
      smoothstep(0.35, 0.95, Math.abs(ux)) *
      smoothstep(-0.10, 0.85, uz);

    const inferiorSquash = uy < 0 ? 0.90 : 1.0;
    let dx = ux * brainScaleX;
    let dy = uy * brainScaleY * inferiorSquash;
    let dz = uz * brainScaleZ;

    
    dy *= 1 + crown * (0.22 + dome * 0.78) * 0.58;
    dy *= 1 + crown * vault * 0.18;
    
    dy *= 1 - temporalUndercut * 0.18;
    dz *= 1 + temporalUndercut * 0.06;

    const dLen = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
    dx /= dLen;
    dy /= dLen;
    dz /= dLen;

    const nx = dx;
    const ny = dy;
    const nz = dz;

    
    const p1 = noise.ridgedFbm(nx * foldFreqPrimary * 1.15, ny * foldFreqPrimary * 0.85, nz * foldFreqPrimary * 1.35, 4, 2.0, 0.55);
    const p2 = noise.ridgedFbm(nx * foldFreqSecondary * 1.25, ny * foldFreqSecondary * 0.90, nz * foldFreqSecondary * 1.55, 3, 2.15, 0.55);
    const p3 = noise.fbm(nx * foldFreqFine * 1.0, ny * foldFreqFine * 1.0, nz * foldFreqFine * 1.0, 2, 2.0, 0.5);

    
    const foldPrimary = (p1 - 0.55);
    const foldSecondary = (p2 - 0.55);
    const fine = p3; // [-1..1]

    
    const top = smoothstep(0.10, 0.92, ny);
    const frontal = smoothstep(0.05, 0.90, nz);
    const occipital = smoothstep(0.05, 0.90, -nz);
    const temporal = smoothstep(0.10, 0.70, 1 - Math.abs(ny)) * smoothstep(0.25, 0.92, Math.abs(nx));

    let displacement = 1.0;
    displacement += foldPrimary * foldAmpPrimary * (0.65 + 0.55 * top);
    displacement += foldSecondary * foldAmpSecondary * (0.55 + 0.65 * temporal);
    displacement += fine * foldAmpFine;

    
    const fissureInfluence = Math.exp(-Math.pow(nx / fissureWidth, 2)) * smoothstep(0.05, 0.85, ny);
    displacement -= fissureInfluence * fissureDepth;

    
    const sylvianLeft = Math.exp(-Math.pow((nx + 0.62) / 0.18, 2) - Math.pow((ny + 0.05) / 0.32, 2));
    const sylvianRight = Math.exp(-Math.pow((nx - 0.62) / 0.18, 2) - Math.pow((ny + 0.05) / 0.32, 2));
    displacement -= (sylvianLeft + sylvianRight) * 0.06;

    
    displacement += frontal * top * 0.075;
    displacement += occipital * smoothstep(-0.95, -0.15, ny) * 0.06;

    
    displacement += temporal * 0.085;

    
    const stemNotch =
      Math.exp(-Math.pow(nx / 0.24, 2)) *
      Math.exp(-Math.pow((ny + 0.86) / 0.18, 2)) *
      Math.exp(-Math.pow((nz + 0.25) / 0.55, 2));
    displacement -= stemNotch * 0.06;

    
    displacement = Math.max(0.86, Math.min(1.20, displacement));

    
    const finalRadius = baseRadius * displacement;
    let px = nx * finalRadius;
    let py = ny * finalRadius;
    let pz = nz * finalRadius;

    
    if (py < basePlane) {
      py = basePlane + (py - basePlane) * 0.18;
    }

    
    const sign = ux >= 0 ? 1 : -1;
    const midline = 1 - clamp01(Math.abs(nx) / fissureWidth);
    const splitMask = clamp01(midline) * smoothstep(0.10, 0.85, ny);
    px += sign * fissureGap * splitMask;

    
    const hemisphere = px > 0.8 ? 'right' : (px < -0.8 ? 'left' : 'center');

    vertices.push({
      x: px,
      y: py,
      z: pz,
      nx: nx,
      ny: ny,
      nz: nz,
      hemisphere
    });
  }
  
  
  for (const [a, b, c] of faces) {
    const addEdge = (i, j) => {
      const key = i < j ? `${i}_${j}` : `${j}_${i}`;
      edges.add(key);
    };
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }
  
  const edgeList = Array.from(edges).map(key => {
    const [i, j] = key.split('_').map(Number);
    return [i, j];
  });
  
  return { vertices, edges: edgeList, faces };
};

const projectToSurface = (point, brainVertices, baseRadius) => {
  
  const len = Math.sqrt(point.x * point.x + point.y * point.y + point.z * point.z);
  const dir = {
    x: point.x / len,
    y: point.y / len,
    z: point.z / len
  };
  
  
  let bestVertex = null;
  let bestDot = -1;
  
  for (const v of brainVertices) {
    
    const vLen = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) || 1;
    const vx = v.x / vLen;
    const vy = v.y / vLen;
    const vz = v.z / vLen;
    const dot = dir.x * vx + dir.y * vy + dir.z * vz;
    if (dot > bestDot) {
      bestDot = dot;
      bestVertex = v;
    }
  }
  
  if (bestVertex) {
    
    const vLen = Math.sqrt(bestVertex.x * bestVertex.x + bestVertex.y * bestVertex.y + bestVertex.z * bestVertex.z) || 1;
    const nx = bestVertex.x / vLen;
    const ny = bestVertex.y / vLen;
    const nz = bestVertex.z / vLen;
    const offset = 6;

    return {
      x: bestVertex.x + nx * offset,
      y: bestVertex.y + ny * offset,
      z: bestVertex.z + nz * offset,
      surfaceNormal: { x: nx, y: ny, z: nz }
    };
  }
  
  
  return { x: point.x, y: point.y, z: point.z, surfaceNormal: dir };
};

const BrainVisualizer = ({ channelData, selectedChannel }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const rotationRef = useRef(0);
  const rotationXRef = useRef(0.25);
  const timeRef = useRef(0);
  const zoomRef = useRef(1.0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, rotY: 0, rotX: 0 });
  const lastInteractionRef = useRef(0);

  const BASE_RADIUS = 92;
  
  
  const brainGeometry = useMemo(() => createBrainGeometry(BASE_RADIUS, 5), [BASE_RADIUS]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    
    canvas.style.touchAction = 'none';
    
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(canvas.offsetWidth * dpr);
      canvas.height = Math.floor(canvas.offsetHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    
    const baseChannelPositions = {
      
      ch1: { theta: 2.35, phi: -Math.PI / 2, label: 'O1/O2' },    // Occipital (back-lower)
      ch2: { theta: 0.45, phi: 0, label: 'Pz' },                   // Parietal (top)
      ch3: { theta: 0.95, phi: Math.PI / 2, label: 'Fp1/Fp2' }     // Frontal (front-upper)
    };
    
    
    const channelPositions = {};
    const baseRadius = BASE_RADIUS;
    
    for (const [ch, pos] of Object.entries(baseChannelPositions)) {
      const sphericalPoint = {
        x: baseRadius * Math.sin(pos.theta) * Math.cos(pos.phi),
        y: baseRadius * Math.cos(pos.theta),
        z: baseRadius * Math.sin(pos.theta) * Math.sin(pos.phi)
      };
      
      const projected = projectToSurface(sphericalPoint, brainGeometry.vertices, baseRadius);
      channelPositions[ch] = {
        ...projected,
        label: pos.label
      };
    }

    
    const project = (point, rotationY, rotationX, cx, cy) => {
      
      const cosY = Math.cos(rotationY);
      const sinY = Math.sin(rotationY);
      let x = point.x * cosY - point.z * sinY;
      let z = point.x * sinY + point.z * cosY;
      
      
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);
      let y = point.y * cosX - z * sinX;
      z = point.y * sinX + z * cosX;
      
      
      const perspective = 460;
      const scale = (perspective / (perspective + z)) * zoomRef.current;
      
      return {
        x: cx + x * scale,
        
        y: cy - y * scale,
        scale,
        z
      };
    };

    const markInteraction = () => {
      lastInteractionRef.current = performance.now();
    };

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const onPointerDown = (e) => {
      if (!canvas) return;
      isDraggingRef.current = true;
      markInteraction();

      canvas.setPointerCapture?.(e.pointerId);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        rotY: rotationRef.current,
        rotX: rotationXRef.current
      };
    };

    const onPointerMove = (e) => {
      if (!isDraggingRef.current) return;
      markInteraction();

      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

    
      rotationRef.current = dragStartRef.current.rotY + dx * 0.006;
      rotationXRef.current = clamp(dragStartRef.current.rotX - dy * 0.004, -1.05, 1.05);
    };

    const onPointerUp = (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      markInteraction();
      canvas.releasePointerCapture?.(e.pointerId);
    };

    const onWheel = (e) => {
      
      e.preventDefault();
      markInteraction();

      const zoom = zoomRef.current;
      const zoomFactor = Math.exp(-e.deltaY * 0.0012);
      zoomRef.current = clamp(zoom * zoomFactor, 0.6, 2.2);
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    const getChannelColor = (ch) => {
      const data = channelData[ch];
      if (!data) return '#8b5cf6'; // Default purple
      
      
      const bands = [
        { val: data.delta, color: '#ef4444' },  // Red
        { val: data.theta, color: '#f59e0b' },  // Amber
        { val: data.alpha, color: '#10b981' },  // Emerald
        { val: data.beta, color: '#3b82f6' },   // Blue
        { val: data.gamma, color: '#a855f7' }   // Purple
      ];
      
      return bands.reduce((a, b) => a.val > b.val ? a : b).color;
    };

    const getChannelIntensity = (ch) => {
      const data = channelData[ch];
      if (!data) return 0.5;
      return Math.max(data.delta, data.theta, data.alpha, data.beta, data.gamma) / 100;
    };

      
    const hologramColors = {
      primary: 'rgba(139, 92, 246, ',     // Purple
      secondary: 'rgba(59, 130, 246, ',    // Blue
      accent: 'rgba(236, 72, 153, ',       // Pink
      glow: 'rgba(167, 139, 250, '         // Light purple
    };

    
    const flarePalette = [
      { r: 139, g: 92, b: 246 },  // purple
      { r: 59, g: 130, b: 246 },  // blue
      { r: 236, g: 72, b: 153 },  // pink
      { r: 167, g: 139, b: 250 }  // light purple
    ];
    const flares = [];

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const cx = width / 2;
      const cy = height / 2;
      
      timeRef.current += 0.016; // ~60fps
      
      
      const bgGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) / 2);
      bgGradient.addColorStop(0, '#0f0a1a');
      bgGradient.addColorStop(0.5, '#050208');
      bgGradient.addColorStop(1, '#000000');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);
      
      
      const now = performance.now();
      const idle = !isDraggingRef.current && (now - lastInteractionRef.current) > 1200;
      if (idle) rotationRef.current += 0.0022;
      const rotationY = rotationRef.current;
      const rotationX = rotationXRef.current + (idle ? Math.sin(timeRef.current * 0.3) * 0.04 : 0);
      
      const { vertices, edges } = brainGeometry;
      
      
      const projectedVertices = vertices.map(v => project(v, rotationY, rotationX, cx, cy));
      
      
      const sortedEdges = edges
        .map(([i, j]) => ({
          indices: [i, j],
          avgZ: (projectedVertices[i].z + projectedVertices[j].z) / 2,
          v1: vertices[i],
          v2: vertices[j]
        }))
        .sort((a, b) => a.avgZ - b.avgZ);
      
      
      for (const edge of sortedEdges) {
        const p1 = projectedVertices[edge.indices[0]];
        const p2 = projectedVertices[edge.indices[1]];
        
        // Skip edges behind the brain
        if (p1.z < -80 && p2.z < -80) continue;
        
        // Depth-based opacity and color
        const depthFactor = Math.max(0, Math.min(1, (edge.avgZ + 100) / 200));
        const opacity = 0.05 + depthFactor * 0.25;
        
        // Hemisphere-based coloring
        const hemisphere = edge.v1.hemisphere;
        let color;
        if (hemisphere === 'left') {
          color = hologramColors.primary + opacity + ')';
        } else if (hemisphere === 'right') {
          color = hologramColors.secondary + opacity + ')';
        } else {
          color = hologramColors.accent + (opacity * 0.7) + ')';
        }
        
        // Pulsing glow effect
        const pulse = 0.5 + Math.sin(timeRef.current * 2 + edge.avgZ * 0.05) * 0.5;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.3 + depthFactor * 0.4 + pulse * 0.2;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      
      
      const pointDensity = 8; // Only draw every Nth point
      for (let i = 0; i < projectedVertices.length; i += pointDensity) {
        const p = projectedVertices[i];
        
        if (p.z < -60) continue;
        
        const depthFactor = Math.max(0, Math.min(1, (p.z + 100) / 200));
        const size = 0.5 + depthFactor * 1.5;
        const opacity = 0.2 + depthFactor * 0.5;
        
        
        const twinkle = Math.sin(timeRef.current * 4 + i * 0.1) > 0.7 ? 1.5 : 1;
        
        ctx.fillStyle = hologramColors.glow + (opacity * twinkle) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * twinkle, 0, Math.PI * 2);
        ctx.fill();
      }

      
      const activity = (
        getChannelIntensity('ch1') +
        getChannelIntensity('ch2') +
        getChannelIntensity('ch3')
      ) / 3;

      const flareSpawnChance = 0.015 + Math.min(0.06, activity * 0.05);
      if (flares.length < 18 && Math.random() < flareSpawnChance) {
        const idx = Math.floor(Math.random() * vertices.length);
        const c = flarePalette[Math.floor(Math.random() * flarePalette.length)];
        flares.push({
          idx,
          life: 1,
          ttl: 0.55 + Math.random() * 0.85,
          size: 7 + Math.random() * 14,
          r: c.r,
          g: c.g,
          b: c.b,
          drift: (Math.random() - 0.5) * 0.6,
        });
      }

      
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      let ambX = 0;
      let ambY = 0;
      let ambR = 0;
      let ambG = 0;
      let ambB = 0;
      let ambW = 0;
      let ambPeak = 0;

      for (let i = flares.length - 1; i >= 0; i--) {
        const f = flares[i];
        f.life -= 0.016 / f.ttl;
        if (f.life <= 0) {
          flares.splice(i, 1);
          continue;
        }

        const v = vertices[f.idx];
        if (!v) continue;
        const wobble = Math.sin(timeRef.current * 1.6 + f.idx * 0.02) * 2.0;
        const flarePoint = {
          x: v.x + wobble + f.drift * 6,
          y: v.y + wobble * 0.25,
          z: v.z
        };

        const pp = project(flarePoint, rotationY, rotationX, cx, cy);
        if (pp.z < -120) continue;

        const a = Math.max(0, Math.min(1, f.life));
        const w = a * a;
        ambX += pp.x * w;
        ambY += pp.y * w;
        ambR += f.r * w;
        ambG += f.g * w;
        ambB += f.b * w;
        ambW += w;
        ambPeak = Math.max(ambPeak, a);

        const radius = (f.size * (0.55 + (1 - a) * 0.8)) * (0.8 + activity * 0.65) * pp.scale;
        const gg = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, radius * 3.1);
        gg.addColorStop(0, `rgba(255, 255, 255, ${0.28 * a})`);
        gg.addColorStop(0.18, `rgba(${f.r}, ${f.g}, ${f.b}, ${0.75 * a})`);
        gg.addColorStop(0.55, `rgba(${f.r}, ${f.g}, ${f.b}, ${0.16 * a})`);
        gg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gg;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, radius * 3.1, 0, Math.PI * 2);
        ctx.fill();
      }

      if (ambW > 0.0001) {
        const ax = ambX / ambW;
        const ay = ambY / ambW;
        const r = Math.round(ambR / ambW);
        const g = Math.round(ambG / ambW);
        const b = Math.round(ambB / ambW);
        const strength = 0.02 + Math.min(0.06, ambPeak * 0.05) + activity * 0.02;
        const rad = Math.max(width, height) * (0.45 + ambPeak * 0.25);

        const spill = ctx.createRadialGradient(ax, ay, 0, ax, ay, rad);
        spill.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${strength})`);
        spill.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${strength * 0.55})`);
        spill.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = spill;
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();
      
      
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.03)';
      ctx.lineWidth = 1;
      const scanOffset = (timeRef.current * 50) % 20;
      for (let y = scanOffset; y < height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      
      const positionValues = Object.entries(channelPositions);
      
      for (let i = 0; i < positionValues.length; i++) {
        for (let j = i + 1; j < positionValues.length; j++) {
          const [ch1, pos1] = positionValues[i];
          const [ch2, pos2] = positionValues[j];
          
          const p1 = project(pos1, rotationY, rotationX, cx, cy);
          const p2 = project(pos2, rotationY, rotationX, cx, cy);
          
          if (p1.z < -40 || p2.z < -40) continue;
          
          
          const intensity1 = getChannelIntensity(ch1);
          const intensity2 = getChannelIntensity(ch2);
          const connectionStrength = (intensity1 + intensity2) / 2;
          
          
          const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          gradient.addColorStop(0, getChannelColor(ch1) + '40');
          gradient.addColorStop(0.5, hologramColors.glow + (0.2 + connectionStrength * 0.3) + ')');
          gradient.addColorStop(1, getChannelColor(ch2) + '40');
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 1 + connectionStrength;
          ctx.setLineDash([8, 8]);
          ctx.lineDashOffset = -timeRef.current * 30;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      // Draw electrode markers (on top)
      Object.entries(channelPositions).forEach(([ch, pos]) => {
        const p = project(pos, rotationY, rotationX, cx, cy);
        const color = getChannelColor(ch);
        const intensity = getChannelIntensity(ch);
        const isSelected = ch === `ch${selectedChannel}`;
        const time = timeRef.current;

        
        if (p.z < -40) return;

        const depthBoost = Math.max(0, Math.min(1, (p.z + 80) / 180));
        const baseRadius = (isSelected ? 15 : 12) * (0.9 + depthBoost * 0.35);
        const pulsePhase = Math.sin(time * 3 + parseInt(ch.slice(2)) * 2);
        const pulseRadius = baseRadius + intensity * 18 + pulsePhase * 3.5;

        
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulseRadius * 3.2 * p.scale);
        halo.addColorStop(0, '#ffffff55');
        halo.addColorStop(0.15, color + 'aa');
        halo.addColorStop(0.45, color + '44');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseRadius * 3.2 * p.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (baseRadius * p.scale) + 1.0, 0, Math.PI * 2);
        ctx.stroke();

        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, (baseRadius * p.scale) - 1.5, 0, Math.PI * 2);
        ctx.stroke();

        
        ctx.save();
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        const coreGradient = ctx.createRadialGradient(
          p.x - baseRadius * 0.25 * p.scale,
          p.y - baseRadius * 0.25 * p.scale,
          0,
          p.x, p.y,
          baseRadius * 1.05 * p.scale
        );
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.25, '#ffffffcc');
        coreGradient.addColorStop(0.55, color);
        coreGradient.addColorStop(1, color + 'aa');
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, baseRadius * 1.05 * p.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        
        if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.lineDashOffset = -time * 20;
          ctx.beginPath();
          ctx.arc(p.x, p.y, baseRadius * p.scale + 10, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const fontPx = Math.max(12, Math.min(18, 13 * p.scale + 6));
        ctx.font = `700 ${fontPx}px "JetBrains Mono", monospace`;

        const labelY = p.y + baseRadius * p.scale + 10;
        const labelMetrics = ctx.measureText(pos.label);

        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
        ctx.fillRect(
          p.x - labelMetrics.width / 2 - 7,
          labelY - 4,
          labelMetrics.width + 14,
          fontPx + 6
        );
        ctx.strokeStyle = color + 'aa';
        ctx.lineWidth = 1;
        ctx.strokeRect(
          p.x - labelMetrics.width / 2 - 7,
          labelY - 4,
          labelMetrics.width + 14,
          fontPx + 6
        );

        
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.strokeText(pos.label, p.x, labelY);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(pos.label, p.x, labelY);
      });
      
      
      const vignetteGradient = ctx.createRadialGradient(cx, cy, Math.min(width, height) * 0.3, cx, cy, Math.max(width, height) * 0.7);
      vignetteGradient.addColorStop(0, 'transparent');
      vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, width, height);
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [channelData, selectedChannel, brainGeometry]);

  return (
    <div className="brain-visualizer">
      <canvas ref={canvasRef} className="brain-canvas" />
      <div className="brain-overlay">
        <span className="brain-label">NEURAL TOPOLOGY</span>
      </div>
    </div>
  );
};

export default BrainVisualizer;
