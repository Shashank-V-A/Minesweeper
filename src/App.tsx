import React from 'react';
import './App.css';
import Minesweeper from './components/Minesweeper';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Minesweeper</h1>
      </header>
      <main>
        <Minesweeper />
      </main>
    </div>
  );
}

export default App;
