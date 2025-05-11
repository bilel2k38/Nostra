import React, { useState, useEffect, useRef } from 'react';
// @ts-ignore - Mock contract doesn't have type definitions
import { useMockCatalystContract } from '../hooks/useMockCatalystContract';
import '../styles/GameMockNintendo.css';
import '../styles/GameMockNintendo.action.css';
import '../styles/GameMockNintendo.chat.css';

// Constants
const MAX_ROUNDS = 5;

const MOVES = [
  { label: 'Cooperate', value: 1, emoji: '🟢', description: 'Work together for mutual benefit' },
  { label: 'Defect', value: 2, emoji: '🔴', description: 'Betray for potential higher gain' },
];

const calculatePayoff = (player: number, ai: number): number => {
  // New payoff matrix based on the provided values
  // Player A: Cooperate (1), Player B: Cooperate (1) => A: +2, B: +2
  // Player A: Cooperate (1), Player B: Defect (2) => A: -3, B: +4
  // Player A: Defect (2), Player B: Cooperate (1) => A: +4, B: -3
  // Player A: Defect (2), Player B: Defect (2) => A: -1, B: -1
  
  if (player === 1 && ai === 1) {
    return 2;  // Both cooperate: +2 NST
  } else if (player === 1 && ai === 2) {
    return -3; // Player cooperates, AI defects: -3 NST
  } else if (player === 2 && ai === 1) {
    return 4;  // Player defects, AI cooperates: +4 NST
  } else {
    return -1; // Both defect: -1 NST
  }
};

const GameMockNintendo: React.FC = () => {
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('Ready to play');
  const [walletConnected, setWalletConnected] = useState<boolean>(false);
  const [nstBalance, setNstBalance] = useState<number>(0);
  const [staked, setStaked] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<{text: string, sender: 'player' | 'ai'}[]>([
    { text: 'Hello! I am MrsBeauty. Ready to play Prisoner\'s Dilemma?', sender: 'ai' }
  ]);
  const [newMessage, setNewMessage] = useState<string>('');
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const historyTableRef = useRef<HTMLDivElement>(null);
  
  const { 
    game, 
    startGame, 
    makeMove: contractMakeMove, 
    submitMove: contractSubmitMove, 
    resetGame, 
    isLoading 
  } = useMockCatalystContract();
  
  const calculateTotalEarnings = () => {
    let playerEarnings = 0;
    let aiEarnings = 0;
    
    if (game && game.history && game.history.length > 0) {
      game.history.forEach((round: {playerMove: number, aiMove: number}) => {
        playerEarnings += calculatePayoff(round.playerMove, round.aiMove);
        aiEarnings += calculatePayoff(round.aiMove, round.playerMove);
      });
    }
    
    return { player: playerEarnings, ai: aiEarnings };
  };
  
  const earnings = calculateTotalEarnings();
  
  const makeMove = (move: number) => {
    setSelectedMove(move);
    contractMakeMove(move);
    setStatus(`Selected: ${move === 1 ? 'Cooperate' : 'Defect'}. Click SUBMIT to confirm.`);
  };
  
  const addPlayerMessage = (message: string) => {
    setChatMessages(prev => [...prev, { text: message, sender: 'player' }]);
  };
  
  const addAiMessage = (message: string) => {
    setChatMessages(prev => [...prev, { text: message, sender: 'ai' }]);
  };
  
  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  // Auto-scroll history table when new entries are added
  useEffect(() => {
    if (historyTableRef.current && game?.history?.length > 0) {
      historyTableRef.current.scrollTop = historyTableRef.current.scrollHeight;
    }
  }, [game?.history?.length]);
  
  // Function to explain rules in chat
  const explainRules = () => {
    addAiMessage("Let me explain the Prisoner's Dilemma:");
    addAiMessage("In each round, we both choose to either Cooperate or Defect without knowing the other's choice.");
    addAiMessage("If we both Cooperate: We each get +2 NST");
    addAiMessage("If we both Defect: We each lose 1 NST");
    addAiMessage("If one Cooperates and one Defects: The defector gets +4 NST, the cooperator loses 3 NST");
    addAiMessage("The game lasts for 5 rounds. Good luck!");
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    addPlayerMessage(newMessage);
    setNewMessage('');
    
    // Simple AI response
    setTimeout(() => {
      if (newMessage.toLowerCase().includes('hello') || newMessage.toLowerCase().includes('hi')) {
        addAiMessage('Hello there! Ready to make your move?');
      } else if (newMessage.toLowerCase().includes('rules')) {
        explainRules();
      } else if (newMessage.toLowerCase().includes('help')) {
        addAiMessage('Need help? Just click the Rules button or ask me specific questions!');
      } else {
        addAiMessage('I see! Remember to make your move when you\'re ready.');
      }
    }, 500);
    
    // Focus back on input
    chatInputRef.current?.focus();
  };
  
  const submitMove = () => {
    if (!selectedMove) return;
    
    setStatus('Submitting move...');
    
    // Simulate AI thinking
    setTimeout(() => {
      contractSubmitMove();
      
      const lastRound = game?.history[game.history.length - 1];
      if (lastRound) {
        const { playerMove, aiMove } = lastRound;
        const playerMoveText = playerMove === 1 ? 'Cooperate' : 'Defect';
        const aiMoveText = aiMove === 1 ? 'Cooperate' : 'Defect';
        const points = calculatePayoff(playerMove, aiMove);
        const pointsText = points > 0 ? `+${points}` : points;
        
        addAiMessage(`Round ${game.history.length} results:`);
        addAiMessage(`You chose: ${playerMoveText}`);
        addAiMessage(`I chose: ${aiMoveText}`);
        addAiMessage(`You earned: ${pointsText} NST`);
        addAiMessage(getResultExplanation(playerMove, aiMove));
        
        if (game.history.length < MAX_ROUNDS) {
          addAiMessage('Ready for the next round?');
        } else {
          const { player, ai } = calculateTotalEarnings();
          addAiMessage(`Game over! Final score: You ${player} | Me ${ai}`);
          
          if (player > ai) {
            addAiMessage('Congratulations! You won the game!');
          } else if (player < ai) {
            addAiMessage('I won this time! Better luck next game!');
          } else {
            addAiMessage('It\'s a tie! Great game!');
          }
        }
      }
      
      setSelectedMove(null);
      setStatus('Ready for next move');
    }, 1000);
  };
  
  const handleStartGame = () => {
    setStatus('Starting game...');
    
    // Reset game state
    resetGame();
    setChatMessages([
      { text: 'Hello! I am MrsBeauty. Ready to play Prisoner\'s Dilemma?', sender: 'ai' }
    ]);
    
    // Start new game
    startGame();
    
    // Add welcome messages
    setTimeout(() => {
      addAiMessage('Game started! Let me explain how to play:');
      explainRules();
      addAiMessage('Make your first move when ready!');
      setStatus('Your turn');
    }, 500);
  };
  
  const handleAction = () => {
    if (!game) {
      // If no game, start a new one
      handleStartGame();
    } else if (game.state === 0) {
      // If game is in initial state, start it
      handleStartGame();
    } else if (game.state === 1) {
      // If game is active and move is selected, submit it
      if (selectedMove) {
        submitMove();
      }
    } else if (game.state === 2) {
      // If game is over, start a new one
      handleStartGame();
    }
  };
  
  const getActionButtonText = () => {
    if (!game) {
      return 'Start Game';
    }
    
    switch (game.state) {
      case 0: return 'Start Game';
      case 1: return selectedMove ? 'Submit Move' : 'Select Move First';
      case 2: return 'New Game';
      default: return 'Action';
    }
  };
  
  const connectWallet = () => {
    setWalletConnected(true);
    setNstBalance(100); // Give some initial NST for testing
    addAiMessage('Wallet connected! You have 100 NST.');
  };
  
  const mintNST = () => {
    setNstBalance(prev => prev + 100);
    addAiMessage('100 NST minted to your wallet!');
  };
  
  const stakeNST = () => {
    if (nstBalance >= 25) {
      setNstBalance(prev => prev - 25);
      setStaked(true);
      addAiMessage('25 NST staked! You can now play the game.');
      
      // Auto-start game after staking
      setTimeout(() => {
        handleStartGame();
      }, 500);
    }
  };
  
  const getResultExplanation = (playerMove: number, aiMove: number) => {
    if (playerMove === 1 && aiMove === 1) {
      return "We both cooperated! This is the socially optimal outcome where we both benefit moderately.";
    } 
    else if (playerMove === 1 && aiMove === 2) {
      return "You cooperated but I defected. While this maximizes my gain, it comes at your expense. This is the 'temptation to defect' in game theory.";
    }
    else if (playerMove === 2 && aiMove === 1) {
      return "You defected while I cooperated. This maximizes your gain at my expense. In a one-shot game, this would be the rational choice.";
    }
    else if (playerMove === 2 && aiMove === 2) {
      return "We both defected! While we both tried to maximize individual gain, we ended up with a suboptimal outcome for both - the classic dilemma.";
    }
    
    return "Interesting outcome!";
  };
  
  return (
    <div className="action-grid" data-component-name="GameMockNintendo" style={{ display: 'grid', gridTemplateColumns: '40% 60%', columnGap: '10px', width: '100vw', margin: 0, padding: 0 }}>
      <div className="game-container">
        <h1>Prisoner's Dilemma Game</h1>
        
        <div className="game-status">
          <div className="status-text">
            {status}
          </div>
          
          <div className="wallet-info">
            {walletConnected ? (
              <div className="balance">
                NST Balance: {nstBalance}
                <button className="mint-button" onClick={mintNST}>Mint 100 NST</button>
              </div>
            ) : (
              <button className="connect-button" onClick={connectWallet}>Connect Wallet</button>
            )}
          </div>
        </div>
        
        <div className="main-content-area">
          <div className="status-column">
            <div className="chat-box">
              <h3>Chat with MrsBeauty</h3>
              <div className="chat-content">
                <div className="chat-messages" ref={chatMessagesRef}>
                  {chatMessages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`message ${msg.sender === 'player' ? 'player-message' : 'ai-message'}`}
                    >
                      <div className="message-sender">
                        {msg.sender === 'player' ? 'You' : 'MrsBeauty'}:
                      </div>
                      <div className="message-text">{msg.text}</div>
                    </div>
                  ))}
                </div>
                
                <form className="chat-input-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    ref={chatInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="chat-input"
                  />
                  <button type="submit" className="send-button">Send</button>
                </form>
              </div>
            </div>
          </div>
          
          <div className="controls-history-column">
            <div className="action-panel">
              <div className="action-grid" style={{ display: 'flex', width: '100%', margin: 0, padding: 0 }}>
                <div className="left-controls" style={{ width: '40%', flex: '0 0 40%' }}>
                  {/* Left Side - 45% width */}
                  <button 
                    className="rules-button control-btn" 
                    onClick={explainRules}
                    disabled={isLoading}
                    style={{ display: 'block', opacity: '1', visibility: 'visible' }}
                  >
                    Rules
                  </button>
                  
                  <button 
                    className="stake-button control-btn" 
                    onClick={stakeNST} 
                    disabled={!walletConnected || staked || nstBalance < 25}
                    style={{ display: 'block', opacity: '1', visibility: 'visible' }}
                  >
                    Stake 25 $NST
                  </button>
                </div>
                
                <div className="right-controls" style={{ width: '60%', flex: '0 0 60%' }}>
                  {/* Right Side - 55% width */}
                  <div className="nintendo-controls-wrapper">
                    <div className="dpad-area">
                      {/* Button 3: Cooperate - Left 50% */}
                      <button
                        className={`cooperate-button control-btn ${selectedMove === 1 ? 'selected' : ''}`}
                        onClick={() => makeMove(1)}
                        disabled={isLoading || !game || game.state !== 1}
                      >
                        <span>Cooperate</span> <span>🟢</span>
                      </button>
                      
                      {/* Button 4: Defect - Right 50% */}
                      <button
                        className={`defect-button control-btn ${selectedMove === 2 ? 'selected' : ''}`}
                        onClick={() => makeMove(2)}
                        disabled={isLoading || !game || game.state !== 1}
                      >
                        <span>Defect</span> <span>🔴</span>
                      </button>
                    </div>
                    
                    {/* Bottom Row - 25% height - Action Button */}
                    <button 
                      className="action-button control-btn main-action" 
                      onClick={handleAction}
                      disabled={isLoading || (game?.state === 1 && !selectedMove)}
                    >
                      {getActionButtonText()}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Game History Box */}
            <div className="history-box">
              <h3>Game History</h3>
              <div className="history-content">
                <div className="table-container" ref={historyTableRef} style={{ maxHeight: '300px', overflowY: 'auto', scrollBehavior: 'smooth' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Rnd</th>
                        <th>You</th>
                        <th>MrsB</th>
                        <th>Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {game && game.history && game.history.length > 0 ? (
                        game.history.map((round: {playerMove: number, aiMove: number}, index: number) => {
                          const playerMove = round.playerMove;
                          const aiMove = round.aiMove;
                          const points = calculatePayoff(playerMove, aiMove);
                          
                          return (
                            <tr key={index}>
                              <td>{index + 1}</td>
                              <td style={{ fontSize: '18px', textAlign: 'center', padding: '5px 8px' }}>{playerMove === 1 ? '🟢' : '🔴'}</td>
                              <td style={{ fontSize: '18px', textAlign: 'center', padding: '5px 8px' }}>{aiMove === 1 ? '🟢' : '🔴'}</td>
                              <td className={points > 0 ? 'positive' : points < 0 ? 'negative' : 'neutral'}>
                                {points > 0 ? '+' : ''}{points}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="no-data">No game history yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Game Over Results */}
                {game && game.state === 2 && (
                  <div className="game-over-results">
                    <h2>Game Over!</h2>
                    <div className="final-scores">
                      Final Score: You {earnings.player} | MrsBeauty {earnings.ai}
                    </div>
                    <div className="game-summary">
                      {earnings.player > earnings.ai ? 'You won!' : 
                       earnings.player < earnings.ai ? 'MrsBeauty won!' : 'It\'s a tie!'}
                    </div>
                    <div className="game-summary">
                      Thanks for playing! Start a new game?
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameMockNintendo;
