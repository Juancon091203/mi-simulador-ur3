import React, { useMemo, useEffect, useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

/**
 * ActiveTargetPoint - Un subcomponente para animar y hacer pulsar
 * el punto que está siendo fotografiado en este momento.
 */
const ActiveTargetPoint = ({ position }) => {
  const meshRef = useRef();

  useFrame(({ clock }) => {
    if (meshRef.current) {
      // Pulsación suave de la escala
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 12) * 0.18;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.045, 16, 16]} />
      <meshStandardMaterial 
        color="#ff3333" 
        emissive="#ff1111" 
        emissiveIntensity={2} 
        roughness={0.1}
        metalness={0.8}
      />
    </mesh>
  );
};

/**
 * ObjetoSujeto - Componente para cargar el modelo 3D del objeto sujeto (tacones.glb)
 * y dibujar un esferoide translúcido y parametrizable a su alrededor.
 */
const ObjetoSujeto = ({
  spheroidSize = { x: 0.6, y: 0.6, z: 0.6 },
  showSpheroid = true,
  pendingPointsPositions = new Float32Array(0),
  activePoint = null,
  position = [1.2, 0.1, 0] // Posicionado al lado del robot
}) => {
  const gltf = useLoader(GLTFLoader, '/scenes/tacones.glb');

  // Clonamos la escena para evitar interferencias de estado compartido
  const modelScene = useMemo(() => {
    const clone = gltf.scene.clone();
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;

        // Aumentar la calidad visual de los materiales por defecto
        if (child.material) {
          child.material = child.material.clone();
          child.material.roughness = 0.4;
          child.material.metalness = 0.3;
        }
      }
    });
    return clone;
  }, [gltf]);

  return (
    <group position={position}>
      {/* Modelo 3D */}
      <primitive object={modelScene} />

      {/* Esferoide Translúcido (Volumen de Control) */}
      {showSpheroid && (
        <group position={[0, 0.1, 0]}>
          {/* Esfera sólida translúcida con brillo estilo holograma */}
          <mesh scale={[spheroidSize.x, spheroidSize.y, spheroidSize.z]}>
            <sphereGeometry args={[1, 64, 64]} />
            <meshStandardMaterial
              color="#00d2ff"
              transparent={true}
              opacity={0.25}
              roughness={0.5}
              metalness={0.5}
              side={THREE.DoubleSide}
              emissive="#004466"
              emissiveIntensity={0.5}
            />
          </mesh>

          {/* Puntos distribuidos siguiendo Fibonacci en la superficie */}
          {pendingPointsPositions.length > 0 && (
            <points>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[pendingPointsPositions, 3]}
                />
              </bufferGeometry>
              <pointsMaterial
                color="#ff9d00" // Naranja premium
                size={0.035}
                sizeAttenuation={true}
                transparent={true}
                opacity={0.9}
              />
            </points>
          )}

          {/* Punto activo que simula la captura de la cámara */}
          {activePoint && (
            <ActiveTargetPoint position={[activePoint.x, activePoint.y, activePoint.z]} />
          )}
        </group>
      )}
    </group>
  );
};

export default ObjetoSujeto;
