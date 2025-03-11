import React, { useState, useEffect, useCallback } from 'react';
import { io } from "socket.io-client";
import styled from 'styled-components';

// Styled components
const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 1.5rem;
`;

const ScoreboardContainer = styled.div`
  background-color: var(--background-light);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 20px var(--shadow-color);
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--accent-blue);
  padding-bottom: 1rem;
`;

const Title = styled.h1`
  font-size: 2.2rem;
  color: var(--text-primary);
  text-shadow: 0 0 10px var(--accent-blue);
`;

const RoundInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const RoundNumber = styled.div`
  font-size: 2rem;
  color: var(--accent-blue);
  font-family: var(--display-font);
`;

const RoundMultiplier = styled.div`
  font-size: 1.2rem;
  color: var(--accent-yellow);
  font-weight: bold;
  margin-top: 0.3rem;
`;

const TimerContainer = styled.div`
  position: relative;
  width: 80px;
  height: 80px;
  background-color: var(--background-dark);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5rem;
  font-family: var(--display-font);
  margin: 0 auto 2rem;
`;

const TimerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: conic-gradient(var(--accent-blue) ${props => props.percentage}%, transparent 0%);
`;

const TimerText = styled.div`
  position: relative;
  z-index: 2;
  color: var(--text-primary);
`;

const GroupsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GroupCard = styled.div`
  background-color: var(--background-dark);
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  transition: all 0.3s ease;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px var(--shadow-color);
  }

  ${props => props.allRevealed && `
    border: 2px solid var(--accent-yellow);
    box-shadow: 0 0 10px var(--accent-yellow);
  `}
`;

const GroupName = styled.h3`
  font-size: 1.8rem;
  font-family: var(--display-font);
  margin-bottom: 0.5rem;
  color: var(--text-primary);
`;

const GroupScore = styled.div`
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--accent-blue);
  margin-bottom: 1rem;
`;

const ChoiceDisplay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin: 0 auto;
  font-size: 2rem;
  font-weight: bold;
  
  ${props => {
    if (props.choice === 'X') {
      return `
        background-color: rgba(255, 49, 49, 0.2);
        color: var(--accent-red);
        border: 2px solid var(--accent-red);
      `;
    } else if (props.choice === 'Y') {
      return `
        background-color: rgba(57, 255, 20, 0.2);
        color: var(--accent-green);
        border: 2px solid var(--accent-green);
      `;
    } else {
      return `
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--text-secondary);
        border: 2px dashed var(--text-secondary);
      `;
    }
  }}
`;

const HistoryContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;

const HistoryItem = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  margin: 0 5px;
  font-size: 0.7rem;
  display: flex;
  justify-content: center;
  align-items: center;
  
  ${props => {
    if (props.choice === 'X') {
      return `
        background-color: rgba(255, 49, 49, 0.2);
        color: var(--accent-red);
        border: 1px solid var(--accent-red);
      `;
    } else if (props.choice === 'Y') {
      return `
        background-color: rgba(57, 255, 20, 0.2);
        color: var(--accent-green);
        border: 1px solid var(--accent-green);
      `;
    }
  }}
`;

const NegotiationIndicator = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  padding: 2rem;
  border-radius: 15px;
  text-align: center;
  z-index: 10;
  animation: glow 2s infinite;
  display: ${props => props.active ? 'block' : 'none'};
`;

const NegotiationIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--accent-blue);
`;

const StartButton = styled.button`
  background-color: var(--accent-green);
  color: var(--background-dark);
  font-size: 1.2rem;
  font-weight: bold;
  padding: 1rem 2rem;
  border-radius: 50px;
  margin: 2rem auto;
  display: block;
  
  &:disabled {
    background-color: #888;
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ResetButton = styled.button`
  background-color: #e74c3c;
  color: white;
  padding: 10px 20px;
  font-size: 1rem;
  font-weight: bold;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 20px;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #c0392b;
  }
`;

const GroupCountMessage = styled.div`
  text-align: center;
  margin: 1rem 0;
  padding: 1rem;
  background-color: ${props => props.isReady ? 'rgba(57, 255, 20, 0.2)' : 'rgba(255, 193, 7, 0.2)'};
  border: 2px solid ${props => props.isReady ? 'var(--accent-green)' : '#ffc107'};
  color: ${props => props.isReady ? 'var(--accent-green)' : '#ffc107'};
  border-radius: 8px;
  font-weight: bold;
`;

const ErrorMessage = styled.div`
  text-align: center;
  margin: 1rem 0;
  padding: 1rem;
  background-color: rgba(255, 49, 49, 0.2);
  border: 2px solid var(--accent-red);
  color: var(--accent-red);
  border-radius: 8px;
  font-weight: bold;
  animation: pulse 1s infinite;
`;

// Nye komponenter for avsløringen
const ChoiceContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1rem 0;
  position: relative;
  width: 100%;
  height: 60px;
`;

const ChoiceHidden = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  font-size: 2rem;
  font-weight: bold;
  border: 2px dashed var(--text-secondary);
`;

const ChoiceRevealed = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  font-size: 2.5rem;
  font-weight: bold;
  animation: revealAnimation 0.5s ease-out;
  
  ${props => props.choice === 'X' ? `
    background-color: rgba(255, 49, 49, 0.2);
    color: var(--accent-red);
    border: 2px solid var(--accent-red);
  ` : `
    background-color: rgba(57, 255, 20, 0.2);
    color: var(--accent-green);
    border: 2px solid var(--accent-green);
  `}
  
  ${props => props.allRevealed && `
    animation: pulseEffect 1.5s infinite;
  `}
  
  @keyframes revealAnimation {
    0% {
      transform: scale(0.1) rotate(-90deg);
      opacity: 0;
    }
    50% {
      transform: scale(1.2) rotate(10deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
  }
  
  @keyframes pulseEffect {
    0% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7);
    }
    70% {
      transform: scale(1.05);
      box-shadow: 0 0 0 10px rgba(255, 215, 0, 0);
    }
    100% {
      transform: scale(1);
      box-shadow: 0 0 0 0 rgba(255, 215, 0, 0);
    }
  }
`;

// Legg til en ny stilkomponent for poeng-annonseringen
const PointsAnnouncement = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 2rem 4rem;
  border-radius: 10px;
  font-size: 2rem;
  font-weight: bold;
  z-index: 1000;
  animation: fadeIn 0.5s ease-out;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  }
`;

const CancelNegotiationButton = styled.button`
  background-color: #ff4d4d; /* Rød */
  color: white;
  font-weight: bold;
  padding: 12px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background-color: #e60000;
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

// Hovedkomponent
function MainScreen() {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState({
    isActive: false,
    currentRound: 0,
    totalRounds: 10,
    timer: 60,
    isNegotiationRound: false,
    negotiationTimer: 180,
    groups: {},
    multiplier: 1,
    waitingForNextRound: false,
  });
  const [errorMessage, setErrorMessage] = useState(null);
  // eslint-disable-next-line
  const [groupsConnected, setGroupsConnected] = useState(0);
  const [revealedGroups, setRevealedGroups] = useState({});
  const [pointsRevealed, setPointsRevealed] = useState(false);
  const [pointsAnnouncement, setPointsAnnouncement] = useState(false);
  const [allChoicesRevealed, setAllChoicesRevealed] = useState(false);
  
  // Oppkobling til socket.io
  useEffect(() => {
    // Bestem server-URL basert på miljø
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://vinn-server.onrender.com' 
      : '/';
    
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket']
    });
    
    newSocket.on("connect", () => {
      console.log("Tilkoblet til serveren");
      newSocket.emit('join-main-screen');
    });
    
    newSocket.on("disconnect", () => {
      console.log("Frakoblet fra serveren");
    });
    
    newSocket.on("game-state", (state) => {
      setGameState(state);
    });
    
    newSocket.on("update-state", (state) => {
      if (!state.waitingForNextRound) {
        setGameState(state);
      }
    });
    
    newSocket.on("round-complete", (state) => {
      setGameState(state);
    });
    
    newSocket.on("timer-update", (timeLeft) => {
      setGameState(prevState => ({
        ...prevState,
        timer: timeLeft
      }));
    });
    
    newSocket.on("negotiation-timer-update", (timeLeft) => {
      setGameState(prevState => ({
        ...prevState,
        negotiationTimer: timeLeft
      }));
    });
    
    newSocket.on("game-full-reset", () => {
      setGameState({
        isActive: false,
        currentRound: 0,
        totalRounds: 10,
        timer: 60,
        isNegotiationRound: false,
        negotiationTimer: 180,
        groups: {},
        multiplier: 1,
        waitingForNextRound: false,
      });
      
      setErrorMessage(null);
    });
    
    newSocket.on("error", ({ message }) => {
      setErrorMessage(message);
      
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    });
    
    newSocket.on("round-start", (data) => {
      setGameState(prevState => ({
        ...prevState,
        currentRound: data.roundNumber,
        multiplier: data.multiplier,
        isNegotiationRound: data.isNegotiationRound || false,
        waitingForNextRound: false,
      }));
      setRevealedGroups({});
      setPointsRevealed(false);
      setPointsAnnouncement(false);
      setAllChoicesRevealed(false);
    });
    
    newSocket.on("round-end", (data) => {
      setGameState(prevState => ({
        ...prevState,
        currentRound: data.roundNumber,
        multiplier: data.multiplier,
        waitingForNextRound: data.waitingForNextRound,
      }));
      setRevealedGroups({});
      setPointsRevealed(false);
      setPointsAnnouncement(false);
    });
    
    newSocket.on("choice-revealed", (data) => {
      // eslint-disable-next-line
      const { groupId, choice, groups: updatedGroups, isLastGroup } = data;
      
      // Oppdater revealedGroups med valget
      setRevealedGroups(prevState => ({
        ...prevState,
        [groupId]: choice  // Bruker bare choice direkte, siden det er det serveren sender
      }));
      
      // Sett all choices revealed flagg hvis dette er den siste gruppen
      if (isLastGroup) {
        setAllChoicesRevealed(true);
      }
    });
    
    newSocket.on("points-revealed", (updatedGameState) => {
      setPointsAnnouncement(true);
      
      // Vis poeng-annonseringen i 2 sekunder
      setTimeout(() => {
        setPointsRevealed(true);
        setPointsAnnouncement(false);
        setGameState(updatedGameState);
      }, 2000);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, []);
  
  // Logikk for å starte spillet
  const startGame = useCallback(() => {
    if (socket) {
      socket.emit('start-game');
    }
  }, [socket]);
  
  // Logikk for å starte neste runde
  const startNextRound = useCallback(() => {
    if (socket) {
      socket.emit('next-round');
    }
  }, [socket]);
  
  // Logikk for å utføre full tilbakestilling av spillet
  const fullReset = useCallback(() => {
    if (socket) {
      if (window.confirm("Er du sikker på at du vil tilbakestille spillet? Dette vil fjerne alle grupper og nullstille alt.")) {
        socket.emit('full-reset');
        setErrorMessage(null);
      }
    }
  }, [socket]);
  
  // Prosenter for timer-visning
  const calculateTimerPercentage = () => {
    if (gameState.isNegotiationRound) {
      return (gameState.negotiationTimer / 180) * 100;
    }
    return (gameState.timer / 60) * 100;
  };
  
  // Sorter grupper etter poengsum
  const sortedGroups = Object.values(gameState.groups).sort((a, b) => b.score - a.score);
  
  // Sjekk om vi har nok grupper til å starte spillet
  const groupCount = Object.keys(gameState.groups).length;
  const readyToStart = groupCount === 4;
  
  // Funksjon for å vise gruppevalg med avsløring
  const renderGroupChoice = (group, groupId) => {
    if (!group) return null;
    
    const isRevealed = revealedGroups[groupId] !== undefined;
    
    return (
      <GroupCard key={groupId} allRevealed={allChoicesRevealed}>
        <GroupName>{group.name}</GroupName>
        
        {/* Vis score basert på om poengene er avslørt eller ikke */}
        <GroupScore>
          {pointsRevealed ? `${group.score} kr` : `${group.score} kr`}
        </GroupScore>
        
        {gameState.waitingForNextRound ? (
          <ChoiceContainer>
            {isRevealed ? (
              <ChoiceRevealed choice={revealedGroups[groupId]} allRevealed={allChoicesRevealed}>
                {revealedGroups[groupId]}
              </ChoiceRevealed>
            ) : (
              <ChoiceHidden>?</ChoiceHidden>
            )}
          </ChoiceContainer>
        ) : (
          <ChoiceDisplay 
            choice={gameState.isActive && !gameState.isNegotiationRound ? '?' : group.choice}
          >
            {gameState.isActive && !gameState.isNegotiationRound ? '?' : group.choice}
          </ChoiceDisplay>
        )}
        
        <HistoryContainer>
          {group.history && group.history.map((item, index) => (
            <HistoryItem key={index} choice={item.choice}>
              {item.choice}
            </HistoryItem>
          ))}
        </HistoryContainer>
      </GroupCard>
    );
  };
  
  // Funksjon for å avbryte forhandling
  const cancelNegotiation = useCallback(() => {
    if (socket && gameState.isNegotiationRound) {
      socket.emit('cancel-negotiation');
    }
  }, [socket, gameState.isNegotiationRound]);
  
  return (
    <MainContainer>
      <ScoreboardContainer>
        <Header>
          <Title>Vinn Så Mye Som Mulig</Title>
          
          <RoundInfo>
            <RoundNumber>Runde {gameState.currentRound || 0}/{gameState.totalRounds}</RoundNumber>
            {gameState.multiplier > 1 && (
              <RoundMultiplier active={true}>
                Multiplikator x{gameState.multiplier}
              </RoundMultiplier>
            )}
          </RoundInfo>
        </Header>
        
        <TimerContainer>
          <TimerOverlay percentage={calculateTimerPercentage()} />
          <TimerText>
            {gameState.isNegotiationRound 
              ? gameState.negotiationTimer 
              : gameState.timer}
          </TimerText>
        </TimerContainer>
        
        <GroupCountMessage isReady={readyToStart}>
          {readyToStart 
            ? 'Alle 4 grupper er tilkoblet! Klar til å starte spillet.'
            : `Venter på at alle grupper skal koble til... (${groupCount}/4 grupper)`
          }
        </GroupCountMessage>
        
        {errorMessage && (
          <ErrorMessage>
            {errorMessage}
          </ErrorMessage>
        )}
        
        <GroupsGrid>
          {sortedGroups.length > 0 ? (
            sortedGroups.map(group => renderGroupChoice(group, group.id))
          ) : (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Ingen grupper har koblet til ennå. Del gruppe-lenken for å få dem med i spillet.
            </p>
          )}
        </GroupsGrid>
        
        {!gameState.isActive && gameState.currentRound === 0 && (
          <StartButton onClick={startGame} disabled={!readyToStart}>
            Start Spillet
          </StartButton>
        )}
        
        {gameState.waitingForNextRound && gameState.currentRound > 0 && gameState.currentRound < gameState.totalRounds && (
          <StartButton onClick={startNextRound}>Start Neste Runde</StartButton>
        )}
        
        {gameState.currentRound === gameState.totalRounds && !gameState.isActive && (
          <div style={{ textAlign: 'center', margin: '2rem', color: 'var(--accent-green)', fontSize: '1.5rem' }}>
            Spillet er ferdig! Vinneren er: {sortedGroups.length > 0 ? sortedGroups[0].name : 'Ingen'}
          </div>
        )}
        
        <ResetButton onClick={fullReset}>
          Tilbakestill Spillet
        </ResetButton>
        
        {gameState.isNegotiationRound && (
          <NegotiationIndicator active={true}>
            <NegotiationIcon>🤝</NegotiationIcon>
            <h2>Forhandling Pågår</h2>
            <p>Resterende tid: {gameState.negotiationTimer} sekunder</p>
            <CancelNegotiationButton onClick={cancelNegotiation}>
              Avbryt Forhandling
            </CancelNegotiationButton>
          </NegotiationIndicator>
        )}
      </ScoreboardContainer>
      
      {pointsAnnouncement && (
        <PointsAnnouncement>
          Resultater blir beregnet...
        </PointsAnnouncement>
      )}
    </MainContainer>
  );
}

export default MainScreen; 