import React, { useRef, useEffect } from 'react';
import './CombinedWaveform.css';

const CombinedWaveform = ({ channelData, electrodePairs }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  const channels = [
    { key: 'ch1', color: '#ff6b6b', name: 'FP1-FP2' },
    { key: 'ch2', color: '#4d96ff', name: 'C3-C4' },
    { key: 'ch3', color: '#6bcb77', name: 'O1-O2' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // Fixed size for performance
    canvas.width = 500;
    canvas.height = 200;
    const width = canvas.width;
    const height = canvas.height;

    const animate = () => {

      // Background
      ctx.fillStyle = 'rgba(5, 2, 15, 0.95)';
      ctx.fillRect(0, 0, width, height);

      const padding = { top: 25, bottom: 20, left: 70, right: 20 };
      const plotWidth = width - padding.left - padding.right;
      const plotHeight = height - padding.top - padding.bottom;
      const channelHeight = plotHeight / 3;

      // Draw each channel
      channels.forEach((channel, idx) => {
        const data = channelData[channel.key]?.raw || [];
        const yCenter = padding.top + channelHeight * idx + channelHeight / 2;
        const yTop = padding.top + channelHeight * idx;

        // Channel separator line
        if (idx > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(padding.left, yTop);
          ctx.lineTo(width - padding.right, yTop);
          ctx.stroke();
        }

        // Channel label background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(5, yCenter - 20, 60, 40);
        ctx.strokeStyle = channel.color + '66';
        ctx.lineWidth = 1;
        ctx.strokeRect(5, yCenter - 20, 60, 40);

        // Channel name
        ctx.fillStyle = channel.color;
        ctx.font = 'bold 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(channel.name, 35, yCenter - 6);
        
        // Region label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '9px "Inter", sans-serif';
        ctx.fillText(electrodePairs[channel.key]?.region || '', 35, yCenter + 8);

        // Center line (zero baseline)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, yCenter);
        ctx.lineTo(width - padding.right, yCenter);
        ctx.stroke();
        ctx.setLineDash([]);

        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 4; i++) {
          const yOffset = (channelHeight / 5) * i;
          ctx.beginPath();
          ctx.moveTo(padding.left, yTop + yOffset);
          ctx.lineTo(width - padding.right, yTop + yOffset);
          ctx.stroke();
        }

        // Draw waveform
        if (data.length > 1) {
          // Main line only (no glow for performance)
          ctx.strokeStyle = channel.color;
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();

          const step = plotWidth / Math.min(data.length - 1, 256);
          const amplitude = channelHeight * 0.35;
          const skipFactor = Math.max(1, Math.floor(data.length / 256));

          for (let i = 0; i < data.length; i += skipFactor) {
            const x = padding.left + (i / data.length) * plotWidth;
            const normalized = ((data[i] - 512) / 512) * amplitude;
            const y = yCenter - normalized;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }

        // Scale markers
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('+', padding.left - 5, yTop + 10);
        ctx.fillText('0', padding.left - 5, yCenter);
        ctx.fillText('-', padding.left - 5, yTop + channelHeight - 10);
      });

      // Time axis
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, height - padding.bottom);
      ctx.lineTo(width - padding.right, height - padding.bottom);
      ctx.stroke();

      // Time labels
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '9px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('0s', padding.left, height - 5);
      ctx.fillText('~1s', width - padding.right, height - 5);
      ctx.fillText('Time →', width / 2, height - 5);

      // Border
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(padding.left, padding.top, plotWidth, plotHeight);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [channelData, electrodePairs, channels]);

  return (
    <div className="combined-waveform">
      <canvas ref={canvasRef} className="waveform-canvas" />
    </div>
  );
};

export default CombinedWaveform;
