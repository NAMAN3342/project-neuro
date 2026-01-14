import React, { useRef, useEffect, useMemo, useState } from 'react';
import {
    Palette,
    Layers,
    Activity,
    Scan
} from 'lucide-react';

// --- MATH & LOGIC ---

// Heat Source Accumulator
class HeatMapInterpolator {
    constructor(resolution = 64) {
        this.resolution = resolution;
        // Sensor positions: T1=TL, T2=TR, T3=BL, T4=BR, T5=Bottom-Center
        this.sensorCoords = [
            [-0.5, -0.5],   // T1
            [0.5, -0.5],    // T2
            [-0.5, 0.1],   // T3 (Moved up from 0.5)
            [0.5, 0.1],    // T4 (Moved up from 0.5)
            [0.0, 0.65]     // T5
        ];
    }

    getSensorCoords() { return this.sensorCoords; }

    interpolate(temperatures) {
        const res = this.resolution;
        const grid = Array(res).fill(null).map(() => Array(res).fill(null));
        const ambientTemp = 25.0; // Base room temperature

        const validData = temperatures
            .map((temp, i) => ({ temp, coord: this.sensorCoords[i] }))
            .filter(d => d.temp !== null);

        if (validData.length === 0) return null;

        for (let y = 0; y < res; y++) {
            for (let x = 0; x < res; x++) {
                const nx = (x / (res - 1)) * 2 - 1;
                const ny = (y / (res - 1)) * 2 - 1;

                // Start with ambient temp
                let tempValue = ambientTemp;

                validData.forEach(({ temp, coord }) => {
                    const dx = nx - coord[0];
                    const dy = ny - coord[1];
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Tighter Gaussian for "Spot" effect
                    const sigma = 0.25;
                    const weight = Math.exp(-(dist * dist) / (2 * sigma * sigma));

                    // Add the heat contribution of this sensor (relative to ambient)
                    tempValue += (temp - ambientTemp) * weight;
                });

                grid[y][x] = tempValue;
            }
        }
        return grid;
    }
}

// Color Palette Logic
function getColorForPalette(norm, palette) {
    if (palette === 'ironbow') {
        if (norm < 0.2) return [0, 0, Math.floor(128 * (norm / 0.2))]; // Black to Blue
        if (norm < 0.4) return [Math.floor(128 * ((norm - 0.2) / 0.2)), 0, 128]; // Blue to Purple
        if (norm < 0.6) {
            const t = (norm - 0.4) / 0.2;
            return [128 + Math.floor(127 * t), Math.floor(165 * t), Math.floor(128 * (1 - t))]; // Purple to Orange
        }
        if (norm < 0.8) {
            const t = (norm - 0.6) / 0.2;
            return [255, 165 + Math.floor(90 * t), 0]; // Orange to Yellow
        }
        const t = (norm - 0.8) / 0.2;
        return [255, 255, Math.floor(255 * t)]; // Yellow to White
    }

    if (palette === 'cool') {
        // Simple distinct blue-cyan gradient
        const r = Math.floor(50 * norm);
        const g = Math.floor(255 * norm);
        const b = 255 - Math.floor(100 * norm);
        return [r, g, b];
    }

    // Thermal (Rainbow)
    if (norm < 0.25) return [0, Math.floor(255 * (norm / 0.25)), 255];
    if (norm < 0.5) return [0, 255, Math.floor(255 * (1 - (norm - 0.25) / 0.25))];
    if (norm < 0.75) return [Math.floor(255 * ((norm - 0.5) / 0.25)), 255, 0];
    return [255, Math.floor(255 * (1 - (norm - 0.75) / 0.25)), 0];
}

function getPaletteGradient(palette) {
    if (palette === 'ironbow') return 'linear-gradient(to right, #000000, #000080, #800080, #FFA500, #FFFF00, #FFFFFF)';
    if (palette === 'cool') return 'linear-gradient(to right, #0000FF, #00FFFF, #E0FFFF)';
    return 'linear-gradient(to right, #0000FF, #00FF00, #FFFF00, #FF0000)';
}

function drawContours(ctx, grid, cx, cy, radius) {
    const res = grid.length;
    // Expanded levels for better visibility across ranges
    const levels = [28, 30, 32, 34, 36, 38, 40, 42, 44];

    // Marching squares lookup (Top:0, Right:1, Bottom:2, Left:3)
    const cases = [
        [],             // 0
        [3, 2],         // 1: BL
        [2, 1],         // 2: BR
        [3, 1],         // 3: BL & BR
        [1, 0],         // 4: TR
        [3, 0, 1, 2],   // 5: BL & TR (Saddle)
        [0, 2],         // 6: TR & BR
        [3, 0],         // 7: All except TL
        [0, 3],         // 8: TL
        [0, 2],         // 9: TL & BL
        [3, 2, 0, 1],   // 10: TL & BR (Saddle)
        [0, 1],         // 11: All except TR
        [1, 3],         // 12: TL & TR
        [1, 2],         // 13: All except BR
        [3, 2],         // 14: All except BL
        []              // 15
    ];

    levels.forEach((level, lIdx) => {
        // Alternating opacity for "major/minor" line feel
        ctx.strokeStyle = lIdx % 2 === 0 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        for (let y = 0; y < res - 1; y++) {
            for (let x = 0; x < res - 1; x++) {
                const vTL = grid[y][x] || 0;
                const vTR = grid[y][x + 1] || 0;
                const vBR = grid[y + 1][x + 1] || 0;
                const vBL = grid[y + 1][x] || 0;

                let type = 0;
                if (vBL >= level) type |= 1;
                if (vBR >= level) type |= 2;
                if (vTR >= level) type |= 4;
                if (vTL >= level) type |= 8;

                if (type === 0 || type === 15) continue;

                const edges = cases[type];
                for (let i = 0; i < edges.length; i += 2) {
                    const p1 = getIsoPoint(edges[i], x, y, level, vTL, vTR, vBR, vBL, res, cx, cy, radius);
                    const p2 = getIsoPoint(edges[i + 1], x, y, level, vTL, vTR, vBR, vBL, res, cx, cy, radius);

                    if (p1 && p2) {
                        ctx.moveTo(p1.x, p1.y);
                        ctx.lineTo(p2.x, p2.y);
                    }
                }
            }
        }
        ctx.stroke();
    });
}

function getIsoPoint(edge, x, y, level, vTL, vTR, vBR, vBL, res, cx, cy, radius) {
    let x1, y1, v1, x2, y2, v2;

    switch (edge) {
        case 0: // Top
            x1 = x; y1 = y; v1 = vTL;
            x2 = x + 1; y2 = y; v2 = vTR;
            break;
        case 1: // Right
            x1 = x + 1; y1 = y; v1 = vTR;
            x2 = x + 1; y2 = y + 1; v2 = vBR;
            break;
        case 2: // Bottom
            x1 = x + 1; y1 = y + 1; v1 = vBR;
            x2 = x; y2 = y + 1; v2 = vBL;
            break;
        case 3: // Left
            x1 = x; y1 = y + 1; v1 = vBL;
            x2 = x; y2 = y; v2 = vTL;
            break;
        default: return null;
    }

    if (v1 === v2) return null;
    const t = (level - v1) / (v2 - v1);

    // Interpolated Grid Coords
    const gx = x1 + (x2 - x1) * t;
    const gy = y1 + (y2 - y1) * t;

    // To Screen Coords
    const nx = (gx / (res - 1)) * 2 - 1;
    const ny = (gy / (res - 1)) * 2 - 1;
    const px = cx + nx * radius;
    const py = cy + ny * radius;

    // Circular Clipping
    const distSq = (px - cx) ** 2 + (py - cy) ** 2;
    if (distSq > radius ** 2) return null;

    return { x: px, y: py };
}

// --- MAIN COMPONENT ---

export default function HeatmapCanvas({ temperatures, width = 400, height = 400 }) {
    const canvasRef = useRef(null);
    const gridDataRef = useRef(null);

    // Internal state
    const [options, setOptions] = useState({ palette: 'ironbow', showContours: true });
    const [stats, setStats] = useState({ min: 0, max: 0, avg: 0 });
    const [clickedPoint, setClickedPoint] = useState(null);

    // Interpolator instance
    const interpolator = useMemo(() => new HeatMapInterpolator(80), []);

    // Calculate stats and render canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const dpr = 1; // Assuming 1 for simplicity, can use window.devicePixelRatio

        if (canvas.width !== width * dpr) {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        }

        ctx.clearRect(0, 0, width, height);

        // Extract values from prop (checking valid range)
        const temps = [
            temperatures?.t1 > 0 ? temperatures.t1 : null,
            temperatures?.t2 > 0 ? temperatures.t2 : null,
            temperatures?.t3 > 0 ? temperatures.t3 : null,
            temperatures?.t4 > 0 ? temperatures.t4 : null,
            temperatures?.t5 > 0 ? temperatures.t5 : null,
        ];

        const validTemps = temps.filter(t => t !== null);

        // Update stats
        if (validTemps.length > 0) {
            const min = Math.min(...validTemps);
            const max = Math.max(...validTemps);
            const avg = validTemps.reduce((a, b) => a + b, 0) / validTemps.length;
            setStats({ min, max, avg });
        } else {
            setStats({ min: 0, max: 0, avg: 0 });
        }

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 10;

        // Perform interpolation
        // Pass "temps" where nulls are preserved so interpolator knows which sensor is missing
        // The Interpolator logic below expects an array matching sensorCoords indices.
        // It filters nulls internally.
        const grid = interpolator.interpolate(temps);
        gridDataRef.current = grid;

        if (grid && validTemps.length > 0) {
            const res = grid.length;
            const imageData = ctx.createImageData(width, height);
            const data = imageData.data;

            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const dx = x - centerX;
                    const dy = y - centerY;

                    if (dx * dx + dy * dy > radius * radius) continue;

                    const nx = dx / radius;
                    const ny = dy / radius;

                    const gx = Math.floor(((nx + 1) / 2) * res);
                    const gy = Math.floor(((ny + 1) / 2) * res);

                    if (gx >= 0 && gx < res && gy >= 0 && gy < res) {
                        const temp = grid[gy][gx];
                        if (temp !== null) {
                            // Normalize for color mapping (25C to 45C range)
                            const norm = Math.max(0, Math.min(1, (temp - 25) / 20));
                            const [r, g, b] = getColorForPalette(norm, options.palette);

                            const idx = (y * width + x) * 4;
                            data[idx] = r;
                            data[idx + 1] = g;
                            data[idx + 2] = b;
                            data[idx + 3] = 255;
                        }
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0);
        }

        // Draw Contours (only if data exists)
        if (options.showContours && grid && validTemps.length > 0) {
            drawContours(ctx, grid, centerX, centerY, radius);
        }

        // Overlay Graphics
        // Outer Ring
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Crosshairs
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - radius);
        ctx.lineTo(centerX, centerY + radius);
        ctx.moveTo(centerX - radius, centerY);
        ctx.lineTo(centerX + radius, centerY);
        ctx.stroke();

        // Sensors
        const sensorCoords = interpolator.getSensorCoords();
        sensorCoords.forEach((coord, i) => {
            const sx = centerX + coord[0] * radius;
            const sy = centerY + coord[1] * radius;
            const temp = temps[i];
            const isActive = temp !== null && temp > 10; // Check simplified valid range

            ctx.fillStyle = isActive ? 'rgba(239, 68, 68, 0.4)' : 'rgba(100, 116, 139, 0.2)';
            ctx.beginPath();
            ctx.arc(sx, sy, 12, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(sx, sy, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`T${i + 1}`, sx, sy - 15);

            if (isActive) {
                ctx.fillText(`${temp.toFixed(1)}`, sx, sy + 20);
            }
        });

        // Clicked Point
        if (clickedPoint) {
            const { x, y, temp } = clickedPoint;
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(x - 8, y);
            ctx.lineTo(x + 8, y);
            ctx.moveTo(x, y - 8);
            ctx.lineTo(x, y + 8);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(x, y, 6, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = '#22d3ee';
            ctx.fillText(`${temp.toFixed(1)}°C`, x, y - 15);
        }

    }, [temperatures, width, height, options, clickedPoint, interpolator]);

    const handleCanvasClick = (e) => {
        const canvas = canvasRef.current;
        if (!canvas || !gridDataRef.current) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 10;
        const dx = x - centerX;
        const dy = y - centerY;

        if (dx * dx + dy * dy <= radius * radius) {
            const grid = gridDataRef.current;
            const res = grid.length;
            const nx = dx / radius;
            const ny = dy / radius;
            const gx = Math.floor(((nx + 1) / 2) * res);
            const gy = Math.floor(((ny + 1) / 2) * res);

            if (gx >= 0 && gx < res && gy >= 0 && gy < res) {
                const temp = grid[gy][gx];
                if (temp !== null) {
                    setClickedPoint({ x, y, temp });
                    return;
                }
            }
        }
        setClickedPoint(null);
    };

    // --- STYLES ---
    const containerStyle = {
        background: '#0f172a', // slate-900
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    };

    const headerStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '12px',
        borderBottom: '1px solid #1e293b'
    };

    const flexGapStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#94a3b8'
    };

    const statBoxStyle = {
        background: '#020617', // slate-950
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: '70px'
    };

    const statLabelStyle = { fontSize: '10px', color: '#64748b' };
    const statValueStyle = { fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold' };

    const controlsStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px'
    };

    const btnStyle = (active) => ({
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 'bold',
        cursor: 'pointer',
        border: active ? '1px solid #06b6d4' : '1px solid #334155',
        background: active ? 'rgba(6, 182, 212, 0.2)' : '#1e293b',
        color: active ? '#22d3ee' : '#cbd5e1',
        transition: 'all 0.2s'
    });

    const paletteBtnStyle = (p, selected) => ({
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        border: selected ? '2px solid white' : '2px solid transparent',
        background: getPaletteGradient(p),
        cursor: 'pointer',
        opacity: selected ? 1 : 0.6
    });

    return (
        <div style={containerStyle}>
            {/* Header / Stats */}
            <div style={headerStyle}>
                <div style={flexGapStyle}>
                    <Scan size={14} className="text-cyan-400" />
                    <span style={{ color: '#cbd5e1' }}>THERMAL VISION</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={statBoxStyle}>
                        <span style={statLabelStyle}>MAX</span>
                        <span style={{ ...statValueStyle, color: '#f43f5e' }}>{stats.max.toFixed(1)}°</span>
                    </div>
                    <div style={statBoxStyle}>
                        <span style={statLabelStyle}>AVG</span>
                        <span style={{ ...statValueStyle, color: '#22d3ee' }}>{stats.avg.toFixed(1)}°</span>
                    </div>
                </div>
            </div>

            {/* Canvas */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', background: '#000', borderRadius: '8px', padding: '10px' }}>
                <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    style={{ width: width, height: height, cursor: 'crosshair', maxWidth: '100%' }}
                />
            </div>

            {/* Controls */}
            <div style={controlsStyle}>
                <div style={flexGapStyle}>
                    <Palette size={14} />
                    {['thermal', 'ironbow', 'cool'].map(p => (
                        <button
                            key={p}
                            onClick={() => setOptions(o => ({ ...o, palette: p }))}
                            style={paletteBtnStyle(p, options.palette === p)}
                            title={p}
                        />
                    ))}
                </div>

                <div style={flexGapStyle}>
                    <Layers size={14} />
                    <button
                        onClick={() => setOptions(o => ({ ...o, showContours: !o.showContours }))}
                        style={btnStyle(options.showContours)}
                    >
                        {options.showContours ? 'CONTOURS ON' : 'OFF'}
                    </button>
                </div>
            </div>

            {/* Clicked Temp Display */}
            {clickedPoint && (
                <div style={{ textAlign: 'center', marginTop: '-10px', fontSize: '12px', color: '#22d3ee', fontFamily: 'monospace' }}>
                    SPOT: {clickedPoint.temp.toFixed(2)}°C
                </div>
            )}
        </div>
    );
}
