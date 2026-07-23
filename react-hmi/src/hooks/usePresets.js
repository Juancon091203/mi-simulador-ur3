import { useState, useEffect } from 'react';

const API = 'http://localhost:5005';

/**
 * Manages all preset-related state and server communication.
 * Exposes: presets, handleSavePreset, handleLoadPreset, handleDeletePreset,
 *          editingPresetName, setEditingPresetName, editingPresetForm, setEditingPresetForm
 */
export function usePresets(calibrationState) {
  const [presets, setPresets] = useState({});
  const [editingPresetName, setEditingPresetName] = useState(null); // nombre o '__new__'
  const [editingPresetForm, setEditingPresetForm] = useState('');

  // Fetch presets from backend on mount
  useEffect(() => {
    const fetchPresets = async () => {
      try {
        // TODO: BACKEND_ENDPOINT_REQUIRED
        // ENDPOINT: GET /presets
        // DESCRIPCIÓN: Carga el diccionario de presets guardados en el servidor o archivo JSON.
        // RESPUESTA: { "Preset 1": { pointCount: 100, spheroidSize, objectCenter, zBounds, objectModel: 'zapato', objectScale: 1.0 }, ... }
        const response = await fetch(`${API}/presets`);
        const data = await response.json();
        setPresets(data);
      } catch (err) {
        console.error('Failed to fetch presets:', err);
      }
    };
    fetchPresets();
  }, []);

  const handleSavePreset = async (name, selectedPoints = []) => {
    const {
      spheroidSize, objectCenter, zBounds,
      pointCount, columnHeight, orbitRadius,
      objectModel, objectScale,
    } = calibrationState;
    const pointsToSave = selectedPoints.length > 0
      ? selectedPoints
      : (calibrationState.selectedPreInspectionPoints || []);

    const config = {
      spheroidSize, objectCenter, zBounds, pointCount, columnHeight, orbitRadius,
      objectModel, objectScale,
      selectedPreInspectionPoints: pointsToSave,
    };
    try {
      // TODO: BACKEND_ENDPOINT_REQUIRED
      // ENDPOINT: POST /save_preset
      // DESCRIPCIÓN: Guarda o actualiza un preset en el servidor con su geometría, modelo 3D y 4 puntos de pre-inspección.
      // PAYLOAD: { name: "Preset 1", config: { pointCount, spheroidSize, objectCenter, zBounds, objectModel, objectScale, selectedPreInspectionPoints } }
      const response = await fetch(`${API}/save_preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config }),
      });
      const data = await response.json();
      if (data.status === 'success') setPresets(data.presets);
      else setPresets(prev => ({ ...prev, [name]: config }));
    } catch (err) {
      console.error('Failed to save preset:', err);
      setPresets(prev => ({ ...prev, [name]: config }));
    }
  };

  const handleDeletePreset = async (name) => {
    try {
      const response = await fetch(`${API}/delete_preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (data.status === 'success') setPresets(data.presets);
    } catch (err) {
      console.error('Failed to delete preset:', err);
    }
  };

  const handleLoadPreset = (name, calibrationSetters) => {
    const config = presets[name];
    if (!config) return;
    const { setSpheroidSize, setObjectCenter, setZBounds, setPointCount, setColumnHeight, setOrbitRadius, setObjectModel, setObjectScale, setSelectedPreInspectionPoints } = calibrationSetters;
    if (config.spheroidSize) setSpheroidSize(config.spheroidSize);
    if (config.objectCenter) setObjectCenter(config.objectCenter);
    if (config.zBounds) setZBounds(config.zBounds);
    if (config.pointCount !== undefined) setPointCount(config.pointCount);
    if (config.columnHeight !== undefined) setColumnHeight(config.columnHeight);
    if (config.orbitRadius !== undefined) setOrbitRadius(config.orbitRadius);
    if (config.objectModel !== undefined && setObjectModel) setObjectModel(config.objectModel);
    if (config.objectScale !== undefined && setObjectScale) setObjectScale(config.objectScale);
    if (config.selectedPreInspectionPoints !== undefined && setSelectedPreInspectionPoints) {
      setSelectedPreInspectionPoints(config.selectedPreInspectionPoints);
    }
  };

  return {
    presets,
    setPresets,
    editingPresetName,
    setEditingPresetName,
    editingPresetForm,
    setEditingPresetForm,
    handleSavePreset,
    handleDeletePreset,
    handleLoadPreset,
  };
}
