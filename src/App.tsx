import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'https://screen-mirror-server.onrender.com';
const socket = io(SOCKET_URL);

const FIXED_ROOM_ID = '1121';

function App() {
  const [isHost, setIsHost] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);

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
      console.log('Unito alla stanza:', id);
      if (!isHost) {
        initializePeerConnection();
      }
    });

    socket.on('room-not-found', () => {
      setError('Host non presente nella stanza');
      console.log('Host non trovato');
    });

    socket.on('viewer-joined', async () => {
      if (isHost) {
        initializePeerConnection();
      }
    });

    socket.on('ice-candidate', async (candidate) => {
      try {
        if (peerConnection) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error('Errore nell\'aggiunta del candidato ICE:', err);
      }
    });

    socket.on('offer', async (offer) => {
      if (!isHost) {
        try {
          const pc = new RTCPeerConnection();
          setPeerConnection(pc);

          pc.ontrack = (event) => {
            const videoElement = document.querySelector('#viewer-video') as HTMLVideoElement;
            if (videoElement && event.streams[0]) {
              videoElement.srcObject = event.streams[0];
            }
          };

          pc.onicecandidate = (event) => {
            if (event.candidate) {
              socket.emit('ice-candidate', { roomId: FIXED_ROOM_ID, candidate: event.candidate });
            }
          };

          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('answer', { roomId: FIXED_ROOM_ID, answer });
        } catch (err) {
          console.error('Errore nella gestione dell\'offerta:', err);
          setError('Errore nella connessione video');
        }
      }
    });

    socket.on('answer', async (answer) => {
      if (isHost && peerConnection) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Errore nell\'impostazione della risposta:', err);
        }
      }
    });

    return () => {
      socket.off('connect');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('room-created');
      socket.off('joined-room');
      socket.off('room-not-found');
      socket.off('viewer-joined');
      socket.off('ice-candidate');
      socket.off('offer');
      socket.off('answer');
      if (peerConnection) {
        peerConnection.close();
      }
    };
  }, [isHost, peerConnection]);

  const initializePeerConnection = () => {
    const pc = new RTCPeerConnection();
    setPeerConnection(pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { roomId: FIXED_ROOM_ID, candidate: event.candidate });
