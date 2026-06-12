import React, { useLayoutEffect, useState, useEffect, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';

// Configuración de ejes idéntica a la versión vanilla
const robotConfig = {
  "UR3": {
    axis: ['y', 'y', 'y', 'y', 'y', 'y'],
    dir: [1, 1, 1, 1, 1, 1]
  },
  "UR5": {
    axis: ['y', 'x', 'x', 'x', 'y', 'y'],
    dir: [1, 1, 1, 1, -1, 1]
  },
  "UR10": {
    axis: ['y', 'x', 'x', 'x', 'y', 'z'],
    dir: [1, 1, 1, 1, 1, 1]
  },
  "UR20": {
    axis: ['z', 'y', 'y', 'y', 'z', 'y'],
    dir: [-1, -1, -1, -1, -1, -1]
  },
  "iER15-1430-MI": {
    axis: ['z', 'y', 'y', 'x', 'y', 'x'],
    dir: [-1, -1, -1, -1, -1, 1]
  }
};

const RobotModel = ({ modelType, jointAngles, position = [0, 0, 0], rotationY = 0 }) => {
  const path = `/scenes/${modelType.toLowerCase()}.glb`;

  // Cargador universal (suspende mientras carga)
  const result = useLoader(
    GLTFLoader,
    path
  );

  // Clona la escena para evitar modificar la cache global y evitar crashes
  const robotScene = useMemo(() => {
    if (!result || !result.scene) return null;
    const clone = result.scene.clone();
    return clone;
  }, [result]);

  const [links, setLinks] = useState([]);
  const [initialQuaternions, setInitialQuaternions] = useState([]);

  // Carga y búsqueda de articulaciones
  useEffect(() => {
    if (!robotScene) return;

    const newLinks = [];
    const newQuats = [];

    // El UR3 tiene una estructura distinta (objeto UR3 arriba)
    const root = robotScene.getObjectByName(modelType) || robotScene;

    // Buscar las articulaciones por coincidencia parcial de texto (ej. "Joint_1", "Joint_1.001", "Joint_1_Tenedor")
    const jointsMap = {};
    root.traverse((child) => {
      if (child.name) {
        // Ocultar pedestal/mesa antigua si existe en el modelo del robot para que no choque con la de la cinta
        const nameLower = child.name.toLowerCase();
        if (nameLower === 'cube' || nameLower === 'table' || nameLower === 'base_table' || nameLower === 'pedestal') {
          child.visible = false;
        }

        for (let i = 1; i <= 6; i++) {
          const regex = new RegExp(`joint_${i}(\\D|$)`, 'i');
          if (regex.test(child.name) && !jointsMap[i]) {
            jointsMap[i] = child;
          }
        }
      }
    });

    for (let i = 1; i <= 6; i++) {
      const joint = jointsMap[i];
      if (joint) {
        newLinks.push(joint);
        newQuats.push(joint.quaternion.clone());
      }
    }

    setLinks(newLinks);
    setInitialQuaternions(newQuats);

    // Limpieza al cambiar de modelo o desmontar
    return () => {
      setLinks([]);
      setInitialQuaternions([]);
    };
  }, [robotScene, modelType]);

  // Aplicar rotaciones en cada frame/cambio de ángulo
  useLayoutEffect(() => {
    if (links.length !== 6 || initialQuaternions.length !== 6) return;

    const config = robotConfig[modelType] || robotConfig["UR3"];

    links.forEach((link, i) => {
      const angle = jointAngles[i] * config.dir[i];
      const axis = config.axis[i];

      // Restaurar pose base
      link.quaternion.copy(initialQuaternions[i]);

      // Aplicar rotación local
      if (axis === 'x') link.rotateX(angle);
      else if (axis === 'y') link.rotateY(angle);
      else if (axis === 'z') link.rotateZ(angle);
    });
  }, [jointAngles, links, initialQuaternions, modelType]);

  if (!robotScene) return null;

  return (
    <primitive 
      object={robotScene} 
      position={position} 
      rotation={[0, rotationY, 0]} 
    />
  );
};

export default RobotModel;
