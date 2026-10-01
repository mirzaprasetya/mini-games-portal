const gameContainer = document.getElementById('game-container');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const startOverlay = document.getElementById('start-overlay');
const gameOverOverlay = document.getElementById('game-over-overlay');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

let score = 0;
let lives = 3;
let isPlaying = false;
let spawnInterval;
let balloons = [];

const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22'];

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playPop() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
    
    gain.gain.setValueAtTime(1, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.1);
}

function playMiss() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.3);
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.3);
}

function spawnBalloon() {
    if (!isPlaying) return;
    
    const balloon = document.createElement('div');
    balloon.classList.add('balloon');
    
    const color = colors[Math.floor(Math.random() * colors.length)];
    balloon.style.backgroundColor = color;
    balloon.style.borderBottomColor = color; // For the tie
    
    const size = Math.random() * 20 + 50; // 50 to 70
    balloon.style.width = `${size}px`;
    balloon.style.height = `${size * 1.25}px`;
    
    const left = Math.random() * (gameContainer.clientWidth - size);
    balloon.style.left = `${left}px`;
    
    // Start at bottom
    balloon.style.bottom = '-100px';
    
    gameContainer.appendChild(balloon);
    
    let bottom = -100;
    const speed = Math.random() * 2 + 1 + (score * 0.05);
    const wobbleSpeed = Math.random() * 0.05 + 0.02;
    let time = Math.random() * 100;
    
    function move() {
        if (!isPlaying || !gameContainer.contains(balloon)) return;
        bottom += speed;
        time += wobbleSpeed;
        
        balloon.style.bottom = `${bottom}px`;
        balloon.style.transform = `translateX(${Math.sin(time) * 20}px)`;
        
        if (bottom > gameContainer.clientHeight + 20) {
            // Escaped
            if (gameContainer.contains(balloon)) {
                gameContainer.removeChild(balloon);
                loseLife();
            }
        } else {
            requestAnimationFrame(move);
        }
    }
    
    balloon.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (!isPlaying) return;
        playPop();
        score++;
        scoreEl.innerText = score;
        
        // Explosion effect
        balloon.style.transform = 'scale(1.5)';
        balloon.style.opacity = '0';
        setTimeout(() => {
            if (gameContainer.contains(balloon)) gameContainer.removeChild(balloon);
        }, 100);
    });
    
    requestAnimationFrame(move);
    balloons.push(balloon);
    
    const nextSpawn = Math.max(400, 1500 - (score * 20));
    spawnInterval = setTimeout(spawnBalloon, nextSpawn);
}

function loseLife() {
    if (!isPlaying) return;
    lives--;
    livesEl.innerText = lives;
    playMiss();
    
    // Flash screen red
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = '0'; flash.style.left = '0';
    flash.style.width = '100%'; flash.style.height = '100%';
    flash.style.backgroundColor = 'rgba(231, 76, 60, 0.5)';
    flash.style.pointerEvents = 'none';
    flash.style.zIndex = '50';
    gameContainer.appendChild(flash);
    
    setTimeout(() => { if (gameContainer.contains(flash)) gameContainer.removeChild(flash); }, 150);
    
    if (lives <= 0) gameOver();
}

function initGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    // Cleanup old balloons
    balloons.forEach(b => {
        if (gameContainer.contains(b)) gameContainer.removeChild(b);
    });
    balloons = [];
    
    score = 0;
    lives = 3;
    scoreEl.innerText = score;
    livesEl.innerText = lives;
    
    isPlaying = true;
    startOverlay.style.display = 'none';
    gameOverOverlay.style.display = 'none';
    
    clearTimeout(spawnInterval);
    spawnBalloon();
}

function gameOver() {
    isPlaying = false;
    clearTimeout(spawnInterval);
    document.getElementById('final-score').innerText = score;
    gameOverOverlay.style.display = 'flex';
}

startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
