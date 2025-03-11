const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const serverless = require('serverless-http');

// Oppretter Express-app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Statiske filer
app.use(express.static(path.join(__dirname, '../client/build')));

// Spillets tilstand og logikk
let groups = {};
let currentRound = 0;
let totalRounds = 10;
let timer = 0;
let timerInterval = null;
let isNegotiationRound = false;
let negotiationTimer = 0;
let negotiationTimerInterval = null;
let negotiationVotes = {};
let roundInProgress = false;
let multiplier = 1;

// Ruting
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
});

// Socket.io håndtering
io.on('connection', (socket) => {
  console.log('En bruker har koblet til:', socket.id);

  // Importér all socket-logikk fra hovedserveren
  // Dette er samme logikk som i server.js, men tilpasset for Netlify

  // Her kommer all socket.io-logikk fra din originale server.js-fil
  // Håndtering av grupper, valg, runder, timer, etc.

  socket.on('disconnect', () => {
    console.log('En bruker har koblet fra:', socket.id);
    // Fjern gruppen hvis den finnes
    for (const groupId in groups) {
      if (groups[groupId].socketId === socket.id) {
        delete groups[groupId];
        break;
      }
    }
  });
});

// Eksporterer funksjon for Netlify
exports.handler = serverless(app);

// Hvis vi kjører lokalt, start serveren
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`Server kjører på port ${PORT}`);
  });
} 