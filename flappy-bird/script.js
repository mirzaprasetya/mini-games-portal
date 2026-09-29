const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const birdBtns = document.querySelectorAll('.bird-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const finalScoreSpan = document.getElementById('final-score');
const startHighScoreSpan = document.getElementById('start-high-score');
const gameOverHighScoreSpan = document.getElementById('game-over-high-score');

// Load high score from localStorage
let highScore = localStorage.getItem('flappyHighScore') || 0;
startHighScoreSpan.innerText = highScore;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playScoreSound() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine'; // Sine wave for a clear bell-like tone
    osc.frequency.setValueAtTime(987.77, t); // B5 note
    osc.frequency.setValueAtTime(1318.51, t + 0.08); // Jump to E6 note for the 'ding' character
    
    // Envelope: Loud start, then decay
    gainNode.gain.setValueAtTime(0.8, t); // Much louder initial volume
    gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.5); // 0.5 second decay for the ring

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(t);
    osc.stop(t + 0.6);
}

// Game constants
const GRAVITY = 0.5;
const FLAP_SPEED = -8;
const PIPE_SPEED = 3;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;

// Game state
let selectedBird = '🐦';
let bird = { x: 80, y: 300, velocity: 0, radius: 15 };
let pipes = [];
let score = 0;
let gameOver = false;
let gameLoopId;

// Event listener for model selection
birdBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        selectedBird = btn.getAttribute('data-bird');
        startGame();
    });
});

function flap() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (!gameOver) {
        bird.velocity = FLAP_SPEED;
    }
}

// Input handling
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault(); // Prevent page scroll
        flap();
    }
});

// Touch and click handling on canvas
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    flap();
}, { passive: false });

canvas.addEventListener('mousedown', flap);

restartBtn.addEventListener('click', startGame);

menuBtn.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
});

function startGame() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    canvas.style.display = 'block';

    bird = { x: 80, y: canvas.height / 2, velocity: 0, radius: 18 };
    pipes = [];
    score = 0;
    gameOver = false;
    
    // Initial pipe setup
    addPipe(canvas.width);
    
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoop();
}

function addPipe(xPos) {
    const minPipeHeight = 50;
    const maxPipeHeight = canvas.height - PIPE_GAP - minPipeHeight;
    const topPipeHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
    
    pipes.push({
        x: xPos || canvas.width,
        topHeight: topPipeHeight,
        bottomY: topPipeHeight + PIPE_GAP,
        passed: false
    });
}

function update() {
    if (gameOver) return;

    // Physics
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;

    // Floor and ceiling collisions
    if (bird.y + bird.radius >= canvas.height) {
        bird.y = canvas.height - bird.radius;
        endGame();
    }
    if (bird.y - bird.radius <= 0) {
        bird.y = bird.radius;
        bird.velocity = 0;
    }

    // Pipes logic
    for (let i = 0; i < pipes.length; i++) {
        let p = pipes[i];
        p.x -= PIPE_SPEED;

        // Bounding box collision
        const birdLeft = bird.x - bird.radius;
        const birdRight = bird.x + bird.radius;
        const birdTop = bird.y - bird.radius;
        const birdBottom = bird.y + bird.radius;

        // Check if bird is within pipe's horizontal space
        if (birdRight > p.x && birdLeft < p.x + PIPE_WIDTH) {
            // Check if hitting top or bottom pipe
            if (birdTop < p.topHeight || birdBottom > p.bottomY) {
                endGame();
            }
        }

        // Score logic
        if (p.x + PIPE_WIDTH < birdLeft && !p.passed) {
            score++;
            p.passed = true;
            playScoreSound();
        }
    }

    // Generate next pipe
    if (pipes.length > 0 && pipes[pipes.length - 1].x < canvas.width - 250) {
        addPipe();
    }

    // Remove old pipes
    if (pipes.length > 0 && pipes[0].x + PIPE_WIDTH < 0) {
        pipes.shift();
    }
}

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background elements (simple ground or clouds if desired)
    // The background color handles the sky.

    // Draw Pipes
    ctx.fillStyle = '#2ecc71';
    ctx.strokeStyle = '#27ae60';
    ctx.lineWidth = 3;

    pipes.forEach(p => {
        // Top pipe
        ctx.fillRect(p.x, 0, PIPE_WIDTH, p.topHeight);
        ctx.strokeRect(p.x, 0, PIPE_WIDTH, p.topHeight);
        
        // Top pipe cap
        ctx.fillRect(p.x - 4, p.topHeight - 20, PIPE_WIDTH + 8, 20);
        ctx.strokeRect(p.x - 4, p.topHeight - 20, PIPE_WIDTH + 8, 20);

        // Bottom pipe
        ctx.fillRect(p.x, p.bottomY, PIPE_WIDTH, canvas.height - p.bottomY);
        ctx.strokeRect(p.x, p.bottomY, PIPE_WIDTH, canvas.height - p.bottomY);

        // Bottom pipe cap
        ctx.fillRect(p.x - 4, p.bottomY, PIPE_WIDTH + 8, 20);
        ctx.strokeRect(p.x - 4, p.bottomY, PIPE_WIDTH + 8, 20);
    });

    // Draw Bird
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.save();
    ctx.translate(bird.x, bird.y);
    
    // Rotate bird downwards when falling, upwards when jumping
    let rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (bird.velocity * 0.08)));
    
    // Some emojis face left natively, so we flip them to face right
    ctx.scale(-1, 1);
    // When scaled negatively on X, rotation needs to be inverted to look correct
    ctx.rotate(-rotation);
    
    ctx.fillText(selectedBird, 0, 0);
    ctx.restore();

    // Draw Score
    ctx.fillStyle = 'white';
    ctx.font = 'bold 50px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 4;
    
    ctx.strokeText(score, canvas.width / 2, 70);
    ctx.fillText(score, canvas.width / 2, 70);
}

function gameLoop() {
    update();
    draw();
    if (!gameOver) {
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

function endGame() {
    gameOver = true;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('flappyHighScore', highScore);
        startHighScoreSpan.innerText = highScore;
    }
    
    finalScoreSpan.innerText = score;
    gameOverHighScoreSpan.innerText = highScore;
    gameOverScreen.style.display = 'flex';
}
