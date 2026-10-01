const menuContainer = document.getElementById('menu');
const gameContainer = document.getElementById('game');
const boardElement = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status-text');
const restartBtn = document.getElementById('restart-btn');
const backBtn = document.getElementById('back-btn');
const resultModal = document.getElementById('result-modal');
const resultMessage = document.getElementById('result-message');
const playAgainBtn = document.getElementById('play-again-btn');

let board = ['', '', '', '', '', '', '', '', ''];
let currentPlayer = 'X';
let gameActive = false;
let gameMode = '2p'; // '1p-easy', '1p-hard', '2p'

const WIN_CONDITIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        gameMode = e.target.getAttribute('data-mode');
        startGame();
    });
});

function startGame() {
    menuContainer.style.display = 'none';
    gameContainer.style.display = 'flex';
    resetBoard();
}

function resetBoard() {
    board = ['', '', '', '', '', '', '', '', ''];
    currentPlayer = 'X';
    gameActive = true;
    statusText.innerText = "Player X's Turn";
    
    cells.forEach(cell => {
        cell.innerText = '';
        cell.classList.remove('x', 'o', 'winning-cell');
    });
    
    resultModal.style.display = 'none';
}

cells.forEach(cell => {
    cell.addEventListener('click', () => handleCellClick(cell));
});

function handleCellClick(cell) {
    const index = parseInt(cell.getAttribute('data-index'));
    
    // Ignore clicks if cell is filled, game is over, or it's bot's turn
    if (board[index] !== '' || !gameActive || (gameMode.startsWith('1p') && currentPlayer === 'O')) return;
    
    makeMove(index, currentPlayer);
    
    if (gameActive && gameMode.startsWith('1p') && currentPlayer === 'O') {
        // Bot's turn
        statusText.innerText = "Bot is thinking...";
        setTimeout(makeBotMove, 500); // Slight delay for realism
    }
}

function makeMove(index, player) {
    board[index] = player;
    cells[index].innerText = player;
    cells[index].classList.add(player.toLowerCase());
    
    checkWin(player);
    
    if (gameActive) {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        if (!(gameMode.startsWith('1p') && currentPlayer === 'O')) {
            statusText.innerText = `Player ${currentPlayer}'s Turn`;
        }
    }
}

function checkWin(player) {
    let roundWon = false;
    let winningCells = [];
    
    for (let i = 0; i < WIN_CONDITIONS.length; i++) {
        const [a, b, c] = WIN_CONDITIONS[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            roundWon = true;
            winningCells = [a, b, c];
            break;
        }
    }
    
    if (roundWon) {
        gameActive = false;
        winningCells.forEach(i => cells[i].classList.add('winning-cell'));
        
        setTimeout(() => {
            if (gameMode.startsWith('1p')) {
                resultMessage.innerText = player === 'X' ? "You Win! 🎉" : "Bot Wins! 🤖";
            } else {
                resultMessage.innerText = `Player ${player} Wins! 🎉`;
            }
            resultModal.style.display = 'flex';
        }, 800);
        return;
    }
    
    if (!board.includes('')) {
        gameActive = false;
        setTimeout(() => {
            resultMessage.innerText = "It's a Draw! 🤝";
            resultModal.style.display = 'flex';
        }, 800);
    }
}

function makeBotMove() {
    if (!gameActive) return;
    
    let bestMove;
    if (gameMode === '1p-easy') {
        const available = board.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
        bestMove = available[Math.floor(Math.random() * available.length)];
    } else {
        bestMove = minimax(board, 'O').index;
    }
    
    makeMove(bestMove, 'O');
}

// Minimax algorithm for unbeatable bot
function minimax(newBoard, player) {
    const availSpots = newBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);
    
    if (checkWinning(newBoard, 'X')) return { score: -10 };
    else if (checkWinning(newBoard, 'O')) return { score: 10 };
    else if (availSpots.length === 0) return { score: 0 };
    
    const moves = [];
    
    for (let i = 0; i < availSpots.length; i++) {
        const move = {};
        move.index = availSpots[i];
        newBoard[availSpots[i]] = player;
        
        if (player === 'O') {
            move.score = minimax(newBoard, 'X').score;
        } else {
            move.score = minimax(newBoard, 'O').score;
        }
        
        newBoard[availSpots[i]] = ''; // reset
        moves.push(move);
    }
    
    let bestMove;
    if (player === 'O') {
        let bestScore = -10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score > bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    } else {
        let bestScore = 10000;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].score < bestScore) {
                bestScore = moves[i].score;
                bestMove = i;
            }
        }
    }
    
    return moves[bestMove];
}

function checkWinning(b, player) {
    for (let i = 0; i < WIN_CONDITIONS.length; i++) {
        const [x, y, z] = WIN_CONDITIONS[i];
        if (b[x] === player && b[y] === player && b[z] === player) return true;
    }
    return false;
}

restartBtn.addEventListener('click', resetBoard);
playAgainBtn.addEventListener('click', resetBoard);
backBtn.addEventListener('click', () => {
    gameContainer.style.display = 'none';
    menuContainer.style.display = 'flex';
    gameActive = false;
});
