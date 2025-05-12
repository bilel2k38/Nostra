import React from 'react';
import PrisonersDilemmaGame from "./components/PrisonersDilemmaGame";
import "./styles/PrisonersDilemmaGame.css";
import "./styles/PrisonersDilemmaGame.action.css";
import "./styles/PrisonersDilemmaGame.chat.css";

/**
 * Main App component that renders the Prisoner's Dilemma Game
 * This is a mock implementation that works locally without blockchain interactions
 */
function App() {
  return (
    <div className="App" style={{ width: '100vw', margin: 0, padding: 0, overflow: 'hidden' }}>
      <header className="App-header" style={{ 
        width: '100vw', 
        margin: 0, 
        padding: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        {/* The mock PrisonersDilemmaGame component you've successfully implemented */}
        <PrisonersDilemmaGame />
      </header>
    </div>
  );
}

export default App;
