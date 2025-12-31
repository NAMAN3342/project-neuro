import React, { useRef, useEffect } from 'react';
import './StockwellSpectrogram.css';

const StockwellSpectrogram = ({ data, frequencies }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const spectrogramHistoryRef = useRef([]);
  const MAX_HISTORY = 100;

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

    const getColor = (value, max) => {
      const normalized = Math.min(1, Math.max(0, value / (max + 0.001)));
      const intensity = Math.pow(normalized, 0.5);
      
      if (intensity < 0.2) {
        const t = intensity / 0.2;
        return `rgb(${Math.floor(t * 50)}, 0, ${Math.floor(t * 100)})`;
      } else if (intensity < 0.4) {
        const t = (intensity - 0.2) / 0.2;
        return `rgb(${Math.floor(50 + t * 150)}, 0, ${Math.floor(100 + t * 55)})`;
      } else if (intensity < 0.6) {
        const t = (intensity - 0.4) / 0.2;
        return `rgb(${Math.floor(200 + t * 55)}, ${Math.floor(t * 100)}, ${Math.floor(155 - t * 155)})`;
      } else if (intensity < 0.8) {
        const t = (intensity - 0.6) / 0.2;
        return `rgb(255, ${Math.floor(100 + t * 155)}, 0)`;
      } else {
        const t = (intensity - 0.8) / 0.2;
        return `rgb(255, 255, ${Math.floor(t * 255)})`;
      }
    };

    const bandRanges = [
      { name: 'δ', min: 0.5, max: 4, color: '#ff6b6b' },
      { name: 'θ', min: 4, max: 8, color: '#ffd93d' },
      { name: 'α', min: 8, max: 13, color: '#6bcb77' },
      { name: 'β', min: 13, max: 30, color: '#4d96ff' },
      { name: 'γ', min: 30, max: 100, color: '#9b59b6' }
    ];

    const animate = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const spectrogramWidth = width - 60;
      const spectrogramHeight = height - 40;
      const startX = 50;
      const startY = 10;
      
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      if (data && data.spectrogram && data.spectrogram.length > 0) {
        const freqSpectrum = data.spectrogram.map(freqBin => {
          if (!freqBin || freqBin.length === 0) return 0;
          return freqBin.reduce((a, b) => a + b, 0) / freqBin.length;
        });
        
        spectrogramHistoryRef.current.push(freqSpectrum);
        if (spectrogramHistoryRef.current.length > MAX_HISTORY) {
          spectrogramHistoryRef.current.shift();
        }
      }

      const history = spectrogramHistoryRef.current;
      const freqs = data?.frequencies || frequencies || [];
      
      if (history.length > 0 && freqs.length > 0) {
        let maxVal = 0;
        history.forEach(slice => {
          slice.forEach(val => {
            if (val > maxVal) maxVal = val;
          });
        });

        const timeStep = spectrogramWidth / MAX_HISTORY;
        const freqStep = spectrogramHeight / freqs.length;

        history.forEach((slice, timeIdx) => {
          const x = startX + timeIdx * timeStep;
          
          slice.forEach((value, freqIdx) => {
            const y = startY + spectrogramHeight - (freqIdx + 1) * freqStep;
            
            ctx.fillStyle = getColor(value, maxVal);
            ctx.fillRect(x, y, timeStep + 1, freqStep + 1);
          });
        });

        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        
        const keyFreqs = [1, 4, 8, 13, 30, 50, 100];
        keyFreqs.forEach(freq => {
          const freqIdx = freqs.findIndex(f => f >= freq);
          if (freqIdx >= 0) {
            const y = startY + spectrogramHeight - (freqIdx / freqs.length) * spectrogramHeight;
            ctx.fillText(`${freq}Hz`, startX - 5, y + 3);
            
            ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            ctx.beginPath();
            ctx.moveTo(startX, y);
            ctx.lineTo(startX + spectrogramWidth, y);
            ctx.stroke();
          }
        });

        bandRanges.forEach(band => {
          const minIdx = freqs.findIndex(f => f >= band.min);
          const maxIdx = freqs.findIndex(f => f >= band.max);
          if (minIdx >= 0) {
            const yMin = startY + spectrogramHeight - (minIdx / freqs.length) * spectrogramHeight;
            const yMax = startY + spectrogramHeight - ((maxIdx >= 0 ? maxIdx : freqs.length) / freqs.length) * spectrogramHeight;
            const yMid = (yMin + yMax) / 2;
            
            ctx.fillStyle = band.color;
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(band.name, startX + spectrogramWidth + 5, yMid + 4);
            
            ctx.strokeStyle = band.color + '60';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(startX + spectrogramWidth + 2, yMax);
            ctx.lineTo(startX + spectrogramWidth + 2, yMin);
            ctx.stroke();
          }
        });

        ctx.fillStyle = '#444';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('← Time', startX + spectrogramWidth / 2, height - 5);

        ctx.save();
        ctx.translate(12, startY + spectrogramHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('Frequency (Hz)', 0, 0);
        ctx.restore();
      } else {
        ctx.fillStyle = '#333';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Waiting for Stockwell Transform data...', width / 2, height / 2);
      }

      const barWidth = 15;
      const barHeight = spectrogramHeight;
      const barX = width - 25;
      const barY = startY;
      
      for (let i = 0; i < barHeight; i++) {
        const value = 1 - (i / barHeight);
        ctx.fillStyle = getColor(value, 1);
        ctx.fillRect(barX, barY + i, barWidth, 1);
      }
      
      ctx.strokeStyle = '#333';
      ctx.strokeRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = '#666';
      ctx.font = '8px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('High', barX + barWidth + 2, barY + 8);
      ctx.fillText('Low', barX + barWidth + 2, barY + barHeight);

      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, frequencies]);

  return (
    <div className="stockwell-spectrogram">
      <canvas ref={canvasRef} className="spectrogram-canvas" />
    </div>
  );
};

export default StockwellSpectrogram;
