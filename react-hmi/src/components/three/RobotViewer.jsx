import React, { Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stage, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import RobotModel from './RobotModel';

// Componente para cargar y renderizar el entorno de la cinta
const ConveyorBelt = () => {
  const gltf = useLoader(GLTFLoader, '/scenes/entornoCinta.glb');
  return <primitive object={gltf.scene} position={[0, 0, 0]} />;
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

        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.5} contactShadow={false}>
            <RobotModel
              modelType={modelType}
              jointAngles={jointAngles}
            />
          </Stage>
          <ConveyorBelt />
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
