import { useRef, useMemo } from 'react';
import * as THREE from 'three';

/**
 * ElectrodeGlow - Colored halo effect around electrodes
 * Shows signal activity without washing out electrode colors
 */
export default function ElectrodeGlow({ color, intensity = 0, position = [0, 0, 0] }) {
    const glowRef = useRef();

    // Create glow material with the electrode's color
    const glowMaterial = useMemo(() => {
        return new THREE.SpriteMaterial({
            map: createGlowTexture(),
            color: color,
            transparent: true,
            opacity: intensity * 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        });
    }, [color, intensity]);

    // Update opacity based on intensity
    if (glowRef.current) {
        glowRef.current.material.opacity = intensity * 0.8;
    }

    // Scale based on intensity
    const scale = 0.02 + (intensity * 0.03);

    return (
        <sprite ref={glowRef} position={position} scale={[scale, scale, 1]}>
            <primitive object={glowMaterial} attach="material" />
        </sprite>
    );
}

/**
 * Create a radial gradient texture for the glow effect
 */
function createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;

    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);

    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
}
