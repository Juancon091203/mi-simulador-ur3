import { useState, useEffect, useRef } from 'react';

/**
 * Custom Hook para gestionar la conexión con el servidor Flask del robot.
 */
export const useRobotConnection = (serverUrl = 'http://localhost:5005') => {
  const [jointAngles, setJointAngles] = useState([0, 0, 0, 0, 0, 0]);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Disconnected');
  const eventSourceRef = useRef(null);

  const connect = async (ipAddress) => {
    try {
      // TODO: BACKEND_ENDPOINT_REQUIRED
      // ENDPOINT: GET /publish_ip/<ip_address>
      // DESCRIPCIÓN: Inicia la suscripción/conexión con la IP del robot UR3 de una estación específica.
      // RESPUESTA ESPERADA: { status: 'success', message: 'Connected' }
      const response = await fetch(`${serverUrl}/publish_ip/${ipAddress}`);
      const data = await response.json();

      if (data.status === 'success') {
        setIsConnected(true);
        setStatusMessage('Connected to Robot');

        // Iniciar el stream de datos si no existe
        if (!eventSourceRef.current) {
          startDataStream();
        }
      } else {
        setStatusMessage(data.message || 'Connection Failed');
        setIsConnected(false);
      }
      return data;
    } catch (error) {
      setStatusMessage('Server Error');
      setIsConnected(false);
      console.error('Connection Error:', error);
      return { status: 'error', message: 'Could not reach Flask server' };
    }
  };

  const disconnect = async () => {
    try {
      // TODO: BACKEND_ENDPOINT_REQUIRED
      // ENDPOINT: GET /disconnect
      // DESCRIPCIÓN: Desconecta el driver del robot UR3 de la estación activa.
      // RESPUESTA ESPERADA: { status: 'success' }
      await fetch(`${serverUrl}/disconnect`);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
      setStatusMessage('Disconnected');
    } catch (error) {
      console.error('Disconnect Error:', error);
    }
  };

  const startDataStream = () => {
    // TODO: BACKEND_ENDPOINT_REQUIRED
    // ENDPOINT: GET /digital (SSE Server-Sent Events)
    // DESCRIPCIÓN: Canal SSE para streaming continuo de ángulos articulares [q0..q5].
    const es = new EventSource(`${serverUrl}/digital`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setJointAngles(data);
    };

    es.onerror = () => {
      console.error('EventSource failed.');
      es.close();
      eventSourceRef.current = null;
    };
  };

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
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
