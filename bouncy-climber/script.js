const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const finalScoreSpan = document.getElementById('final-score');
const soundBtn = document.getElementById('sound-btn');
const tutorialArrows = document.getElementById('tutorial-arrows');

// High DPI Canvas Setup
function resizeCanvas() {
    const wrapper = document.getElementById('game-wrapper');
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    
    // Internal logical size (standardizing on 400x600 for math, but scaling up visually)
    // Wait, let's keep logical 400x600 and just scale the context.
    const logicalWidth = 400;
    const logicalHeight = 600;
    
    // Actually, setting width/height explicitly to wrapper size, then scaling context by devicePixelRatio
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // Calculate scale to map 400x600 logical space to actual pixel space
    scaleX = width / logicalWidth;
    scaleY = height / logicalHeight;
    
    ctx.scale(dpr * scaleX, dpr * scaleY);
    
    // Save logical dimensions
    canvas.logicalWidth = logicalWidth;
    canvas.logicalHeight = logicalHeight;
}
window.addEventListener('resize', resizeCanvas);
let scaleX = 1; let scaleY = 1;
resizeCanvas(); // Initial call

// Game variables
let animationId;
let lastTime = 0;
let score = 0;
let isGameOver = false;
let isGameRunning = false;
let soundEnabled = true;
let jumpCount = 0;

// Audio context
let audioCtx;
function playBoing() {
    if (!soundEnabled) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
}

soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundBtn.innerText = soundEnabled ? '🔊 Sound' : '🔇 Muted';
});

// Input handling (Pointer Events)
let isMovingLeft = false;
let isMovingRight = false;
let tiltX = 0;

window.addEventListener('deviceorientation', (e) => {
    tiltX = e.gamma || 0; // gamma is left/right tilt in degrees (-90 to 90)
});

function handlePointer(e) {
    if (!isGameRunning) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 2) {
        isMovingLeft = true;
        isMovingRight = false;
    } else {
        isMovingRight = true;
        isMovingLeft = false;
    }
}
function handlePointerEnd() {
    isMovingLeft = false;
    isMovingRight = false;
}

canvas.addEventListener('pointerdown', (e) => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); handlePointer(e); });
canvas.addEventListener('pointermove', (e) => { if(isMovingLeft || isMovingRight) handlePointer(e); });
canvas.addEventListener('pointerup', handlePointerEnd);
canvas.addEventListener('pointercancel', handlePointerEnd);

window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') isMovingLeft = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') isMovingRight = true;
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') isMovingLeft = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') isMovingRight = false;
});
window.addEventListener('blur', handlePointerEnd);

// Entities
const player = {
    x: 200, y: 500, size: 36, vy: 0, vx: 0,
    speed: 300, // pixels per second
    jumpForce: -750, // Increased for higher jump
    gravity: 1500, // Increased for snappier fall
    scaleY: 1, scaleX: 1
};

let platforms = [];
let particles = [];

function spawnParticles(x, y) {
    for(let i=0; i<5; i++) {
        particles.push({
            x: x, y: y,
            vx: (Math.random() - 0.5) * 100,
            vy: (Math.random() - 0.5) * 50,
            life: 1,
            size: Math.random() * 5 + 3
        });
    }
}

function generatePlatform(y, isTutorial = false) {
    let width = 60;
    if (isTutorial) width = 140; // Super safe first few
    else width = Math.max(50, 100 - (score * 1.5)); // Shrinks as you climb
    
    const maxX = canvas.logicalWidth - width;
    
    // If tutorial, place near center, else random
    const x = isTutorial ? (canvas.logicalWidth/2 - width/2) : (Math.random() * maxX);
    return { x, y, width, height: 12, color: '#4CAF50', bounceAnim: 0 };
}

function initGame() {
    player.x = canvas.logicalWidth / 2; // Center horizontally
    player.y = canvas.logicalHeight - 100;
    player.vy = player.jumpForce;
    player.vx = 0;
    player.scaleX = 1;
    player.scaleY = 1;
    
    score = 0;
    jumpCount = 0;
    isGameOver = false;
    isGameRunning = true;
    
    platforms = [];
    particles = [];
    
    // First safe starting platform exactly under player
    platforms.push({ x: player.x - 70, y: player.y + 40, width: 140, height: 15, color: '#2ecc71', bounceAnim: 0 });
    
    // 3 safe tutorial platforms directly above
    for (let i = 1; i <= 3; i++) {
        platforms.push(generatePlatform(player.y + 40 - (i * 70), true));
    }
    // Fill the rest randomly
    for(let i = 4; i <= 8; i++) {
        platforms.push(generatePlatform(player.y + 40 - (i * 90), false));
    }
    
    tutorialArrows.style.opacity = '1';
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    
    lastTime = performance.now();
    requestAnimationFrame(update);
}

function update(time) {
    if (isGameOver) return;
    const dt = Math.min((time - lastTime) / 1000, 0.05); // max 50ms per frame to prevent tunneling
    lastTime = time;
    
    // Movement
    if (isMovingLeft) {
        player.vx = -player.speed;
    } else if (isMovingRight) {
        player.vx = player.speed;
    } else if (Math.abs(tiltX) > 3) {
        // Gyroscope tilt control with a 3-degree deadzone
        let normalizedTilt = Math.max(-30, Math.min(30, tiltX)) / 30; // Max speed at 30 degrees tilt
        player.vx = player.speed * normalizedTilt;
    } else {
        player.vx = 0;
    }
    
    player.x += player.vx * dt;

    
    // Screen wrap
    if (player.x + player.size/2 < 0) player.x = canvas.logicalWidth + player.size/2;
    else if (player.x - player.size/2 > canvas.logicalWidth) player.x = -player.size/2;
    
    // Physics
    player.vy += player.gravity * dt;
    player.y += player.vy * dt;
    
    // Recover scale animation
    player.scaleX += (1 - player.scaleX) * 10 * dt;
    player.scaleY += (1 - player.scaleY) * 10 * dt;
    
    // Collisions (only when falling)
    if (player.vy > 0) {
        for (let i = 0; i < platforms.length; i++) {
            const p = platforms[i];
            const bottomOfPlayer = player.y + player.size/2;
            const previousBottom = (player.y - player.vy * dt) + player.size/2;
            
            // Check horizontal bounds (AABB)
            if (player.x + player.size/2 > p.x && player.x - player.size/2 < p.x + p.width) {
                // Check vertical intersection
                if (bottomOfPlayer >= p.y && previousBottom <= p.y + 5) {
                    player.y = p.y - player.size/2;
                    player.vy = player.jumpForce;
                    player.scaleX = 1.4; // Squash
                    player.scaleY = 0.6;
                    p.bounceAnim = 5;
                    playBoing();
                    spawnParticles(player.x, p.y);
                    
                    jumpCount++;
                    if(jumpCount === 3) tutorialArrows.style.opacity = '0';
                    break;
                }
            }
        }
    }
    
    // Camera scroll up
    const midScreen = canvas.logicalHeight / 2;
    if (player.y < midScreen) {
        const diff = midScreen - player.y;
        player.y = midScreen;
        
        // Add exact difference to score (converted to int later)
        score += diff / 50; 
        
        // Scroll platforms
        for (let i = 0; i < platforms.length; i++) {
            platforms[i].y += diff;
        }
        // Scroll particles
        for (let i = 0; i < particles.length; i++) {
            particles[i].y += diff;
        }
        
        // Remove off-screen platforms and spawn new ones
        platforms = platforms.filter(p => p.y < canvas.logicalHeight);
        
        const topPlatform = platforms[platforms.length - 1];
        // Vertical gap increases slightly with score, max out at safe distance
        const gap = Math.min(100, 60 + (score * 1.5));
        if (topPlatform.y > 0) {
            platforms.push(generatePlatform(topPlatform.y - gap, false));
        }
    }
    
    // Particles update
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt * 2;
        if (p.life <= 0) particles.splice(i, 1);
    }
    
    // Platform animations
    for (let p of platforms) {
        if (p.bounceAnim > 0) p.bounceAnim -= dt * 30;
        if (p.bounceAnim < 0) p.bounceAnim = 0;
    }
    
    // Game Over
    if (player.y > canvas.logicalHeight + player.size) {
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
    ctx.clearRect(0, 0, canvas.logicalWidth, canvas.logicalHeight);
    
    // Draw background grid/clouds for depth? 
    // Keep it simple for now, just clear.
    
    // Platforms
    for (let p of platforms) {
        ctx.fillStyle = p.color || '#4CAF50';
        ctx.beginPath();
        // Add bounce offset
        ctx.roundRect(p.x, p.y + p.bounceAnim, p.width, p.height, 5);
        ctx.fill();
        // Inner highlight
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(p.x + 2, p.y + 2 + p.bounceAnim, p.width - 4, 3);
    }
    
    // Particles
    ctx.fillStyle = 'white';
    for (let p of particles) {
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    // Player (Frog Emoji)
    ctx.save();
    ctx.translate(player.x, player.y);
    // Add stretch when moving fast vertically
    let stretch = 1;
    if(player.vy < -200) stretch = 1.1;
    if(player.vy > 200) stretch = 0.9;
    
    ctx.scale(player.scaleX, player.scaleY * stretch);
    
    ctx.font = `${player.size}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🐸', 0, 0);
    ctx.restore();
    
    // Score HUD
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${Math.floor(score)}`, 10, 30);
}

startBtn.addEventListener('click', () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // Request device orientation permission for iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    console.log("Gyroscope permission granted.");
                }
            })
            .catch(console.error);
    }
    
    initGame();
});
restartBtn.addEventListener('click', initGame);

// Initial empty draw
ctx.fillStyle = '#87CEEB';
ctx.fillRect(0, 0, canvas.width, canvas.height);
