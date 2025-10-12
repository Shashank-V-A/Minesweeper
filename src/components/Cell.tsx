import React from 'react';
import { CellData } from './Minesweeper';
import './Cell.css';

interface CellProps {
  cell: CellData;
  onClick: () => void;
  onRightClick: () => void;
  gameStatus: 'playing' | 'won' | 'lost';
}

const Cell: React.FC<CellProps> = ({ cell, onClick, onRightClick, gameStatus }) => {
  const handleClick = () => {
    onClick();
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onRightClick();
  };

  const getCellContent = (): string => {
    if (cell.isFlagged) {
      return '🚩';
    }
    
    if (!cell.isRevealed) {
      return '';
    }
    
    if (cell.isMine) {
      return '💣';
    }
    
    return cell.neighborMines > 0 ? cell.neighborMines.toString() : '';
  };

  const getCellClassName = (): string => {
    let className = 'cell';
    
    if (cell.isRevealed) {
      className += ' revealed';
      if (cell.isMine) {
        className += ' mine';
        if (gameStatus === 'lost') {
          className += ' exploded';
        }
      } else if (cell.neighborMines > 0) {
        className += ` number-${cell.neighborMines}`;
      }
    } else {
      className += ' hidden';
      if (cell.isFlagged) {
        className += ' flagged';
      }
    }
    
    return className;
  };

  return (
    <button
      className={getCellClassName()}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      disabled={gameStatus !== 'playing'}
    >
      {getCellContent()}
    </button>
  );
};

export default Cell;