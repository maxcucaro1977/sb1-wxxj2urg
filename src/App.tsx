import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://screen-mirror-server.onrender.com';
const socket = io(SOCKET_URL);

const FIXED_ROOM_ID = '1121';

function App() {
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    socket.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
      setIsConnecting(false);
      setError('Errore di connessione al server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setError('Disconnesso dal server');
    });

    socket.on('room-created', (id) => {
      setRoomId(id);
      setIsHost(true);
      startMobileStream();
    });

    socket.on('joined-room', (id) => {
      setRoomId(id);
      setIsHost(false);
    });

    socket.on('stream-data', (stream) => {
      if (!isHost) {
        const videoElement = document.querySelector('#viewer-video') as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
        }
      }
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('room-created');
      socket.off('joined-room');
      socket.off('stream-data');
    };
  }, [isHost]);

  const startMobileStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });
      
      setIsSharing(true);
      
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.className = 'w-full rounded-lg';
      
      const container = document.getElementById('screen-share-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(videoElement);
      }

      socket.emit('stream-data', { roomId: FIXED_ROOM_ID, stream });
      
      stream.getTracks()[0].onended = () => {
        setIsSharing(false);
        if (container) {
          container.innerHTML = '';
        }
      };
    } catch (err) {
      console.error('Errore:', err);
      setError('Impossibile accedere alla fotocamera');
      setIsSharing(false);
    }
  };

  const createRoom = () => {
    if (!isConnected) {
      setError('Non connesso al server');
      return;
    }
    socket.emit('create-room');
  };

  const joinRoom = () => {
    if (!isConnected) {
      setError('Non connesso al server');
      return;
    }
    socket.emit('join-room', FIXED_ROOM_ID);
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

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {!roomId && (
          <div className="space-y-4">
            <button
              onClick={createRoom}
              disabled={!isConnected}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
