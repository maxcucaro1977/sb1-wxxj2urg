import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://screen-mirror-server.onrender.com';
const socket = io(SOCKET_URL);

function App() {
  const [isViewer, setIsViewer] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const isViewerMode = window.location.search.includes('viewer');
    setIsViewer(isViewerMode);

    if (!isViewerMode) {
      startStreaming();
    }

    socket.on('stream-data', (streamData) => {
      if (isViewerMode) {
        const videoElement = document.getElementById('viewer') as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = streamData;
        }
      }
    });

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      socket.off('stream-data');
    };
  }, []);

  const startStreaming = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      
      const videoElement = document.getElementById('streamer') as HTMLVideoElement;
      if (videoElement) {
        videoElement.srcObject = mediaStream;
      }

      socket.emit('stream-data', { stream: mediaStream });
    } catch (error) {
      console.error('Errore accesso fotocamera:', error);
    }
  };

  if (isViewer) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <video
          id="viewer"
          autoPlay
          playsInline
          className="w-full max-w-2xl rounded-lg shadow-lg"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <video
          id="streamer"
          autoPlay
          playsInline
          className="w-full rounded-lg"
        />
        <p className="mt-4 text-center">
          Link per visualizzare: {window.location.origin}?viewer
        </p>
      </div>
    </div>
  );
}

export default App;
