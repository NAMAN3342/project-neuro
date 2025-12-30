import React, { useEffect, useRef, useState } from 'react';
import './LoadingScreen.css';

const LoadingScreen = () => {
  const canvasRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing neural interface...');

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let rotation = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 3D Brain wireframe vertices (simplified brain shape)
    const brainVertices = [];
    const brainEdges = [];
    
    // Generate brain-like sphere with irregularities
    const generateBrain = () => {
      const latitudes = 20;
      const longitudes = 30;
      
      for (let lat = 0; lat <= latitudes; lat++) {
        const theta = (lat * Math.PI) / latitudes;
        for (let lon = 0; lon <= longitudes; lon++) {
          const phi = (lon * 2 * Math.PI) / longitudes;
          
          // Brain-like deformation
          let r = 150;
          r += Math.sin(theta * 3) * 20; // Vertical waves
          r += Math.sin(phi * 5) * 10; // Horizontal folds (gyri)
          r += Math.cos(theta * 2 + phi * 3) * 15; // Asymmetry
          
          // Frontal lobe bulge
          if (theta > Math.PI * 0.3 && theta < Math.PI * 0.7 && phi > Math.PI * 0.8 && phi < Math.PI * 1.2) {
            r += 20;
          }
          
          const x = r * Math.sin(theta) * Math.cos(phi);
          const y = r * Math.cos(theta);
          const z = r * Math.sin(theta) * Math.sin(phi);
          
          brainVertices.push({ x, y, z });
        }
      }
      
      // Create edges for wireframe
      for (let lat = 0; lat < latitudes; lat++) {
        for (let lon = 0; lon < longitudes; lon++) {
          const i = lat * (longitudes + 1) + lon;
          brainEdges.push([i, i + 1]);
          brainEdges.push([i, i + longitudes + 1]);
        }
      }
    };
    
    generateBrain();

    // Neural activity particles
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

    // Project 3D to 2D
    const project = (point, rotation) => {
      // Rotate around Y axis
      const cosY = Math.cos(rotation);
      const sinY = Math.sin(rotation);
      let x = point.x * cosY - point.z * sinY;
      let z = point.x * sinY + point.z * cosY;
      
      // Rotate around X axis (slight tilt)
      const cosX = Math.cos(0.3);
      const sinX = Math.sin(0.3);
      let y = point.y * cosX - z * sinX;
      z = point.y * sinX + z * cosX;
      
      // Perspective projection
      const perspective = 500;
      const scale = perspective / (perspective + z);
      
      return {
        x: canvas.width / 2 + x * scale,
        y: canvas.height / 2 + y * scale,
        scale,
        z
      };
    };

    const animate = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      rotation += 0.01;
      
      // Draw brain wireframe
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.3)';
      ctx.lineWidth = 0.5;
      
      brainEdges.forEach(([i, j]) => {
        if (i < brainVertices.length && j < brainVertices.length) {
          const p1 = project(brainVertices[i], rotation);
          const p2 = project(brainVertices[j], rotation);
          
          // Only draw front-facing edges
          if (p1.z > -100 && p2.z > -100) {
            const alpha = Math.min(1, (p1.z + 200) / 300) * 0.5;
            ctx.strokeStyle = `rgba(0, 255, 157, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });
      
      // Draw neural activity particles
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
        ctx.fillStyle = `rgba(0, 200, 255, ${p.life * 0.8})`;
        ctx.fill();
        
        // Glow effect
        const gradient = ctx.createRadialGradient(proj.x, proj.y, 0, proj.x, proj.y, size * 3);
        gradient.addColorStop(0, `rgba(0, 200, 255, ${p.life * 0.5})`);
        gradient.addColorStop(1, 'rgba(0, 200, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, size * 3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw synaptic connections
      ctx.strokeStyle = 'rgba(255, 100, 200, 0.2)';
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
            ctx.strokeStyle = `rgba(255, 100, 200, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 3;
      });
    }, 100);

    // Status text updates
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
