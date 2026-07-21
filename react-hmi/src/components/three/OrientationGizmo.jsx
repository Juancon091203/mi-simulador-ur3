import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * GizmoCameraSync - Subcomponente que corre DENTRO del Canvas de Three.js
 * Extrae la matriz de rotación de la cámara en cada frame sin interferir en el renderizado.
 */
export const GizmoCameraSync = ({ onMatrixUpdate }) => {
  const { camera } = useThree();
  const mat = useRef(new THREE.Matrix3());

  useFrame(() => {
    if (camera && onMatrixUpdate) {
      mat.current.setFromMatrix4(camera.matrixWorldInverse);
      onMatrixUpdate([...mat.current.elements]);
    }
  });

  return null;
};

/**
 * OrientationGizmoOverlay - Subcomponente HTML/SVG flotante posicionado en la esquina superior derecha.
 * Renders 100% fiable sobre el visor 3D en la esquina (top: 15px, right: 15px).
 */
export const OrientationGizmoOverlay = ({ matrixElements, darkMode = false, onSnapView }) => {
  const lineX = useRef();
  const lineY = useRef();
  const lineZ = useRef();

  const headX = useRef();
  const headY = useRef();
  const headZ = useRef();

  const textX = useRef();
  const textY = useRef();
  const textZ = useRef();

  useEffect(() => {
    if (!matrixElements) return;
    const e = matrixElements;
    const radius = 20;
    const cx = 35;
    const cy = 35;

    // Proyección de los ejes locales X, Y, Z a la pantalla 2D (Z = Altura Vertical, Y = Profundidad)
    const xX = cx + e[0] * radius;
    const xY = cy - e[1] * radius;

    const yX = cx + e[6] * radius;
    const yY = cy - e[7] * radius;

    const zX = cx + e[3] * radius;
    const zY = cy - e[4] * radius;

    if (lineX.current && headX.current && textX.current) {
      lineX.current.setAttribute('x2', xX.toFixed(1));
      lineX.current.setAttribute('y2', xY.toFixed(1));
      headX.current.setAttribute('cx', xX.toFixed(1));
      headX.current.setAttribute('cy', xY.toFixed(1));
      textX.current.setAttribute('x', xX.toFixed(1));
      textX.current.setAttribute('y', (xY + 3.5).toFixed(1));

      lineY.current.setAttribute('x2', yX.toFixed(1));
      lineY.current.setAttribute('y2', yY.toFixed(1));
      headY.current.setAttribute('cx', yX.toFixed(1));
      headY.current.setAttribute('cy', yY.toFixed(1));
      textY.current.setAttribute('x', yX.toFixed(1));
      textY.current.setAttribute('y', (yY + 3.5).toFixed(1));

      lineZ.current.setAttribute('x2', zX.toFixed(1));
      lineZ.current.setAttribute('y2', zY.toFixed(1));
      headZ.current.setAttribute('cx', zX.toFixed(1));
      headZ.current.setAttribute('cy', zY.toFixed(1));
      textZ.current.setAttribute('x', zX.toFixed(1));
      textZ.current.setAttribute('y', (zY + 3.5).toFixed(1));
    }
  }, [matrixElements]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '15px',
        right: '15px',
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        background: darkMode ? 'rgba(15, 23, 42, 0.75)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-glass)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 20,
        pointerEvents: 'auto',
        userSelect: 'none',
      }}
    >
      <svg width="70" height="70" viewBox="0 0 70 70">
        {/* Centro del origen */}
        <circle cx="35" cy="35" r="3" fill={darkMode ? '#94a3b8' : '#64748b'} />

        {/* Eje X (Rojo) */}
        <line ref={lineX} x1="35" y1="35" x2="55" y2="35" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
        <circle ref={headX} cx="55" cy="35" r="7" fill="#ef4444" style={{ cursor: 'pointer' }} onClick={() => onSnapView && onSnapView('X')} />
        <text ref={textX} x="55" y="38.5" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" style={{ pointerEvents: 'none' }}>X</text>

        {/* Eje Y (Verde) */}
        <line ref={lineY} x1="35" y1="35" x2="35" y2="15" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        <circle ref={headY} cx="35" cy="15" r="7" fill="#10b981" style={{ cursor: 'pointer' }} onClick={() => onSnapView && onSnapView('Y')} />
        <text ref={textY} x="35" y="18.5" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" style={{ pointerEvents: 'none' }}>Y</text>

        {/* Eje Z (Azul) */}
        <line ref={lineZ} x1="35" y1="35" x2="35" y2="55" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        <circle ref={headZ} cx="35" cy="55" r="7" fill="#3b82f6" style={{ cursor: 'pointer' }} onClick={() => onSnapView && onSnapView('Z')} />
        <text ref={textZ} x="35" y="58.5" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" style={{ pointerEvents: 'none' }}>Z</text>
      </svg>
    </div>
  );
};
