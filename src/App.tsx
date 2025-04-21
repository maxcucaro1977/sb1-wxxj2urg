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
  const [isConnected, setIsConnected] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

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
        setError('Errore nella riproduzione dello stream');
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

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });

      // Combina gli stream video e audio
      const combinedStream = new MediaStream();
      displayStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
      });
      audioStream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
      });
      
      setStream(combinedStream);
      setIsSharing(true);
      
      const videoElement = document.querySelector('#screen-share') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = combinedStream;
      }

      // Invia lo stream al server
      socket.emit('stream-data', { 
        track: combinedStream.getVideoTracks()[0],
        audio: true
      });
      
      // Gestione della fine della condivisione
      combinedStream.getVideoTracks()[0].onended = () => {
        stopSharing();
      };
    } catch (err) {
      setIsSharing(false);
      setStream(null);
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
    }
  };

  const stopSharing = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      const videoElement = document.querySelector('#screen-share') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = null;
      }
    }
    setIsSharing(false);
    setStream(null);
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <h1 className="text-2xl font-bold text-gray-800">
              {isConnected ? 'Connesso' : 'Disconnesso'}
            </h1>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg w-full">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={isSharing ? stopSharing : startScreenShare}
              disabled={!isConnected}
              className={`px-4 py-2 rounded-lg ${
                !isConnected
                  ? 'bg-gray-300 cursor-not-allowed'
                  : isSharing
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSharing ? 'Interrompi Condivisione' : 'Condividi Schermo'}
            </button>

            {isSharing && (
              <button
                onClick={toggleAudio}
                className={`px-4 py-2 rounded-lg ${
                  isMuted
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white`}
              >
                {isMuted ? 'Attiva Audio' : 'Disattiva Audio'}
              </button>
            )}
          </div>
          
          <div className="w-full space-y-4">
            <div className="relative">
              <video 
                id="screen-share"
                autoPlay 
                playsInline
                muted 
                className="w-full aspect-video bg-black rounded-lg"
              />
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                Il tuo schermo
              </div>
            </div>
            
            <div className="relative">
              <video 
                id="viewer-video" 
                autoPlay 
                playsInline 
                className="w-full aspect-video bg-black rounded-lg"
              />
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                Visualizzazione remota
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;