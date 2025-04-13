import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());

const waitingQueue = [];
const rooms = [];
const recentPairs = new Set();
const socketToRoom = new Map();

function pairKey(a, b) {
  return [a, b].sort().join('-');
}

function tryToMatch() {
  while (waitingQueue.length >= 2) {
    const user1 = waitingQueue.shift();
    let user2Index = waitingQueue.findIndex(
      (u) => !recentPairs.has(pairKey(user1.name, u.name))
    );

    if (user2Index === -1) {
      waitingQueue.push(user1);
      break;
    }

    const user2 = waitingQueue.splice(user2Index, 1)[0];
    const roomId = uuidv4();
    rooms.push(roomId);

    recentPairs.add(pairKey(user1.name, user2.name));
    if (recentPairs.size > 100) recentPairs.clear();

    user1.socket.join(roomId);
    user2.socket.join(roomId);

    socketToRoom.set(user1.socket.id, roomId);
    socketToRoom.set(user2.socket.id, roomId);

    user1.socket.emit('matched', {
      roomId,
      partnerName: user2.name,
      shouldCreateOffer: true,
    });

    user2.socket.emit('matched', {
      roomId,
      partnerName: user1.name,
      shouldCreateOffer: false,
    });

    console.log(`✅ Matched ${user1.name} & ${user2.name} in room ${roomId}`);
  }
}

io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('join-queue', (name) => {
    console.log(`${name} joined the queue`);
    waitingQueue.push({ socket, name });
    tryToMatch();
  });

  // WebRTC Signaling Handlers
  socket.on('send-offer', ({ offer, roomId }) => {
    socket.to(roomId).emit('receive-offer', { offer });
  });

  socket.on('send-answer', ({ answer, roomId }) => {
    socket.to(roomId).emit('receive-answer', { answer });
  });

  socket.on('send-ice-candidate', ({ candidate, roomId }) => {
    socket.to(roomId).emit('receive-ice-candidate', { candidate });
  });

  socket.on('skip-room', ({ roomId, name }) => {
    socket.leave(roomId);
    waitingQueue.push({ socketId: socket.id, name });
    tryToMatch();
  });

  socket.on('disconnect', () => {
    const idx = waitingQueue.findIndex((u) => u.socket.id === socket.id);
    if (idx !== -1) waitingQueue.splice(idx, 1);

    const roomId = socketToRoom.get(socket.id);
    if (roomId) {
      socket.to(roomId).emit('partner-disconnected');
      socketToRoom.delete(socket.id);
    }

    console.log('❌ User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('🚀 Server running on http://localhost:3000');
});
