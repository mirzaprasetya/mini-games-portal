const holes = document.querySelectorAll('.hole');
const scoreBoard = document.getElementById('score');
const timeBoard = document.getElementById('time');
const startBtn = document.getElementById('start-btn');
const modal = document.getElementById('game-over-modal');
const finalScoreEl = document.getElementById('final-score');
const highScoreEl = document.getElementById('high-score');
const playAgainBtn = document.getElementById('play-again-btn');

let lastHole;
let timeUp = false;
let score = 0;
let timeLimit = 30;
let countdownTimer;

let highScore = localStorage.getItem('whackHighScore') || 0;
highScoreEl.innerText = highScore;

// Random time generator
function randomTime(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

// Pick random hole
function randomHole(holesList) {
    const idx = Math.floor(Math.random() * holesList.length);
    const hole = holesList[idx];
    
    // Prevent same hole back-to-back
    if (hole === lastHole) {
        return randomHole(holesList);
    }
    lastHole = hole;
    return hole;
}

function peep() {
    // Speed up slightly as time goes down? 
    // Let's keep it between 500ms and 1000ms for kid friendly, maybe 400-900.
    const time = randomTime(400, 900);
    const hole = randomHole(holes);
    
    // Prevent popping a hole that is already up
    if (hole.classList.contains('up')) {
        if (!timeUp) return peep();
    }
    
    hole.classList.add('up');
    
    // Reset the mole appearance
    const mole = hole.querySelector('.mole');
    mole.classList.remove('whacked');
    
    setTimeout(() => {
        hole.classList.remove('up');
        if (!timeUp) {
            peep();
            // Occasionally trigger a double peep to make it exciting
            if (Math.random() > 0.7) {
                setTimeout(peep, 200);
            }
        }
    }, time);
}

function startGame() {
    scoreBoard.innerText = 0;
    timeBoard.innerText = timeLimit;
    timeUp = false;
    score = 0;
    startBtn.disabled = true;
    
    // Ensure all moles are down
    holes.forEach(hole => hole.classList.remove('up'));
    
    let timeLeft = timeLimit;
    
    countdownTimer = setInterval(() => {
        timeLeft--;
        timeBoard.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            endGame();
        }
    }, 1000);
    
    peep();
}

function endGame() {
    timeUp = true;
    startBtn.disabled = false;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('whackHighScore', highScore);
        highScoreEl.innerText = highScore;
    }
    
    finalScoreEl.innerText = score;
    modal.style.display = 'flex';
}

function whack(e) {
    if (!e.isTrusted) return; // Prevent programmatic fake clicks
    
    const mole = e.target;
    const hole = mole.parentNode;
    
    // If it's already whacked or not up, ignore
    if (!hole.classList.contains('up') || mole.classList.contains('whacked')) return;
    
    score++;
    scoreBoard.innerText = score;
    
    // Visual feedback
    mole.classList.add('whacked');
    
    // Retract mole quickly
    setTimeout(() => {
        hole.classList.remove('up');
    }, 100);
}

holes.forEach(hole => {
    const mole = hole.querySelector('.mole');
    
    // Use pointerdown to respond instantly on mobile (avoids 300ms tap delay) and desktop
    mole.addEventListener('pointerdown', (e) => {
        e.preventDefault(); // Stop double-tap zoom
        whack(e);
    });
});

startBtn.addEventListener('click', startGame);

playAgainBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    startGame();
});
