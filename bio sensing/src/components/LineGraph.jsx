import { useRef, useEffect } from 'react';

/**
 * LineGraph - Scrolling real-time line graph
 */
export default function LineGraph({ title, data = [], color = 'rgb(0, 255, 200)', height = 150 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        // Set canvas size
        const width = canvas.parentElement.clientWidth - 20;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = 'rgba(40, 45, 55, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw data
        if (data.length < 2) return;

        const xStep = width / (data.length - 1);
        const yCenter = height / 2;
        const yScale = height / 2.5;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        data.forEach((value, i) => {
            const x = i * xStep;
            const y = yCenter - (value * yScale);

            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

    }, [data, color, height]);

    return (
        <div style={{ padding: '10px 0' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>
    );
}
