const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');

let score = 0;
let highScore = localStorage.getItem('dinoHighScore') || 0;
highScoreEl.innerText = highScore;

let isPlaying = false;
let gameLoopId;
let gameSpeed = 5;
let frameCount = 0;

const dino = {
    x: 50,
    y: 150, // Ground level
    width: 30,
    height: 40,
    dy: 0,
    jumpForce: -12,
    gravity: 0.6,
    grounded: true
};

let obstacles = [];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    if (type === 'jump') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(600, t + 0.1);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
    } else if (type === 'die') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.start(t); osc.stop(t + 0.3);
    }
    
    osc.connect(gain); gain.connect(audioCtx.destination);
}

function initGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    score = 0;
    gameSpeed = 5;
    frameCount = 0;
    obstacles = [];
    dino.y = 150;
    dino.dy = 0;
    dino.grounded = true;
    isPlaying = true;
    startOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';
    
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoop();
}

function jump() {
    if (isPlaying && dino.grounded) {
        dino.dy = dino.jumpForce;
        dino.grounded = false;
        playSound('jump');
    }
}

function spawnObstacle() {
    obstacles.push({
        x: canvas.width,
        y: 150,
        width: 20,
        height: Math.random() > 0.5 ? 40 : 25
    });
}

function gameLoop() {
    if (!isPlaying) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw ground line
    ctx.fillStyle = '#2f3640';
    ctx.fillRect(0, 190, canvas.width, 2);
    
    // Physics
    dino.dy += dino.gravity;
    dino.y += dino.dy;
    
    if (dino.y >= 150) {
        dino.y = 150;
        dino.dy = 0;
        dino.grounded = true;
    }
    
    // Draw Dino (flipped horizontally to face right)
    ctx.save();
    ctx.translate(dino.x + 15, dino.y + 20); // Center of dino
    ctx.scale(-1, 1); // Flip horizontally
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🦖', 0, 0);
    ctx.restore();
    
    // Manage obstacles
    if (frameCount > 0 && frameCount % Math.max(60, Math.floor(120 - gameSpeed*5)) === 0) {
        spawnObstacle();
    }
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        let obs = obstacles[i];
        obs.x -= gameSpeed;
        
        ctx.fillStyle = '#27ae60';
        // Draw cactus
        ctx.fillRect(obs.x, obs.y + (40 - obs.height), obs.width, obs.height);
        
        // AABB Collision (shrink bounding box slightly for fair gameplay)
        if (dino.x < obs.x + obs.width - 5 &&
            dino.x + dino.width - 5 > obs.x &&
            dino.y < obs.y + 40 &&
            dino.y + dino.height > obs.y + (40 - obs.height)) {
            gameOver();
            return;
        }
        
        if (obs.x + obs.width < 0) {
            obstacles.splice(i, 1);
        }
    }
    
    // Score
    if (frameCount % 10 === 0) {
        score++;
        scoreEl.innerText = score;
        if (score % 100 === 0) gameSpeed += 0.5;
    }
    
    frameCount++;
    gameLoopId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    isPlaying = false;
    playSound('die');
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('dinoHighScore', highScore);
        highScoreEl.innerText = highScore;
    }
    document.getElementById('final-score').innerText = score;
    gameOverOverlay.style.display = 'flex';
}

// Input
document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (!isPlaying && startOverlay.style.display !== 'none') initGame();
        else if (!isPlaying && gameOverOverlay.style.display !== 'none') initGame();
        else jump();
    }
});

canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (isPlaying) jump();
});

document.getElementById('start-btn').addEventListener('click', initGame);
document.getElementById('restart-btn').addEventListener('click', initGame);
