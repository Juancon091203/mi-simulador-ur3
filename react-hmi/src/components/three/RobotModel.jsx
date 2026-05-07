import React, { useLayoutEffect, useRef, useState, useMemo } from 'react';
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
    axis: ['y', 'x', 'x', 'x', 'y', 'z'],
    dir: [1, 1, 1, 1, 1, 1]
  },
  "UR10": {
    axis: ['y', 'x', 'x', 'x', 'y', 'z'],
    dir: [1, 1, 1, 1, 1, 1]
  }
};

const RobotModel = ({ modelType, jointAngles }) => {
  const group = useRef();
  
  // Nota: En un entorno real, las escenas estarían en public/scenes/
  // Para que funcione en este proyecto, asumimos que están en la carpeta del servidor flask
  // o que el proxy/docker las sirve.
  const path = modelType === 'UR3' ? '/scenes/scene.json' : `/scenes/${modelType.toLowerCase()}.glb`;
  
  // Cargador universal
  const result = useLoader(
    modelType === 'UR3' ? THREE.ObjectLoader : GLTFLoader, 
    path
  );

  const scene = useMemo(() => {
    return modelType === 'UR3' ? result : result.scene;
  }, [result, modelType]);

  const [links, setLinks] = useState([]);
  const [initialQuaternions, setInitialQuaternions] = useState([]);

  // Setup de articulaciones nada más cargar el modelo
  useLayoutEffect(() => {
    if (!scene) return;

    const newLinks = [];
    const newQuats = [];
    
    // El UR3 tiene una estructura distinta (objeto UR3 arriba)
    const root = scene.getObjectByName(modelType) || scene;

    for (let i = 1; i <= 6; i++) {
      const joint = root.getObjectByName(`Joint_${i}`);
      if (joint) {
        newLinks.push(joint);
        newQuats.push(joint.quaternion.clone());
      }
    }

    setLinks(newLinks);
    setInitialQuaternions(newQuats);
  }, [scene, modelType]);

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

  return <primitive object={scene} ref={group} />;
};

export default RobotModel;
