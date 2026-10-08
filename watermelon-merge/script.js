const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');

const fruitsConfig = [
    { emoji: '🍒', radius: 15, mass: 1 },
    { emoji: '🍓', radius: 25, mass: 1.5 },
    { emoji: '🍇', radius: 35, mass: 2 },
    { emoji: '🍋', radius: 45, mass: 2.5 },
    { emoji: '🍊', radius: 55, mass: 3 },
    { emoji: '🍎', radius: 70, mass: 3.5 },
    { emoji: '🍈', radius: 85, mass: 4 },
    { emoji: '🍍', radius: 100, mass: 4.5 },
    { emoji: '🍉', radius: 120, mass: 5 }
];

let fruits = [];
let score = 0;

// Audio setup
let audioCtx;
function playPopSound() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

class Fruit {
    constructor(x, y, level) {
        this.x = x;
        this.y = y;
        this.level = level;
        this.vx = 0;
        this.vy = 0;
        this.config = fruitsConfig[level];
        this.radius = this.config.radius;
        this.mass = this.config.mass;
        this.emoji = this.config.emoji;
        this.markedForDeletion = false;
    }
    
    draw(ctx) {
        ctx.font = `${this.radius * 2 * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y);
    }
    
    update(dt) {
        // Gravity
        this.vy += 1000 * dt;
        
        // Damping
        this.vx *= 0.99;
        this.vy *= 0.99;
        
        // Position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // Walls
        if (this.x - this.radius < 0) {
            this.x = this.radius;
            this.vx *= -0.5;
        } else if (this.x + this.radius > canvas.width) {
            this.x = canvas.width - this.radius;
            this.vx *= -0.5;
        }
        
        // Floor
        if (this.y + this.radius > canvas.height) {
            this.y = canvas.height - this.radius;
            this.vy *= -0.5;
            this.vx *= 0.8;
        }
    }
}

let lastTime = performance.now();
function gameLoop(time) {
    const dt = Math.min((time - lastTime) / 1000, 0.05); // max dt
    lastTime = time;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let i = 0; i < fruits.length; i++) {
        fruits[i].update(dt);
    }
    
    resolveCollisions();
    
    fruits = fruits.filter(f => !f.markedForDeletion);
    
    for (let i = 0; i < fruits.length; i++) {
        fruits[i].draw(ctx);
    }
    
    if (canDrop) {
        ctx.globalAlpha = 0.6;
        const config = fruitsConfig[currentFruitLevel];
        ctx.font = `${config.radius * 2 * 0.8}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.beginPath();
        ctx.moveTo(cursorX, config.radius);
        ctx.lineTo(cursorX, canvas.height);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        
        ctx.fillText(config.emoji, cursorX, config.radius);
        ctx.globalAlpha = 1.0;
    }
    
    requestAnimationFrame(gameLoop);
}

function resolveCollisions() {
    for (let i = 0; i < fruits.length; i++) {
        for (let j = i + 1; j < fruits.length; j++) {
            const f1 = fruits[i];
            const f2 = fruits[j];
            
            if (f1.markedForDeletion || f2.markedForDeletion) continue;
            
            const dx = f2.x - f1.x;
            const dy = f2.y - f1.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const minDist = f1.radius + f2.radius;
            
            if (distance < minDist) {
                if (f1.level === f2.level && f1.level < fruitsConfig.length - 1) {
                    f1.markedForDeletion = true;
                    f2.markedForDeletion = true;
                    
                    const newX = (f1.x + f2.x) / 2;
                    const newY = (f1.y + f2.y) / 2;
                    const newFruit = new Fruit(newX, newY, f1.level + 1);
                    newFruit.vy = -100;
                    fruits.push(newFruit);
                    
                    score += (f1.level + 1) * 10;
                    scoreEl.innerText = `Score: ${score}`;
                    
                    playPopSound();
                    continue;
                }
                
                const nx = dx / distance;
                const ny = dy / distance;
                
                const p = minDist - distance;
                
                const totalMass = f1.mass + f2.mass;
                const r1 = f2.mass / totalMass;
                const r2 = f1.mass / totalMass;
                
                f1.x -= nx * p * r1;
                f1.y -= ny * p * r1;
                f2.x += nx * p * r2;
                f2.y += ny * p * r2;
                
                const vx = f2.vx - f1.vx;
                const vy = f2.vy - f1.vy;
                const velAlongNormal = vx * nx + vy * ny;
                
                if (velAlongNormal > 0) continue;
                
                const e = 0.2;
                
                let j_impulse = -(1 + e) * velAlongNormal;
                j_impulse /= (1 / f1.mass + 1 / f2.mass);
                
                const impulseX = j_impulse * nx;
                const impulseY = j_impulse * ny;
                
                f1.vx -= impulseX / f1.mass;
                f1.vy -= impulseY / f1.mass;
                f2.vx += impulseX / f2.mass;
                f2.vy += impulseY / f2.mass;
            }
        }
    }
}

let currentFruitLevel = Math.floor(Math.random() * 4);
let nextFruitLevel = Math.floor(Math.random() * 4);
let cursorX = canvas.width / 2;
let canDrop = true;
const nextFruitEl = document.getElementById('next-fruit');
nextFruitEl.innerText = fruitsConfig[nextFruitLevel].emoji;

function updateCursorX(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    let x = (e.clientX - rect.left) * scaleX;
    const radius = fruitsConfig[currentFruitLevel].radius;
    
    if (x - radius < 0) x = radius;
    if (x + radius > canvas.width) x = canvas.width - radius;
    cursorX = x;
}

canvas.addEventListener('mousemove', updateCursorX);
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    updateCursorX(e.touches[0]);
}, {passive: false});

canvas.addEventListener('mousedown', handleDrop);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    updateCursorX(e.touches[0]);
    handleDrop(e.touches[0]);
}, {passive: false});

function handleDrop(e) {
    if (!canDrop) return;
    
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtx.resume();
    }
    updateCursorX(e);
    
    const newFruit = new Fruit(cursorX, fruitsConfig[currentFruitLevel].radius, currentFruitLevel);
    fruits.push(newFruit);
    
    canDrop = false;
    setTimeout(() => canDrop = true, 600);
    
    currentFruitLevel = nextFruitLevel;
    nextFruitLevel = Math.floor(Math.random() * 4);
    nextFruitEl.innerText = fruitsConfig[nextFruitLevel].emoji;
    
    // Update cursor constraint for new fruit
    const radius = fruitsConfig[currentFruitLevel].radius;
    if (cursorX - radius < 0) cursorX = radius;
    if (cursorX + radius > canvas.width) cursorX = canvas.width - radius;
}

requestAnimationFrame(gameLoop);
