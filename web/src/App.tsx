import React from 'react';
import GameMockNintendo from "./components/GameMockNintendo";
import "./styles/GameMockNintendo.css";
import "./styles/GameMockNintendo.action.css";
import "./styles/GameMockNintendo.chat.css";

/**
 * Main App component that renders the Catalyst Game
 * This is a mock implementation that works locally without blockchain interactions
 */
function App() {
  return (
    <div className="App" style={{ width: '100vw', margin: 0, padding: 0, overflow: 'hidden' }}>
      <header className="App-header" style={{ width: '100vw', margin: 0, padding: 0 }}>
        {/* The GameMockNintendo component will be rendered here */}
        <GameMockNintendo />
      </header>
    </div>
  );
}

export default App;
