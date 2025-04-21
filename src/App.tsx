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
      socket.off('room-not-found');
      socket.off('stream-data');
    };
  }, [isHost]);

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

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      setIsSharing(true);
      
      const videoElement = document.createElement('video');
      videoElement.srcObject = stream;
      videoElement.autoplay = true;
      videoElement.className = 'w-full rounded-lg';
      
      const container = document.getElementById('screen-share-container');
      if (container) {
        container.innerHTML = '';
        container.appendChild(videoElement);
      }

      socket.emit('stream-data', { roomId: FIXED_ROOM_ID, stream });
      
      stream.getVideoTracks()[0].onended = () => {
        setIsSharing(false);
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
                isConnected ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Diventa Host
            </button>
            
            <div className="flex space-x-2">
              <button
                onClick={joinRoom}
                disabled={!isConnected}
                className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
                  isConnected ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                Unisciti come Spettatore
              </button>
            </div>
          </div>
        )}

        {roomId && (
          <div className="space-y-4">
            {isHost ? (
              <button
                onClick={startScreenShare}
                disabled={isSharing}
                className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                  isSharing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }`}
              >
                {isSharing ? 'Condivisione in corso...' : 'Inizia a Condividere'}
              </button>
            ) : (
              <video
                id="viewer-video"
                autoPlay
                playsInline
                className="w-full rounded-lg bg-gray-50"
              />
            )}
          </div>
        )}
        
        <div 
          id="screen-share-container" 
          className="mt-6 rounded-lg bg-gray-50 min-h-[200px] flex items-center justify-center"
        >
          {!isSharing && isHost && (
            <p className="text-gray-500">
              La condivisione apparirà qui
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;