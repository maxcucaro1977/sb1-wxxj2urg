import { useEffect, useState } from 'react';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ScreenShare } from './components/ScreenShare';
import { VideoViewer } from './components/VideoViewer';
import { useSocket } from './hooks/useSocket';
import { useScreenShare } from './hooks/useScreenShare';

type AppProps = Record<string, never>;

const App: React.FC<AppProps> = () => {
  const { socket, isConnected, isConnecting, error: socketError, reconnectAttempts } = useSocket();
  const { isSharing, error: shareError, startScreenShare } = useScreenShare(socket);
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');

  useEffect(() => {
    if (!socket) return;

    const handleRoomCreated = (id: string) => {
      setRoomId(id);
      setIsHost(true);
    };

    const handleRoomJoined = (id: string) => {
      setRoomId(id);
      setIsHost(false);
    };

    socket.on('room-created', handleRoomCreated);
    socket.on('joined-room', handleRoomJoined);

    return () => {
      socket.off('room-created', handleRoomCreated);
      socket.off('joined-room', handleRoomJoined);
    };
  }, [socket]);

  const handleCreateRoom = () => {
    if (!socket || !isConnected) return;
    socket.emit('create-room');
  };

  const handleJoinRoom = () => {
    if (!socket || !isConnected) return;
    socket.emit('join-room');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Screen Mirror</h1>
