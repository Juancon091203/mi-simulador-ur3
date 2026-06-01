import { useState, useEffect, useRef } from 'react';

/**
 * Hook para conectarse directamente al WebSocket del robot de tu compañero.
 * @param {string} defaultUrl - Dirección del servidor WebSocket
 */
export const useRobotWebSocket = (defaultUrl = 'ws://192.168.3.41:7000/ws') => {
  const [jointAngles, setJointAngles] = useState([0, 0, 0, 0, 0, 0]);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Disconnected from WebSocket');
  const wsRef = useRef(null);

  const connect = (url = defaultUrl) => {
    // Si ya existe una conexión, la cerramos antes de abrir una nueva
    if (wsRef.current) {
      wsRef.current.close();
    }

    setStatusMessage('Connecting to WebSocket...');
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setStatusMessage(`Connected to WebSocket: ${url}`);
      console.log('[WebSocket] Conexión abierta con éxito.');
    };

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);

        // Comprobar la estructura según ejemploWebSocket.json
        if (payload.type === 'robot_state' && payload.data && payload.data) {
          const joints = payload.data.joints;
          if (Array.isArray(joints) && joints.length === 6) {
            setJointAngles(joints);
          }
        }
      } catch (error) {
        console.error('[WebSocket] Error al parsear JSON:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[WebSocket] Error en la conexión:', error);
      setStatusMessage('WebSocket Connection Error');
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      setStatusMessage('Disconnected from WebSocket');
      console.log('[WebSocket] Conexión cerrada.');
      wsRef.current = null;
    };
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    jointAngles,
    isConnected,
    statusMessage,
    connect,
    disconnect
  };
};
