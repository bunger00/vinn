const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? ["https://vinn-spill.netlify.app", "https://www.vinnspill.no", "http://localhost:3000"]
      : "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Spill-tilstand
const gameState = {
  isActive: false,
  currentRound: 0,
  totalRounds: 10,
  timer: 60, // Sekunder
  isNegotiationRound: false,
  negotiationTimer: 180, // 3 minutter
  negotiationVotes: { yes: 0, no: 0 },
  groups: {},
  roundChoices: {},
  roundResults: [],
  multiplier: 1,
  waitingForNextRound: false,
  completedRounds: []
};

// Funksjon for full resetting av spillet, inkludert fjerning av alle grupper
function fullReset() {
  gameState.isActive = false;
  gameState.currentRound = 0;
  gameState.timer = 60;
  gameState.isNegotiationRound = false;
  gameState.negotiationTimer = 180;
  gameState.negotiationVotes = { yes: 0, no: 0 };
  gameState.roundChoices = {};
  gameState.roundResults = [];
  gameState.multiplier = 1;
  gameState.waitingForNextRound = false;
  gameState.completedRounds = [];
  
  // Tøm alle grupper
  gameState.groups = {};

  io.emit('game-full-reset');
  io.emit('update-state', gameState);
}

// Funksjon for å initialisere spillet på nytt
function resetGame() {
  gameState.isActive = false;
  gameState.currentRound = 0;
  gameState.timer = 60;
  gameState.isNegotiationRound = false;
  gameState.negotiationTimer = 180;
  gameState.negotiationVotes = { yes: 0, no: 0 };
  gameState.roundChoices = {};
  gameState.roundResults = [];
  gameState.multiplier = 1;
  gameState.waitingForNextRound = false;
  gameState.completedRounds = [];
  
  // Nullstill poeng, men behold gruppenavn
  Object.keys(gameState.groups).forEach(groupId => {
    gameState.groups[groupId].score = 0;
    gameState.groups[groupId].history = [];
    gameState.groups[groupId].hasVoted = false;
    gameState.groups[groupId].choice = null;
  });

  io.emit('game-reset');
  io.emit('update-state', gameState);
}

// Funksjon for å håndtere neste runde
function startNextRound() {
  // Nullstill flagget for venting på neste runde
  gameState.waitingForNextRound = false;
  
  if (gameState.currentRound >= gameState.totalRounds) {
    // Spillet er ferdig
    gameState.isActive = false;
    io.emit('game-over', gameState);
    return;
  }
  
  gameState.currentRound++;
  
  // Nullstill valg for den nye runden
  gameState.roundChoices = {};
  Object.keys(gameState.groups).forEach(groupId => {
    gameState.groups[groupId].choice = null;
    gameState.groups[groupId].hasVoted = false;
  });
  
  // Sjekk om det er en forhandlingsrunde
  if (gameState.currentRound === 5 || gameState.currentRound === 8) {
    // Valgfri forhandlingsrunde - starter timer med en gang
    gameState.negotiationVotes = { yes: 0, no: 0 };
    gameState.isNegotiationRound = true;
    
    // Sett multiplikator basert på runde
    gameState.multiplier = gameState.currentRound === 5 ? 3 : 5;
    
    // Start forhandlingstimeren umiddelbart
    gameState.negotiationTimer = 180; // 3 minutter
    io.emit('negotiation-vote-start');
    
    // Start nedtelling umiddelbart
    startNegotiationTimer();
  } else if (gameState.currentRound === 10) {
    // Obligatorisk forhandlingsrunde
    gameState.isNegotiationRound = true;
    gameState.negotiationTimer = 180; // 3 minutter
    gameState.multiplier = 10;
    
    startNegotiation();
  } else {
    // Vanlig runde
    gameState.isNegotiationRound = false;
    gameState.multiplier = 1;
    gameState.timer = 60;
    
    startRoundTimer();
  }
  
  io.emit('round-start', {
    roundNumber: gameState.currentRound,
    isNegotiationRound: gameState.isNegotiationRound,
    multiplier: gameState.multiplier
  });
  
  io.emit('update-state', gameState);
}

// Funksjon for å starte nedtelling
function startRoundTimer() {
  gameState.isActive = true;
  gameState.timer = 60;
  
  const timerInterval = setInterval(() => {
    gameState.timer--;
    
    io.emit('timer-update', gameState.timer);
    
    if (gameState.timer <= 0) {
      clearInterval(timerInterval);
      endRound();
    }
  }, 1000);
}

// Funksjon for å starte forhandlingstimer
let negotiationTimerInterval;
function startNegotiationTimer() {
  // Rydde opp eventuelle eksisterende intervaller
  if (negotiationTimerInterval) {
    clearInterval(negotiationTimerInterval);
  }
  
  gameState.negotiationTimer = 180; // 3 minutter
  
  negotiationTimerInterval = setInterval(() => {
    gameState.negotiationTimer--;
    
    io.emit('negotiation-timer-update', gameState.negotiationTimer);
    
    if (gameState.negotiationTimer <= 0) {
      clearInterval(negotiationTimerInterval);
      endNegotiation();
    }
  }, 1000);
}

// Funksjon som sjekker om alle gruppene har gjort et valg
function allGroupsHaveChosen() {
  const groupIds = Object.keys(gameState.groups);
  if (groupIds.length === 0) return false;
  
  return groupIds.every(groupId => gameState.groups[groupId].choice !== null);
}

// Funksjon for å starte forhandling
function startNegotiation() {
  gameState.isNegotiationRound = true;
  io.emit('negotiation-start', gameState.negotiationTimer);
  
  startNegotiationTimer();
}

// Funksjon for å avslutte forhandling
function endNegotiation() {
  gameState.isNegotiationRound = false;
  io.emit('negotiation-end');
  
  // Start normal runde etter forhandling
  startRoundTimer();
}

// Funksjon for å avbryte forhandling og gå til vanlig runde
function cancelNegotiation() {
  // Stopp forhandlingstimeren
  if (negotiationTimerInterval) {
    clearInterval(negotiationTimerInterval);
  }
  
  gameState.isNegotiationRound = false;
  
  // Informer alle klienter om at forhandlingen er avsluttet
  io.emit('negotiation-end');
  
  // Start en vanlig rundtimer
  gameState.timer = 60;
  startRoundTimer();
}

// Funksjon for å avslutte runden og beregne resultater
function endRound() {
  // Sjekk om runden allerede er avsluttet for å unngå duplisering
  if (gameState.completedRounds.includes(gameState.currentRound)) {
    console.log(`Runde ${gameState.currentRound} er allerede avsluttet. Ignorerer duplikat endRound-kall.`);
    return;
  }

  // Tell antall X og Y
  let countX = 0;
  let countY = 0;
  
  Object.keys(gameState.groups).forEach(groupId => {
    if (!gameState.groups[groupId].choice) {
      // Hvis en gruppe ikke har valgt, sett tilfeldig valg
      gameState.groups[groupId].choice = Math.random() > 0.5 ? 'X' : 'Y';
    }
    
    if (gameState.groups[groupId].choice === 'X') {
      countX++;
    } else {
      countY++;
    }
    
    // Skjul valget midlertidig for den sekvensielle avsløringen
    gameState.groups[groupId].choiceRevealed = false;
  });
  
  // Beregn poeng basert på kombinasjonen - nøyaktig i henhold til tabellen
  let xPoints = 0;
  let yPoints = 0;
  
  if (countX === 4) {
    // 4X: Alle taper 1000 kr hver
    xPoints = -1000;
  } else if (countX === 3 && countY === 1) {
    // 3X, 1Y: X'ene vinner 1000 kr hver, Y'en taper 3000 kr
    xPoints = 1000;  
    yPoints = -3000; 
  } else if (countX === 2 && countY === 2) {
    // 2X, 2Y: X'ene vinner 2000 kr hver, Y'ene taper 2000 kr hver
    xPoints = 2000;  
    yPoints = -2000; 
  } else if (countX === 1 && countY === 3) {
    // 1X, 3Y: X'en vinner 3000 kr, Y'ene taper 1000 kr hver
    xPoints = 3000;  
    yPoints = -1000; 
  } else if (countY === 4) {
    // 4Y: Alle vinner 1000 kr hver
    yPoints = 1000;
  }
  
  // Multipliser poengene hvis det er en spesialrunde
  xPoints *= gameState.multiplier;
  yPoints *= gameState.multiplier;
  
  // Forbered poeng og historikk for hver gruppe, men ikke oppdater faktiske score ennå
  Object.keys(gameState.groups).forEach(groupId => {
    const choice = gameState.groups[groupId].choice;
    const points = choice === 'X' ? xPoints : yPoints;
    
    // Lagre poengene for denne runden til senere
    gameState.groups[groupId].pendingPoints = points;
    
    // Beregn ny score, men ikke oppdater den ennå
    gameState.groups[groupId].pendingNewScore = gameState.groups[groupId].score + points;
    
    // Sørg for at historikken er tom for denne runden før vi legger til
    gameState.groups[groupId].history = gameState.groups[groupId].history || [];
    gameState.groups[groupId].history = gameState.groups[groupId].history.filter(h => h.round !== gameState.currentRound);
    
    // Forbered historikk-innlegget, men ikke legg det til ennå
    gameState.groups[groupId].pendingHistory = {
      round: gameState.currentRound,
      choice: choice,
      points: points,
      totalScore: gameState.groups[groupId].pendingNewScore
    };
  });
  
  // Marker denne runden som avsluttet
  gameState.completedRounds.push(gameState.currentRound);
  
  // Lagre resultatet for denne runden
  const roundResult = {
    round: gameState.currentRound,
    choices: { ...gameState.roundChoices },
    xCount: countX,
    yCount: countY,
    xPoints: xPoints,
    yPoints: yPoints,
    multiplier: gameState.multiplier
  };
  
  // Fjern eventuelle gamle resultater for samme runde
  gameState.roundResults = gameState.roundResults.filter(r => r.round !== gameState.currentRound);
  gameState.roundResults.push(roundResult);
  
  // Sett spillstatus
  gameState.waitingForNextRound = true;
  gameState.isActive = false;
  
  // Send signal om at runden er ferdig (uten å vise valgene ennå)
  io.emit('round-end', {
    roundNumber: gameState.currentRound,
    multiplier: gameState.multiplier,
    waitingForNextRound: true
  });
  
  // Start sekvensert avsløring av valg
  startSequentialReveal();
}

// Ny funksjon for å starte sekvensert avsløring av valg
function startSequentialReveal() {
  // Få liste over gruppe-ID-er sortert etter gruppenavn
  const groupIds = Object.keys(gameState.groups).sort((a, b) => 
    gameState.groups[a].name.localeCompare(gameState.groups[b].name)
  );
  
  // Lagre originale poeng for å bruke senere
  const originalScores = {};
  Object.keys(gameState.groups).forEach(groupId => {
    originalScores[groupId] = gameState.groups[groupId].score;
  });
  
  // Avsløre et valg hvert 2. sekund
  let revealIndex = 0;
  
  function revealNextChoice() {
    if (revealIndex < groupIds.length) {
      const groupId = groupIds[revealIndex];
      
      // Marker valget som avslørt
      gameState.groups[groupId].choiceRevealed = true;
      
      // Send oppdatering til alle klienter, men ikke inkluder oppdaterte poeng ennå
      io.emit('choice-revealed', {
        groupId: groupId,
        choice: gameState.groups[groupId].choice,
        groups: gameState.groups,
        isLastGroup: revealIndex === groupIds.length - 1
      });
      
      // Planlegg neste avsløring
      revealIndex++;
      if (revealIndex < groupIds.length) {
        setTimeout(revealNextChoice, 2000);
      } else {
        // Alle valg er avslørt, vent 2 sekunder før vi viser poengsummene
        setTimeout(() => {
          // Oppdater faktiske poeng og historikk for alle grupper
          Object.keys(gameState.groups).forEach(gid => {
            if (gameState.groups[gid].pendingPoints !== undefined) {
              // Oppdater poengene
              gameState.groups[gid].score = gameState.groups[gid].pendingNewScore;
              
              // Legg til i historikken
              gameState.groups[gid].history.push(gameState.groups[gid].pendingHistory);
              
              // Fjern midlertidige felter
              delete gameState.groups[gid].pendingPoints;
              delete gameState.groups[gid].pendingNewScore;
              delete gameState.groups[gid].pendingHistory;
            }
          });
          
          // Send ut oppdaterte poeng
          io.emit('points-revealed', gameState);
          
          // Etter ytterligere 1 sekund, send fullstendig tilstand
          setTimeout(() => {
            io.emit('round-complete', gameState);
          }, 1000);
        }, 2000);
      }
    }
  }
  
  // Start avsløringen
  setTimeout(revealNextChoice, 1000);
}

// Serve statiske filer fra /client/build i produksjon
// I produksjon bruker vi Netlify for frontend, derfor trenger vi ikke å serve statiske filer her
if (process.env.NODE_ENV === 'production') {
  // API-route for helsekontroll
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Server er oppe og kjører' });
  });
} else {
  // Bare i utvikling - serve statiske filer lokalt
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Socket.io tilkoblinger
io.on('connection', (socket) => {
  console.log('En bruker har koblet til:', socket.id);
  
  // Håndter tilkobling av gruppevisning
  socket.on('join-group', ({ groupId, groupName }) => {
    let id = groupId;
    
    // Hvis det ikke er spesifisert en groupId, opprett en ny
    if (!id) {
      id = uuidv4();
      
      // Sjekk om vi allerede har 4 grupper
      if (Object.keys(gameState.groups).length >= 4) {
        socket.emit('error', { message: 'Maksimalt antall grupper er nådd' });
        return;
      }
      
      // Initialiser ny gruppe
      gameState.groups[id] = {
        id: id,
        name: groupName || `Gruppe ${Object.keys(gameState.groups).length + 1}`,
        score: 0,
        history: [],
        choice: null,
        hasVoted: false
      };
    }
    
    // Koble socket til gruppen
    socket.join(`group-${id}`);
    socket.groupId = id;
    
    // Send tilbake gruppe-ID til klienten
    socket.emit('group-joined', {
      groupId: id,
      groupInfo: gameState.groups[id]
    });
    
    // Oppdater alle om den nye gruppen
    io.emit('update-state', gameState);
  });
  
  // Håndter tilkobling av hovedskjerm
  socket.on('join-main-screen', () => {
    socket.join('main-screen');
    socket.emit('game-state', gameState);
  });
  
  // Håndter gruppenavnendring
  socket.on('update-group-name', ({ groupId, newName }) => {
    if (gameState.groups[groupId]) {
      gameState.groups[groupId].name = newName;
      io.emit('update-state', gameState);
    }
  });
  
  // Håndter gruppevalg (X eller Y)
  socket.on('make-choice', ({ groupId, choice }) => {
    if (gameState.groups[groupId] && gameState.isActive && !gameState.isNegotiationRound) {
      gameState.groups[groupId].choice = choice;
      gameState.roundChoices[groupId] = choice;
      
      // Informer gruppen om at deres valg er registrert, men ikke låst
      io.to(`group-${groupId}`).emit('choice-updated', choice);
      
      // Oppdater alle
      io.emit('update-state', gameState);
    }
  });
  
  // Håndter avstemning om forhandling
  socket.on('negotiation-vote', ({ groupId, vote }) => {
    if (gameState.groups[groupId] && gameState.isNegotiationRound && !gameState.groups[groupId].hasVoted) {
      gameState.groups[groupId].hasVoted = true;
      
      if (vote) {
        gameState.negotiationVotes.yes++;
      } else {
        gameState.negotiationVotes.no++;
      }
      
      // Sjekk om alle har stemt
      const groupCount = Object.keys(gameState.groups).length;
      if (gameState.negotiationVotes.yes + gameState.negotiationVotes.no >= groupCount) {
        // Hvis alle har stemt ja, fortsett forhandling (timer kjører allerede)
        if (gameState.negotiationVotes.yes === groupCount) {
          io.emit('negotiation-start');
        } else {
          // Ellers, avbryt forhandling og gå til normal runde
          cancelNegotiation();
        }
      }
    }
  });
  
  // Håndter avbrytelse av forhandling fra hovedskjermen
  socket.on('cancel-negotiation', () => {
    if (gameState.isNegotiationRound) {
      cancelNegotiation();
    }
  });
  
  // Håndter full tilbakestilling av spillet
  socket.on('full-reset', () => {
    fullReset();
  });
  
  // Håndter start av nytt spill
  socket.on('start-game', () => {
    // Sjekk om vi har nøyaktig 4 grupper før vi starter spillet
    const groupCount = Object.keys(gameState.groups).length;
    
    if (groupCount !== 4) {
      socket.emit('error', { 
        message: `Spillet krever 4 grupper for å starte. Du har ${groupCount} grupper tilkoblet.` 
      });
      return;
    }
    
    resetGame();
    startNextRound();
  });
  
  // Legg til en ny event for å starte neste runde manuelt
  socket.on('next-round', () => {
    if (gameState.waitingForNextRound) {
      startNextRound();
    }
  });
  
  // Håndter frakobling
  socket.on('disconnect', () => {
    console.log('En bruker har koblet fra:', socket.id);
    
    // Hvis det var en gruppe, behold gruppedata
    // (vi fjerner ikke grupper ved frakobling for å tillate gjenoppkobling)
  });
});

// Start serveren
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server kjører på port ${PORT}`);
}); 