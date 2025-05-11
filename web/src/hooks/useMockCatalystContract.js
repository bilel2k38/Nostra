import { useState } from 'react';

export const useMockCatalystContract = () => {
  const [game, setGame] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Start a new game
  const startGame = async (stake) => {
    setIsLoading(true);
    try {
      // Create a game state object
      const newGame = {
        state: 1, // Active
        round: 0,
        playerMoves: [],
        aiMoves: [],
        history: [],
        stake: stake || 25
      };
      
      setGame(newGame);
      return true;
    } catch (error) {
      console.error("Error starting game:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Make a move (store locally until submitted)
  const makeMove = (move) => {
    if (!game) return;
    
    // Store the move locally
    const updatedGame = { ...game, currentMove: move };
    setGame(updatedGame);
  };

  // Submit the move to the contract
  const submitMove = async () => {
    if (!game || !game.currentMove) return;
    
    setIsLoading(true);
    try {
      // Generate a random AI move (1 or 2)
      const aiMove = Math.floor(Math.random() * 2) + 1;
      
      // Update local game state
      const updatedPlayerMoves = [...(game.playerMoves || []), game.currentMove];
      const updatedAiMoves = [...(game.aiMoves || []), aiMove];
      
      // Create a history entry for this round
      const updatedHistory = [...(game.history || []), {
        playerMove: game.currentMove,
        aiMove: aiMove
      }];
      
      const updatedGame = {
        ...game,
        playerMoves: updatedPlayerMoves,
        aiMoves: updatedAiMoves,
        history: updatedHistory,
        round: (game.round || 0) + 1,
        currentMove: null
      };
      
      // Check if game is over (5 rounds)
      if (updatedGame.round >= 5) {
        updatedGame.state = 2; // Game over
      }
      
      setGame(updatedGame);
    } catch (error) {
      console.error("Error submitting move:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Reveal the AI's move (in a real contract this would be a separate step)
  const revealMove = async () => {
    // In our mock implementation, the AI move is already revealed in submitMove
    // This function is just for API compatibility
    return Promise.resolve();
  };
  
  // Reset the game
  const resetGame = () => {
    setGame(null);
  };

  return {
    game,
    startGame,
    makeMove,
    submitMove,
    revealMove,
    resetGame,
    isLoading
  };
};

export default useMockCatalystContract;
