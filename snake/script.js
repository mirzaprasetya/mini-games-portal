const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

const gridSize = 20;
const tileCount = canvas.width / gridSize;

let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
highScoreEl.innerText = highScore;

let snake = [];
let dx = 0;
let dy = 0;
let nextDx = 0;
let nextDy = 0;
let foodX;
let foodY;
let gameLoopId;
let gameSpeed = 130;
let isPlaying = false;

function initGame() {
    snake = [
        { x: 10, y: 10 },
        { x: 10, y: 11 },
        { x: 10, y: 12 }
    ];
    dx = 0;
    dy = -1;
    nextDx = 0;
    nextDy = -1;
    score = 0;
    gameSpeed = 130;
    scoreEl.innerText = score;
    placeFood();
    isPlaying = true;
    startOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';
    
    if (gameLoopId) clearTimeout(gameLoopId);
    gameLoop();
}

function placeFood() {
    foodX = Math.floor(Math.random() * tileCount);
    foodY = Math.floor(Math.random() * tileCount);
    
    // Don't place food on snake
    for (let part of snake) {
        if (part.x === foodX && part.y === foodY) {
            return placeFood();
        }
    }
}

function gameLoop() {
    if (!isPlaying) return;
    
    setTimeout(() => {
        gameLoopId = requestAnimationFrame(gameLoop);
    }, gameSpeed);
    
    dx = nextDx;
    dy = nextDy;
    
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    
    // Check wall collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        return gameOver();
    }
    
    // Check self collision
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return gameOver();
        }
    }
    
    snake.unshift(head);
    
    // Check food collision
    if (head.x === foodX && head.y === foodY) {
        score += 10;
        scoreEl.innerText = score;
        placeFood();
        // Slightly increase speed
        if (gameSpeed > 60) gameSpeed -= 2;
    } else {
        snake.pop();
    }
    
    draw();
}

function draw() {
    // Clear canvas
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw food (apple)
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(foodX * gridSize + gridSize/2, foodY * gridSize + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw snake
    snake.forEach((part, index) => {
        ctx.fillStyle = index === 0 ? '#2ecc71' : '#27ae60';
        ctx.fillRect(part.x * gridSize + 1, part.y * gridSize + 1, gridSize - 2, gridSize - 2);
    });
}

function gameOver() {
    isPlaying = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        highScoreEl.innerText = highScore;
    }
    gameOverOverlay.style.display = 'flex';
}

function changeDirection(newDx, newDy) {
    if (!isPlaying) return;
    // Prevent 180 degree turns
    if (newDx === -dx && newDy === -dy && snake.length > 1) return;
    nextDx = newDx;
    nextDy = newDy;
}

// Keyboard controls
window.addEventListener('keydown', e => {
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            changeDirection(0, -1);
            if (isPlaying) e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            changeDirection(0, 1);
            if (isPlaying) e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            changeDirection(-1, 0);
            if (isPlaying) e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            changeDirection(1, 0);
            if (isPlaying) e.preventDefault();
            break;
    }
});

// D-Pad controls
document.getElementById('btn-up').addEventListener('touchstart', (e) => { e.preventDefault(); changeDirection(0, -1); });
document.getElementById('btn-down').addEventListener('touchstart', (e) => { e.preventDefault(); changeDirection(0, 1); });
document.getElementById('btn-left').addEventListener('touchstart', (e) => { e.preventDefault(); changeDirection(-1, 0); });
document.getElementById('btn-right').addEventListener('touchstart', (e) => { e.preventDefault(); changeDirection(1, 0); });

document.getElementById('btn-up').addEventListener('mousedown', () => changeDirection(0, -1));
document.getElementById('btn-down').addEventListener('mousedown', () => changeDirection(0, 1));
document.getElementById('btn-left').addEventListener('mousedown', () => changeDirection(-1, 0));
document.getElementById('btn-right').addEventListener('mousedown', () => changeDirection(1, 0));

// Swipe support
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, {passive: false});

canvas.addEventListener('touchmove', e => {
    if (isPlaying) e.preventDefault(); // Prevent scrolling while playing
}, {passive: false});

canvas.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal swipe
        if (Math.abs(diffX) > 30) {
            if (diffX > 0) changeDirection(1, 0); // Right
            else changeDirection(-1, 0); // Left
        }
    } else {
        // Vertical swipe
        if (Math.abs(diffY) > 30) {
            if (diffY > 0) changeDirection(0, 1); // Down
            else changeDirection(0, -1); // Up
        }
    }
});

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

// Initial draw
draw();
