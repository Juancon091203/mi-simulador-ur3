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
  y = -0.543
}) => {
  const [centerX, , centerZ] = center;

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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, y + 0.01, centerZ]}>
        <ringGeometry args={[radius - 0.01, radius + 0.01, 64]} />
        <meshBasicMaterial 
          color="#3aedff" 
          transparent={true} 
          opacity={0.3} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Línea exterior delgada adicional de adorno */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, y + 0.01, centerZ]}>
        <ringGeometry args={[radius - 0.05, radius - 0.048, 64]} />
        <meshBasicMaterial 
          color="#3aedff" 
          transparent={true} 
          opacity={0.15} 
          side={THREE.DoubleSide} 
        />
      </mesh>

      {/* Renderizar los 6 puntos en la circunferencia con sus grados */}
      {points.map((pt) => {
        const isActive = pt.index === activeIndex;
        const deg = pt.index * 60;
        
        // Colocar el texto de los grados hacia el exterior
        const labelRadius = radius + 0.22;
        const labelX = centerX + labelRadius * Math.cos(pt.angle);
        const labelZ = centerZ + labelRadius * Math.sin(pt.angle);
        const labelRotation = -pt.angle - Math.PI / 2;

        return (
          <group key={pt.index}>
            <group position={[pt.x, y + 0.02, pt.z]}>
              {/* Indicador de posición (Cilindro pequeño tipo placa metálica/sensor) */}
              <mesh castShadow receiveShadow>
                <cylinderGeometry args={[0.08, 0.09, 0.02, 16]} />
                <meshStandardMaterial 
                  color={isActive ? "#ff9d00" : "#1e222b"} 
                  roughness={0.4}
                  metalness={0.6}
                />
              </mesh>

              {/* Punto central luminoso */}
              <mesh position={[0, 0.015, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.01, 16]} />
                <meshBasicMaterial 
                  color={isActive ? "#ffa600" : "#3aedff"} 
                  transparent={true}
                  opacity={isActive ? 0.9 : 0.6}
                />
              </mesh>

              {/* Anillo de brillo pulsante / indicador de actividad */}
              {isActive && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]}>
                  <ringGeometry args={[0.08, 0.12, 32]} />
                  <meshBasicMaterial 
                    color="#ff9d00" 
                    transparent={true} 
                    opacity={0.5} 
                    side={THREE.DoubleSide}
                  />
                </mesh>
              )}
            </group>

            {/* Texto de Grados en el suelo */}
            <Text
              position={[labelX, y + 0.005, labelZ]}
              rotation={[-Math.PI / 2, 0, labelRotation]}
              fontSize={0.06}
              color={isActive ? "#ff9d00" : "#3aedff"}
              font="https://fonts.gstatic.com/s/outfit/v11/0yb92k3WN_t3HmcSM4nJ5w.woff"
              anchorX="center"
              anchorY="middle"
              fillOpacity={isActive ? 0.95 : 0.4}
            >
              {`${deg}°`}
            </Text>
          </group>
        );
      })}
    </group>
  );
};

export default RobotPathCircle;
