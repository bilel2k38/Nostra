// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CatalystContract {
    struct Game {
        address player;
        uint256 aiStrategyId; // 0 = Always Cooperate, 1 = Always Defect, 2 = Tit-for-Tat
        string[] humanMoves;
        string[] aiMoves;
        uint256 round;
        bool completed;
    }

    mapping(uint256 => Game) public games;
    uint256 public gameId;

    function startGame(address player, uint256 aiStrategyId) public returns (uint256) {
        gameId++;
        games[gameId] = Game(player, aiStrategyId, new string[](5), new string[](5), 0, false);
        return gameId;
    }

    function submitMove(uint256 gameId, string memory move) public {
        Game storage game = games[gameId];
        require(game.player == msg.sender, "Not the player");
        require(game.round < 5, "Game completed");
        require(keccak256(bytes(move)) == keccak256(bytes("C")) || keccak256(bytes(move)) == keccak256(bytes("D")), "Invalid move");

        game.humanMoves[game.round] = move;
        // AI move logic (simplified, to be handled off-chain by MrsBeauty)
        game.aiMoves[game.round] = "C"; // Placeholder for AI strategy
        game.round++;
        if (game.round == 5) game.completed = true;
    }

    function endGame(uint256 gameId) public view returns (uint256, uint256) {
        Game storage game = games[gameId];
        require(game.completed, "Game not completed");
        // Simplified payoff logic (to be expanded)
        uint256 humanPayoff = 0;
        uint256 aiPayoff = 0;
        for (uint256 i = 0; i < 5; i++) {
            if (keccak256(bytes(game.humanMoves[i])) == keccak256(bytes("C")) && keccak256(bytes(game.aiMoves[i])) == keccak256(bytes("C"))) {
                humanPayoff += 150;
                aiPayoff += 150;
            } else if (keccak256(bytes(game.humanMoves[i])) == keccak256(bytes("C")) && keccak256(bytes(game.aiMoves[i])) == keccak256(bytes("D"))) {
                humanPayoff += 0;
                aiPayoff += 100;
            } else if (keccak256(bytes(game.humanMoves[i])) == keccak256(bytes("D")) && keccak256(bytes(game.aiMoves[i])) == keccak256(bytes("C"))) {
                humanPayoff += 100;
                aiPayoff += 0;
            }
        }
        return (humanPayoff, aiPayoff);
    }
}