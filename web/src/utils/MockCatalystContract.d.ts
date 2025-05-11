interface GameData {
  player: string;
  ai: string;
  state: number;
  round: number;
  playerStake: string;
  aiStake: string;
  playerMoves: number[];
  aiMoves: number[];
  playerBalance: string;
  aiBalance: string;
}

declare const mockContract: {
  setPlayerAddress: (address: string) => void;
  getCurrentGameId: () => number;
  getGame: (gameId: number) => GameData | null;
  startGame: (stake: number) => number;
  submitMove: (gameId: number, playerMove: number, aiMove: number) => boolean;
};

export default mockContract;
