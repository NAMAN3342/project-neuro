import React, { useRef, useEffect } from 'react';
import './DeepThinking.css';

const DeepThinking = ({ onBack }) => {
  const canvasRef = useRef(null);

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

    // Neural network nodes
    const nodes = [];
    for (let i = 0; i < 20; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: 2 + Math.random() * 3
      });
    }

    const animate = () => {
      time += 0.016;

      // Dark purple-tinted background
      ctx.fillStyle = '#0a0a12';
      ctx.fillRect(0, 0, width, height);

      // Move and draw nodes
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Draw connections
        nodes.forEach((other, j) => {
          if (i >= j) return;
          const dx = other.x - node.x;
          const dy = other.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200) {
            const alpha = (1 - dist / 200) * 0.15;
            ctx.strokeStyle = `rgba(155, 89, 182, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(155, 89, 182, ${0.3 + Math.sin(time + i) * 0.2})`;
        ctx.fill();
      });

      // Pulsing center glow
      const pulseSize = 150 + Math.sin(time) * 30;
      const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, pulseSize
      );
      gradient.addColorStop(0, 'rgba(155, 89, 182, 0.1)');
      gradient.addColorStop(1, 'rgba(155, 89, 182, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="deep-thinking">
      <canvas ref={canvasRef} className="dt-bg-canvas" />
      
      <div className="dt-content">
        <button className="dt-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back
        </button>

        <div className="dt-center">
          <div className="dt-icon">💭</div>
          <h1 className="dt-title">Deep Thinking</h1>
          <span className="dt-badge">COMING SOON</span>
          
          <div className="dt-description">
            <p>Advanced neural pattern analysis and cognitive state detection</p>
          </div>

          <div className="dt-features">
            <div className="feature-item">
              <span className="feature-icon">🔬</span>
              <span className="feature-text">Deep Pattern Analysis</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🧬</span>
              <span className="feature-text">Neural Fingerprinting</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span className="feature-text">Cognitive Load Metrics</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <span className="feature-text">Focus State Detection</span>
            </div>
          </div>

          <div className="dt-progress">
            <span className="progress-label">Development Progress</span>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '35%' }}></div>
            </div>
            <span className="progress-percent">35%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeepThinking;
