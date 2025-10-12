import React, { useState, useCallback } from 'react';
import GameBoard from './GameBoard';
import GameInfo from './GameInfo';
import './Minesweeper.css';

export interface CellData {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
  row: number;
  col: number;
}

export interface GameState {
  board: CellData[][];
  mineCount: number;
  flagCount: number;
  gameStatus: 'playing' | 'won' | 'lost';
  firstClick: boolean;
  startTime: Date | null;
  endTime: Date | null;
  currentScore: number;
  highScore: number;
}

const ROWS = 9;
const COLS = 9;
const MINE_COUNT = 10;
const HIGH_SCORE_KEY = 'minesweeper_high_score';

const Minesweeper: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => initializeGame());

  function getHighScore(): number {
    const saved = localStorage.getItem(HIGH_SCORE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  }

  function saveHighScore(score: number): void {
    localStorage.setItem(HIGH_SCORE_KEY, score.toString());
  }

  function calculateScore(startTime: Date, endTime: Date): number {
    const timeInSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    
    // Base score for winning
    const baseScore = 1000;
    
    // Time bonus: faster completion gives more points (max 500 bonus)
    // Formula: 500 - time, but minimum 0
    const timeBonus = Math.max(0, 500 - timeInSeconds);
    
    return baseScore + timeBonus;
  }

  function initializeGame(): GameState {
    const board: CellData[][] = [];
    
    for (let row = 0; row < ROWS; row++) {
      board[row] = [];
      for (let col = 0; col < COLS; col++) {
        board[row][col] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
          row,
          col
        };
      }
    }

    return {
      board,
      mineCount: MINE_COUNT,
      flagCount: 0,
      gameStatus: 'playing',
      firstClick: true,
      startTime: null,
      endTime: null,
      currentScore: 0,
      highScore: getHighScore()
    };
  }

  const placeMines = useCallback((board: CellData[][], excludeRow: number, excludeCol: number) => {
    const positions: Array<[number, number]> = [];
    
    // Generate all possible positions except the first clicked cell
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (row !== excludeRow || col !== excludeCol) {
          positions.push([row, col]);
        }
      }
    }

    // Shuffle positions and place mines
    const shuffled = positions.sort(() => Math.random() - 0.5);
    for (let i = 0; i < MINE_COUNT; i++) {
      const [row, col] = shuffled[i];
      board[row][col].isMine = true;
    }

    // Calculate neighbor mine counts
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (!board[row][col].isMine) {
          board[row][col].neighborMines = countNeighborMines(board, row, col);
        }
      }
    }
  }, []);

  const countNeighborMines = (board: CellData[][], row: number, col: number): number => {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i;
        const newCol = col + j;
        if (newRow >= 0 && newRow < ROWS && newCol >= 0 && newCol < COLS) {
          if (board[newRow][newCol].isMine) {
            count++;
          }
        }
      }
    }
    return count;
  };

  const handleCellClick = (row: number, col: number) => {
    if (gameState.gameStatus !== 'playing' || gameState.board[row][col].isFlagged || gameState.board[row][col].isRevealed) {
      return;
    }

    setGameState(prevState => {
      const newBoard = prevState.board.map(r => r.map(c => ({ ...c })));
      let newGameStatus = prevState.gameStatus;
      let newStartTime = prevState.startTime;
      let newEndTime = prevState.endTime;

      // Handle first click
      if (prevState.firstClick) {
        placeMines(newBoard, row, col);
        newStartTime = new Date();
      }

      // Reveal the cell
      revealCell(newBoard, row, col);

      // Check if clicked on a mine
      let newCurrentScore = prevState.currentScore;
      let newHighScore = prevState.highScore;
      
      if (newBoard[row][col].isMine) {
        newGameStatus = 'lost';
        newEndTime = new Date();
        newCurrentScore = 0;
        // Reveal all mines
        for (let r = 0; r < ROWS; r++) {
          for (let c = 0; c < COLS; c++) {
            if (newBoard[r][c].isMine) {
              newBoard[r][c].isRevealed = true;
            }
          }
        }
      } else {
        // Check win condition
        const isWon = checkWinCondition(newBoard);
        if (isWon && newStartTime) {
          newGameStatus = 'won';
          newEndTime = new Date();
          newCurrentScore = calculateScore(newStartTime, newEndTime);
          
          console.log('Game Won! Current Score:', newCurrentScore);
          console.log('Previous High Score:', prevState.highScore);
          
          // Update high score if current score is higher
          if (newCurrentScore > prevState.highScore) {
            newHighScore = newCurrentScore;
            saveHighScore(newHighScore);
            console.log('New High Score!', newHighScore);
          }
        }
      }

      return {
        ...prevState,
        board: newBoard,
        gameStatus: newGameStatus,
        firstClick: false,
        startTime: newStartTime,
        endTime: newEndTime,
        currentScore: newCurrentScore,
        highScore: newHighScore
      };
    });
  };

  const revealCell = (board: CellData[][], row: number, col: number) => {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS || board[row][col].isRevealed || board[row][col].isFlagged) {
      return;
    }

    board[row][col].isRevealed = true;

    // If cell has no neighboring mines, reveal all neighbors
    if (board[row][col].neighborMines === 0 && !board[row][col].isMine) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          revealCell(board, row + i, col + j);
        }
      }
    }
  };

  const checkWinCondition = (board: CellData[][]): boolean => {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = board[row][col];
        if (!cell.isMine && !cell.isRevealed) {
          return false;
        }
      }
    }
    return true;
  };

  const handleCellRightClick = (row: number, col: number) => {
    if (gameState.gameStatus !== 'playing' || gameState.board[row][col].isRevealed) {
      return;
    }

    setGameState(prevState => {
      const newBoard = prevState.board.map(r => r.map(c => ({ ...c })));
      const cell = newBoard[row][col];
      
      let newFlagCount = prevState.flagCount;
      
      if (cell.isFlagged) {
        cell.isFlagged = false;
        newFlagCount--;
      } else if (newFlagCount < MINE_COUNT) {
        cell.isFlagged = true;
        newFlagCount++;
      }

      return {
        ...prevState,
        board: newBoard,
        flagCount: newFlagCount
      };
    });
  };

  const resetGame = () => {
    setGameState(initializeGame());
  };

  return (
    <div className="minesweeper">
      <GameInfo 
        gameState={gameState}
        onReset={resetGame}
      />
      <GameBoard 
        board={gameState.board}
        onCellClick={handleCellClick}
        onCellRightClick={handleCellRightClick}
        gameStatus={gameState.gameStatus}
      />
    </div>
  );
};

export default Minesweeper;