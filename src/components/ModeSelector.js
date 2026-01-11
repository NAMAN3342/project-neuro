import React, { useRef, useEffect, useState } from 'react';
import './ModeSelector.css';

// Accept either onSelectMode or setMode for backward compatibility
const ModeSelector = ({ onSelectMode, setMode, mode }) => {
  const canvasRef = useRef(null);
  const [hoveredMode, setHoveredMode] = useState(null);
  const [entityReady, setEntityReady] = useState(false);

  // Sound effect
  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type === 'hover' ? 'sine' : 'square';
      osc.frequency.value = type === 'hover' ? 100 : 60;
      gain.gain.value = 0.05;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch(e) {}
  };

  useEffect(() => {
    // Delay entity appearance for dramatic effect
    const timer = setTimeout(() => setEntityReady(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', resize);

    let time = 0;
    let animationId;

    // Rain system
    const raindrops = [];
    for (let i = 0; i < 300; i++) {
      raindrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speed: 10 + Math.random() * 15,
        length: 15 + Math.random() * 25,
        alpha: 0.1 + Math.random() * 0.2
      });
    }

    // Fog/mist particles
    const fogParticles = [];
    for (let i = 0; i < 40; i++) {
      fogParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 150 + Math.random() * 250,
        speed: 0.3 + Math.random() * 0.4,
        alpha: 0.015 + Math.random() * 0.02
      });
    }

    // Entity tentacles
    const tentacles = [];
    for (let i = 0; i < 12; i++) {
      const side = i < 6 ? -1 : 1;
      tentacles.push({
        baseX: width / 2 + side * (50 + Math.random() * 80),
        baseY: height * 0.85,
        segments: 15,
        phase: Math.random() * Math.PI * 2,
        amplitude: 40 + Math.random() * 50,
        thickness: 12 - (i % 6) * 1.5,
        reachTarget: i < 3 ? 'left' : i < 6 ? 'center' : i < 9 ? 'right' : 'down'
      });
    }

    // Floating hologram positions
    const hologramPositions = {
      left: { x: width * 0.2, y: height * 0.35 },
      center: { x: width * 0.5, y: height * 0.25 },
      right: { x: width * 0.8, y: height * 0.35 }
    };

    // Glowing brain pulses
    let brainPulse = 0;

    const animate = () => {
      time += 0.016;
      brainPulse = (Math.sin(time * 2) + 1) / 2;

      // Dark background
      ctx.fillStyle = '#030305';
      ctx.fillRect(0, 0, width, height);

      // Cyan fog
      fogParticles.forEach(p => {
        p.x += p.speed;
        if (p.x > width + p.size) {
          p.x = -p.size;
          p.y = Math.random() * height;
        }
        const fogGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        fogGrad.addColorStop(0, `rgba(0, 50, 60, ${p.alpha})`);
        fogGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = fogGrad;
        ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      });

      // Cyan rain
      ctx.lineWidth = 1;
      raindrops.forEach(drop => {
        drop.y += drop.speed;
        if (drop.y > height) {
          drop.y = -drop.length;
          drop.x = Math.random() * width;
        }
        ctx.strokeStyle = `rgba(0, 255, 200, ${drop.alpha})`;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();
      });

      // Vignette
      const vignetteGrad = ctx.createRadialGradient(
        width / 2, height * 0.6, height * 0.1,
        width / 2, height * 0.6, height * 0.9
      );
      vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGrad.addColorStop(0.4, 'rgba(0, 0, 0, 0.3)');
      vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, width, height);

      // Entity body with subtle glow
      const entityCenterX = width / 2;
      const entityCenterY = height * 0.75;

      // Entity aura glow
      const entityAura = ctx.createRadialGradient(
        entityCenterX, entityCenterY, 0,
        entityCenterX, entityCenterY, 300
      );
      entityAura.addColorStop(0, 'rgba(0, 255, 200, 0.08)');
      entityAura.addColorStop(0.5, 'rgba(100, 50, 150, 0.05)');
      entityAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = entityAura;
      ctx.fillRect(0, 0, width, height);

      // Draw tentacles reaching towards hologram cards
      tentacles.forEach((t, ti) => {
        const targetPos = hologramPositions[t.reachTarget] || { x: t.baseX, y: height };
        
        ctx.beginPath();
        ctx.moveTo(t.baseX, t.baseY);

        for (let s = 1; s <= t.segments; s++) {
          const progress = s / t.segments;
          const targetX = t.baseX + (targetPos.x - t.baseX) * progress * 0.7;
          const targetY = t.baseY + (targetPos.y - t.baseY) * progress * 0.5;
          const wave = Math.sin(time * 1.5 + t.phase + s * 0.3) * t.amplitude * (1 - progress * 0.7);
          
          ctx.lineTo(targetX + wave, targetY);
        }

        // Tentacle body
        ctx.strokeStyle = 'rgba(20, 10, 40, 0.95)';
        ctx.lineWidth = t.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        
        // Tentacle highlight
        ctx.strokeStyle = 'rgba(0, 200, 150, 0.15)';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Entity head/core
      ctx.beginPath();
      ctx.ellipse(entityCenterX, entityCenterY - 50, 100, 130, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10, 5, 20, 0.98)';
      ctx.fill();

      // Entity glowing eyes
      const eyeGlowIntensity = 0.5 + brainPulse * 0.5;
      [-35, 35].forEach(offsetX => {
        // Eye glow aura
        const eyeAura = ctx.createRadialGradient(
          entityCenterX + offsetX, entityCenterY - 80, 0,
          entityCenterX + offsetX, entityCenterY - 80, 30
        );
        eyeAura.addColorStop(0, `rgba(0, 255, 200, ${eyeGlowIntensity * 0.6})`);
        eyeAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = eyeAura;
        ctx.fillRect(entityCenterX + offsetX - 40, entityCenterY - 120, 80, 80);
        
        // Eye core
        ctx.beginPath();
        ctx.ellipse(entityCenterX + offsetX, entityCenterY - 80, 8, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 200, ${eyeGlowIntensity})`;
        ctx.fill();
      });

      // Hologram glow when hovered
      Object.entries(hologramPositions).forEach(([key, pos]) => {
        const isHovered = hoveredMode === key || 
                         (key === 'left' && hoveredMode === 'neural') ||
                         (key === 'center' && hoveredMode === 'game') ||
                         (key === 'right' && hoveredMode === 'deep');
        
        if (isHovered) {
          const holoGlow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 180);
          holoGlow.addColorStop(0, 'rgba(0, 255, 200, 0.1)');
          holoGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = holoGlow;
          ctx.fillRect(pos.x - 200, pos.y - 200, 400, 400);
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, [hoveredMode]);

  const modes = [
    {
      id: 'neural',
      position: 'left',
      title: 'Neural',
      subtitle: 'Brain Monitor',
      description: 'EEG patterns & frequency',
      icon: '🧠',
      brainGlow: true,
      color: '#00ffc8',
      available: true
    },
    {
      id: 'game',
      position: 'center',
      title: 'Game',
      subtitle: 'BCI Control',
      description: 'Neural game commands',
      icon: '🎮',
      brainGlow: false,
      color: '#ff6b6b',
      available: true
    },
    {
      id: 'deep',
      position: 'right',
      title: 'Deep',
      subtitle: 'Analysis',
      description: 'Advanced patterns',
      icon: '💭',
      brainGlow: false,
      color: '#9b59b6',
      available: false
    }
  ];

  return (
    <div className="mode-selector entity-theme">
      <canvas ref={canvasRef} className="mode-bg-canvas" />
      
      <div className={`mode-content ${entityReady ? 'visible' : ''}`}>
        {/* Title */}
        <div className="entity-title">
          <span className="title-whisper">choose your interface</span>
          <h1 className="title-main glitch" data-text="PROJECT NEURO">PROJECT NEURO</h1>
        </div>

        {/* Holographic Cards */}
        <div className="hologram-cards">
          {modes.map((modeItem) => (
            <div
              key={modeItem.id}
              className={`hologram-card ${modeItem.position} ${!modeItem.available ? 'locked' : ''} ${hoveredMode === modeItem.id ? 'hovered' : ''}`}
              style={{ '--card-color': modeItem.color }}
              onMouseEnter={() => { setHoveredMode(modeItem.id); playSound('hover'); }}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => {
                if (!modeItem.available) return;
                playSound('select');
                const handler = typeof onSelectMode === 'function' ? onSelectMode : setMode;
                if (typeof handler === 'function') {
                  handler(modeItem.id);
                }
              }}
            >
              <div className="card-frame">
                <div className="frame-corner tl"></div>
                <div className="frame-corner tr"></div>
                <div className="frame-corner bl"></div>
                <div className="frame-corner br"></div>
              </div>
              
              <div className="card-content">
                <div className={`card-icon ${modeItem.brainGlow ? 'brain-pulse' : ''}`}>
                  {modeItem.icon}
                </div>
                <h2 className="card-title">{modeItem.title}</h2>
                <span className="card-subtitle">{modeItem.subtitle}</span>
                <p className="card-desc">{modeItem.description}</p>
                
                {modeItem.available ? (
                  <div className="card-action">
                    <span>INTERFACE</span>
                    <div className="action-line"></div>
                  </div>
                ) : (
                  <div className="card-locked">
                    <span>🔒 LOCKED</span>
                  </div>
                )}
              </div>

              <div className="card-glow"></div>
              <div className="card-scanline"></div>
            </div>
          ))}
        </div>

        {/* Entity instruction */}
        <div className="entity-instruction">
          <span className="instruction-text">「 SELECT YOUR PATH 」</span>
        </div>
      </div>

      {/* Ambient overlay */}
      <div className="ambient-overlay"></div>
    </div>
  );
};

export default ModeSelector;
