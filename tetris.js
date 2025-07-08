const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score-value');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const timerElement = document.getElementById('timer');

// Set scale for easier drawing
context.scale(20, 20);

// Game variables
let score = 0;
let gameInterval = null;
let isPaused = false;
let isAccelerated = false;
let normalSpeed = 500;
let acceleratedSpeed = 50;

// Tetris board dimensions
const COLS = 10;
const ROWS = 20;

// Create the board (2D array)
function createBoard() {
    const board = [];
    for (let y = 0; y < ROWS; y++) {
        board[y] = new Array(COLS).fill(0);
    }
    return board;
}

let board = createBoard();

// Tetromino shapes and colors
const TETROMINOES = {
    'I': [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
    'J': [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0],
    ],
    'L': [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0],
    ],
    'O': [
        [4, 4],
        [4, 4],
    ],
    'S': [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0],
    ],
    'T': [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0],
    ],
    'Z': [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0],
    ],
};

// More vibrant and distinct colors for Tetrominoes
const COLORS = [
    null,
    '#00f0f0', // I - Cyan
    '#1e90ff', // J - Dodger Blue
    '#ff9800', // L - Orange
    '#f9ea36', // O - Yellow
    '#43ea2e', // S - Green
    '#a259f7', // T - Purple
    '#ff1744', // Z - Red
];

// Current piece state
let currentPiece = null;

let timer = 0;
let timerInterval = null;

function updateTimerDisplay() {
    timerElement.textContent = `Time: ${timer}s`;
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer++;
        updateTimerDisplay();
    }, 1000);
}

function pauseTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function resumeTimer() {
    if (!timerInterval) {
        timerInterval = setInterval(() => {
            timer++;
            updateTimerDisplay();
        }, 1000);
    }
}

function resetTimer() {
    pauseTimer();
    timer = 0;
    updateTimerDisplay();
}

function randomTetromino() {
    const keys = Object.keys(TETROMINOES);
    const type = keys[Math.floor(Math.random() * keys.length)];
    const shape = TETROMINOES[type];
    return {
        type,
        shape: shape.map(row => row.slice()),
        pos: { x: Math.floor(COLS / 2) - Math.ceil(shape[0].length / 2), y: 0 },
    };
}

function drawCell(x, y, colorIndex) {
    if (!colorIndex) return;
    context.fillStyle = COLORS[colorIndex];
    context.fillRect(x, y, 1, 1);
    context.lineWidth = 0.08;
    context.strokeStyle = '#fff';
    context.strokeRect(x, y, 1, 1);
}

function drawBoard() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    // Draw board
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            drawCell(x, y, board[y][x]);
        }
    }
    // Draw current piece
    if (currentPiece) {
        for (let y = 0; y < currentPiece.shape.length; y++) {
            for (let x = 0; x < currentPiece.shape[y].length; x++) {
                if (currentPiece.shape[y][x]) {
                    drawCell(currentPiece.pos.x + x, currentPiece.pos.y + y, currentPiece.shape[y][x]);
                }
            }
        }
    }
}

// Update resetGame to reset board and spawn a piece
function resetGame() {
    score = 0;
    scoreElement.textContent = score;
    board = createBoard();
    currentPiece = randomTetromino();
    drawBoard();
    resetTimer();
}

function startGame() {
    resetGame();
    if (gameInterval) clearInterval(gameInterval);
    isPaused = false;
    pauseBtn.textContent = 'Pause Game';
    gameInterval = setInterval(update, normalSpeed);
    startTimer();
}

// Collision detection
function collide(board, piece) {
    const { shape, pos } = piece;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                const newY = pos.y + y;
                const newX = pos.x + x;
                if (
                    newY < 0 ||
                    newY >= ROWS ||
                    newX < 0 ||
                    newX >= COLS ||
                    board[newY][newX]
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Merge piece into the board
function merge(board, piece) {
    const { shape, pos } = piece;
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x]) {
                board[pos.y + y][pos.x + x] = shape[y][x];
            }
        }
    }
}

// Move piece
function movePiece(dx, dy) {
    if (!currentPiece) return;
    const newPiece = {
        ...currentPiece,
        pos: { x: currentPiece.pos.x + dx, y: currentPiece.pos.y + dy },
    };
    if (!collide(board, newPiece)) {
        currentPiece = newPiece;
        drawBoard();
        return true;
    }
    return false;
}

// Rotate piece
function rotatePiece() {
    if (!currentPiece) return;
    const shape = currentPiece.shape;
    // Transpose and reverse rows for clockwise rotation
    const newShape = shape[0].map((_, i) => shape.map(row => row[i])).reverse();
    const newPiece = {
        ...currentPiece,
        shape: newShape,
    };
    if (!collide(board, newPiece)) {
        currentPiece = newPiece;
        drawBoard();
    }
}

// Drop piece down by one
function dropPiece() {
    if (!movePiece(0, 1)) {
        // Lock piece
        merge(board, currentPiece);
        clearLines();
        // Spawn new piece
        currentPiece = randomTetromino();
        // Game over check
        if (collide(board, currentPiece)) {
            gameOver();
            return;
        }
    }
}

// Clear completed lines
function clearLines() {
    let lines = 0;
    outer: for (let y = ROWS - 1; y >= 0; y--) {
        for (let x = 0; x < COLS; x++) {
            if (!board[y][x]) continue outer;
        }
        // Remove line
        board.splice(y, 1);
        board.unshift(new Array(COLS).fill(0));
        lines++;
        y++; // Check same row again
    }
    if (lines > 0) {
        score += lines * 100;
        scoreElement.textContent = score;
    }
}

// Game over
function gameOver() {
    clearInterval(gameInterval);
    gameInterval = null;
    pauseTimer();
    alert('Game Over! Your score: ' + score);
}

// Keyboard controls
window.addEventListener('keydown', (e) => {
    if (!currentPiece) return;
    switch (e.key) {
        case 'ArrowLeft':
            movePiece(-1, 0);
            break;
        case 'ArrowRight':
            movePiece(1, 0);
            break;
        case 'ArrowDown':
            if (!isAccelerated) {
                isAccelerated = true;
                clearInterval(gameInterval);
                gameInterval = setInterval(update, acceleratedSpeed);
            }
            dropPiece();
            break;
        case 'ArrowUp':
            rotatePiece();
            break;
        case ' ': // Spacebar for hard drop
            while (movePiece(0, 1)) {}
            dropPiece();
            break;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowDown' && isAccelerated) {
        isAccelerated = false;
        clearInterval(gameInterval);
        gameInterval = setInterval(update, normalSpeed);
    }
});

// Update update() to move piece down
function update() {
    dropPiece();
    drawBoard();
}

function pauseGame() {
    if (!isPaused) {
        clearInterval(gameInterval);
        gameInterval = null;
        isPaused = true;
        pauseBtn.textContent = 'Resume Game';
        pauseTimer();
    } else {
        const currentSpeed = isAccelerated ? acceleratedSpeed : normalSpeed;
        gameInterval = setInterval(update, currentSpeed);
        isPaused = false;
        pauseBtn.textContent = 'Pause Game';
        resumeTimer();
    }
}

function restartGame() {
    if (gameInterval) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
    isPaused = false;
    pauseBtn.textContent = 'Pause Game';
    resetGame();
    startTimer();
}

startBtn.addEventListener('click', startGame);
pauseBtn.addEventListener('click', pauseGame);
restartBtn.addEventListener('click', restartGame);

// TODO: Implement Tetris logic 