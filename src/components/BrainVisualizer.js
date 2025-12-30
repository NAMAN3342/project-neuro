import React, { useRef, useEffect } from 'react';
import './BrainVisualizer.css';

const BrainVisualizer = ({ channelData, selectedChannel }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    // Channel positions on brain (3D coordinates)
    const channelPositions = {
      ch1: { x: 0, y: -50, z: -60, label: 'O1/O2' },    // Occipital
      ch2: { x: 0, y: -30, z: 0, label: 'Pz' },          // Parietal
      ch3: { x: 0, y: 20, z: 50, label: 'Fp1/Fp2' }      // Frontal
    };

    // Generate brain mesh vertices
    const brainVertices = [];
    const latitudes = 15;
    const longitudes = 20;
    
    for (let lat = 0; lat <= latitudes; lat++) {
      const theta = (lat * Math.PI) / latitudes;
      for (let lon = 0; lon <= longitudes; lon++) {
        const phi = (lon * 2 * Math.PI) / longitudes;
        
        let r = 70;
        r += Math.sin(theta * 3) * 10;
        r += Math.sin(phi * 4) * 5;
        
        const x = r * Math.sin(theta) * Math.cos(phi);
        const y = r * Math.cos(theta);
        const z = r * Math.sin(theta) * Math.sin(phi);
        
        brainVertices.push({ x, y, z });
      }
    }

    const project = (point, rotation, cx, cy) => {
      const cosY = Math.cos(rotation);
      const sinY = Math.sin(rotation);
      let x = point.x * cosY - point.z * sinY;
      let z = point.x * sinY + point.z * cosY;
      
      const cosX = Math.cos(0.2);
      const sinX = Math.sin(0.2);
      let y = point.y * cosX - z * sinX;
      z = point.y * sinX + z * cosX;
      
      const perspective = 300;
      const scale = perspective / (perspective + z);
      
      return {
        x: cx + x * scale,
        y: cy + y * scale,
        scale,
        z
      };
    };

    const getChannelColor = (ch) => {
      const data = channelData[ch];
      if (!data) return '#333';
      
      // Color based on dominant band
      const bands = [
        { val: data.delta, color: '#ff6b6b' },
        { val: data.theta, color: '#ffd93d' },
        { val: data.alpha, color: '#6bcb77' },
        { val: data.beta, color: '#4d96ff' },
        { val: data.gamma, color: '#9b59b6' }
      ];
      
      return bands.reduce((a, b) => a.val > b.val ? a : b).color;
    };

    const getChannelIntensity = (ch) => {
      const data = channelData[ch];
      if (!data) return 0;
      return Math.max(data.delta, data.theta, data.alpha, data.beta, data.gamma) / 100;
    };

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const cx = width / 2;
      const cy = height / 2;
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      rotationRef.current += 0.005;
      const rotation = rotationRef.current;
      
      // Draw brain wireframe
      ctx.strokeStyle = 'rgba(100, 100, 100, 0.15)';
      ctx.lineWidth = 0.5;
      
      for (let lat = 0; lat < latitudes; lat++) {
        for (let lon = 0; lon < longitudes; lon++) {
          const i = lat * (longitudes + 1) + lon;
          const p1 = project(brainVertices[i], rotation, cx, cy);
          const p2 = project(brainVertices[i + 1], rotation, cx, cy);
          const p3 = project(brainVertices[i + longitudes + 1], rotation, cx, cy);
          
          if (p1.z > -50) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.stroke();
          }
        }
      }
      
      // Draw channel markers
      Object.entries(channelPositions).forEach(([ch, pos]) => {
        const p = project(pos, rotation, cx, cy);
        const color = getChannelColor(ch);
        const intensity = getChannelIntensity(ch);
        const isSelected = ch === `ch${selectedChannel}`;
        const baseRadius = isSelected ? 15 : 10;
        const pulseRadius = baseRadius + intensity * 20;
        
        // Glow effect
        if (p.z > -30) {
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulseRadius * 2);
          gradient.addColorStop(0, color + '60');
          gradient.addColorStop(0.5, color + '20');
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, pulseRadius * 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Main marker
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, baseRadius * p.scale, 0, Math.PI * 2);
          ctx.fill();
          
          // Selection ring
          if (isSelected) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, baseRadius * p.scale + 5, 0, Math.PI * 2);
            ctx.stroke();
          }
          
          // Label
          ctx.fillStyle = '#fff';
          ctx.font = '10px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(pos.label, p.x, p.y + baseRadius + 15);
        }
      });
      
      // Draw connections between channels
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.2)';
      ctx.lineWidth = 1;
      const positions = Object.values(channelPositions);
      
      for (let i = 0; i < positions.length - 1; i++) {
        const p1 = project(positions[i], rotation, cx, cy);
        const p2 = project(positions[i + 1], rotation, cx, cy);
        
        if (p1.z > -30 && p2.z > -30) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [channelData, selectedChannel]);

  return (
    <div className="brain-visualizer">
      <canvas ref={canvasRef} className="brain-canvas" />
    </div>
  );
};

export default BrainVisualizer;
