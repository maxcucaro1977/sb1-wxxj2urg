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

// Crea la stanza permanente all'avvio del server
const permanentRoom = {
  id: FIXED_ROOM_ID,
  active: false
};

io.on('connection', (socket) => {
  console.log('Client connesso:', socket.id);

  socket.on('create-room', () => {
