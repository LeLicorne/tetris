import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useAppSelector } from '../hooks/useAppSelector';
import { scoreService } from '../services/scoreService';
import GuestScoreSaveDialog from '../components/GuestScoreSaveDialog';
import '../App.css';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 780;
const SPEED_STEP = 55;
const MIN_SPEED = 95;
const POWERUP_SPAWN_CHANCE = 0.2;
const POWERUP_SCORE_BONUS: Record<PowerupType, number> = {
  bomb: 75,
  row: 125,
  column: 125,
};

type Tetromino = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
type PowerupType = 'bomb' | 'row' | 'column';
type Cell = Tetromino | null;
type Board = Cell[][];
type PowerupCell = PowerupType | null;
type PowerupBoard = PowerupCell[][];
type Shape = number[][];
type GameStatus = 'playing' | 'paused' | 'game-over';

type Piece = {
  type: Tetromino;
  shape: Shape;
  row: number;
  col: number;
};

type GameState = {
  board: Board;
  powerups: PowerupBoard;
  active: Piece;
  next: Piece;
  score: number;
  lines: number;
  level: number;
  status: GameStatus;
};

const TETROMINOES: Record<Tetromino, Shape> = {
  I: [[1, 1, 1, 1]],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
};

const PIECES = Object.keys(TETROMINOES) as Tetromino[];
const POWERUP_TYPES: PowerupType[] = ['bomb', 'row', 'column'];
const LINE_POINTS = [0, 100, 300, 500, 800];

function createBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
}

function createPowerupBoard(): PowerupBoard {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<PowerupCell>(BOARD_WIDTH).fill(null));
}

function cloneShape(shape: Shape): Shape {
  return shape.map((row) => [...row]);
}

function randomType(): Tetromino {
  return PIECES[Math.floor(Math.random() * PIECES.length)];
}

function createPiece(type: Tetromino = randomType()): Piece {
  const shape = cloneShape(TETROMINOES[type]);

  return {
    type,
    shape,
    row: 0,
    col: Math.floor((BOARD_WIDTH - shape[0].length) / 2),
  };
}

function createGame(): GameState {
  return {
    board: createBoard(),
    powerups: createPowerupBoard(),
    active: createPiece(),
    next: createPiece(),
    score: 0,
    lines: 0,
    level: 1,
    status: 'playing',
  };
}

function rotateShape(shape: Shape): Shape {
  return shape[0].map((_, colIndex) => shape.map((row) => row[colIndex]).reverse());
}

function isBlocked(board: Board, piece: Piece): boolean {
  return piece.shape.some((row, rowIndex) =>
    row.some((cell, colIndex) => {
      if (!cell) {
        return false;
      }

      const boardRow = piece.row + rowIndex;
      const boardCol = piece.col + colIndex;

      return (
        boardCol < 0 ||
        boardCol >= BOARD_WIDTH ||
        boardRow >= BOARD_HEIGHT ||
        (boardRow >= 0 && board[boardRow][boardCol] !== null)
      );
    })
  );
}

function mergePiece(board: Board, piece: Piece): Board {
  const merged = board.map((row) => [...row]);

  piece.shape.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const boardRow = piece.row + rowIndex;
      const boardCol = piece.col + colIndex;

      if (cell && boardRow >= 0) {
        merged[boardRow][boardCol] = piece.type;
      }
    });
  });

  return merged;
}

function movePiece(piece: Piece, rowOffset: number, colOffset: number): Piece {
  return {
    ...piece,
    row: piece.row + rowOffset,
    col: piece.col + colOffset,
  };
}

function getPieceCells(piece: Piece): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = [];

  piece.shape.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell) {
        cells.push({ row: piece.row + rowIndex, col: piece.col + colIndex });
      }
    });
  });

  return cells;
}

function clearPowerupAt(powerups: PowerupBoard, row: number, col: number): PowerupBoard {
  return powerups.map((powerupRow, rowIndex) =>
    powerupRow.map((cell, colIndex) => (rowIndex === row && colIndex === col ? null : cell))
  );
}

function clearCompletedLinesWithPowerups(
  board: Board,
  powerups: PowerupBoard
): { board: Board; powerups: PowerupBoard; cleared: number } {
  const keptRows: Array<{ board: Cell[]; powerups: PowerupCell[] }> = [];
  let cleared = 0;

  for (let rowIndex = 0; rowIndex < BOARD_HEIGHT; rowIndex += 1) {
    const boardRow = board[rowIndex];
    const powerupRow = powerups[rowIndex];

    if (boardRow.every((cell) => cell !== null)) {
      cleared += 1;
      continue;
    }

    keptRows.push({ board: [...boardRow], powerups: [...powerupRow] });
  }

  const emptyBoardRows = Array.from({ length: cleared }, () => Array<Cell>(BOARD_WIDTH).fill(null));
  const emptyPowerupRows = Array.from({ length: cleared }, () =>
    Array<PowerupCell>(BOARD_WIDTH).fill(null)
  );

  return {
    board: [...emptyBoardRows, ...keptRows.map((row) => row.board)],
    powerups: [...emptyPowerupRows, ...keptRows.map((row) => row.powerups)],
    cleared,
  };
}

function applyPowerupEffect(
  board: Board,
  powerups: PowerupBoard,
  trigger: { row: number; col: number; type: PowerupType }
): { board: Board; powerups: PowerupBoard } {
  const nextBoard = board.map((row) => [...row]);
  const nextPowerups = powerups.map((row) => [...row]);

  const clearCell = (row: number, col: number) => {
    if (row < 0 || row >= BOARD_HEIGHT || col < 0 || col >= BOARD_WIDTH) {
      return;
    }

    nextBoard[row][col] = null;
    nextPowerups[row][col] = null;
  };

  if (trigger.type === 'bomb') {
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let colOffset = -1; colOffset <= 1; colOffset += 1) {
        clearCell(trigger.row + rowOffset, trigger.col + colOffset);
      }
    }
  }

  if (trigger.type === 'row') {
    for (let col = 0; col < BOARD_WIDTH; col += 1) {
      clearCell(trigger.row, col);
    }
  }

  if (trigger.type === 'column') {
    for (let row = 0; row < BOARD_HEIGHT; row += 1) {
      clearCell(row, trigger.col);
    }
  }

  return { board: nextBoard, powerups: nextPowerups };
}

function findTriggeredPowerup(
  state: GameState
): { row: number; col: number; type: PowerupType } | null {
  for (const cell of getPieceCells(state.active)) {
    const powerup = state.powerups[cell.row]?.[cell.col];

    if (powerup) {
      return {
        row: cell.row,
        col: cell.col,
        type: powerup,
      };
    }
  }

  return null;
}

function findRandomSupportedCell(
  board: Board,
  powerups: PowerupBoard,
  active: Piece
): { row: number; col: number } | null {
  const activeCells = new Set(getPieceCells(active).map((cell) => `${cell.row}:${cell.col}`));
  const emptyCells: Array<{ row: number; col: number }> = [];

  for (let row = 0; row < BOARD_HEIGHT - 1; row += 1) {
    for (let col = 0; col < BOARD_WIDTH; col += 1) {
      if (
        board[row][col] === null &&
        powerups[row][col] === null &&
        board[row + 1][col] !== null &&
        !activeCells.has(`${row}:${col}`)
      ) {
        emptyCells.push({ row, col });
      }
    }
  }

  if (emptyCells.length === 0) {
    return null;
  }

  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
}

function spawnRandomPowerup(state: GameState): PowerupBoard {
  const hasPowerupAlready = state.powerups.some((row) => row.some((cell) => cell !== null));

  if (hasPowerupAlready || Math.random() > POWERUP_SPAWN_CHANCE) {
    return state.powerups;
  }

  const spawnCell = findRandomSupportedCell(state.board, state.powerups, state.active);

  if (!spawnCell) {
    return state.powerups;
  }

  const nextPowerup = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];

  return state.powerups.map((row, rowIndex) =>
    row.map((cell, colIndex) =>
      rowIndex === spawnCell.row && colIndex === spawnCell.col ? nextPowerup : cell
    )
  );
}

function placeNextPiece(state: GameState, lockedBoard: Board): GameState {
  const triggeredPowerup = findTriggeredPowerup(state);
  const afterPowerup = triggeredPowerup
    ? applyPowerupEffect(lockedBoard, state.powerups, triggeredPowerup)
    : { board: lockedBoard, powerups: state.powerups };
  const powerupsAfterTrigger = triggeredPowerup
    ? clearPowerupAt(afterPowerup.powerups, triggeredPowerup.row, triggeredPowerup.col)
    : afterPowerup.powerups;
  const clearedResult = clearCompletedLinesWithPowerups(afterPowerup.board, powerupsAfterTrigger);
  const board = clearedResult.board;
  const powerups = clearedResult.powerups;
  const nextActive = {
    ...state.next,
    row: 0,
    col: Math.floor((BOARD_WIDTH - state.next.shape[0].length) / 2),
  };
  const gainedPoints = LINE_POINTS[clearedResult.cleared] * state.level;
  const powerupBonus = triggeredPowerup ? POWERUP_SCORE_BONUS[triggeredPowerup.type] : 0;
  const gainedPointsWithPowerup = gainedPoints + powerupBonus;
  const totalLines = state.lines + clearedResult.cleared;
  const nextLevel = Math.floor(totalLines / 10) + 1;
  const powerupsAfterSpawn = spawnRandomPowerup({
    ...state,
    board,
    powerups,
    active: nextActive,
  });

  return {
    board,
    powerups: powerupsAfterSpawn,
    active: nextActive,
    next: createPiece(),
    score: state.score + gainedPointsWithPowerup,
    lines: totalLines,
    level: nextLevel,
    status: isBlocked(board, nextActive) ? 'game-over' : 'playing',
  };
}

function addGhostPiece(board: Board, active: Piece): Piece {
  let ghost = active;

  while (!isBlocked(board, movePiece(ghost, 1, 0))) {
    ghost = movePiece(ghost, 1, 0);
  }

  return ghost;
}

function getDisplayBoard(board: Board, powerups: PowerupBoard, active: Piece): string[][] {
  const display = board.map((row) => row.map((cell) => (cell ? `filled ${cell}` : 'empty')));
  powerups.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell && display[rowIndex][colIndex] === 'empty') {
        display[rowIndex][colIndex] = `powerup ${cell}`;
      }
    });
  });

  const ghost = addGhostPiece(board, active);

  ghost.shape.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const boardRow = ghost.row + rowIndex;
      const boardCol = ghost.col + colIndex;

      if (cell && boardRow >= 0 && display[boardRow][boardCol] === 'empty') {
        display[boardRow][boardCol] = `ghost ${ghost.type}`;
      }
    });
  });

  active.shape.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const boardRow = active.row + rowIndex;
      const boardCol = active.col + colIndex;

      if (cell && boardRow >= 0) {
        display[boardRow][boardCol] = `filled ${active.type} active`;
      }
    });
  });

  return display;
}

function getPreviewGrid(piece: Piece): string[][] {
  const grid = Array.from({ length: 4 }, () => Array<string>(4).fill('empty'));
  const rowOffset = Math.floor((4 - piece.shape.length) / 2);
  const colOffset = Math.floor((4 - piece.shape[0].length) / 2);

  piece.shape.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell) {
        grid[rowIndex + rowOffset][colIndex + colOffset] = `filled ${piece.type}`;
      }
    });
  });

  return grid;
}

export default function GamePage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const [game, setGame] = useState<GameState>(() => createGame());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);
  const finalScoreRef = useRef<GameState | null>(null);

  const displayBoard = useMemo(
    () => getDisplayBoard(game.board, game.powerups, game.active),
    [game.active, game.board, game.powerups]
  );
  const previewGrid = useMemo(() => getPreviewGrid(game.next), [game.next]);
  const dropSpeed = Math.max(MIN_SPEED, INITIAL_SPEED - (game.level - 1) * SPEED_STEP);

  const restart = useCallback(() => {
    finalScoreRef.current = null;
    setGame(createGame());
  }, []);

  const lockCurrentPiece = useCallback((state: GameState): GameState => {
    return placeNextPiece(state, mergePiece(state.board, state.active));
  }, []);

  const tick = useCallback(() => {
    setGame((current) => {
      if (current.status !== 'playing') {
        return current;
      }

      const moved = movePiece(current.active, 1, 0);

      if (!isBlocked(current.board, moved)) {
        return {
          ...current,
          active: moved,
        };
      }

      return lockCurrentPiece(current);
    });
  }, [lockCurrentPiece]);

  const moveHorizontal = useCallback((direction: -1 | 1) => {
    setGame((current) => {
      if (current.status !== 'playing') {
        return current;
      }

      const moved = movePiece(current.active, 0, direction);

      return isBlocked(current.board, moved)
        ? current
        : {
            ...current,
            active: moved,
          };
    });
  }, []);

  const softDrop = useCallback(() => {
    setGame((current) => {
      if (current.status !== 'playing') {
        return current;
      }

      const moved = movePiece(current.active, 1, 0);

      if (!isBlocked(current.board, moved)) {
        return {
          ...current,
          active: moved,
          score: current.score + 1,
        };
      }

      return lockCurrentPiece(current);
    });
  }, [lockCurrentPiece]);

  const hardDrop = useCallback(() => {
    setGame((current) => {
      if (current.status !== 'playing') {
        return current;
      }

      let dropped = current.active;
      let distance = 0;

      while (!isBlocked(current.board, movePiece(dropped, 1, 0))) {
        dropped = movePiece(dropped, 1, 0);
        distance += 1;
      }

      return lockCurrentPiece({
        ...current,
        active: dropped,
        score: current.score + distance * 2,
      });
    });
  }, [lockCurrentPiece]);

  const rotateActive = useCallback(() => {
    setGame((current) => {
      if (current.status !== 'playing' || current.active.type === 'O') {
        return current;
      }

      const rotated = {
        ...current.active,
        shape: rotateShape(current.active.shape),
      };
      const kickOffsets = [0, -1, 1, -2, 2];
      const validRotation = kickOffsets
        .map((offset) => movePiece(rotated, 0, offset))
        .find((piece) => !isBlocked(current.board, piece));

      return validRotation
        ? {
            ...current,
            active: validRotation,
          }
        : current;
    });
  }, []);

  const togglePause = useCallback(() => {
    setGame((current) => {
      if (current.status === 'game-over') {
        return current;
      }

      return {
        ...current,
        status: current.status === 'paused' ? 'playing' : 'paused',
      };
    });
  }, []);

  const handleGameOver = useCallback(async () => {
    const finalState = finalScoreRef.current ?? game;

    if (user) {
      try {
        await scoreService.saveScore({
          userId: user.uid,
          username: user.username || user.email?.split('@')[0] || 'Anonymous',
          score: finalState.score,
          lines: finalState.lines,
          level: finalState.level,
          timestamp: Date.now(),
        });
        navigate({ to: '/leaderboard' });
      } catch (error) {
        console.error('Failed to save score:', error);
        navigate({ to: '/leaderboard' });
      }
    } else {
      setShowSaveDialog(true);
    }
  }, [user, game, navigate]);

  const handleSaveGuestScore = useCallback(
    async (username: string) => {
      setIsSavingScore(true);
      try {
        await scoreService.saveScore({
          userId: 'guest_' + Date.now(),
          username,
          score: game.score,
          lines: game.lines,
          level: game.level,
          timestamp: Date.now(),
        });
        setShowSaveDialog(false);
        navigate({ to: '/leaderboard' });
      } catch (error) {
        console.error('Failed to save guest score:', error);
      } finally {
        setIsSavingScore(false);
      }
    },
    [game.score, game.lines, game.level, navigate]
  );

  useEffect(() => {
    const interval = window.setInterval(tick, dropSpeed);

    return () => window.clearInterval(interval);
  }, [dropSpeed, tick]);

  useEffect(() => {
    if (game.status === 'game-over') {
      finalScoreRef.current = game;
      const timeoutId = window.setTimeout(() => {
        handleGameOver();
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, [game, handleGameOver]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showSaveDialog) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        moveHorizontal(-1);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        moveHorizontal(1);
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        softDrop();
      }

      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'x') {
        event.preventDefault();
        rotateActive();
      }

      if (event.key === ' ') {
        event.preventDefault();
        hardDrop();
      }

      if (event.key.toLowerCase() === 'p') {
        event.preventDefault();
        togglePause();
      }

      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        restart();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hardDrop, moveHorizontal, restart, rotateActive, showSaveDialog, softDrop, togglePause]);

  return (
    <>
      <main className="tetris-shell">
        <section className="tetris-layout" aria-label="Tetris">
          <div className="game-panel">
            <div className="game-heading">
              <div>
                <p className="app-eyebrow">Arcade</p>
                <h1 className="app-title" style={{ fontSize: '2.4rem' }}>
                  Tetris
                </h1>
              </div>
              <div className="flex gap-3">
                <Link to="/" className="app-link-button app-link-button--ghost">
                  Home
                </Link>
                <button type="button" className="app-button app-button--primary" onClick={restart}>
                  Rejouer
                </button>
              </div>
            </div>

            <div className="board-wrap">
              <div className="board" role="grid" aria-label="Plateau Tetris">
                {displayBoard.map((row, rowIndex) =>
                  row.map((cellClass, colIndex) => (
                    <span
                      aria-hidden="true"
                      className={`cell ${cellClass}`}
                      key={`${rowIndex}-${colIndex}`}
                    />
                  ))
                )}
              </div>

              {game.status !== 'playing' && (
                <div className="game-overlay">
                  <p>{game.status === 'paused' ? 'Pause' : 'Partie terminee'}</p>
                  <button
                    type="button"
                    className="app-button app-button--primary"
                    onClick={game.status === 'paused' ? togglePause : restart}
                  >
                    {game.status === 'paused' ? 'Continuer' : 'Nouvelle partie'}
                  </button>
                </div>
              )}
            </div>

            <div className="touch-controls" aria-label="Controles tactiles">
              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={() => moveHorizontal(-1)}
                aria-label="Gauche"
              >
                Left
              </button>
              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={rotateActive}
                aria-label="Tourner"
              >
                Rotate
              </button>
              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={() => moveHorizontal(1)}
                aria-label="Droite"
              >
                Right
              </button>
              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={softDrop}
                aria-label="Descendre"
              >
                Down
              </button>
              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={hardDrop}
                aria-label="Chute instantanee"
              >
                Drop
              </button>
            </div>
          </div>

          <aside className="side-panel" aria-label="Informations de partie">
            <div className="stat-grid">
              <div>
                <span>Score</span>
                <strong>{game.score}</strong>
              </div>
              <div>
                <span>Lignes</span>
                <strong>{game.lines}</strong>
              </div>
              <div>
                <span>Niveau</span>
                <strong>{game.level}</strong>
              </div>
              <div>
                <span>Vitesse</span>
                <strong>{Math.round(1000 / dropSpeed)}x</strong>
              </div>
            </div>

            <div className="next-panel">
              <h2>Suivant</h2>
              <div className="preview" aria-hidden="true">
                {previewGrid.map((row, rowIndex) =>
                  row.map((cellClass, colIndex) => (
                    <span className={`cell ${cellClass}`} key={`preview-${rowIndex}-${colIndex}`} />
                  ))
                )}
              </div>
            </div>

            <div className="command-panel">
              <button
                type="button"
                className="app-button app-button--secondary"
                onClick={togglePause}
              >
                {game.status === 'paused' ? 'Continuer' : 'Pause'}
              </button>
              <button
                type="button"
                className="app-button app-button--ghost"
                onClick={() => navigate({ to: '/' })}
              >
                Home
              </button>
              <button type="button" className="app-button app-button--primary" onClick={restart}>
                Reset
              </button>
            </div>

            <dl className="controls-list">
              <div>
                <dt>Fleches</dt>
                <dd>Deplacer, descendre, tourner</dd>
              </div>
              <div>
                <dt>Espace</dt>
                <dd>Chute instantanee</dd>
              </div>
              <div>
                <dt>P / R</dt>
                <dd>Pause ou recommencer</dd>
              </div>
            </dl>
          </aside>
        </section>
      </main>

      {showSaveDialog && (
        <GuestScoreSaveDialog
          score={game.score}
          onSave={handleSaveGuestScore}
          onSkip={() => navigate({ to: '/' })}
          isLoading={isSavingScore}
        />
      )}
    </>
  );
}
