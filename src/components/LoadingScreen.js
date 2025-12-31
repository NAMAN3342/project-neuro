import React, { useEffect, useRef, useState } from 'react';
import './LoadingScreen.css';

class SimplexNoise {
  constructor(seed = 1337) {
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);

    for (let i = 0; i < 256; i++) this.p[i] = i;
    let n = 256;
    const rand = this.mulberry32(seed);
    while (n > 1) {
      const k = Math.floor(rand() * n);
      n--;
      [this.p[n], this.p[k]] = [this.p[k], this.p[n]];
    }

    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }

    this.grad3 = [
      [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
      [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
      [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1]
    ];
    this.F3 = 1 / 3;
    this.G3 = 1 / 6;
  }

  mulberry32(seed) {
    return function () {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
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
      if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
      else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
    } else {
      if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
      else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
      else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    }

    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;

    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    let n0, n1, n2, n3;
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 < 0) n0 = 0;
    else {
      t0 *= t0;
      n0 = t0 * t0 * this.dot3(grad3[permMod12[ii + perm[jj + perm[kk]]]], x0, y0, z0);
    }

    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 < 0) n1 = 0;
    else {
      t1 *= t1;
      n1 = t1 * t1 * this.dot3(grad3[permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]]], x1, y1, z1);
    }

    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 < 0) n2 = 0;
    else {
      t2 *= t2;
      n2 = t2 * t2 * this.dot3(grad3[permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]]], x2, y2, z2);
    }

    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 < 0) n3 = 0;
    else {
      t3 *= t3;
      n3 = t3 * t3 * this.dot3(grad3[permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]]], x3, y3, z3);
    }

    return 32 * (n0 + n1 + n2 + n3);
  }

  fbm(x, y, z, octaves = 3, lacunarity = 2, persistence = 0.55) {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let max = 0;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.noise3D(x * frequency, y * frequency, z * frequency);
      max += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return value / max;
  }

  ridgedFbm(x, y, z, octaves = 4, lacunarity = 2.0, gain = 0.55) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let prev = 1;

    for (let i = 0; i < octaves; i++) {
      const n = this.noise3D(x * frequency, y * frequency, z * frequency);
      const ridged = 1 - Math.abs(n);
      const weighted = ridged * ridged * prev;
      value += weighted * amplitude;
      prev = Math.max(0.15, Math.min(1, weighted * 2));
      frequency *= lacunarity;
      amplitude *= gain;
    }
    return Math.max(0, Math.min(1, value));
  }
}

const createIcosahedronGeometry = (detail = 4) => {
  const t = (1 + Math.sqrt(5)) / 2;
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

  let vertices = baseVertices.map((v) => {
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
    const mid = [(v1[0] + v2[0]) / 2, (v1[1] + v2[1]) / 2, (v1[2] + v2[2]) / 2];
    const len = Math.sqrt(mid[0] * mid[0] + mid[1] * mid[1] + mid[2] * mid[2]) || 1;
    mid[0] /= len; mid[1] /= len; mid[2] /= len;

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
      newFaces.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = newFaces;
  }

  return { vertices, faces };
};

const createBrainGeometry = (baseRadius) => {
  const noise = new SimplexNoise(42);
  const { vertices: icoVertices, faces } = createIcosahedronGeometry(4);

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const smoothstep = (a, b, x) => {
    const t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  const vertices = [];
  const edges = new Set();

  const brainScaleX = 1.16;
  const brainScaleY = 0.98;
  const brainScaleZ = 1.30;

  const fissureGap = Math.max(2.4, baseRadius * 0.04);
  const fissureWidth = 0.18;
  const fissureDepth = 0.18;
  const basePlane = -baseRadius * 0.70;

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
    const rXZ = Math.sqrt(ux * ux + uz * uz);
    const dome = Math.pow(1 - Math.min(1, rXZ), 1.55);
    const vault = 1 - 0.22 * Math.pow(Math.abs(uz), 1.25);
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
    dx /= dLen; dy /= dLen; dz /= dLen;

    const nx = dx;
    const ny = dy;
    const nz = dz;

    const p1 = noise.ridgedFbm(nx * foldFreqPrimary * 1.15, ny * foldFreqPrimary * 0.85, nz * foldFreqPrimary * 1.35, 4, 2.0, 0.55);
    const p2 = noise.ridgedFbm(nx * foldFreqSecondary * 1.25, ny * foldFreqSecondary * 0.90, nz * foldFreqSecondary * 1.55, 3, 2.15, 0.55);
    const p3 = noise.fbm(nx * foldFreqFine, ny * foldFreqFine, nz * foldFreqFine, 2, 2.0, 0.5);

    const foldPrimary = (p1 - 0.55);
    const foldSecondary = (p2 - 0.55);
    const fine = p3;

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

    vertices.push({ x: px, y: py, z: pz, hemisphere: px > 0.8 ? 'right' : (px < -0.8 ? 'left' : 'center') });
  }

  for (const [a, b, c] of faces) {
    const addEdge = (i, j) => edges.add(i < j ? `${i}_${j}` : `${j}_${i}`);
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }

  const edgeList = Array.from(edges).map((key) => key.split('_').map(Number));
  return { vertices, edges: edgeList };
};

const LoadingScreen = () => {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing neural interface...');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let rotation = 0;

    let width = 0;
    let height = 0;
    let brain = null;
    let baseRadius = 160;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      baseRadius = Math.min(width, height) * 0.22;
      brain = createBrainGeometry(baseRadius);
    };
    resize();
    window.addEventListener('resize', resize);

    
    const particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * 400 - 200,
        y: Math.random() * 400 - 200,
        z: Math.random() * 400 - 200,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        vz: (Math.random() - 0.5) * 2,
        life: Math.random()
      });
    }

    
    const flarePalette = [
      { r: 139, g: 92, b: 246 },  // purple
      { r: 59, g: 130, b: 246 },  // blue
      { r: 236, g: 72, b: 153 },  // pink
      { r: 16, g: 185, b: 129 },  // teal
      { r: 245, g: 158, b: 11 }   // amber
    ];
    const flares = [];

    
    const project = (point, rotation) => {
      // Rotate around Y axis
      const cosY = Math.cos(rotation);
      const sinY = Math.sin(rotation);
      let x = point.x * cosY - point.z * sinY;
      let z = point.x * sinY + point.z * cosY;
      
      // Rotate around X axis (slight tilt)
      const cosX = Math.cos(0.35);
      const sinX = Math.sin(0.35);
      let y = point.y * cosX - z * sinX;
      z = point.y * sinX + z * cosX;
      
      // Perspective projection
      const perspective = 560;
      const scale = perspective / (perspective + z);
      
      return {
        x: width / 2 + x * scale,
        // invert Y so +Y is up (consistent with main brain renderer)
        y: height / 2 - y * scale,
        scale,
        z
      };
    };

    const animate = () => {
      
      const bg = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.6);
      bg.addColorStop(0, '#0f0a1a');
      bg.addColorStop(0.55, '#050208');
      bg.addColorStop(1, '#000000');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      
      rotation += 0.007;

      if (!brain) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      const { vertices: brainVertices, edges: brainEdges } = brain;

      
      const projected = brainVertices.map((v) => project(v, rotation));
      
      
      for (const [i, j] of brainEdges) {
        const p1 = projected[i];
        const p2 = projected[j];
        if (!p1 || !p2) continue;
        if (p1.z < -180 && p2.z < -180) continue;

        const depth = Math.max(0, Math.min(1, (p1.z + 220) / 420));
        const alpha = 0.04 + depth * 0.18;
        ctx.lineWidth = 0.25 + depth * 0.45;

        // Hemisphere tint (purple vs blue)
        const hemi = brainVertices[i].hemisphere;
        const c = hemi === 'right'
          ? `rgba(59, 130, 246, ${alpha})`
          : hemi === 'left'
            ? `rgba(139, 92, 246, ${alpha})`
            : `rgba(236, 72, 153, ${alpha * 0.85})`;

        ctx.strokeStyle = c;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }

      
      const pointDensity = 6;
      for (let i = 0; i < projected.length; i += pointDensity) {
        const p = projected[i];
        if (!p || p.z < -140) continue;

        const depth = Math.max(0, Math.min(1, (p.z + 220) / 420));
        const tw = Math.sin(rotation * 2.5 + i * 0.07) > 0.75 ? 1.7 : 1;
        const size = (0.45 + depth * 1.35) * tw;
        const alpha = (0.18 + depth * 0.45) * (0.65 + tw * 0.35);
        ctx.fillStyle = `rgba(167, 139, 250, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.life -= 0.005;
        
        if (p.life <= 0) {
          p.x = Math.random() * 200 - 100;
          p.y = Math.random() * 200 - 100;
          p.z = Math.random() * 200 - 100;
          p.life = 1;
        }
        
        const proj = project(p, rotation);
        const size = 3 * proj.scale;
        
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167, 139, 250, ${p.life * 0.55})`;
        ctx.fill();
        
        
        const gradient = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, size * 3.2);
        gradient.addColorStop(0, `rgba(236, 72, 153, ${p.life * 0.20})`);
        gradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, size * 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
      
      
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.18)';
      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length - 1; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dz = particles[i].z - particles[j].z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (dist < 80) {
            const p1 = project(particles[i], rotation);
            const p2 = project(particles[j], rotation);
            const alpha = (1 - dist / 80) * 0.3 * particles[i].life * particles[j].life;
            ctx.strokeStyle = `rgba(236, 72, 153, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      
      const spawnChance = 0.08 + Math.min(0.22, progress / 100 * 0.18);
      if (Math.random() < spawnChance) {
        const idx = Math.floor(Math.random() * brainVertices.length);
        const v = brainVertices[idx];
        const c = flarePalette[Math.floor(Math.random() * flarePalette.length)];
        flares.push({
          idx,
          life: 1,
          ttl: 0.6 + Math.random() * 0.7,
          size: (8 + Math.random() * 16) * (0.8 + (progress / 100) * 0.6),
          r: c.r,
          g: c.g,
          b: c.b,
          drift: (Math.random() - 0.5) * 0.6,
          v,
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

        const v = brainVertices[f.idx];
        if (!v) continue;
        const wobble = Math.sin(rotation * 1.8 + f.idx * 0.03) * 2.0;
        const flarePoint = {
          x: v.x + wobble + f.drift * 6,
          y: v.y + wobble * 0.2,
          z: v.z
        };
        const pp = project(flarePoint, rotation);
        if (pp.z < -160) continue;

        const a = Math.max(0, Math.min(1, f.life));
        // Accumulate for an ambient "light spill" layer
        const w = a * a;
        ambX += pp.x * w;
        ambY += pp.y * w;
        ambR += f.r * w;
        ambG += f.g * w;
        ambB += f.b * w;
        ambW += w;
        ambPeak = Math.max(ambPeak, a);

        const radius = f.size * (0.55 + (1 - a) * 0.75) * pp.scale;
        const g = ctx.createRadialGradient(pp.x, pp.y, 0, pp.x, pp.y, radius * 3.2);
        g.addColorStop(0, `rgba(255, 255, 255, ${0.35 * a})`);
        g.addColorStop(0.15, `rgba(${f.r}, ${f.g}, ${f.b}, ${0.80 * a})`);
        g.addColorStop(0.55, `rgba(${f.r}, ${f.g}, ${f.b}, ${0.18 * a})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, radius * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }

      
      if (ambW > 0.0001) {
        const cx = ambX / ambW;
        const cy = ambY / ambW;
        const r = Math.round(ambR / ambW);
        const g = Math.round(ambG / ambW);
        const b = Math.round(ambB / ambW);
        const strength = 0.035 + Math.min(0.08, ambPeak * 0.07);

        const rad = Math.max(width, height) * (0.55 + ambPeak * 0.25);
        const spill = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        spill.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${strength})`);
        spill.addColorStop(0.35, `rgba(${r}, ${g}, ${b}, ${strength * 0.55})`);
        spill.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = spill;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.restore();

      
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.02)';
      ctx.lineWidth = 1;
      const scanOffset = (rotation * 180) % 18;
      for (let y = scanOffset; y < height; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();

    
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 3;
      });
    }, 100);

    
    const statusMessages = [
      'Initializing neural interface...',
      'Loading Stockwell Transform engine...',
      'Calibrating frequency analyzers...',
      'Preparing 3-channel acquisition...',
      'Optimizing power algorithms...',
      'Neural network ready...'
    ];
    
    let statusIndex = 0;
    const statusInterval = setInterval(() => {
      statusIndex = (statusIndex + 1) % statusMessages.length;
      setStatusText(statusMessages[statusIndex]);
    }, 700);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      clearInterval(progressInterval);
      clearInterval(statusInterval);
    };
  }, []);

  return (
    <div className="loading-screen">
      <canvas ref={canvasRef} className="brain-canvas" />
      
      <div className="loading-content">
        <div className="logo-container">
          <h1 className="project-title">
            <span className="title-project">PROJECT</span>
            <span className="title-neuro">NEURO</span>
          </h1>
          <p className="subtitle">Advanced Neural Signal Analysis</p>
        </div>
        
        <div className="loading-bar-container">
          <div className="loading-bar">
            <div className="loading-progress" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <span className="loading-percent">{Math.min(Math.round(progress), 100)}%</span>
        </div>
        
        <p className="status-text">{statusText}</p>
        
        <div className="tech-badges">
          <span className="badge">Stockwell Transform</span>
          <span className="badge">3-Channel EEG</span>
          <span className="badge">Real-Time DSP</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
