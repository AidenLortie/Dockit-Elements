import {button, Component, div, DockitElementRoot, h1, span} from 'dockit-elements';



// DEMO

// Cell type
type Cell = {
    mine: boolean;
    revealed: boolean;
    flagged: boolean;
    adjacent: number;
};

const SIZE = 8;
const MINES = 10;

function createEmptyBoard(): Cell[][] {
    return Array.from({length: SIZE}, () =>
        Array.from({length: SIZE}, () => ({
            mine: false,
            revealed: false,
            flagged: false,
            adjacent: 0
        }))
    );
}

function placeMines(board: Cell[][], mines: number) {
    let placed = 0;
    while (placed < mines) {
        const r = Math.floor(Math.random() * SIZE);
        const c = Math.floor(Math.random() * SIZE);
        if (!board[r][c].mine) {
            board[r][c].mine = true;
            placed++;
        }
    }
}

function countAdjacents(board: Cell[][]) {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c].mine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = r + dr, nc = c + dc;
                    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && board[nr][nc].mine) count++;
                }
            }
            board[r][c].adjacent = count;
        }
    }
}

function revealEmpty(board: Cell[][], r: number, c: number) {
    const stack = [[r, c]];
    while (stack.length) {
        const [cr, cc] = stack.pop()!;
        if (!board[cr][cc].revealed && !board[cr][cc].flagged) {
            board[cr][cc].revealed = true;
            if (board[cr][cc].adjacent === 0 && !board[cr][cc].mine) {
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const nr = cr + dr, nc = cc + dc;
                        if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
                            if (!board[nr][nc].revealed && !board[nr][nc].flagged) {
                                // Always reveal adjacent cells
                                board[nr][nc].revealed = true;
                                // Only cascade into further blanks
                                if (board[nr][nc].adjacent === 0 && !board[nr][nc].mine) {
                                    stack.push([nr, nc]);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

// Helper to generate a stable style object for a cell button
function getCellButtonStyle(cell: Cell, gameOver: boolean){
    return {
        default: {
            width: '32px',
            height: '32px',
            margin: '2px',
            background: cell.revealed ? '#eee' : '#bbb',
            color: cell.mine && cell.revealed ? 'red' : '#222',
            border: '1px solid #888',
            cursor: gameOver || cell.revealed ? 'default' : 'pointer',
            outline: 'none',
            padding: '0',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            lineHeight: '32px',
            fontFamily: 'Segoe UI Emoji, Apple Color Emoji, monospace, system-ui, sans-serif',
            overflow: 'hidden',
            userSelect: 'none',
            whiteSpace: 'nowrap',
        },
    };
}

class Minesweeper extends Component<{ board: Cell[][]; gameOver: boolean; won: boolean; flags: number }> {
    constructor() {
        super({board: [], gameOver: false, won: false, flags: 0});
        this.reset();
    }

    reset = () => {
        const board = createEmptyBoard();
        placeMines(board, MINES);
        countAdjacents(board);
        this.setState({board, gameOver: false, won: false, flags: 0});
    };

    revealCell = (r: number, c: number) => {
        if (this.state.gameOver) return;
        const board = this.state.board.map(row => row.map(cell => ({...cell})));
        const cell = board[r][c];
        if (cell.revealed || cell.flagged) return;
        cell.revealed = true;
        if (cell.mine) {
            // Reveal all mines
            for (let row of board) for (let cell of row) if (cell.mine) cell.revealed = true;
            this.setState({board, gameOver: true, won: false});
            return;
        }
        if (cell.adjacent === 0) {
            revealEmpty(board, r, c);
        }
        // Check win
        let won = true;
        for (let row of board) for (let cell of row) if (!cell.mine && !cell.revealed) won = false;
        // Always update board after reveal/cascade
        this.setState({board, gameOver: won, won});
    };

    flagCell = (r: number, c: number, e: MouseEvent) => {
        e.preventDefault();
        if (this.state.gameOver) return;
        const board = this.state.board.map(row => row.map(cell => ({...cell})));
        const cell = board[r][c];
        if (cell.revealed) return;
        cell.flagged = !cell.flagged;
        const flags = board.flat().filter(cell => cell.flagged).length;
        this.setState({board, flags});
    };

    renderView() {
        const {board, gameOver, won, flags} = this.state;
        this.children = [
            h1(["Minesweeper"]),
            div([
                span([gameOver ? (won ? "🎉 You Win!" : "💥 Game Over!") : `Flags: ${flags}/${MINES}`]),
                button(["Restart"], {events: {click: this.reset}, style: {default: {marginLeft: '16px'}}})
            ], {style: {default: {marginBottom: '16px', display: 'flex', alignItems: 'center'}}}),
            div(
                board.map((row, r) =>
                    div(
                        row.map((cell, c) =>
                            button([
                                    span([
                                        cell.revealed
                                            ? (cell.mine ? "💣" : (cell.adjacent ? String(cell.adjacent) : ""))
                                            : (cell.flagged ? "🚩" : "")
                                    ])
                                ], {
                                    events: {
                                        click: () => this.revealCell(r, c),
                                        contextmenu: (e?: Event) => this.flagCell(r, c, e as MouseEvent)
                                    },
                                    style: {
                                        default: {
                                            display: 'absolute',
                                            margin: '2px',
                                            minWidth: '32px',
                                            minHeight: '32px',
                                            maxWidth: '32px',
                                            maxHeight: '32px',
                                            background: cell.revealed ? '#eee' : '#bbb',
                                            color: cell.mine && cell.revealed ? 'red' : '#222',
                                        }
                                    },
                                    disabled: gameOver || cell.revealed
                                }
                            )
                        ),
                        {style: {default: {display: 'flex', flexWrap: 'nowrap'}}}
                    )
                ),
                {
                    style: {
                        default: {
                            display: 'inline-block',
                            background: '#888',
                            padding: '8px',
                            borderRadius: '8px',
                            userSelect: 'none'
                        }
                    }
                }
            )
        ];
    }
}

const app = new DockitElementRoot(
    document.getElementById('app')!,
    new Minesweeper()
);
app.render();