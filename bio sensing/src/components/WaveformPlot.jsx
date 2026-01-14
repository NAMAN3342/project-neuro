import { useRef, useEffect } from 'react';

/**
 * WaveformPlot - Real-time signal waveform visualization
 */
export default function WaveformPlot({ signalData, channelName, baseColor, width = 280, height = 60, isActive = false }) {
    const canvasRef = useRef(null);
    const dataBufferRef = useRef([]);
    const maxDataPoints = 150; // Number of points to display



    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Set canvas size accounting for device pixel ratio
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Add new data point to buffer only if active
        if (isActive && signalData !== undefined && signalData !== null) {
            dataBufferRef.current.push(signalData);

            // Keep only the last maxDataPoints
            if (dataBufferRef.current.length > maxDataPoints) {
                dataBufferRef.current.shift();
            }
        } else if (!isActive) {
            // Clear buffer when not active
            dataBufferRef.current = [];
        }

        // Clear canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;

        // Horizontal grid lines
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Draw waveform only if active and has data
        if (isActive && dataBufferRef.current.length > 1) {
            const stepX = width / (maxDataPoints - 1);
            const scaleY = height / 400; // Scale factor for signal amplitude
            const centerY = height / 2;

            // Use the fixed base color for the channel
            const waveColor = baseColor;

            ctx.strokeStyle = waveColor;
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Create gradient for glow effect
            const gradient = ctx.createLinearGradient(0, 0, width, 0);
            gradient.addColorStop(0, waveColor + '40');
            gradient.addColorStop(0.5, waveColor);
            gradient.addColorStop(1, waveColor + '40');

            ctx.beginPath();

            dataBufferRef.current.forEach((value, index) => {
                const x = index * stepX;
                const y = centerY - (value * scaleY);

                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });

            ctx.strokeStyle = gradient;
            ctx.stroke();

            // Add glow effect
            ctx.shadowBlur = 10;
            ctx.shadowColor = waveColor;
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else if (!isActive) {
            // Draw flat line at center when not active
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, height / 2);
            ctx.lineTo(width, height / 2);
            ctx.stroke();
        }

    }, [signalData, width, height, baseColor, isActive]);

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: `${width}px`,
                height: `${height}px`,
                borderRadius: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
        />
    );
}
