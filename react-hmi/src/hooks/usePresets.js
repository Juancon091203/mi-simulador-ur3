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
        const response = await fetch(`${API}/presets`);
        const data = await response.json();
        setPresets(data);
      } catch (err) {
        console.error('Failed to fetch presets:', err);
      }
    };
    fetchPresets();
  }, []);

  const handleSavePreset = async (name) => {
    const {
      spheroidSize, objectCenter, zBounds,
      pointCount, columnHeight, orbitRadius,
    } = calibrationState;
    const config = { spheroidSize, objectCenter, zBounds, pointCount, columnHeight, orbitRadius };
    try {
      const response = await fetch(`${API}/save_preset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, config }),
      });
      const data = await response.json();
      if (data.status === 'success') setPresets(data.presets);
    } catch (err) {
      console.error('Failed to save preset:', err);
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
    const { setSpheroidSize, setObjectCenter, setZBounds, setPointCount, setColumnHeight, setOrbitRadius } = calibrationSetters;
    if (config.spheroidSize) setSpheroidSize(config.spheroidSize);
    if (config.objectCenter) setObjectCenter(config.objectCenter);
    if (config.zBounds) setZBounds(config.zBounds);
    if (config.pointCount !== undefined) setPointCount(config.pointCount);
    if (config.columnHeight !== undefined) setColumnHeight(config.columnHeight);
    if (config.orbitRadius !== undefined) setOrbitRadius(config.orbitRadius);
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
