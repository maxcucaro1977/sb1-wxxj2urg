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

  const startScreenShare = async () => {
    try {
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Il tuo browser non supporta la condivisione dello schermo');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
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

  const downloadApp = () => {
    window.location.href = 'https://github.com/tuorepository/screen-mirror/releases/latest/download/app-release.apk';
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              {isConnected ? 'Connesso' : 'Disconnesso'}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={startScreenShare}
                disabled={!isConnected || isSharing}
                className={`px-4 py-2 rounded-lg ${
                  !isConnected || isSharing
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isSharing ? 'Condivisione in corso...' : 'Condividi Schermo'}
              </button>
              <button
                onClick={downloadApp}
                className="px-4 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white"
              >
                Scarica App Android
              </button>
            </div>
          </div>

          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              id="screen-share"
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
          </div>

          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              id="viewer-video"
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;