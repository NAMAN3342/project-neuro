import { useRef, Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useProgress, Html } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import Electrodes from './Electrodes';
import React from 'react';

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <div style={{
        color: 'white',
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
        textAlign: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          borderTopColor: '#3b82f6',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <div>{progress.toFixed(0)}% loaded</div>
      </div>
    </Html>
  );
}

function Model({ modelPath, materialPath, onLoad, electrodesRef, isConnected }) {
  const materials = useLoader(MTLLoader, materialPath);
  const obj = useLoader(OBJLoader, modelPath, (loader) => {
    materials.preload();
    loader.setMaterials(materials);
  });

  const { camera, controls } = useThree();
  const [modelReady, setModelReady] = React.useState(false);

  useEffect(() => {
    if (obj) {
      // Calculate bounding box
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());

      // Center the model at origin
      obj.position.sub(center);

      // Calculate optimal camera distance
      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = camera.fov * (Math.PI / 180);
      const cameraZ = Math.abs(maxDim / Math.tan(fov / 2)) * 0.9; // Closer zoom (was 1.5)

      // Position camera
      camera.position.set(0, 0, cameraZ);
      camera.lookAt(0, 0, 0);

      // Set orbit controls target
      if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
      }

      setModelReady(true);
      if (onLoad) onLoad();
    }
  }, [obj, camera, controls, onLoad]);

  // Ensure proper materials
  useEffect(() => {
    obj.traverse((child) => {
      if (child.isMesh) {
        if (child.material) {
          child.material.side = THREE.DoubleSide;
        }
      }
    });
  }, [obj]);

  return (
    <>
      <primitive object={obj} />
      {modelReady && <Electrodes ref={electrodesRef} modelRef={obj} isConnected={isConnected} />}
    </>
  );
}

export default function ModelViewer({ electrodesRef, isConnected }) {
  const controlsRef = useRef();

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        style={{ background: '#0f1115' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 7]} intensity={1.5} />
        <directionalLight position={[-5, 5, -10]} intensity={1} />
        <directionalLight position={[0, -5, 5]} intensity={0.8} />

        <Suspense fallback={<Loader />}>
          <Model
            modelPath="/obj_free/obj_free/free_head.obj"
            materialPath="/obj_free/obj_free/free_head.mtl"
            electrodesRef={electrodesRef}
            isConnected={isConnected}
          />
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          enablePan
          enableZoom
          minDistance={0.5}
          maxDistance={50}
        />
      </Canvas>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
