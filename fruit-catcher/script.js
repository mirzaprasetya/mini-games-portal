const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let highScore = localStorage.getItem('fruitHighScore') || 0;
highScoreEl.innerText = highScore;

let basket = { x: 200, y: 500, width: 80, height: 40 };
let objects = [];
let gameLoopId;
let isPlaying = false;
let frameCount = 0;

const fruits = ['🍎', '🍌', '🍇', '🍉', '🍓'];
const bomb = '💣';

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    if (type === 'catch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    } else if (type === 'bomb') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    }
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.3);
}

function initGame() {
    score = 0;
    scoreEl.innerText = score;
    objects = [];
    basket.x = canvas.width / 2 - basket.width / 2;
    basket.y = canvas.height - 60;
    isPlaying = true;
    frameCount = 0;
    startOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoop();
}

function spawnObject() {
    const isBomb = Math.random() < 0.2;
    const emoji = isBomb ? bomb : fruits[Math.floor(Math.random() * fruits.length)];
    objects.push({
        x: Math.random() * (canvas.width - 30) + 15,
        y: -30,
        type: isBomb ? 'bomb' : 'fruit',
        emoji: emoji,
        speed: Math.random() * 2 + 2 + (score * 0.05) // speed increases with score
    });
}

function gameLoop() {
    if (!isPlaying) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw Basket
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.roundRect(basket.x, basket.y, basket.width, basket.height, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(basket.x + 10, basket.y + 10, basket.width - 20, 5); // Detail
    
    // Manage Objects
    if (frameCount % 40 === 0) spawnObject();
    
    for (let i = objects.length - 1; i >= 0; i--) {
        let obj = objects[i];
        obj.y += obj.speed;
        
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obj.emoji, obj.x, obj.y);
        
        // Collision
        if (obj.y > basket.y && obj.y < basket.y + basket.height &&
            obj.x > basket.x && obj.x < basket.x + basket.width) {
            
            if (obj.type === 'bomb') {
                playSound('bomb');
                gameOver();
                return;
            } else {
                playSound('catch');
                score++;
                scoreEl.innerText = score;
                objects.splice(i, 1);
            }
        }
        // Remove if off screen
        else if (obj.y > canvas.height + 30) {
            objects.splice(i, 1);
        }
    }
    
    frameCount++;
    gameLoopId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    isPlaying = false;
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('fruitHighScore', highScore);
        highScoreEl.innerText = highScore;
    }
    document.getElementById('final-score').innerText = score;
    gameOverOverlay.style.display = 'flex';
}

// Controls
canvas.addEventListener('touchmove', e => {
    if(!isPlaying) return;
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    // Map touch to canvas resolution
    const scaleX = canvas.width / rect.width;
    basket.x = (touchX * scaleX) - basket.width / 2;
    
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;
}, {passive: false});

canvas.addEventListener('mousemove', e => {
    if(!isPlaying) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    basket.x = ((e.clientX - rect.left) * scaleX) - basket.width / 2;
    
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.width > canvas.width) basket.x = canvas.width - basket.width;
});

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
