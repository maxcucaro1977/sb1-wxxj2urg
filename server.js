import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const FIXED_ROOM_ID = '1121';
let hostSocket = null;

const permanentRoom = {
  id: FIXED_ROOM_ID,
  active: false
};

io.on('connection', (socket) => {
  console.log('Client connesso:', socket.id);

  socket.on('create-room', () => {
    permanentRoom.active = true;
    hostSocket = socket.id;
    socket.join(FIXED_ROOM_ID);
    socket.emit('room-created', FIXED_ROOM_ID);
    console.log(`Host connesso alla stanza permanente: ${socket.id}`);
  });

  socket.on('join-room', () => {
    if (permanentRoom.active && hostSocket) {
      socket.join(FIXED_ROOM_ID);
      socket.emit('joined-room', FIXED_ROOM_ID);
      socket.to(FIXED_ROOM_ID).emit('viewer-joined');
      console.log(`Viewer connesso alla stanza permanente: ${socket.id}`);
    } else {
      socket.emit('room-not-found');
      console.log('Tentativo di connessione fallito: host non presente');
    }
  });

  socket.on('stream-data', (data) => {
