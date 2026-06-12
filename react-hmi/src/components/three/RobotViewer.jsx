import React, { Suspense, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import RobotModel from './RobotModel';
import ObjetoSujeto from './ObjetoSujeto';
import RobotPathCircle from './RobotPathCircle';

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

const BaseUR20 = ({ position = [0, 0, 0], rotationY = 0 }) => {
  const geometry = useLoader(STLLoader, '/scenes/base.stl');

  return (
    <mesh geometry={geometry} position={position} rotation={[0, rotationY, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#888888" roughness={0.6} />
    </mesh>
  );
};

/**
 * RobotViewer - Un componente modular para visualizar robots UR.
 * @param {string} modelType - 'UR3', 'UR5', o 'UR10'
 * @param {Array} jointAngles - Array de 6 ángulos en radianes
 */
const RobotViewer = ({ 
  modelType = 'UR3', 
  jointAngles = [0, 0, 0, 0, 0, 0],
  spheroidSize = { x: 0.6, y: 0.6, z: 0.6 },
  showSpheroid = true,
  pendingPointsPositions = new Float32Array(0),
  activePoint = null,
  robotPositionIndex = 0,
  robotPosition = [0, 0, 0],
  robotRotationY = 0,
  nextFivePoints = [],
  objectCenter = { x: 1.2, y: 0.2, z: 0.0 },
  zBounds = { min: -1.0, max: 1.0 },
  showSectors = false
}) => {
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
            position={robotPosition}
            rotationY={robotRotationY}
          />
          <ConveyorBelt />
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.543, 0]} receiveShadow>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial color="#0e0f14" roughness={0.7} metalness={0.1} />
          </mesh>
          <gridHelper args={[30, 30, '#00d2ff', '#1f2937']} position={[0, -0.542, 0]} opacity={0.12} transparent />
          <BaseUR20 position={[robotPosition[0], -0.543, robotPosition[2]]} rotationY={robotRotationY} />
          <ObjetoSujeto 
            spheroidSize={spheroidSize} 
            showSpheroid={showSpheroid} 
            pendingPointsPositions={pendingPointsPositions} 
            activePoint={activePoint}
            nextFivePoints={nextFivePoints}
            objectCenter={objectCenter}
            zBounds={zBounds}
            showSectors={showSectors}
          />
          <RobotPathCircle activeIndex={robotPositionIndex} center={[objectCenter.x, 0, objectCenter.z]} radius={1.6} y={-0.543} />
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
