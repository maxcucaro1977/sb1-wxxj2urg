import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.DEV 
  ? 'http://localhost:10000'  // Development server
  : 'https://armony.onrender.com'; // Production server

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
});

const FIXED_ROOM_ID = '1121';

function App() {
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      console.log('Connesso al server');
    });

    socket.on('connect_error', (error) => {
      setIsConnected(false);
      setIsConnecting(false);
      setError('Errore di connessione al server: ' + error.message);
      console.error('Errore di connessione:', error);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setError('Disconnesso dal server');
      console.log('Disconnesso dal server');
    });

    socket.on('room-created', (id) => {
      setRoomId(id);
      setIsHost(true);
      console.log('Stanza creata:', id);
    });

    socket.on('joined-room', (id) => {
      setRoomId(id);
      setIsHost(false);
      console.log('Unito alla stanza:', id);
    });

    socket.on('room-not-found', () => {
      setError('Host non presente nella stanza');
      console.log('Host non trovato');
    });

    socket.on('stream-data', (streamData) => {
      if (!isHost) {
        const videoElement = document.querySelector('#viewer-video') as HTMLVideoElement;
        if (videoElement) {
          const blob = new Blob([streamData], { type: 'video/webm' });
          videoElement.src = URL.createObjectURL(blob);
          videoElement.play().catch(console.error);
        }
      }
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('room-created');
      socket.off('joined-room');
      socket.off('room-not-found');
      socket.off('stream-data');
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isHost, stream]);

  const createRoom = () => {
    if (!isConnected) {
      setError('Non connesso al server');
      return;
    }
    console.log('Richiesta creazione stanza');
    socket.emit('create-room');
  };

  const joinRoom = () => {
    if (!isConnected) {
      setError('Non connesso al server');
      return;
    }
    console.log('Richiesta unione alla stanza');
    socket.emit('join-room', FIXED_ROOM_ID);
  };

  const startScreenShare = async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Il tuo browser non supporta la condivisione dello schermo');
      }

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      setStream(mediaStream);
      setIsSharing(true);
      
      const videoElement = document.createElement('video');
      videoElement.srcObject = mediaStream;
      videoElement.autoplay = true;
      videoElement.className = 'w-full rounded-lg';
      
      const container = document.getElementById('screen-share-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(videoElement);
      }

      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          socket.emit('stream-data', { roomId: FIXED_ROOM_ID, stream: event.data });
        }
      };

      mediaRecorder.start(100); // Invia chunks ogni 100ms

      mediaStream.getVideoTracks()[0].onended = () => {
        mediaRecorder.stop();
        setIsSharing(false);
        setStream(null);
        if (container) {
          container.innerHTML = '';
        }
      };
    } catch (err) {
      console.error('Errore:', err);
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
      setIsSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Screen Mirror</h1>
        
        <div className={`mb-4 p-4 rounded-lg ${
          isConnecting ? 'bg-yellow-100 text-yellow-700' :
          isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {isConnecting ? 'Connessione al server in corso...' :
           isConnected ? 'Connesso al server' : 'Non connesso al server'}
        </div>
