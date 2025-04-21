import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Ensure we use the correct protocol and port for development
const SOCKET_URL = import.meta.env.DEV 
  ? `ws://${window.location.hostname}:10000`
  : 'https://armony.onrender.com';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: false,
      forceNew: true
    });

    newSocket.connect();

    newSocket.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      setReconnectAttempts(0);
    });

    newSocket.on('connect_error', (err) => {
      setIsConnected(false);
      setIsConnecting(false);
      setError(`Errore di connessione: ${err.message}`);
      
      if (reconnectAttempts < 5) {
        setTimeout(() => {
          setReconnectAttempts(prev => prev + 1);
          newSocket.connect();
        }, 1000 * Math.pow(2, reconnectAttempts));
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setError('Disconnesso dal server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [reconnectAttempts]);

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    reconnectAttempts
  };
}
