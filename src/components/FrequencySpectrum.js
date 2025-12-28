import React, { useRef, useEffect } from 'react';
import './FrequencySpectrum.css';

const FrequencySpectrum = ({ bandPowers, channel }) => {
  const canvasRef = useRef(null);

  const bands = [
    { key: 'delta', name: 'δ Delta', freq: '0.5-4 Hz', color: '#00d4ff' },
    { key: 'theta', name: 'θ Theta', freq: '4-8 Hz', color: '#aa00ff' },
    { key: 'alpha', name: 'α Alpha', freq: '8-13 Hz', color: '#00ff9d' },
    { key: 'beta', name: 'β Beta', freq: '13-30 Hz', color: '#ff0080' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 60;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    const barWidth = chartWidth / bands.length / 2;
    const spacing = chartWidth / bands.length;

    // Clear with dark background
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(100, 255, 218, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const y = padding + (chartHeight / 10) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw Y-axis labels (power %)
    ctx.fillStyle = '#64ffda';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
      const y = padding + (chartHeight / 10) * i;
      const value = 100 - (i * 10);
      ctx.fillText(value + '%', padding - 10, y + 4);
    }

    // Draw axes
    ctx.strokeStyle = '#64ffda';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw spectrum bars
    bands.forEach((band, index) => {
      const value = bandPowers[band.key];
      const barHeight = (value * chartHeight);
      const x = padding + spacing * index + spacing / 2 - barWidth / 2;
      const y = height - padding - barHeight;

      // Draw bar with glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = band.color;
      
      // Gradient fill
      const gradient = ctx.createLinearGradient(x, y, x, height - padding);
      gradient.addColorStop(0, band.color);
      gradient.addColorStop(1, band.color + '40');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);
      
      ctx.shadowBlur = 0;

      // Draw border
      ctx.strokeStyle = band.color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Draw frequency label
      ctx.fillStyle = '#8892b0';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(band.freq, x + barWidth / 2, height - padding + 20);

      // Draw band name
      ctx.fillStyle = band.color;
      ctx.font = 'bold 13px Arial';
      ctx.fillText(band.name, x + barWidth / 2, height - padding + 38);

      // Draw power value on top of bar
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Courier New';
      ctx.fillText((value * 100).toFixed(1) + '%', x + barWidth / 2, y - 8);
    });

    // Draw title
    ctx.fillStyle = '#00ff9d';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`POWER SPECTRAL DENSITY - Channel ${channel}`, width / 2, 25);

    // Draw Y-axis label
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#64ffda';
    ctx.font = '11px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Relative Power (%)', 0, 0);
    ctx.restore();

  }, [bandPowers]);

  return (
    <div className="frequency-spectrum">
      <canvas 
        ref={canvasRef} 
        width={900} 
        height={400}
        className="spectrum-canvas"
      />
      <div className="spectrum-info">
        <div className="info-item">
          <span className="label">Sampling Rate:</span>
          <span className="value">128 Hz</span>
        </div>
        <div className="info-item">
          <span className="label">Resolution:</span>
          <span className="value">Real-time FFT</span>
        </div>
        <div className="info-item">
          <span className="label">Window:</span>
          <span className="value">RMS Power</span>
        </div>
      </div>
    </div>
  );
};

export default FrequencySpectrum;
