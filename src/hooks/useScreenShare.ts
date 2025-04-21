import { useState, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

export const useScreenShare = (socket: Socket | null) => {
  const [isSharing, setIsSharing] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startScreenShare = useCallback(async () => {
    if (!socket) return;

    try {
      setError(null);
      
      if (!navigator.mediaDevices?.getDisplayMedia) {
        throw new Error('Il tuo browser non supporta la condivisione dello schermo');
      }

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      setStream(mediaStream);
      setIsSharing(true);
      
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp8,opus'
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          socket.emit('stream-data', { stream: event.data });
        }
      };

      mediaRecorder.start(100);

      mediaStream.getVideoTracks()[0].onended = () => {
        mediaRecorder.stop();
        setIsSharing(false);
        setStream(null);
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
      setIsSharing(false);
    }
  }, [socket]);

  const stopScreenShare = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsSharing(false);
    }
  }, [stream]);

  return {
    isSharing,
    error,
    startScreenShare,
    stopScreenShare
  };
};