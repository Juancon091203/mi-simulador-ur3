import { useState, useEffect } from 'react';

export const useRobotHttp = (ip) => {
    const [jointAngles, setJointAngles] = useState([0, 0, 0, 0, 0, 0]);
    const [isConnected, setIsConnected] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Disconnected');

    useEffect(() => {
        let active = true;
        let timerId = null;

        const fetchData = async () => {
            let success = false;
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1000);
                
                const response = await fetch(`http://${ip}:7000/joints`, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!response.ok) throw new Error('No conectado');

                const data = await response.json();

                if (active) {
                    // Convertimos los grados de Estun a radianes para Three.js
                    const radians = data.joints.map(deg => deg * Math.PI / 180);
                    setJointAngles(radians);
                    setIsConnected(true);
                    setStatusMessage('Connected to Robot');
                    success = true;
                }
            } catch (err) {
                if (active) {
                    setIsConnected(false);
                    setStatusMessage('Connection Lost');
                }
            }

            if (active) {
                // Si la conexión fue exitosa, consultar de nuevo en 50ms para fluidez de 20fps.
                // Si falló, esperar 2000ms antes de reintentar para no saturar el pool de conexiones.
                timerId = setTimeout(fetchData, success ? 50 : 2000);
            }
        };

        fetchData();

        return () => {
            active = false;
            if (timerId) clearTimeout(timerId);
        };
    }, [ip]);

    return { jointAngles, isConnected, statusMessage };
};