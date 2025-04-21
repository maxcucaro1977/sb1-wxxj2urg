import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Determine the correct WebSocket URL based on the environment
const SOCKET_URL = import.meta.env.DEV 
  ? window.location.hostname === 'localhost'
    ? 'http://localhost:10000'
    : `http://${window.location.hostname}:10000`
  : 'https://armony.onrender.com';

// Configure Socket.IO with more robust connection options
const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'], // Try WebSocket first, fallback to polling
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  autoConnect: false // Prevent automatic connection attempts
});

const FIXED_ROOM_ID = '1121';

function App() {
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    // Connect manually after setup
    socket.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      setReconnectAttempts(0);
      console.log('Connesso al server');
    });

    socket.on('connect_error', (error) => {
      setIsConnected(false);
      setIsConnecting(false);
      setError('Errore di connessione al server: ' + error.message);
      console.error('Errore di connessione:', error);
