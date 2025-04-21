import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.DEV 
  ? 'http://localhost:10000'  // Development server
  : 'https://armony.onrender.com'; // Production server

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000
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
