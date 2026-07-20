import React from 'react';
import * as THREE from 'three';
import { Text } from '@react-three/drei';

/**
 * RobotPathCircle - Componente para dibujar la circunferencia de guiado
 * de 1.6m de radio alrededor del objeto y las 6 posiciones equidistantes.
 * 
 * @param {number} activeIndex - Índice activo actual (0 a 5)
 * @param {Array} center - Coordenadas [x, y, z] del centro (objeto)
 * @param {number} radius - Radio de la circunferencia (1.6m por defecto)
 */
const RobotPathCircle = ({
  activeIndex = 0,
  center = [1.2, 0, 0],
  radius = 1.6,
  y = -0.543,
  hideLabels = false,
  darkMode = false
}) => {
  const [centerX, , centerZ] = center;

  const circleColor = darkMode ? "#3aedff" : "#0284c7";
  const activeColor = darkMode ? "#ff9d00" : "#d97706";

  // Generamos las 6 posiciones equidistantes (cada 60 grados / PI/3 radianes)
  const points = Array.from({ length: 6 }).map((_, i) => {
    const angle = i * (Math.PI / 3);
    return {
      x: centerX + radius * Math.cos(angle),
      z: centerZ + radius * Math.sin(angle),
      angle: angle,
      index: i
    };
  });

  return (
    <group>
      {/* Círculo base en el suelo (plano XZ) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, y + 0.001, centerZ]}>
        <ringGeometry args={[radius - 0.015, radius + 0.015, 64]} />
        <meshBasicMaterial 
          color={circleColor} 
          transparent={true} 
          opacity={darkMode ? 0.35 : 0.75} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Línea exterior delgada adicional de adorno */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, y + 0.001, centerZ]}>
        <ringGeometry args={[radius - 0.05, radius - 0.046, 64]} />
        <meshBasicMaterial 
          color={circleColor} 
          transparent={true} 
          opacity={darkMode ? 0.2 : 0.45} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Renderizar los 6 puntos en la circunferencia con sus grados */}
      {points.map((pt) => {
        const isActive = pt.index === activeIndex;
        const deg = pt.index * 60;
        
        // Colocar el texto de los grados hacia el exterior
        const labelRadius = radius + 0.18;
        const labelX = centerX + labelRadius * Math.cos(pt.angle);
        const labelZ = centerZ + labelRadius * Math.sin(pt.angle);
        const labelRotation = -pt.angle - Math.PI / 2;

        return (
          <group key={pt.index}>
            <group position={[pt.x, y + 0.011, pt.z]}>
              {/* Indicador de posición (Cilindro pequeño tipo placa metálica/sensor) */}
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[0.08, 0.09, 0.02, 16]} />
                <meshStandardMaterial 
                  color={isActive ? activeColor : (darkMode ? "#1e222b" : "#cbd5e1")} 
                  roughness={0.4}
                  metalness={0.6}
                />
              </mesh>

              {/* Punto central luminoso */}
              <mesh position={[0, 0.015, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.01, 16]} />
                <meshBasicMaterial 
                  color={isActive ? activeColor : circleColor} 
                  transparent={true}
                  opacity={isActive ? 0.95 : (darkMode ? 0.6 : 0.85)}
                />
              </mesh>

              {/* Anillo de brillo pulsante / indicador de actividad */}
              {isActive && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
                  <ringGeometry args={[0.08, 0.12, 32]} />
                  <meshBasicMaterial 
                    color={activeColor} 
                    transparent={true} 
                    opacity={0.6} 
                    side={THREE.DoubleSide}
                  />
                </mesh>
              )}
            </group>

            {/* Texto de Grados en el suelo (WebGL Text) */}
            {!hideLabels && (
              <group position={[labelX, y + 0.006, labelZ]} rotation={[-Math.PI / 2, 0, labelRotation]}>
                {/* Borde exterior */}
                <mesh position={[0, 0, -0.0005]}>
                  <planeGeometry args={[0.38, 0.16]} />
                  <meshBasicMaterial 
                    color={isActive ? activeColor : circleColor} 
                    transparent={true} 
                    opacity={isActive ? 0.8 : (darkMode ? 0.3 : 0.6)}
                    depthWrite={false}
                  />
                </mesh>
                {/* Fondo */}
                <mesh position={[0, 0, 0]}>
                  <planeGeometry args={[0.36, 0.14]} />
                  <meshBasicMaterial 
                    color={isActive ? (darkMode ? "#110b00" : "#fef3c7") : (darkMode ? "#0e0f14" : "#ffffff")} 
                    transparent={true} 
                    opacity={0.95} 
                    depthWrite={false}
                  />
                </mesh>
                {/* Texto */}
                <Text
                  position={[0, 0, 0.001]}
                  fontSize={0.10}
                  color={isActive ? activeColor : (darkMode ? "#3aedff" : "#0284c7")}
                  anchorX="center"
                  anchorY="middle"
                  fontWeight="bold"
                >
                  {`${deg}°`}
                </Text>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};

export default RobotPathCircle;
