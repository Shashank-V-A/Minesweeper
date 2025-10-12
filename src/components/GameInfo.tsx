import React, { useState, useEffect } from 'react';
import { GameState } from './Minesweeper';
import './GameInfo.css';

interface GameInfoProps {
  gameState: GameState;
  onReset: () => void;
}

const GameInfo: React.FC<GameInfoProps> = ({ gameState, onReset }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [liveScore, setLiveScore] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (gameState.startTime && gameState.gameStatus === 'playing') {
      interval = setInterval(() => {
        const elapsed = Math.floor((new Date().getTime() - gameState.startTime!.getTime()) / 1000);
        setElapsedTime(elapsed);
        // Calculate live score (what you'd get if you won now)
        const baseScore = 1000;
        const timeBonus = Math.max(0, 500 - elapsed);
        setLiveScore(baseScore + timeBonus);
      }, 1000);
    } else if (gameState.endTime && gameState.startTime) {
      setElapsedTime(Math.floor((gameState.endTime.getTime() - gameState.startTime.getTime()) / 1000));
      setLiveScore(gameState.currentScore);
    } else {
      setElapsedTime(0);
      setLiveScore(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameState.startTime, gameState.endTime, gameState.gameStatus, gameState.currentScore]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusEmoji = (): string => {
    switch (gameState.gameStatus) {
      case 'won':
        return '😎';
      case 'lost':
        return '💀';
      default:
        return '🙂';
    }
  };

  const getStatusText = (): string => {
    switch (gameState.gameStatus) {
      case 'won':
        return 'You Won!';
      case 'lost':
        return 'Game Over';
      default:
        return 'Playing';
    }
  };

  return (
    <div className="game-info">
      <div className="game-stats">
        <div className="stat">
          <span className="stat-label">Mines:</span>
          <span className="stat-value">{gameState.mineCount - gameState.flagCount}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Time:</span>
          <span className="stat-value">{formatTime(elapsedTime)}</span>
        </div>
      </div>
      
      <div className="score-section">
        <div className="stat">
          <span className="stat-label">
            {gameState.gameStatus === 'playing' ? 'Potential Score:' : 'Current Score:'}
          </span>
          <span className="stat-value score-current">{liveScore}</span>
        </div>
        <div className="stat">
          <span className="stat-label">High Score:</span>
          <span className="stat-value score-high">{gameState.highScore}</span>
        </div>
      </div>
      
      <div className="game-status">
        <div className="status-display">
          <span className="status-emoji">{getStatusEmoji()}</span>
          <span className="status-text">{getStatusText()}</span>
        </div>
        <button className="reset-button" onClick={onReset}>
          New Game
        </button>
      </div>
      
      <div className="game-instructions">
        <p>Left click to reveal • Right click to flag</p>
      </div>
    </div>
  );
};

export default GameInfo;