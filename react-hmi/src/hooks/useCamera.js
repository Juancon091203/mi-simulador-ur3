import { useState, useEffect, useMemo } from 'react';

const API = 'http://localhost:5005';

/**
 * Manages photo capture state, camera status polling, manual/auto capture loop,
 * and related memos (activePoint, pendingPointsPositions, nextFivePoints).
 *
 * @param {object} options
 * @param {Array}  options.globalSequence - Scaled trajectory points from useCalibration
 * @param {number} options.pointCount     - Total number of capture points
 * @param {function} options.setRobotPositionIndex - Sync robot sector position
 */
export function useCamera({ globalSequence, pointCount, setRobotPositionIndex }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhotoStep, setCurrentPhotoStep] = useState(0);
  const [photos, setPhotos] = useState([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [cameraConnected, setCameraConnected] = useState(false);
  const [stabilityThreshold, setStabilityThreshold] = useState(0.25);

  // Poll camera connection status every 3s
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const res = await fetch(`${API}/camera/status`);
        const data = await res.json();
        setCameraConnected(data.camera_connected);
      } catch {
        setCameraConnected(false);
      }
    };
    checkCamera();
    const interval = setInterval(checkCamera, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch photos on mount
  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        const res = await fetch(`${API}/camera/photos`);
        const data = await res.json();
        setPhotos(data);
      } catch (err) {
        console.error('Failed to fetch photos on load:', err);
      }
    };
    fetchPhotos();
  }, []);

  // Reset step when point count changes
  useEffect(() => {
    setCurrentPhotoStep(0);
  }, [pointCount]);

  // Automated event-driven capture loop (unstable → stable transitions)
  useEffect(() => {
    if (!isPlaying) return;
    let active = true;
    let hasSeenUnstable = false;
    let isCapturing = false;

    const checkLoop = async () => {
      while (active && isPlaying) {
        try {
          const res = await fetch(`${API}/camera/status`);
          if (!res.ok) throw new Error('Status request failed');
          const statusData = await res.json();
          if (!active || !isPlaying) break;

          const isStable = statusData.stable;
          if (!isStable) {
            hasSeenUnstable = true;
          } else if (isStable && !isCapturing) {
            const hasPhotoForStep = photos.some(p => p.step === currentPhotoStep);
            if (hasSeenUnstable || (!hasPhotoForStep && currentPhotoStep === 0)) {
              isCapturing = true;
              try {
                const captureRes = await fetch(`${API}/camera/capture`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ step: currentPhotoStep }),
                });
                const captureData = await captureRes.json();
                if (captureData.status === 'success' && active) setPhotos(captureData.photos);
              } catch (err) {
                console.error('Error capturing photo in play run:', err);
              }
              if (!active || !isPlaying) break;
              setCurrentPhotoStep(prev => {
                const next = prev + 1;
                if (next >= pointCount) setIsPlaying(false);
                return next;
              });
              hasSeenUnstable = false;
              isCapturing = false;
            }
          }
        } catch (err) {
          console.error('Error polling camera stability in run loop:', err);
        }
        await new Promise(resolve => setTimeout(resolve, 250));
      }
    };

    checkLoop();
    return () => { active = false; };
  }, [isPlaying, currentPhotoStep, pointCount, photos]);

  // Sync robot sector from active point
  const activePoint = useMemo(() => {
    if (currentPhotoStep >= 0 && currentPhotoStep < globalSequence.length) {
      return globalSequence[currentPhotoStep];
    }
    return null;
  }, [globalSequence, currentPhotoStep]);

  useEffect(() => {
    if (activePoint !== null) setRobotPositionIndex(activePoint.sector);
  }, [activePoint, setRobotPositionIndex]);

  const pendingPointsPositions = useMemo(() => {
    const positions = [];
    globalSequence.forEach((pt, idx) => {
      if (idx > currentPhotoStep) positions.push(pt.x, pt.y, pt.z);
    });
    return new Float32Array(positions);
  }, [globalSequence, currentPhotoStep]);

  const nextFivePoints = useMemo(() => {
    const points = [];
    if (activePoint) points.push([activePoint.x, activePoint.y, activePoint.z]);
    const startIdx = currentPhotoStep + 1;
    const endIdx = Math.min(globalSequence.length, startIdx + 5);
    for (let i = startIdx; i < endIdx; i++) {
      const pt = globalSequence[i];
      points.push([pt.x, pt.y, pt.z]);
    }
    return points;
  }, [globalSequence, currentPhotoStep, activePoint]);

  // Manual capture handlers
  const handleManualNext = async () => {
    if (currentPhotoStep < pointCount) {
      try {
        const res = await fetch(`${API}/camera/capture`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ step: currentPhotoStep }),
        });
        const data = await res.json();
        if (data.status === 'success') setPhotos(data.photos);
      } catch (err) {
        console.error('Failed manual photo capture:', err);
      }
      setCurrentPhotoStep(prev => prev + 1);
    }
  };

  const handleManualPrev = () => {
    if (currentPhotoStep > 0) setCurrentPhotoStep(prev => prev - 1);
  };

  const handleClearPhotos = async () => {
    try {
      const res = await fetch(`${API}/camera/clear_photos`, { method: 'POST' });
      const data = await res.json();
      setPhotos(data.photos || []);
    } catch (err) {
      console.error('Failed to clear photos:', err);
    }
  };

  const handleDeletePhoto = async (stepIndex) => {
    try {
      const res = await fetch(`${API}/camera/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepIndex }),
      });
      const data = await res.json();
      if (data.status === 'success') setPhotos(data.photos || []);
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  return {
    isPlaying, setIsPlaying,
    currentPhotoStep, setCurrentPhotoStep,
    photos, setPhotos,
    isGalleryOpen, setIsGalleryOpen,
    cameraConnected,
    stabilityThreshold, setStabilityThreshold,
    activePoint,
    pendingPointsPositions,
    nextFivePoints,
    handleManualNext,
    handleManualPrev,
    handleClearPhotos,
    handleDeletePhoto,
  };
}
