import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://screen-mirror-server.onrender.com';
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

function App() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socket.on('connect_error', (error) => {
      setError('Errore di connessione al server: ' + error.message);
    });

    socket.on('stream-data', (stream) => {
      const videoElement = document.querySelector('#viewer-video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    });

