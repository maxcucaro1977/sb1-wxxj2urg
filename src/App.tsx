import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.DEV 
  ? `${window.location.protocol}//${window.location.host}`
  : 'https://armony.onrender.com';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      autoConnect: false,
      withCredentials: false
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
