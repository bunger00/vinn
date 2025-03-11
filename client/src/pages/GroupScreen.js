import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import styled from 'styled-components';

// Styled components
const GroupScreenContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  min-height: 100vh;
  background-color: var(--background-dark);
  color: var(--text-primary);
`;

const GroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const GroupInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const EditNameContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
`;

const NameInput = styled.input`
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  color: var(--text-primary);
  margin-right: 0.5rem;
  font-size: 1rem;
`;

const SaveButton = styled.button`
  background-color: var(--accent-blue);
  color: var(--text-primary);
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: bold;
`;

const TimerDisplay = styled.div`
  font-size: 2rem;
  font-family: var(--display-font);
  color: ${props => props.timeLeft <= 10 ? 'var(--accent-red)' : 'var(--accent-blue)'};
  animation: ${props => props.timeLeft <= 10 ? 'pulse 1s infinite' : 'none'};
`;

const ChoiceContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin: 2rem 0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const ChoiceButton = styled.button`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
  font-weight: bold;
  transition: all 0.3s ease;
  
  ${props => {
    if (props.choice === 'X') {
      return `
        background-color: rgba(255, 49, 49, 0.2);
        color: var(--accent-red);
        border: 3px solid var(--accent-red);
        
        &:hover {
          background-color: rgba(255, 49, 49, 0.4);
          box-shadow: 0 0 15px var(--accent-red);
        }
      `;
    } else {
      return `
        background-color: rgba(57, 255, 20, 0.2);
        color: var(--accent-green);
        border: 3px solid var(--accent-green);
        
        &:hover {
          background-color: rgba(57, 255, 20, 0.4);
          box-shadow: 0 0 15px var(--accent-green);
        }
      `;
    }
  }}
  
  ${props => props.selected && `
    transform: scale(1.1);
    box-shadow: 0 0 20px ${props.choice === 'X' ? 'var(--accent-red)' : 'var(--accent-green)'};
  `}
  
  ${props => props.disabled && `
    opacity: 0.5;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: none;
    }
  `}
`;

const GroupScoreDisplay = styled.div`
  font-size: 1.8rem;
  font-weight: bold;
  margin: 1rem 0;
  display: flex;
  align-items: center;
  
  .pending-score {
    opacity: 0.7;
  }
  
  .points-change {
    font-size: 1.2rem;
    font-weight: bold;
    animation: bounceIn 0.8s;
    margin-left: 0.5rem;
  }
  
  .points-change.positive {
    color: var(--accent-green);
  }
  
  .points-change.negative {
    color: var(--accent-red);
  }
  
  @keyframes bounceIn {
    0% { transform: scale(0.1); opacity: 0; }
    60% { transform: scale(1.2); opacity: 1; }
    100% { transform: scale(1); }
  }
`;

const RoundHistory = styled.div`
  background-color: var(--background-light);
  border-radius: 8px;
  padding: 1rem;
  margin-top: 2rem;
`;

const HistoryTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
`;

const HistoryList = styled.div`
  max-height: 200px;
  overflow-y: auto;
`;

const HistoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const HistoryRound = styled.span`
  font-weight: bold;
  color: var(--accent-blue);
`;

const HistoryChoice = styled.span`
  font-weight: bold;
  color: ${props => props.choice === 'X' ? 'var(--accent-red)' : 'var(--accent-green)'};
`;

const HistoryPoints = styled.span`
  font-weight: bold;
  color: ${props => props.points >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'};
`;

const NegotiationVote = styled.div`
  background-color: var(--background-light);
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  margin-top: 2rem;
`;

const VoteTitle = styled.h3`
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: var(--accent-blue);
`;

const VoteDescription = styled.p`
  margin-bottom: 2rem;
  color: var(--text-secondary);
`;

const VoteButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 2rem;
`;

const VoteYesButton = styled.button`
  background-color: var(--accent-green);
  color: var(--background-dark);
  padding: 1rem 2rem;
  border-radius: 30px;
  font-weight: bold;
`;

const VoteNoButton = styled.button`
  background-color: var(--accent-red);
  color: var(--background-dark);
  padding: 1rem 2rem;
  border-radius: 30px;
  font-weight: bold;
`;

const NegotiationActive = styled.div`
  background-color: rgba(0, 191, 255, 0.1);
  border: 2px solid var(--accent-blue);
  border-radius: 10px;
  padding: 2rem;
  text-align: center;
  margin-top: 2rem;
`;

const NegotiationTimer = styled.div`
  font-size: 2.5rem;
  font-family: var(--display-font);
  color: var(--accent-blue);
  margin: 1rem 0;
`;

const StatusMessage = styled.div`
  background-color: var(--background-light);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  margin-top: 1rem;
  animation: pulse 2s infinite;
`;

const MultiplierBanner = styled.div`
  background-color: rgba(57, 255, 20, 0.2);
  border: 2px solid var(--accent-green);
  color: var(--accent-green);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  margin: 1rem 0;
  font-weight: bold;
  animation: pulse 2s infinite;
`;

const InfoMessage = styled.div`
  background-color: rgba(0, 153, 255, 0.1);
  border: 1px solid var(--accent-blue);
  color: var(--accent-blue);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  margin: 1rem 0;
  font-style: italic;
`;

// Hovedkomponent
function GroupScreen() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  const [socket, setSocket] = useState(null);
  const [group, setGroup] = useState(null);
  const [groupName, setGroupName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [gameState, setGameState] = useState({
    isActive: false,
    currentRound: 0,
    totalRounds: 10,
    timer: 60,
    isNegotiationRound: false,
    multiplier: 1,
  });
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [choiceLocked, setChoiceLocked] = useState(false);
  const [negotiationVoted, setNegotiationVoted] = useState(false);
  const [choice, setChoice] = useState(null);
  const [score, setScore] = useState(0);
  const [waitingForNextRound, setWaitingForNextRound] = useState(false);
  const [history, setHistory] = useState([]);
  const [timer, setTimer] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null);
  const [pointsRevealed, setPointsRevealed] = useState(false);
  const [pendingPoints, setPendingPoints] = useState(null);
  const [allChoicesRevealed, setAllChoicesRevealed] = useState(false);
  
  // Beregn antall grupper og om vi er klare til å starte
  const groupCount = gameState.groups ? Object.keys(gameState.groups).length : 0;
  const readyToStart = groupCount === 4;
  
  // Oppkobling til socket.io
  useEffect(() => {
    // Bestem server-URL basert på miljø
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? '/.netlify/functions/server' 
      : '/';
    
    const newSocket = io(socketUrl);
    
    newSocket.on('connect', () => {
      console.log('Tilkoblet til serveren');
      
      // Bli med i en gruppe
      newSocket.emit('join-group', {
        groupId: groupId,
        groupName: 'Ny Gruppe'
      });
    });
    
    newSocket.on('disconnect', () => {
      console.log('Frakoblet fra serveren');
    });
    
    newSocket.on('group-joined', ({ groupId, groupInfo }) => {
      setGroup(groupInfo);
      setGroupName(groupInfo.name);
      navigate(`/group/${groupId}`, { replace: true });
    });
    
    newSocket.on('update-state', (state) => {
      setGameState(state);
      
      // Oppdaterer gruppen, men bare hvis vi ikke er i en ventemodus
      if (state.groups[groupId] && !state.waitingForNextRound) {
        setGroup(state.groups[groupId]);
      }
    });
    
    // Ny handler for round-complete som erstatter de tidligere hendelsene
    newSocket.on('round-complete', (state) => {
      setGameState(state);
      
      // Oppdater gruppe-infoen direkte fra state
      if (state.groups[groupId]) {
        setGroup(state.groups[groupId]);
      }
    });
    
    newSocket.on('timer-update', (timeLeft) => {
      setGameState(prevState => ({
        ...prevState,
        timer: timeLeft
      }));
    });
    
    newSocket.on('negotiation-timer-update', (timeLeft) => {
      setGameState(prevState => ({
        ...prevState,
        negotiationTimer: timeLeft
      }));
    });
    
    newSocket.on('choice-updated', (choice) => {
      setSelectedChoice(choice);
    });
    
    newSocket.on('round-start', () => {
      setSelectedChoice(null);
      setChoiceLocked(false);
      setNegotiationVoted(false);
    });
    
    newSocket.on('negotiation-vote-start', () => {
      setNegotiationVoted(false);
    });
    
    newSocket.on('negotiation-start', () => {
      // Forhandling har startet
    });
    
    newSocket.on('negotiation-end', () => {
      setSelectedChoice(null);
      setChoiceLocked(false);
    });
    
    newSocket.on('game-full-reset', () => {
      // Når spillet resettes fullstendig, omdiriger til hjemmesiden
      // siden gruppen vår nå er fjernet
      navigate('/', { replace: true });
    });
    
    newSocket.on('error', ({ message }) => {
      alert(message);
    });
    
    newSocket.on('round-end', () => {
      setWaitingForNextRound(true);
      setPointsRevealed(false);
      setAllChoicesRevealed(false);
      setPendingPoints(null);
    });

    newSocket.on('choice-revealed', ({ isLastGroup }) => {
      if (isLastGroup) {
        // Alle valg er nå avslørt, men poengene er ikke klare ennå
        setAllChoicesRevealed(true);
        setInfoMessage('Alle valg er avslørt. Resultatet beregnes...');
      }
    });

    newSocket.on('points-revealed', (updatedGameState) => {
      if (groupId && updatedGameState.groups[groupId]) {
        const updatedGroup = updatedGameState.groups[groupId];
        setScore(updatedGroup.score);
        setHistory(updatedGroup.history || []);
        
        const latestRound = updatedGameState.currentRound;
        const latestHistory = updatedGroup.history.find(h => h.round === latestRound);
        
        if (latestHistory) {
          setPendingPoints(latestHistory.points);
        }
      }
      
      setPointsRevealed(true);
      setInfoMessage('Poengene er oppdatert!');
      
      // Fjern meldingen etter 5 sekunder
      setTimeout(() => {
        setInfoMessage(null);
      }, 5000);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [groupId, navigate]);
  
  // Håndter navneendring
  const updateGroupName = useCallback(() => {
    if (socket && groupId && groupName.trim() !== '') {
      socket.emit('update-group-name', {
        groupId,
        newName: groupName
      });
      setEditingName(false);
    }
  }, [socket, groupId, groupName]);
  
  // Håndter valg (X eller Y)
  const makeChoice = useCallback((choice) => {
    if (socket && groupId && gameState.isActive && !gameState.isNegotiationRound) {
      socket.emit('make-choice', {
        groupId,
        choice
      });
      setSelectedChoice(choice);
    }
  }, [socket, groupId, gameState.isActive, gameState.isNegotiationRound]);
  
  // Håndter avstemning om forhandling
  const voteForNegotiation = useCallback((vote) => {
    if (socket && groupId && gameState.isNegotiationRound && !negotiationVoted) {
      socket.emit('negotiation-vote', {
        groupId,
        vote
      });
      setNegotiationVoted(true);
    }
  }, [socket, groupId, gameState.isNegotiationRound, negotiationVoted]);
  
  // Hvis ingen gruppe er tilgjengelig ennå
  if (!group) {
    return (
      <GroupScreenContainer>
        <h2>Kobler til spillet...</h2>
      </GroupScreenContainer>
    );
  }
  
  return (
    <GroupScreenContainer>
      <GroupHeader>
        <GroupInfo>
          {editingName ? (
            <EditNameContainer>
              <NameInput
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Skriv inn gruppenavn"
              />
              <SaveButton onClick={updateGroupName}>Lagre</SaveButton>
            </EditNameContainer>
          ) : (
            <h2 onClick={() => setEditingName(true)}>
              {group.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>(klikk for å endre)</span>
            </h2>
          )}
        </GroupInfo>
        
        <TimerDisplay timeLeft={gameState.isNegotiationRound ? gameState.negotiationTimer : gameState.timer}>
          {gameState.isNegotiationRound ? gameState.negotiationTimer : gameState.timer}
        </TimerDisplay>
      </GroupHeader>
      
      {!gameState.isActive && gameState.currentRound === 0 && !readyToStart && (
        <StatusMessage>
          Venter på at alle grupper skal koble til...
          {groupCount < 4 && ` Trenger ${4 - groupCount} gruppe${4 - groupCount === 1 ? '' : 'r'} til.`}
        </StatusMessage>
      )}
      
      {gameState.multiplier > 1 && (
        <MultiplierBanner>
          Multiplikator x{gameState.multiplier} denne runden! Alle poeng ganges med {gameState.multiplier}.
        </MultiplierBanner>
      )}
      
      {gameState.isActive && !gameState.isNegotiationRound && (
        <>
          <StatusMessage>
            Runde {gameState.currentRound}/{gameState.totalRounds} - Velg X eller Y
            {selectedChoice && <span> - Du har valgt <strong>{selectedChoice}</strong></span>}
          </StatusMessage>
          
          <InfoMessage>
            Du kan endre valget ditt så mange ganger du ønsker inntil nedtellingen på {gameState.timer} sekunder er over.
            Valget ditt blir automatisk låst når tiden er ute.
          </InfoMessage>
          
          <ChoiceContainer>
            <ChoiceButton
              choice="X"
              selected={selectedChoice === 'X'}
              disabled={choiceLocked}
              onClick={() => makeChoice('X')}
            >
              X
            </ChoiceButton>
            
            <ChoiceButton
              choice="Y"
              selected={selectedChoice === 'Y'}
              disabled={choiceLocked}
              onClick={() => makeChoice('Y')}
            >
              Y
            </ChoiceButton>
          </ChoiceContainer>
        </>
      )}
      
      {gameState.isNegotiationRound && !negotiationVoted && (gameState.currentRound === 5 || gameState.currentRound === 8) && (
        <NegotiationVote>
          <VoteTitle>Forhandlingsrunde</VoteTitle>
          <VoteDescription>
            Dette er en mulig forhandlingsrunde. Vil du delta i en 3-minutters forhandling med de andre gruppene?
            Alle gruppene må være enige for at forhandlingen skal skje.
          </VoteDescription>
          
          <VoteButtons>
            <VoteYesButton onClick={() => voteForNegotiation(true)}>Ja</VoteYesButton>
            <VoteNoButton onClick={() => voteForNegotiation(false)}>Nei</VoteNoButton>
          </VoteButtons>
        </NegotiationVote>
      )}
      
      {gameState.isNegotiationRound && (negotiationVoted || gameState.currentRound === 10) && (
        <NegotiationActive>
          <h3>Forhandling Pågår</h3>
          <p>Diskuter strategi med de andre gruppene. Du har:</p>
          <NegotiationTimer>{gameState.negotiationTimer} sekunder</NegotiationTimer>
          <p>Etter forhandlingen får du 60 sekunder til å bestemme ditt valg.</p>
        </NegotiationActive>
      )}
      
      <GroupScoreDisplay>
        {waitingForNextRound && !pointsRevealed ? (
          <span>{score} kr</span>
        ) : (
          <span>{score} kr</span>
        )}
        
        {waitingForNextRound && pointsRevealed && pendingPoints && (
          <div className={`points-change ${pendingPoints > 0 ? 'positive' : 'negative'}`}>
            {pendingPoints > 0 ? '+' : ''}{pendingPoints} kr
          </div>
        )}
      </GroupScoreDisplay>
      
      {group.history && group.history.length > 0 && (
        <RoundHistory>
          <HistoryTitle>Historikk</HistoryTitle>
          
          <HistoryList>
            {group.history.map((item, index) => (
              <HistoryItem key={index}>
                <HistoryRound>Runde {item.round}</HistoryRound>
                <HistoryChoice choice={item.choice}>{item.choice}</HistoryChoice>
                <HistoryPoints points={item.points}>
                  {item.points >= 0 ? `+${item.points}` : item.points} kr
                </HistoryPoints>
              </HistoryItem>
            ))}
          </HistoryList>
        </RoundHistory>
      )}
      
      {infoMessage && (
        <InfoMessage>{infoMessage}</InfoMessage>
      )}
    </GroupScreenContainer>
  );
}

export default GroupScreen; 