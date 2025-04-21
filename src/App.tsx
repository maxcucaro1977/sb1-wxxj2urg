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
  const [isConnected, setIsConnected] = useState(false);
  const [isMobile] = useState(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  });

  useEffect(() => {
    socket.on('connect', () => {
      setError(null);
      setIsConnected(true);
      console.log('Connesso al server');
    });

    socket.on('connect_error', (error) => {
      setIsConnected(false);
      setError('Errore di connessione al server: ' + error.message);
      console.error('Errore di connessione:', error);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setError('Disconnesso dal server');
      console.log('Disconnesso dal server');
    });

    socket.on('stream-data', async (data) => {
      try {
        const videoElement = document.querySelector('#viewer-video') as HTMLVideoElement;
        if (videoElement) {
          const stream = new MediaStream();
          stream.addTrack(data.track);
          videoElement.srcObject = stream;
          await videoElement.play();
        }
      } catch (err) {
        console.error('Errore nella riproduzione dello stream:', err);
      }
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('stream-data');
    };
  }, []);

  const startStream = async () => {
    try {
      setError(null);
      
      const constraints = isMobile 
        ? { video: { facingMode: 'environment' }, audio: false }
        : { video: true, audio: false };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setIsSharing(true);
      
      const videoElement = document.querySelector('#screen-share') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
      }

      const videoTrack = stream.getVideoTracks()[0];
      socket.emit('stream-data', { track: videoTrack });
      
      videoTrack.onended = () => {
        setIsSharing(false);
        if (videoElement) {
          videoElement.srcObject = null;
        }
      };
    } catch (err) {
      setIsSharing(false);
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full"
