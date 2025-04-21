import { useEffect, useState } from 'react';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ScreenShare } from './components/ScreenShare';
import { VideoViewer } from './components/VideoViewer';
import { useSocket } from './hooks/useSocket';
import { useScreenShare } from './hooks/useScreenShare';

function App() {
  const { socket, isConnected, isConnecting, error: socketError, reconnectAttempts } = useSocket();
  const { isSharing, error: shareError, startScreenShare } = useScreenShare(socket);
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');

  useEffect(() => {
    if (!socket) return;

    socket.on('room-created', (id) => {
      setRoomId(id);
      setIsHost(true);
    });

    socket.on('joined-room', (id) => {
      setRoomId(id);
      setIsHost(false);
    });

    return () => {
      socket.off('room-created');
      socket.off('joined-room');
    };
  }, [socket]);

  const createRoom = () => {
    if (!socket || !isConnected) return;
    socket.emit('create-room');
  };

  const joinRoom = () => {
    if (!socket || !isConnected) return;
    socket.emit('join-room');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Screen Mirror</h1>
        
        <ConnectionStatus
          isConnecting={isConnecting}
          isConnected={isConnected}
          reconnectAttempts={reconnectAttempts}
