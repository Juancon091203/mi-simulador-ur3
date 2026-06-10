import { useState, useEffect } from 'react';

export const useRobotHttp = (ip) => {
    const [jointAngles, setJointAngles] = useState([0, 0, 0, 0, 0, 0]);
    const [isConnected, setIsConnected] = useState(false);
    const [statusMessage, setStatusMessage] = useState('Disconnected');

    useEffect(() => {
        // Esta función obtiene los datos del servidor C++
        const fetchData = async () => {
            try {
                const response = await fetch(`http://${ip}:7000/joints`);
                if (!response.ok) throw new Error('No conectado');

                const data = await response.json();

                // Convertimos los grados de Estun a radianes para Three.js
                const radians = data.joints.map(deg => deg * Math.PI / 180);

                setJointAngles(radians);
                setIsConnected(true);
                setStatusMessage('Connected to Robot');
            } catch (err) {
                setIsConnected(false);
                setStatusMessage('Connection Lost');
            }
        };

        // Consultar cada 50ms para una fluidez de 20fps
        const interval = setInterval(fetchData, 50);

        return () => clearInterval(interval);
    }, [ip]);

    return { jointAngles, isConnected, statusMessage };
};