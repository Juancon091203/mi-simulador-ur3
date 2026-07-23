import React, { useMemo, useEffect, useRef } from 'react';
import { useLoader, useFrame, useThree } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

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

// Spherical linear interpolation (Slerp) on a unit sphere
const slerp = (v0, v1, t) => {
  const dot = v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
  const clampedDot = Math.max(-1, Math.min(1, dot));

  if (clampedDot > 0.9995) {
    return [
      v0[0] + t * (v1[0] - v0[0]),
      v0[1] + t * (v1[1] - v0[1]),
      v0[2] + t * (v1[2] - v0[2])
    ];
  }

  const theta_0 = Math.acos(clampedDot);
  const sin_theta_0 = Math.sin(theta_0);

  const s0 = Math.sin((1 - t) * theta_0) / sin_theta_0;
  const s1 = Math.sin(t * theta_0) / sin_theta_0;

  return [
    s0 * v0[0] + s1 * v1[0],
    s0 * v0[1] + s1 * v1[1],
    s0 * v0[2] + s1 * v1[2]
  ];
};

// Genera un arco en la superficie del esferoide entre p0 y p1
const getSpheroidArc = (p0, p1, steps, spheroidSize) => {
  const sx = spheroidSize.x || 0.1;
  const sy = spheroidSize.y || 0.1;
  const sz = spheroidSize.z || 0.1;

  // Proyectar a la esfera unitaria
  const u0 = [p0[0] / sx, p0[1] / sy, p0[2] / sz];
  const u1 = [p1[0] / sx, p1[1] / sy, p1[2] / sz];

  const arc = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const ut = slerp(u0, u1, t);
    // Volver a proyectar al esferoide
    arc.push([
      ut[0] * sx,
      ut[1] * sy,
      ut[2] * sz
    ]);
  }
  return arc;
};

import { getObjectModelPath } from '../../constants/objectModels';

/**
 * ObjetoSujeto - Componente para cargar el modelo 3D del objeto sujeto (escalable y dinámico)
 * y dibujar un esferoide translúcido y parametrizable a su alrededor.
 */
const ObjetoSujeto = ({
  spheroidSize = { x: 0.6, y: 0.6, z: 0.6 },
  showSpheroid = true,
  pendingPointsPositions = new Float32Array(0),
  activePoint = null,
  nextFivePoints = [],
  objectCenter = { x: 0.0, y: 1.0, z: 0.0 },
  zBounds = { min: -1.0, max: 1.0 },
  showSectors = false,
  darkMode = false,
  objectModel = 'zapato',
  objectScale = 1.0,
  selectedPreInspectionPoints = [],
  isPointSelectionMode = false,
  onToggleSelectPoint,
  globalSequence = [],
}) => {
  const modelPath = getObjectModelPath(objectModel);
  const gltf = useLoader(GLTFLoader, modelPath);
  const { size } = useThree();
  // Factor de escala adaptativo según la resolución del visor 3D
  const responsiveScale = Math.max(1.0, Math.min(2.6, (size?.height || 700) / 420));
  const sectorColor = darkMode ? "#ff9d00" : "#b45309";

  // Calcular la trayectoria curva que abraza la superficie de la esfera/esferoide
  const curvedLinePoints = useMemo(() => {
    if (!nextFivePoints || nextFivePoints.length < 2) return [];

    const fullPath = [];
    const stepsPerSegment = 15; // Número de pasos para suavizar cada curva

    for (let i = 0; i < nextFivePoints.length - 1; i++) {
      const p0 = nextFivePoints[i];
      const p1 = nextFivePoints[i + 1];
      const arc = getSpheroidArc(p0, p1, stepsPerSegment, spheroidSize);

      // Si no es el primer segmento, omitimos el punto inicial del arco para no duplicar vértices
      if (i > 0) {
        fullPath.push(...arc.slice(1));
      } else {
        fullPath.push(...arc);
      }
    }
    return fullPath;
  }, [nextFivePoints, spheroidSize]);

  // Clonamos la escena para evitar interferencias de estado compartido
  const modelScene = useMemo(() => {
    if (!gltf || !gltf.scene) return null;
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

  // Cálculo del corte de la esfera en Three.js usando la polar theta
  const { thetaStart, thetaLength } = useMemo(() => {
    const minZ = Math.max(-1.0, Math.min(1.0, zBounds.min));
    const maxZ = Math.max(-1.0, Math.min(1.0, zBounds.max));
    const start = Math.acos(maxZ);
    const end = Math.acos(minZ);
    return {
      thetaStart: start,
      thetaLength: end - start
    };
  }, [zBounds]);

  return (
    <group>
      {/* Modelo 3D - posicionado y escalado dinámicamente */}
      {modelScene && (
        <primitive
          object={modelScene}
          position={[objectCenter.x, objectCenter.y - 0.1, objectCenter.z]}
          scale={[objectScale, objectScale, objectScale]}
        />
      )}

      {/* Esferoide Translúcido (Volumen de Control) */}
      {showSpheroid && (
        <group position={[objectCenter.x, objectCenter.y, objectCenter.z]}>
          {/* Esfera sólida translúcida con corte dinámico y brillo estilo holograma */}
          <mesh scale={[spheroidSize.x, spheroidSize.y, spheroidSize.z]}>
            <sphereGeometry key={`${thetaStart}_${thetaLength}`} args={[1, 64, 64, 0, 2 * Math.PI, thetaStart, thetaLength]} />
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

          {/* Tapa plana para cerrar el corte superior si no está al límite superior */}
          {zBounds.max < 0.99 && (
            <mesh position={[0, zBounds.max * spheroidSize.y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[spheroidSize.x, spheroidSize.z, 1]}>
              <ringGeometry key={`max_${zBounds.max}`} args={[0, Math.sqrt(1 - zBounds.max ** 2), 64]} />
              <meshStandardMaterial
                color="#00d2ff"
                transparent={true}
                opacity={0.35}
                side={THREE.DoubleSide}
                emissive="#004466"
                emissiveIntensity={0.5}
              />
            </mesh>
          )}

          {/* Tapa plana para cerrar el corte inferior si no está al límite inferior */}
          {zBounds.min > -0.99 && (
            <mesh position={[0, zBounds.min * spheroidSize.y, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[spheroidSize.x, spheroidSize.z, 1]}>
              <ringGeometry key={`min_${zBounds.min}`} args={[0, Math.sqrt(1 - zBounds.min ** 2), 64]} />
              <meshStandardMaterial
                color="#00d2ff"
                transparent={true}
                opacity={0.35}
                side={THREE.DoubleSide}
                emissive="#004466"
                emissiveIntensity={0.5}
              />
            </mesh>
          )}

          {/* Sector slice visualizers ("gajos" y ecuador) */}
          {showSectors && (
            <group scale={[spheroidSize.x, spheroidSize.y, spheroidSize.z]}>
              {/* Vertical wedge dividers */}
              {[Math.PI / 6, Math.PI / 2, 5 * Math.PI / 6].map((phi, idx) => (
                <group key={idx} rotation={[0, phi, 0]}>
                  {/* Neon border highlighting the plane intersection with the sphere */}
                  <mesh>
                    <ringGeometry key={`ring_${phi}`} args={[1.0, 1.015, 64]} />
                    <meshBasicMaterial
                      color={sectorColor}
                      transparent={true}
                      opacity={0.8}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                  {/* Semi-transparent vertical divider plane */}
                  <mesh>
                    <ringGeometry key={`disk_${phi}`} args={[0, 1.0, 64]} />
                    <meshBasicMaterial
                      color={sectorColor}
                      transparent={true}
                      opacity={0.06}
                      side={THREE.DoubleSide}
                    />
                  </mesh>
                </group>
              ))}

              {/* Horizontal equator divider */}
              <group rotation={[-Math.PI / 2, 0, 0]}>
                {/* Neon border highlighting the horizontal plane intersection with the sphere */}
                <mesh>
                  <ringGeometry key="horizontal_ring" args={[1.0, 1.015, 64]} />
                  <meshBasicMaterial
                    color={sectorColor}
                    transparent={true}
                    opacity={0.8}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                {/* Semi-transparent horizontal divider plane */}
                <mesh>
                  <ringGeometry key="horizontal_disk" args={[0, 1.0, 64]} />
                  <meshBasicMaterial
                    color={sectorColor}
                    transparent={true}
                    opacity={0.06}
                    side={THREE.DoubleSide}
                  />
                </mesh>
              </group>
            </group>
          )}

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
                color={darkMode ? "#ffffff" : "#0284c7"}
                size={darkMode ? 0.035 : 0.045}
                sizeAttenuation={true}
                transparent={true}
                opacity={darkMode ? 0.9 : 1.0}
              />
            </points>
          )}

          {/* Trayectoria de los próximos 5 puntos con degradado fade-out */}
          {curvedLinePoints && curvedLinePoints.length > 1 && (
            <group>
              {curvedLinePoints.slice(0, -1).map((p, idx) => {
                const opacity = Math.max(0.08, 1.0 - (idx / (curvedLinePoints.length - 1)));
                return (
                  <Line
                    key={idx}
                    points={[p, curvedLinePoints[idx + 1]]}
                    color={darkMode ? "#00ff88" : "#047857"}
                    lineWidth={darkMode ? 2.5 : 3.5}
                    transparent={true}
                    opacity={opacity}
                  />
                );
              })}
            </group>
          )}

          {/* Punto activo que simula la captura de la cámara */}
          {activePoint && (
            <ActiveTargetPoint position={[activePoint.x, activePoint.y, activePoint.z]} />
          )}

          {/* Interactive Clickable Point Spheres in Selection Mode */}
          {isPointSelectionMode && Array.isArray(globalSequence) && globalSequence.length > 0 && (
            <group>
              {globalSequence.map((pt, idx) => {
                if (!pt || typeof pt.x !== 'number') return null;
                const isSelected = Array.isArray(selectedPreInspectionPoints) && selectedPreInspectionPoints.includes(idx);
                const radius = (isSelected ? 0.065 : 0.042) * responsiveScale;
                return (
                  <mesh
                    key={idx}
                    position={[pt.x, pt.y, pt.z]}
                    onClick={(e) => {
                      e.stopPropagation();
                      const targetIdx = idx;
                      setTimeout(() => {
                        if (onToggleSelectPoint) onToggleSelectPoint(targetIdx);
                      }, 0);
                    }}
                    onPointerOver={(e) => {
                      e.stopPropagation();
                      document.body.style.cursor = 'pointer';
                    }}
                    onPointerOut={() => {
                      document.body.style.cursor = 'auto';
                    }}
                  >
                    <sphereGeometry args={[radius, 16, 16]} />
                    <meshStandardMaterial
                      color={isSelected ? "#00ff88" : "#00d2ff"}
                      emissive={isSelected ? "#00cc66" : "#004466"}
                      emissiveIntensity={isSelected ? 2.5 : 0.4}
                      roughness={0.2}
                    />
                  </mesh>
                );
              })}
            </group>
          )}

          {/* Glowing Green 3D Spheres for Selected Pre-Inspection Points (halo removed) */}
          {Array.isArray(selectedPreInspectionPoints) && selectedPreInspectionPoints.map((pointIdx, slotIdx) => {
            const pt = Array.isArray(globalSequence) && globalSequence[pointIdx];
            if (!pt || typeof pt.x !== 'number' || typeof pt.y !== 'number' || typeof pt.z !== 'number') return null;

            const selectedRadius = 0.075 * responsiveScale;

            return (
              <mesh key={`sel_pt_${pointIdx}_${slotIdx}`} position={[pt.x, pt.y, pt.z]} castShadow>
                <sphereGeometry args={[selectedRadius, 20, 20]} />
                <meshStandardMaterial
                  color="#00ff88"
                  emissive="#00cc66"
                  emissiveIntensity={2.8}
                  roughness={0.1}
                  metalness={0.3}
                />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};

export default ObjetoSujeto;
