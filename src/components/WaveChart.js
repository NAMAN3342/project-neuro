import React, { useRef, useEffect } from 'react';
import './WaveChart.css';

const WaveChart = ({ history, channel }) => {
  const canvasRef = useRef(null);

  const bands = [
    { key: 'delta', color: '#00d4ff', name: 'δ Delta' },
    { key: 'theta', color: '#aa00ff', name: 'θ Theta' },
    { key: 'alpha', color: '#00ff9d', name: 'α Alpha' },
    { key: 'beta', color: '#ff0080', name: 'β Beta' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'rgba(100, 255, 218, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal lines
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let i = 0; i <= 10; i++) {
      const x = (width / 10) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw each band
    bands.forEach(band => {
      const data = history[band.key];
      if (data.length < 2) return;

      ctx.strokeStyle = band.color;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = band.color;
      ctx.beginPath();

      data.forEach((value, index) => {
        const x = (index / Math.max(data.length - 1, 1)) * width;
        const y = height - (value * height);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Draw labels
    ctx.fillStyle = '#64ffda';
    ctx.font = '11px Courier New';
    ctx.fillText('0%', 5, height - 5);
    ctx.fillText('100%', 5, 15);

  }, [history]);

  return (
    <div className="wave-chart">
      <h2>Time Series - Channel {channel}</h2>
      <div className="chart-legend">
        {bands.map(band => (
          <div key={band.key} className="legend-item">
            <div className="legend-color" style={{ background: band.color }}></div>
            <span>{band.name}</span>
          </div>
        ))}
      </div>
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={300}
        className="chart-canvas"
      />
      <div className="chart-info">
        Real-time visualization of EEG band powers over time
      </div>
    </div>
  );
};

export default WaveChart;
