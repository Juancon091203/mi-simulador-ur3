import { useState, useEffect, useMemo } from 'react';

const API = 'http://localhost:5005';

/**
 * Manages all calibration state: spheroid params, trajectory fetch from backend,
 * robot position/rotation calculation and sequence memos.
 */
export function useCalibration() {
  const [spheroidSize, setSpheroidSize] = useState({ x: 0.6, y: 0.6, z: 0.6 });
  const [showSpheroid, setShowSpheroid] = useState(true);
  const [pointCount, setPointCount] = useState(100);
  const [objectCenter, setObjectCenter] = useState({ x: 0.0, y: 1.0, z: 0.0 });
  const [zBounds, setZBounds] = useState({ min: -1.0, max: 1.0 });
  const [showSectors, setShowSectors] = useState(false);
  const [columnHeight, setColumnHeight] = useState(0.5);
  const [orbitRadius, setOrbitRadius] = useState(1.6);
  const [objectModel, setObjectModel] = useState('zapato');
  const [objectScale, setObjectScale] = useState(1.0);
  const [backendSequence, setBackendSequence] = useState([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [robotPositionIndex, setRobotPositionIndex] = useState(0);

  // Fetch trajectory from backend with 250ms debounce
  useEffect(() => {
    let active = true;
    setIsCalculating(true);

    const startTime = Date.now();
    const fetchTrajectory = async () => {
      const reqSize = { x: spheroidSize.x, y: spheroidSize.y, z: spheroidSize.z };
      const reqCenter = { x: objectCenter.x, y: objectCenter.y, z: objectCenter.z };
      const reqBounds = { min: zBounds.min, max: zBounds.max };
      try {
        const response = await fetch(`${API}/calculate_trajectory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            n: pointCount,
            radius: 1.0,
            cx: reqCenter.x,
            cy: reqCenter.z,
            cz: reqCenter.y,
            sx: reqSize.x,
            sy: reqSize.z,
            sz: reqSize.y,
            min_z: reqBounds.min,
            max_z: reqBounds.max,
          }),
        });
        const data = await response.json();
        if (active) {
          if (data.status === 'success' && Array.isArray(data.points)) {
            const pointsMapped = data.points.map((pt, index) => ({
              unitX: (pt.x - reqCenter.x) / reqSize.x,
              unitY: (pt.z - reqCenter.y) / reqSize.y,
              unitZ: (pt.y - reqCenter.z) / reqSize.z,
              sector: pt.sector,
              rx: pt.rx, ry: pt.ry, rz: pt.rz,
              originalIndex: index,
            }));
            setBackendSequence(pointsMapped);
          } else {
            setBackendSequence([]);
          }
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 350 - elapsed);
          setTimeout(() => {
            if (active) setIsCalculating(false);
          }, remaining);
        }
      } catch (err) {
        console.error('Failed to fetch trajectory from backend:', err);
        if (active) { setBackendSequence([]); setIsCalculating(false); }
      }
    };

    const timer = setTimeout(fetchTrajectory, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [
    pointCount,
    spheroidSize.x, spheroidSize.y, spheroidSize.z,
    objectCenter.x, objectCenter.y, objectCenter.z,
    zBounds.min, zBounds.max,
  ]);

  // Reset step when point count changes
  // (currentPhotoStep reset is handled in useCamera to avoid circular dep)

  // Scale backend sequence with current spheroid sizes
  const globalSequence = useMemo(() => {
    if (backendSequence && backendSequence.length > 0) {
      return backendSequence.map(pt => ({
        x: pt.unitX * spheroidSize.x,
        y: pt.unitY * spheroidSize.y,
        z: pt.unitZ * spheroidSize.z,
        sector: pt.sector,
        rx: pt.rx, ry: pt.ry, rz: pt.rz,
        originalIndex: pt.originalIndex,
      }));
    }
    return [];
  }, [backendSequence, spheroidSize]);

  // Robot 3-D position on the orbit circle
  const robotPosition = useMemo(() => {
    const angle = robotPositionIndex * (Math.PI / 3);
    return [
      objectCenter.x + orbitRadius * Math.cos(angle),
      -0.543 + columnHeight,
      objectCenter.z + orbitRadius * Math.sin(angle),
    ];
  }, [robotPositionIndex, objectCenter.x, objectCenter.z, orbitRadius, columnHeight]);

  const robotRotationY = useMemo(() => {
    const angle = robotPositionIndex * (Math.PI / 3);
    return Math.PI - angle;
  }, [robotPositionIndex]);

  return {
    // State
    spheroidSize, setSpheroidSize,
    showSpheroid, setShowSpheroid,
    pointCount, setPointCount,
    objectCenter, setObjectCenter,
    zBounds, setZBounds,
    showSectors, setShowSectors,
    columnHeight, setColumnHeight,
    orbitRadius, setOrbitRadius,
    objectModel, setObjectModel,
    objectScale, setObjectScale,
    isCalculating,
    // Derived
    globalSequence,
    robotPosition,
    robotRotationY,
    robotPositionIndex,
    setRobotPositionIndex,
  };
}
