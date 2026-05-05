import { useCallback, useEffect, useMemo, useState } from 'react';
import './App.css';

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 780;
const SPEED_STEP = 55;
const MIN_SPEED = 95;

type Tetromino = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
type Cell = Tetromino | null;
type Board = Cell[][];
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
const LINE_POINTS = [0, 100, 300, 500, 800];

function createBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () => Array<Cell>(BOARD_WIDTH).fill(null));
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

function clearCompletedLines(board: Board): { board: Board; cleared: number } {
  const remainingRows = board.filter((row) => row.some((cell) => cell === null));
  const cleared = BOARD_HEIGHT - remainingRows.length;
  const emptyRows = Array.from({ length: cleared }, () => Array<Cell>(BOARD_WIDTH).fill(null));

  return {
    board: [...emptyRows, ...remainingRows],
    cleared,
  };
}

function movePiece(piece: Piece, rowOffset: number, colOffset: number): Piece {
  return {
    ...piece,
    row: piece.row + rowOffset,
    col: piece.col + colOffset,
  };
}

function placeNextPiece(state: GameState, lockedBoard: Board): GameState {
  const { board, cleared } = clearCompletedLines(lockedBoard);
  const nextActive = {
    ...state.next,
    row: 0,
    col: Math.floor((BOARD_WIDTH - state.next.shape[0].length) / 2),
  };
  const gainedPoints = LINE_POINTS[cleared] * state.level;
  const totalLines = state.lines + cleared;
  const nextLevel = Math.floor(totalLines / 10) + 1;

  return {
    board,
    active: nextActive,
    next: createPiece(),
    score: state.score + gainedPoints,
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

function getDisplayBoard(board: Board, active: Piece): string[][] {
  const display = board.map((row) => row.map((cell) => (cell ? `filled ${cell}` : 'empty')));
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

function App() {
  const [game, setGame] = useState<GameState>(() => createGame());

  const displayBoard = useMemo(
    () => getDisplayBoard(game.board, game.active),
    [game.active, game.board]
  );
  const previewGrid = useMemo(() => getPreviewGrid(game.next), [game.next]);
  const dropSpeed = Math.max(MIN_SPEED, INITIAL_SPEED - (game.level - 1) * SPEED_STEP);

  const restart = useCallback(() => {
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

  useEffect(() => {
    const interval = window.setInterval(tick, dropSpeed);

    return () => window.clearInterval(interval);
  }, [dropSpeed, tick]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
  }, [hardDrop, moveHorizontal, restart, rotateActive, softDrop, togglePause]);

  return (
    <main className="tetris-shell">
      <section className="tetris-layout" aria-label="Tetris">
        <div className="game-panel">
          <div className="game-heading">
            <div>
              <p className="eyebrow">React arcade</p>
              <h1>Tetris</h1>
            </div>
            <button type="button" className="primary-action" onClick={restart}>
              Rejouer
            </button>
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
                  className="primary-action"
                  onClick={game.status === 'paused' ? togglePause : restart}
                >
                  {game.status === 'paused' ? 'Continuer' : 'Nouvelle partie'}
                </button>
              </div>
            )}
          </div>

          <div className="touch-controls" aria-label="Controles tactiles">
            <button type="button" onClick={() => moveHorizontal(-1)} aria-label="Gauche">
              Left
            </button>
            <button type="button" onClick={rotateActive} aria-label="Tourner">
              Rotate
            </button>
            <button type="button" onClick={() => moveHorizontal(1)} aria-label="Droite">
              Right
            </button>
            <button type="button" onClick={softDrop} aria-label="Descendre">
              Down
            </button>
            <button type="button" onClick={hardDrop} aria-label="Chute instantanee">
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
            <button type="button" onClick={togglePause}>
              {game.status === 'paused' ? 'Continuer' : 'Pause'}
            </button>
            <button type="button" onClick={restart}>
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
  );
}

export default App;
