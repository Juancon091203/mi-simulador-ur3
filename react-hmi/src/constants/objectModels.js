/**
 * Registro escalable de modelos 3D de objetos para fotografiar.
 * Para añadir un nuevo modelo en el futuro, simplemente añade una entrada a este array.
 */
export const AVAILABLE_OBJECT_MODELS = [
  { id: 'zapato', name: 'Zapato', path: '/scenes/zapato.glb' },
  { id: 'bolsito', name: 'Bolsito', path: '/scenes/bolsito.glb' },
  { id: 'tacones', name: 'Tacones', path: '/scenes/tacones.glb' },
];

export const DEFAULT_OBJECT_MODEL = 'zapato';
export const DEFAULT_OBJECT_SCALE = 1.0;

export const getObjectModelPath = (modelId) => {
  const found = AVAILABLE_OBJECT_MODELS.find((m) => m.id === modelId);
  return found ? found.path : AVAILABLE_OBJECT_MODELS[0].path;
};
