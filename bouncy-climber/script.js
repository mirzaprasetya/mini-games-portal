const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreSpan = document.getElementById('final-score');

// Game variables
let animationId;
let score = 0;
let highestY = 0;
let isGameOver = false;
let isGameRunning = false;

// Audio context
let audioCtx;

function playBoing() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    // Frequency sweep for boing
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// Input handling
let isMovingLeft = false;
let isMovingRight = false;

function handleInputStart(e) {
    if (!isGameRunning) return;
    const rect = canvas.getBoundingClientRect();
    let clientX;
    
    if (e.touches) {
        clientX = e.touches[0].clientX;
    } else {
        clientX = e.clientX;
    }
    
    const x = clientX - rect.left;
    if (x < rect.width / 2) {
        isMovingLeft = true;
        isMovingRight = false;
    } else {
        isMovingRight = true;
        isMovingLeft = false;
    }
}

function handleInputEnd(e) {
    isMovingLeft = false;
    isMovingRight = false;
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') isMovingLeft = true;
    if (e.code === 'ArrowRight') isMovingRight = true;
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft') isMovingLeft = false;
    if (e.code === 'ArrowRight') isMovingRight = false;
});

canvas.addEventListener('touchstart', handleInputStart, {passive: false});
canvas.addEventListener('touchend', handleInputEnd);
canvas.addEventListener('mousedown', handleInputStart);
canvas.addEventListener('mouseup', handleInputEnd);
canvas.addEventListener('mouseleave', handleInputEnd);

const player = {
    x: 200,
    y: 400,
    width: 20,
    height: 20,
    vy: 0,
    vx: 0,
    speed: 5,
    jumpStrength: -10,
    gravity: 0.4
};

let platforms = [];
const platformWidth = 60;
const platformHeight = 10;
const platformVerticalSpacing = 80;

function createPlatform(y) {
    const minX = 0;
    const maxX = canvas.width - platformWidth;
    const x = Math.random() * (maxX - minX) + minX;
    return { x, y, width: platformWidth, height: platformHeight };
}

function initGame() {
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 150;
    player.vy = player.jumpStrength;
    player.vx = 0;
    
    score = 0;
    isGameOver = false;
    isGameRunning = true;
    
    platforms = [];
    platforms.push({ x: 0, y: canvas.height - 10, width: canvas.width, height: 10 });
    
    for (let i = 1; i <= 8; i++) {
        platforms.push(createPlatform(canvas.height - i * platformVerticalSpacing));
    }
    
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    update();
}

function update() {
    if (isGameOver) return;
    
    if (isMovingLeft) {
        player.vx = -player.speed;
    } else if (isMovingRight) {
        player.vx = player.speed;
    } else {
        player.vx = 0;
    }
    
    player.x += player.vx;
    
    if (player.x + player.width < 0) {
        player.x = canvas.width;
    } else if (player.x > canvas.width) {
        player.x = -player.width;
    }
    
    player.vy += player.gravity;
    player.y += player.vy;
    
    if (player.vy > 0) {
        for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            if (player.x < p.x + p.width && 
                player.x + player.width > p.x && 
                player.y + player.height > p.y && 
                player.y + player.height < p.y + p.height + player.vy) {
                
                player.y = p.y - player.height;
                player.vy = player.jumpStrength;
                playBoing();
                break;
            }
        }
    }
    
    if (player.y < canvas.height / 2) {
        const diff = canvas.height / 2 - player.y;
        player.y = canvas.height / 2;
        
        score += diff;
        
        for (let i = 0; i < platforms.length; i++) {
            platforms[i].y += diff;
        }
        
        platforms = platforms.filter(p => p.y < canvas.height);
        
        while (platforms.length > 0 && platforms[platforms.length - 1].y > 0) {
            platforms.push(createPlatform(platforms[platforms.length - 1].y - platformVerticalSpacing));
        }
    }
    
    if (player.y > canvas.height) {
        isGameOver = true;
        isGameRunning = false;
        finalScoreSpan.textContent = Math.floor(score);
        gameOverScreen.style.display = 'flex';
        return;
    }
    
    draw();
    animationId = requestAnimationFrame(update);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#4CAF50';
    for (let i = 0; i < platforms.length; i++) {
        const p = platforms[i];
        ctx.fillRect(p.x, p.y, p.width, p.height);
    }
    
    ctx.fillStyle = '#FF5722';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 50);
}

startBtn.addEventListener('click', () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    initGame();
});
restartBtn.addEventListener('click', initGame);

ctx.fillStyle = '#87CEEB';
ctx.fillRect(0, 0, canvas.width, canvas.height);
