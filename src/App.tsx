import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://armony.onrender.com';
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

function App() {
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setError(null);
      console.log('Connesso al server');
    });

    socket.on('connect_error', (error) => {
      setError('Errore di connessione al server: ' + error.message);
      console.error('Errore di connessione:', error);
    });

    socket.on('stream-data', (stream) => {
