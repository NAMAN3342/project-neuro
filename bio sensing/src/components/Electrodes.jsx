import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import ThermalWaves from './ThermalWaves';
import ElectrodeGlow from './ElectrodeGlow';

const electrodeDirections = [
  { name: 'Fp1', direction: new THREE.Vector3(0.2, 0.9, 1).normalize(), color: '#3b82f6', connectedColor: '#3b82f6', channel: 0 },
  { name: 'F2', direction: new THREE.Vector3(-0.2, 0.9, 1).normalize(), color: '#3b82f6', connectedColor: '#3b82f6', channel: 0 },
  { name: 'C3', direction: new THREE.Vector3(0.18, 1, -0.1).normalize(), color: '#fbbf24', connectedColor: '#fbbf24', channel: 1 },
  { name: 'C4', direction: new THREE.Vector3(-0.18, 1, -0.1).normalize(), color: '#fbbf24', connectedColor: '#fbbf24', channel: 1 },
  { name: 'O1', direction: new THREE.Vector3(0.08, 0.3, -0.6).normalize(), color: '#a78bfa', connectedColor: '#a78bfa', channel: 2 },
  { name: 'O2', direction: new THREE.Vector3(-0.08, 0.3, -0.6).normalize(), color: '#a78bfa', connectedColor: '#a78bfa', channel: 2 },
  { name: 'REF', direction: new THREE.Vector3(1, -0.25, -0.5).normalize(), color: '#10b981', connectedColor: '#10b981', channel: 0 },
];

const thermalSensorDirections = [
  { name: 'T1', direction: new THREE.Vector3(-0.38, 0.8, 0.84).normalize(), color: '#ff6b6b' },
  { name: 'T2', direction: new THREE.Vector3(0.38, 0.8, 0.84).normalize(), color: '#ff6b6b' },
  { name: 'T3', direction: new THREE.Vector3(-0.35, 1, -0.1).normalize(), color: '#ffa94d' },
  { name: 'T4', direction: new THREE.Vector3(0.35, 1, -0.1).normalize(), color: '#ffa94d' },
  { name: 'T5', direction: new THREE.Vector3(0, 0.3, -0.6).normalize(), color: '#a78bfa' },
];

function Electrode({ name, position, color, connectedColor, channel, onMeshReady, isConnected, glowIntensity = 0 }) {
  const meshRef = useRef();

  useEffect(() => {
    if (meshRef.current && onMeshReady) {
      onMeshReady(name, meshRef.current, channel);
    }
  }, [name, channel, onMeshReady]);

  // Use connected color when connected, otherwise use default
  const displayColor = isConnected ? connectedColor : color;

  return (
    <group position={position}>
      {/* Colored glow halo - shows activity without changing electrode color */}
      {glowIntensity > 0.1 && (
        <ElectrodeGlow
          color={displayColor}
          intensity={glowIntensity}
          position={[0, 0, 0]}
        />
      )}

      <mesh ref={meshRef}>
        <sphereGeometry args={[0.008, 16, 16]} />
        <meshStandardMaterial
          color={displayColor}
          emissive={displayColor}
          emissiveIntensity={0.4}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      <Html
        position={[0, 0.03, 0]}
        center
        distanceFactor={0.3}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          border: `1px solid ${displayColor}`,
        }}>
          {name}
        </div>
      </Html>
    </group>
  );
}

function ThermalSensor({ name, position, color, rotation = [0, 0, 0], onMeshReady, intensity = 0.6, isActive = false }) {
  const meshRef = useRef();

  useEffect(() => {
    if (meshRef.current && onMeshReady) {
      onMeshReady(name, meshRef.current);
    }
  }, [name, onMeshReady]);

  // Determine wave rotation based on sensor name
  let waveRotation = [Math.PI / 2, 0, 0]; // Default horizontal
  if (name === 'T1' || name === 'T2' || name === 'T5') {
    // Rotate waves 90 degrees for T1, T2, T5
    waveRotation = [0, 0, 0]; // Vertical orientation
  }

  return (
    <group position={position}>
      {/* Thermal sensor capsule */}
      <mesh ref={meshRef} rotation={rotation}>
        <capsuleGeometry args={[0.004, 0.012, 8, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={intensity}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>

      {/* Animated thermal waves - only show when active */}
      {isActive && <ThermalWaves position={[0, 0, 0]} color={color} intensity={intensity} rotation={waveRotation} />}

      <Html
        position={[0, 0.03, 0]}
        center
        distanceFactor={0.3}
        style={{
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: '600',
          whiteSpace: 'nowrap',
          border: `1px solid ${color}`,
        }}>
          {name}
        </div>
      </Html>
    </group>
  );
}

const Electrodes = forwardRef(({ modelRef, isConnected = false }, ref) => {
  const [electrodePositions, setElectrodePositions] = useState([]);
  const [thermalPositions, setThermalPositions] = useState([]);
  const [glowIntensities, setGlowIntensities] = useState({ ch0: 0, ch1: 0, ch2: 0 });
  const electrodeControllerRef = useRef(null);
  const thermalControllerRef = useRef(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getElectrodeController: () => electrodeControllerRef.current,
    getThermalController: () => thermalControllerRef.current,
  }));

  useEffect(() => {
    if (!modelRef) return;

    const raycaster = new THREE.Raycaster();
    const positions = [];

    electrodeDirections.forEach((electrode) => {
      raycaster.set(new THREE.Vector3(0, 0, 0), electrode.direction);
      const intersects = raycaster.intersectObject(modelRef, true);

      if (intersects.length > 0) {
        const position = intersects[0].point;
        positions.push({
          name: electrode.name,
          position: [position.x, position.y, position.z],
          color: electrode.color,
          connectedColor: electrode.connectedColor,
          channel: electrode.channel,
        });
      }
    });

    setElectrodePositions(positions);
  }, [modelRef]);

  useEffect(() => {
    if (!modelRef) return;

    const raycaster = new THREE.Raycaster();
    const positions = [];

    thermalSensorDirections.forEach((sensor) => {
      raycaster.set(new THREE.Vector3(0, 0, 0), sensor.direction);
      const intersects = raycaster.intersectObject(modelRef, true);

      if (intersects.length > 0) {
        const position = intersects[0].point.clone();
        if (sensor.name === 'T1' || sensor.name === 'T2') {
          position.addScaledVector(sensor.direction, 0.008);
        }
        positions.push({
          name: sensor.name,
          position: [position.x, position.y, position.z],
          color: sensor.color,
        });
      }
    });

    setThermalPositions(positions);
  }, [modelRef]);

  const handleElectrodeMeshReady = (name, mesh, channel) => {
    if (!electrodeControllerRef.current) {
      // Import controller dynamically
      import('../utils/ElectrodeController.js').then(module => {
        electrodeControllerRef.current = module.default;
        electrodeControllerRef.current.registerElectrode(name, mesh, channel);
      });
    } else {
      electrodeControllerRef.current.registerElectrode(name, mesh, channel);
    }
  };

  const handleThermalMeshReady = (name, mesh) => {
    if (!thermalControllerRef.current) {
      // Import controller dynamically
      import('../utils/ThermalController.js').then(module => {
        thermalControllerRef.current = module.default;
        thermalControllerRef.current.registerSensor(name, mesh);
      });
    } else {
      thermalControllerRef.current.registerSensor(name, mesh);
    }
  };

  // Update electrode visuals in animation loop
  useFrame((state, delta) => {
    if (electrodeControllerRef.current) {
      electrodeControllerRef.current.update(delta);
      // Get current intensities for glow effect
      const intensities = electrodeControllerRef.current.getIntensities();
      setGlowIntensities(intensities);
    }
  });

  return (
    <group>
      {electrodePositions.map((electrode) => (
        <Electrode
          key={electrode.name}
          name={electrode.name}
          position={electrode.position}
          color={electrode.color}
          connectedColor={electrode.connectedColor}
          channel={electrode.channel}
          isConnected={isConnected}
          glowIntensity={glowIntensities[`ch${electrode.channel}`] || 0}
          onMeshReady={handleElectrodeMeshReady}
        />
      ))}
      {thermalPositions.map((sensor) => {
        let rotation = [0, 0, 0];
        if (sensor.name === 'T1' || sensor.name === 'T2') {
          rotation = [0, 0, Math.PI / 2];
        } else if (sensor.name === 'T3' || sensor.name === 'T4') {
          rotation = [Math.PI / 2, 0, 0];
        } else if (sensor.name === 'T5') {
          rotation = [0, Math.PI / 2, 0];
        }

        // Get current color and intensity from thermal controller
        let currentColor = sensor.color;
        let intensity = 0.6;

        if (thermalControllerRef.current) {
          const sensorData = thermalControllerRef.current.sensors.get(sensor.name);
          if (sensorData?.mesh?.material) {
            // Get the actual current color from the material
            currentColor = '#' + sensorData.mesh.material.color.getHexString();
            intensity = sensorData.mesh.material.emissiveIntensity || 0.6;
          }
        }

        return (
          <ThermalSensor
            key={sensor.name}
            name={sensor.name}
            position={sensor.position}
            color={currentColor}
            rotation={rotation}
            intensity={intensity}
            isActive={isConnected}
            onMeshReady={handleThermalMeshReady}
          />
        );
      })}
    </group>
  );
});

Electrodes.displayName = 'Electrodes';

export default Electrodes;
