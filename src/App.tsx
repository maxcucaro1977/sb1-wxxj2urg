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
      const videoElement = document.querySelector('#viewer-video') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
      }
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('stream-data');
    };
  }, []);

  const startScreenShare = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      setIsSharing(true);
      
      const videoElement = document.querySelector('#screen-share') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = stream;
      }

      socket.emit('stream-data', { stream });
      
      stream.getVideoTracks()[0].onended = () => {
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
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Screen Mirror</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={startScreenShare}
            disabled={isSharing}
            className={`w-full py-3 px-4 rounded-lg text-white font-medium ${
              isSharing 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }`}
          >
            {isSharing ? 'Condivisione in corso...' : 'Condividi Schermo'}
          </button>

          <button
            onClick={() => {
              const video = document.querySelector('#viewer-video') as HTMLVideoElement;
              if (video) {
                video.style.display = video.style.display === 'none' ? 'block' : 'none';
              }
            }}
            className="w-full py-3 px-4 rounded-lg text-white font-medium bg-green-600 hover:bg-green-700"
          >
            Guarda Condivisione
          </button>
        </div>
        
        <div className="mt-6">
          <video id="screen-share" autoPlay playsInline className="w-full rounded-lg" />
          <video id="viewer-video" autoPlay playsInline className="w-full rounded-lg" style={{display: 'none'}} />
        </div>
      </div>
    </div>
  );
}

export default App;
