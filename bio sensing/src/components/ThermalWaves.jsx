import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * ThermalWaves - Animated wave rings emanating from thermal sensors
 */
export default function ThermalWaves({ position, color, intensity = 0.5, rotation = [Math.PI / 2, 0, 0] }) {
    const groupRef = useRef();
    const wavesRef = useRef([]);

    // Create 3 expanding wave rings
    const waves = useMemo(() => {
        return [
            { delay: 0, scale: 1 },
            { delay: 0.33, scale: 1 },
            { delay: 0.66, scale: 1 }
        ];
    }, []);

    useFrame((state) => {
        if (!groupRef.current) return;

        const time = state.clock.elapsedTime;

        wavesRef.current.forEach((wave, index) => {
            if (!wave) return;

            const waveDelay = waves[index].delay;
            const animTime = (time + waveDelay) % 2; // 2 second cycle

            // Scale: expand from 0.5 to 2.5
            const scale = 0.5 + (animTime / 2) * 2;
            wave.scale.set(scale, scale, 1);

            // Opacity: fade out as it expands
            const opacity = Math.max(0, 1 - (animTime / 2)) * intensity * 0.6;
            wave.material.opacity = opacity;
        });
    });

    return (
        <group ref={groupRef} position={position}>
            {waves.map((_, index) => (
                <mesh
                    key={index}
                    ref={(el) => (wavesRef.current[index] = el)}
                    rotation={rotation}
                >
                    <ringGeometry args={[0.015, 0.02, 32]} />
                    <meshBasicMaterial
                        color={color}
                        transparent
                        opacity={0.6}
                        side={THREE.DoubleSide}
                        blending={THREE.AdditiveBlending}
                    />
                </mesh>
            ))}
        </group>
    );
}
