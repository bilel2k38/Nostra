# Catalyst Prisoner's Dilemma Game

A prototype implementation of the Catalyst Prisoner's Dilemma game with a mock version for local testing and a Web3-enabled version for blockchain interactions.

## Project Structure

- `/web` - React-based web implementation of the game
  - `/src` - Source code for the web application
    - `/components` - React components including the game implementation
    - `/hooks` - Custom hooks for Web3 and contract interactions
    - `/contracts` - Contract ABIs and addresses
    - `/styles` - CSS files for styling the game

## Features

### Mock Implementation

- Works locally without blockchain interactions for faster development and testing
- Complete game mechanics where players make decisions independently
- Results are revealed only after both players have committed to their choices
- Simulated wallet connection and NST token staking
- Full 5-round gameplay with scoring system

### Web3 Implementation

- Real blockchain interactions using the Catalyst network
- Connection to MetaMask wallet
- NST token balance checking and staking
- Game contract interactions for making moves and submitting results

## Running the Application

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone this repository
2. Navigate to the web directory:
```bash
cd web
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically http://localhost:5173 or similar)

### Using the Mock Implementation

1. When the app loads, you'll see the Prisoner's Dilemma game interface
2. Click the "Connect Wallet" button to simulate wallet connection
3. After connecting, click "Stake 15 NST" to start the game
4. For each round, choose either "Cooperate" or "Defect"
5. After submitting your move, the AI opponent's move will be revealed
6. Play through all 5 rounds to see the final score

### Game Rules

- Both players choose to either Cooperate (🟢) or Defect (🔴) each round
- Payoffs for each round:
  - Both Cooperate: +2 NST each
  - You Cooperate, AI Defects: -3 NST you, +4 NST AI
  - You Defect, AI Cooperates: +4 NST you, -3 NST AI
  - Both Defect: -1 NST each
- The game consists of 5 rounds
- The player with the highest total score at the end wins

## Deploying to GitHub

To share this project on GitHub:

1. Create a new repository on GitHub
2. Push the essential files:

```bash
# Initialize git repository (if not already done)
git init

# Add essential files
git add web/src/components/PrisonersDilemmaGame.tsx
git add web/src/hooks/useMockCatalystContract.js
git add web/src/App.tsx
git add web/src/main.tsx
git add web/src/styles/
git add web/index.html
git add web/package.json
git add web/vite.config.js
git add README.md

# Commit changes
git commit -m "Add Prisoner's Dilemma mock implementation"

# Add remote repository
git remote add origin https://github.com/yourusername/catalyst-prisoners-dilemma.git

# Push to GitHub
git push -u origin main
```

Replace `yourusername` with your actual GitHub username and `catalyst-prisoners-dilemma` with your repository name.

### Running the Telegram Bot

1. Make sure you have Python 3.7+ installed
2. Install required packages:
```bash
pip install python-telegram-bot
```

3. Run the bot:
```bash
python MrsBeautyBot.py
```

## Game Rules

The Prisoner's Dilemma game is played with the following payoff matrix:

- Both cooperate: +2 NST each
- Player cooperates, AI defects: Player -3 NST, AI +4 NST
- Player defects, AI cooperates: Player +4 NST, AI -3 NST
- Both defect: -1 NST each

## Development

This project is designed to be a prototype for testing game mechanics and UI/UX before implementing blockchain functionality.
- **Phase**: Prototype v1 (Month 1-2)  
- **Goals**: Validate game mechanics, ensure blockchain/AI integration, and log data for DeSci research.  
- **Setup**: Install Node.js, npm, and Hardhat. Run `npm install` and `npx hardhat compile` for contracts.  
- **Next**: See `docs/game-mechanics.md` for details.