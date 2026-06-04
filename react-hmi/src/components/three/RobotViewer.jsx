import React, { Suspense, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import RobotModel from './RobotModel';

// Componente para cargar y renderizar el entorno de la cinta
const ConveyorBelt = () => {
  const gltf = useLoader(GLTFLoader, '/scenes/entornoCinta.glb?v=3');

  useEffect(() => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // Si el material tiene color plano blanco por defecto, asegurar que responda correctamente a las sombras
        if (child.material) {
          child.material.roughness = 0.6;
        }
      }
    });
  }, [gltf]);

  return <primitive object={gltf.scene} position={[0, 0, 0]} />;
};

const BaseUR20 = () => {
  const geometry = useLoader(STLLoader, '/scenes/base.stl');

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#888888" roughness={0.6} />
    </mesh>
  );
};

/**
 * RobotViewer - Un componente modular para visualizar robots UR.
 * @param {string} modelType - 'UR3', 'UR5', o 'UR10'
 * @param {Array} jointAngles - Array de 6 ángulos en radianes
 */
const RobotViewer = ({ modelType = 'UR3', jointAngles = [0, 0, 0, 0, 0, 0] }) => {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 2, 4]} fov={50} />

        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 15, 10]} intensity={0.8} castShadow />

        <Suspense fallback={null}>
          <Environment preset="city" />
          <RobotModel
            modelType={modelType}
            jointAngles={jointAngles}
          />
          <ConveyorBelt />
          <BaseUR20 />
        </Suspense>

        <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.75} />
      </Canvas>

      {/* Overlay opcional para mostrar información del modelo */}
      <div style={{ position: 'absolute', bottom: 20, right: 20, pointerEvents: 'none' }}>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)' }}>
          Rendering: {modelType} Baseline Active
        </span>
      </div>
    </div>
  );
};

export default RobotViewer;
