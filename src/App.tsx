import { useEffect, useState } from 'react';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ScreenShare } from './components/ScreenShare';
import { VideoViewer } from './components/VideoViewer';
import { useSocket } from './hooks/useSocket';
import { useScreenShare } from './hooks/useScreenShare';

const App = () => {
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

  const renderConnectionError = () => {
    if (!socketError && !shareError) return null;
    return (
      <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
        {socketError || shareError}
      </div>
    );
