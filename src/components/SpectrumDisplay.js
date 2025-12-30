import React, { useRef, useEffect } from 'react';
import './SpectrumDisplay.css';

const SpectrumDisplay = ({ data }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const valuesRef = useRef({ delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 });

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

    const bands = [
      { name: 'δ', key: 'delta', color: '#ff6b6b', freq: '0.5-4 Hz' },
      { name: 'θ', key: 'theta', color: '#ffd93d', freq: '4-8 Hz' },
      { name: 'α', key: 'alpha', color: '#6bcb77', freq: '8-13 Hz' },
      { name: 'β', key: 'beta', color: '#4d96ff', freq: '13-30 Hz' },
      { name: 'γ', key: 'gamma', color: '#9b59b6', freq: '30-100 Hz' }
    ];

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);
      
      // Smooth value transitions
      bands.forEach(band => {
        const target = data[band.key] || 0;
        valuesRef.current[band.key] += (target - valuesRef.current[band.key]) * 0.15;
      });
      
      const barWidth = (width - 60) / bands.length - 20;
      const maxHeight = height - 80;
      
      bands.forEach((band, i) => {
        const x = 30 + i * (barWidth + 20);
        const value = valuesRef.current[band.key];
        const barHeight = (value / 100) * maxHeight;
        const y = height - 50 - barHeight;
        
        // Glow effect
        const gradient = ctx.createLinearGradient(x, y, x, height - 50);
        gradient.addColorStop(0, band.color);
        gradient.addColorStop(1, band.color + '20');
        
        // Shadow/glow
        ctx.shadowColor = band.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = gradient;
        
        // Draw bar with rounded top
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [8, 8, 0, 0]);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Value label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(value)}%`, x + barWidth / 2, y - 10);
        
        // Name label
        ctx.fillStyle = band.color;
        ctx.font = '16px sans-serif';
        ctx.fillText(band.name, x + barWidth / 2, height - 25);
        
        // Freq label
        ctx.fillStyle = '#666';
        ctx.font = '10px sans-serif';
        ctx.fillText(band.freq, x + barWidth / 2, height - 10);
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data]);

  return (
    <div className="spectrum-display">
      <canvas ref={canvasRef} className="spectrum-canvas" />
    </div>
  );
};

export default SpectrumDisplay;
