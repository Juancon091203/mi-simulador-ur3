import { useState, useEffect, useRef } from 'react';

/**
 * Custom Hook para gestionar la conexión con el servidor Flask del robot.
 */
export const useRobotConnection = (serverUrl = 'http://localhost:5000') => {
  const [jointAngles, setJointAngles] = useState([0, 0, 0, 0, 0, 0]);
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Disconnected');
  const eventSourceRef = useRef(null);

  const connect = async (ipAddress) => {
    try {
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
