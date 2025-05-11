// MockCatalystContract.js
// A client-side mock of the CatalystContract for testing the UI

class MockCatalystContract {
  constructor() {
    this.gameId = 0;
    this.games = {};
    this.playerAddress = '0x123456789abcdef';
    this.listeners = [];
  }

  // Set the player's address
  setPlayerAddress(address) {
    this.playerAddress = address;
  }

  // Start a new game
  startGame(stake = 25) {
    this.gameId++;
    const stakeInWei = stake * 10**18;
    
    this.games[this.gameId] = {
      player: this.playerAddress,
      ai: '0x222a7c348B60B9091E5e1dC89c7Eb1847AC395B4',
      state: 1, // Active
      round: 0,
      playerStake: stakeInWei.toString(),
      aiStake: stakeInWei.toString(),
      playerMoves: [0, 0, 0, 0, 0],
      aiMoves: [0, 0, 0, 0, 0],
      playerBalance: stakeInWei.toString(),
      aiBalance: stakeInWei.toString()
    };
    
    return this.gameId;
  }

  // Submit a move for the current round
  submitMove(gameId, playerMove, aiMove) {
    if (!this.games[gameId]) return false;
    if (this.games[gameId].state !== 1) return false;
    if (this.games[gameId].round >= 5) return false;
    
    const game = this.games[gameId];
    const round = game.round;
    
    // Record moves
    game.playerMoves[round] = playerMove;
    game.aiMoves[round] = aiMove;
    
    // Calculate payoffs
    const [playerPayoff, aiPayoff] = this.calculatePayoff(playerMove, aiMove);
    
    // Update balances
    game.playerBalance = (BigInt(game.playerBalance) + BigInt(playerPayoff)).toString();
    game.aiBalance = (BigInt(game.aiBalance) + BigInt(aiPayoff)).toString();
    
    // Increment round
    game.round++;
    
    // Check if game is finished
    if (game.round === 5) {
      game.state = 2; // Finished
    }
    
    return true;
  }

  // Calculate payoffs based on moves
  calculatePayoff(playerMove, aiMove) {
    const COOP = BigInt(3 * 10**18);
    const SUCKER = BigInt(-5 * 10**18);
    const TEMPT = BigInt(7 * 10**18);
    const PUNISH = BigInt(1 * 10**18);
    
    if (playerMove === 1 && aiMove === 1) {
      return [COOP, COOP];
    } else if (playerMove === 1 && aiMove === 2) {
      return [SUCKER, TEMPT];
    } else if (playerMove === 2 && aiMove === 1) {
      return [TEMPT, SUCKER];
    } else {
      return [PUNISH, PUNISH];
    }
  }

  // End the game and calculate final payouts
  endGame(gameId) {
    if (!this.games[gameId]) return [0, 0];
    if (this.games[gameId].state !== 2) return [0, 0];
    
    const game = this.games[gameId];
    return [game.playerBalance, game.aiBalance];
  }

  // Get the current gameId
  getCurrentGameId() {
    return this.gameId;
  }

  // Get a game by ID
  getGame(gameId) {
    return this.games[gameId] || null;
  }
}

// Create a singleton instance
const mockContract = new MockCatalystContract();

export default mockContract;
