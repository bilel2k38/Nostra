import React, { useState, useEffect, useRef, useCallback } from 'react';
// @ts-ignore - Mock contract doesn't have type definitions
import { useMockCatalystContract } from '../hooks/useMockCatalystContract';
import '../styles/PrisonersDilemmaGame.css';
import '../styles/PrisonersDilemmaGame.action.css';
import '../styles/PrisonersDilemmaGame.chat.css';

// Type definitions
interface GameState {
  round: number;
  roundStartTime: number;
  status: string;
  selectedMove: number | null;
  playerSubmitted: boolean;
  botSubmitted: boolean;
}

interface GameHistory {
  round: number;
  playerMove: number;
  aiMove: number;
  playerPoints: number;
  aiPoints: number;
}

interface ChatMessage {
  text: string;
  sender: 'player' | 'ai';
  isTyping?: boolean;
  isComplete?: boolean;
  visibleText?: string;
}

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

const PrisonersDilemmaGame: React.FC = () => {
  const [selectedMove, setSelectedMove] = useState<number | null>(null);
  const [status, setStatus] = useState<string>('Ready to play');
  const [staked, setStaked] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState>({
    round: 0,
    roundStartTime: 0,
    status: 'idle',
    selectedMove: null,
    playerSubmitted: false,
    botSubmitted: false,
  });
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [nstBalance, setNstBalance] = useState<number>(100);
  const [newMessage, setNewMessage] = useState<string>('');
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const historyTableRef = useRef<HTMLDivElement>(null);
  const processedRoundRef = useRef<number>(0);
  
  // Mock Catalyst contract hook
  const { 
    game, 
    startGame, 
    makeMove: contractMakeMove, 
    submitMove: contractSubmitMove,
    resetGame: contractResetGame,
    isLoading: contractLoading,
    error: contractError
  } = useMockCatalystContract();

  // Mock wallet hooks - starting with disconnected state
  const [mockAccount, setMockAccount] = useState<string | null>(null);
  const isConnecting = false;
  const web3Error = null;
  
  const approveNST = async () => { 
    setIsLoading(false); 
    return true; 
  };
  
  const web3ConnectWallet = async () => { 
    setIsLoading(true);
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsConnected(true); 
    setMockAccount('0x742d35Cc6634C0532925a3b844Bc454e4438f44e');
    setNstBalance(100);
    setIsLoading(false);
    return true; 
  };
  
  // Mock functions to fix TypeScript errors
  const connectWallet = web3ConnectWallet;
  const mintNST = async () => { setNstBalance(prev => prev + 15); return true; };
  const resetGame = contractResetGame;
  
  // Use the mock account instead of the auto-connected one
  const account = mockAccount;
  
  // Derived state
  const walletConnected = !!account;
  
  const calculateTotalEarnings = useCallback(() => {
    let playerEarnings = 0;
    let aiEarnings = 0;
    
    if (game && game.history && game.history.length > 0) {
      game.history.forEach((round: {playerMove: number, aiMove: number}) => {
        playerEarnings += calculatePayoff(round.playerMove, round.aiMove);
        aiEarnings += calculatePayoff(round.aiMove, round.playerMove);
      });
    }
    
    return { player: playerEarnings, ai: aiEarnings };
  }, [game]);
  
  const earnings = calculateTotalEarnings();
  
  const makeMove = (move: number) => {
    // Only send a message if no move was previously selected
    const firstSelection = selectedMove === null;
    
    // Update state with the selected move
    setSelectedMove(move);
    contractMakeMove(move); 
    
    // Update status text only
    const moveText = move === 1 ? 'Cooperate' : 'Defect';
    setStatus(`Selected: ${moveText}. Click SUBMIT to confirm.`);
    
    // Only add MrsBeauty's message if this is the first selection (not when changing choices)
    if (firstSelection) {
      addAiMessage(`I have made my decision too... Click SUBMIT when you are ready to reveal our choices!`);
    }
  };
  
  const addPlayerMessage = useCallback((message: string) => {
    if (!message || message.trim() === '') return; // Don't add empty messages
    setChatMessages(prev => [...prev, { text: message, sender: 'player' }]);
  }, []);
  
  const addAiMessage = useCallback((message: string) => {
    if (!message || message.trim() === '') return; // Don't add empty messages
    
    // Add a new AI message with typing animation
    setChatMessages(prev => {
      const newMessage = { 
        text: message, 
        sender: 'ai' as const,
        isTyping: true, 
        isComplete: false,
        visibleText: ''
      };
      return [...prev, newMessage];
    });
    
    // Set up character-by-character typing animation
    const typingSpeed = 15; // milliseconds per character - faster animation for better UX
    
    let charIndex = 0;
    const typingInterval = setInterval(() => {
      setChatMessages(prev => {
        // Find the message we're animating (should be the last one)
        if (prev.length === 0) {
          clearInterval(typingInterval);
          return prev;
        }
        
        const lastIndex = prev.length - 1;
        const currentMsg = prev[lastIndex];
        
        if (!currentMsg || !currentMsg.isTyping) {
          clearInterval(typingInterval);
          return prev;
        }
        
        charIndex++;
        const newVisibleText = currentMsg.text.substring(0, charIndex);
        const isComplete = charIndex >= currentMsg.text.length;
        
        // Update the message with the new visible text
        const updatedMessages = [...prev];
        updatedMessages[lastIndex] = {
          ...currentMsg,
          visibleText: newVisibleText,
          isComplete: isComplete,
          isTyping: !isComplete
        };
        
        // If we've reached the end of the message, clear the interval
        if (isComplete) {
          clearInterval(typingInterval);
        }
        
        return updatedMessages;
      });
    }, typingSpeed);
  }, []);
  
  // Function to update status in both Game Log and as MrsBeauty chat message
  const updateStatus = useCallback((statusText: string, chatMessage?: string) => {
    setStatus(statusText);
    if (chatMessage) {
      addAiMessage(chatMessage);
    }
  }, [addAiMessage]);
  
  // No welcome message here - we'll use the one from the initialization effect
  
  // Helper function to suggest next steps based on game state
  const suggestNextStep = () => {
    if (!walletConnected) {
      return 'First, connect your wallet by clicking the CONNECT button.';
    } else if (walletConnected && !staked) {
      return `You've connected your wallet! Now stake 15 NST by clicking the STAKE button.`;
    } else if (walletConnected && staked && (!game || game.state === 0)) {
      return 'Great! You have staked 15 NST. Click START to begin the game!';
    } else if (game && game.state === 1 && selectedMove === null) {
      return `Round ${game.round}: Choose your move - COOPERATE or DEFECT?`;
    } else if (game && game.state === 1 && selectedMove !== null) {
      return `You've selected a move. Click SUBMIT to confirm your choice!`;
    } else if (game && game.state === 2) {
      return 'Game over! Click RESET to play again.';
    }
    return '';
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
  
  // Initialize welcome messages when component mounts
  useEffect(() => {
    // Clear any existing messages first
    setChatMessages([]);
    
    // Add welcome messages with a slight delay
    setTimeout(() => {
      // Add both welcome messages directly to avoid animation issues
      setChatMessages([
        { 
          text: "Welcome to the Prisoner's Dilemma! I am MrsBeauty, and I'll be your host.", 
          sender: 'ai' as const,
          isTyping: false,
          isComplete: true
        },
        {
          text: "Click the CONNECT button to get started. Type 'rules' anytime if you want to see the full game instructions!",
          sender: 'ai' as const,
          isTyping: false,
          isComplete: true
        }
      ]);
    }, 100);
    
    // Reset round counter
    processedRoundRef.current = 0;
  }, []); // Empty dependency array ensures this only runs once
  
  const explainRules = () => {
    // Create a new message with the rules
    const rulesMessage = `• Choose: Cooperate (🟢) or Defect (🔴)\n` +
      `• ${MAX_ROUNDS} rounds total, 15 NST stake required\n` +
      `• Both players choose moves secretly\n\n` +
      `PAYOFFS:\n` +
      `• Both Cooperate: +2 NST each\n` +
      `• You Cooperate, AI Defects: -3 NST you, +4 NST AI\n` +
      `• You Defect, AI Cooperates: +4 NST you, -3 NST AI\n` +
      `• Both Defect: -1 NST each`;
    
    // Add the rules message with typing animation
    addAiMessage(rulesMessage);
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMessage.trim() === '') return;
    
    // Store the message before clearing the input
    const messageText = newMessage;
    
    // Add player message to chat
    addPlayerMessage(messageText);
    
    // Clear input field immediately for better UX
    setNewMessage('');
    
    // Handle commands and responses
    const lowerMessage = messageText.toLowerCase().trim();
    
    // Handle special commands
    if (lowerMessage === 'rules' || lowerMessage === 'help') {
      // Add a small delay before showing the response
      setTimeout(() => {
        // Create a concise rules message
        const rulesMessage = `• Choose: Cooperate (🟢) or Defect (🔴)\n` +
          `• ${MAX_ROUNDS} rounds total, 15 NST stake required\n` +
          `• Both players choose moves secretly\n\n` +
          `PAYOFFS:\n` +
          `• Both Cooperate: +2 NST each\n` +
          `• You Cooperate, AI Defects: -3 NST you, +4 NST AI\n` +
          `• You Defect, AI Cooperates: +4 NST you, -3 NST AI\n` +
          `• Both Defect: -1 NST each`;
        
        // Use the typing animation for rules
        addAiMessage(rulesMessage);
      }, 300);
    } else {
      // Generic responses based on game state with clear guidance
      setTimeout(() => {
        if (game && game.state === 0) {
          addAiMessage("Ready to play! " + suggestNextStep());
        } else if (game && game.state === 1) {
          addAiMessage("Let's play! " + suggestNextStep());
        } else if (game && game.state === 2) {
          addAiMessage("Game over! Want to play again? Just click RESET.");
        } else {
          addAiMessage("I'm here to help! " + suggestNextStep());
        }
      }, 300);
    }
  };
  
  const getCommentary = useCallback((playerMove: number, aiMove: number, playerPayoff: number) => {
    if (playerMove === 1 && aiMove === 1) {
      return `We both cooperated! That's the spirit of mutual benefit!`;
    } else if (playerMove === 2 && aiMove === 2) {
      return `We both defected! Mutual suspicion costs us both.`;
    } else if (playerMove === 1 && aiMove === 2) {
      return `You cooperated, but I defected. Sometimes trust is exploited.`;
    } else {
      return `You defected while I cooperated. Clever move!`;
    }
  }, []);

  // Adjusted to only return text, AI message is sent from calling contexts if needed
  const getResultExplanation = useCallback((playerMove: number, aiMove: number, playerPayoff: number, aiPayoff: number, shouldAddToChat: boolean = false): string => {
    const playerMoveText = playerMove === 1 ? 'Cooperate 🟢' : 'Defect 🔴';
    const aiMoveText = aiMove === 1 ? 'Cooperate 🟢' : 'Defect 🔴';
    
    let explanation = `You: ${playerMoveText}, MrsBeauty: ${aiMoveText}. `;
    
    if (playerMove === 1 && aiMove === 1) {
      explanation += `Both cooperated! You: +${playerPayoff} NST, MrsBeauty: +${aiPayoff} NST`;
      if (shouldAddToChat) addAiMessage("We both cooperated! That's the spirit of mutual benefit!");
    } 
    else if (playerMove === 1 && aiMove === 2) {
      explanation += `You cooperated, but MrsBeauty defected! You: ${playerPayoff} NST, MrsBeauty: +${aiPayoff} NST`;
      if (shouldAddToChat) addAiMessage("You cooperated but I defected! Sometimes temptation wins...");
    }
    else if (playerMove === 2 && aiMove === 1) {
      explanation += `You defected while MrsBeauty cooperated! You: +${playerPayoff} NST, MrsBeauty: ${aiPayoff} NST`;
      if (shouldAddToChat) addAiMessage("You defected while I cooperated! Well played, you maximized your gain.");
    }
    else {
      explanation += `Both defected! You: ${playerPayoff} NST, MrsBeauty: ${aiPayoff} NST`;
      if (shouldAddToChat) addAiMessage("We both defected! Mutual suspicion leads to mutual loss.");
    }
    
    return explanation;
  }, [addAiMessage]);
  
  const submitMove = () => {
    if (!walletConnected || !staked) {
      updateStatus('You need to connect wallet and stake NST first', '1️⃣ First, connect your wallet and 2️⃣ stake some NST before we can start playing.');
      return;
    }
    
    if (selectedMove === null) {
      updateStatus('Select a move first', '4️⃣ You need to select COOPERATE or DEFECT first before submitting!');
      return;
    }
        
    if (game && game.state === 1) {
      // Process the move - this runs synchronously in our mock implementation
      contractSubmitMove(); 
      // The actual result processing will be handled by the useEffect below, listening to `game` changes.
      setSelectedMove(null); // Reset UI for next selection
    }
  };

  // useEffect to handle game progression, round results, and game over logic
  useEffect(() => {
    if (game && game.history && game.history.length > 0 && game.history.length > processedRoundRef.current) {
      const currentRoundNumber = game.history.length;
      const latestEntry = game.history[currentRoundNumber - 1];

      if (latestEntry && latestEntry.playerMove !== undefined && latestEntry.aiMove !== undefined) {
        const playerMoveSubmitted = latestEntry.playerMove;
        const aiMove = latestEntry.aiMove;
        const playerPayoff = calculatePayoff(playerMoveSubmitted, aiMove);
        const aiPayoff = calculatePayoff(aiMove, playerMoveSubmitted);

        const explanation = getResultExplanation(playerMoveSubmitted, aiMove, playerPayoff, aiPayoff, false);
        const commentary = getCommentary(playerMoveSubmitted, aiMove, playerPayoff);

        addAiMessage(`📊 Round ${currentRoundNumber} Results: ${commentary}`);
        setStatus(`Round ${currentRoundNumber} results: ${explanation}`);

        processedRoundRef.current = currentRoundNumber;

        if (currentRoundNumber >= MAX_ROUNDS) {
          setTimeout(() => {
            const finalEarnings = calculateTotalEarnings();
            
            // Use direct message setting instead of animation to prevent artifacts
            const endGameMessages = [
              { 
                text: `🏁 Game Over! Final Score: You ${finalEarnings.player} / Me ${finalEarnings.ai}`, 
                sender: 'ai' as const,
                isTyping: false,
                isComplete: true
              }
            ];
            
            // Add appropriate winning/losing message
            if (finalEarnings.player > finalEarnings.ai) {
              endGameMessages.push({
                text: `🏆 Congratulations! You won by ${finalEarnings.player - finalEarnings.ai} points! Your strategy paid off.`,
                sender: 'ai' as const,
                isTyping: false,
                isComplete: true
              });
            } else if (finalEarnings.player < finalEarnings.ai) {
              endGameMessages.push({
                text: `💎 I won by ${finalEarnings.ai - finalEarnings.player} points! Better luck next time!`,
                sender: 'ai' as const,
                isTyping: false,
                isComplete: true
              });
            } else {
              endGameMessages.push({
                text: `🤝 It is a tie! Great minds think alike... or do they? 😉`,
                sender: 'ai' as const,
                isTyping: false,
                isComplete: true
              });
            }
            
            // Set all messages at once
            setChatMessages(prev => [...prev, ...endGameMessages]);
            
            // Add play again message with a delay
            setTimeout(() => {
              setChatMessages(prev => [...prev, { 
                text: `Want to play again? Click RESET and then START for a new game!`, 
                sender: 'ai' as const,
                isTyping: false,
                isComplete: true
              }]);
            }, 1000);
          }, 1000);
        } else {
          setTimeout(() => {
            if (currentRoundNumber === 1) {
              addAiMessage(`🔄 Round 2 begins! Will you stick with your strategy or adapt?`);
            } else if (currentRoundNumber === 2) {
              addAiMessage(`🔄 Round 3 begins! Halfway through! Your current score: ${calculateTotalEarnings().player}.`);
            } else if (currentRoundNumber === 3) {
              addAiMessage(`🔄 Round 4 begins! Only two rounds left! Make them count.`);
            } else {
              addAiMessage(`🔄 Final round! Round 5 begins! Will you cooperate or defect for the last time?`);
            }
          }, 1000);
        }
      }
    }
  }, [game, addAiMessage, updateStatus, getCommentary, getResultExplanation, calculateTotalEarnings, calculatePayoff]); // Added calculatePayoff to dependencies
  
  const handleStartGame = () => {
    if (!walletConnected) {
      updateStatus('Wallet not connected', '1️⃣ First, you need to connect your wallet by clicking the CONNECT button.');
      return;
    }
    
    if (!staked) {
      updateStatus('No stake detected', '2️⃣ You need to stake at least 15 NST to play. Click the STAKE 15 NST button.');
      return;
    }
    
    // Reset UI state
    setSelectedMove(null);
    processedRoundRef.current = 0;
    
    // Start the game
    startGame();
    setStatus('Game started! Choose your move for Round 1.');
    
    // Add welcome messages directly without animation to prevent artifacts
    setChatMessages([
      { 
        text: `Will you COOPERATE or DEFECT? Choose wisely...`, 
        sender: 'ai' as const,
        isTyping: false,
        isComplete: true
      },
      {
        text: `Remember: Cooperate (🟢) for mutual benefit, or Defect (🔴) for potential higher gain.`,
        sender: 'ai' as const,
        isTyping: false,
        isComplete: true
      }
    ]);
  };
  
  const stakeNST = () => {
    if (!walletConnected) {
      updateStatus('Wallet not connected', '1️⃣ First, you need to connect your wallet by clicking the CONNECT button.');
      return;
    }
    
    if (nstBalance < 15) {
      updateStatus('Insufficient balance', 'You need at least 15 NST to stake. Click MINT to get more NST.');
      return;
    }
    
    // Mock staking
    setStaked(true);
    setNstBalance(prev => prev - 15);
    updateStatus('Staked 15 NST', '✅ Step 2 complete! You\'ve staked 15 NST. 3️⃣ Now click START to begin the game!');
  };
  

  
  const handleAction = () => {
    // If game is null or state is 0, start a new game
    if (!game || game.state === 0) {
      handleStartGame();
      return;
    }
    
    // Otherwise handle based on current game state
    switch (game.state) {
      case 1: // Game in progress
        submitMove();
        break;
      case 2: // Game finished
        resetGame();
        updateStatus('Game reset. Ready to start a new round?', 'Game has been reset. Ready for another challenge?');
        break;
    }
  };
  
  const getActionButtonText = () => {
    if (!game) return 'START';
    
    switch (game.state) {
      case 0: return 'START';
      case 1: return selectedMove ? 'SUBMIT' : 'SELECT MOVE';
      case 2: return 'RESET';
      default: return 'START';
    }
  };
  
  return (
    <div className="game-container">
      {/* Game Header */}
      <div className="game-header">
        <h1 className="game-title">Prisoner's Dilemma</h1>
        
        <div className="wallet-info-area">
          {walletConnected ? (
            <div className="connected-wallet-info">
              <div className="wallet-status-row">
                <span className="wallet-status">Connected</span>
                <button className="mint-button" onClick={mintNST}>MINT NST</button>
              </div>
              <span className="nst-balance">Balance: {nstBalance} NST</span>
            </div>
          ) : (
            <button className="connect-button" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
      
      {/* Main Game Area */}
      <div className="main-content-area">
        {/* Left Column - Chat */}
        <div className="status-column">
          <div className="chat-box">
            <h3>MrsBeauty (Host) Chat</h3>
            <div className="chat-messages" ref={chatMessagesRef}>
              {chatMessages.map((msg, index) => {
                // Only render messages that have text content
                // Filter out empty messages or messages with just a single character
                if (!msg.text || msg.text.trim() === '' || msg.text.trim().length === 1) {
                  return null;
                }
                
                return (
                  <div key={index} className={`chat-message ${msg.sender}`}>
                    <div className="message-bubble">
                      {msg.sender === 'ai' && <div className="message-sender">MrsBeauty</div>}
                      {msg.isTyping ? (
                        <div className="message-text">
                          <span className="typing-animation">
                            {msg.visibleText || ' '}
                          </span>
                        </div>
                      ) : (
                        <div className="message-text">
                          {msg.text.includes('<') ? (
                            <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                          ) : (
                            <span>{msg.text}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="chat-input"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                ref={chatInputRef}
              />
              <button type="submit" className="send-button">Send</button>
            </form>
          </div>
        </div>
        
        {/* Right Column - Controls and Game Log */}
        <div className="controls-history-column">
          <div className="controls-area">
            <div className="action-grid" data-component-name="PrisonersDilemmaGame" style={{ display: 'grid', gridTemplateColumns: '40% 60%', columnGap: '10px' }}>
              <div className="action-grid-cell">
                <div className="action-button-wrapper">
                  <button 
                    className="control-btn rules-button" 
                    onClick={explainRules}
                    disabled={isLoading}
                  >
                    RULES
                  </button>
                  <button 
                    className="control-btn stake-button" 
                    onClick={stakeNST}
                    disabled={isLoading || staked || !walletConnected || nstBalance < 15}
                  >
                    {staked ? 'STAKED' : 'STAKE 15 NST'}
                  </button>
                </div>
              </div>
              <div className="action-grid-cell">
                <div className="controls-wrapper">
                  <div className="dpad-area">
                    <button 
                      className={`cooperate-button control-btn ${selectedMove === 1 ? 'selected' : ''}`}
                      onClick={() => makeMove(1)}
                      disabled={isLoading || game?.state !== 1}
                    >
                      COOPERATE
                    </button>
                    <button 
                      className={`defect-button control-btn ${selectedMove === 2 ? 'selected' : ''}`}
                      onClick={() => makeMove(2)}
                      disabled={isLoading || game?.state !== 1}
                    >
                      DEFECT
                    </button>
                  </div>
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

            {/* Game Log Box */}
            <div className="game-log-box">
              <h3>Game Log</h3>
              <div className="game-log-content">
                {/* Current Status Section */}
                <div className="status-log-section">
                  <h4>Current Status</h4>
                  <p className="status-text" style={{ color: 'black' }}>Current Round: {game ? game.round : 0}/{MAX_ROUNDS}</p>
                  <p className="status-text" style={{ color: 'black' }}>Your Earnings: {earnings.player} NST</p>
                  <p className="status-text" style={{ color: 'black' }}>MrsBeauty's Earnings: {earnings.ai} NST</p>
                  <p className="status-text" style={{ color: 'black' }}>Stake: {staked ? '15 NST' : 'Not Staked'}</p>
                </div>

                {/* History Section */}
                <div className="history-log-section">
                  <h4>Round History</h4>
                  <div className="table-container" ref={historyTableRef}>
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
    </div>
  );
};

export default PrisonersDilemmaGame;
