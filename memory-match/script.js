const grid = document.getElementById('grid');
const movesEl = document.getElementById('moves');
const modal = document.getElementById('game-over-modal');
const finalMovesEl = document.getElementById('final-moves');
const playAgainBtn = document.getElementById('play-again-btn');

const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];
let cards = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let isLocked = false;

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    if (type === 'flip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
    } else if (type === 'match') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.setValueAtTime(800, t + 0.1);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.start(t); osc.stop(t + 0.3);
    } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.setValueAtTime(600, t + 0.1);
        osc.frequency.setValueAtTime(800, t + 0.2);
        gain.gain.setValueAtTime(0.5, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.start(t); osc.stop(t + 0.5);
    }
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
}

function initGame() {
    grid.innerHTML = '';
    cards = [...emojis, ...emojis].sort(() => Math.random() - 0.5);
    flippedCards = [];
    matchedPairs = 0;
    moves = 0;
    movesEl.innerText = moves;
    isLocked = false;
    modal.style.display = 'none';

    cards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.dataset.emoji = emoji;
        card.dataset.index = index;
        
        card.innerHTML = `
            <div class="card-face card-front">${emoji}</div>
            <div class="card-face card-back"></div>
        `;
        
        card.addEventListener('click', () => flipCard(card));
        grid.appendChild(card);
    });
}

function flipCard(card) {
    if (isLocked || card.classList.contains('flipped')) return;
    
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    card.classList.add('flipped');
    flippedCards.push(card);
    playSound('flip');
    
    if (flippedCards.length === 2) {
        moves++;
        movesEl.innerText = moves;
        checkMatch();
    }
}

function checkMatch() {
    isLocked = true;
    const [card1, card2] = flippedCards;
    
    if (card1.dataset.emoji === card2.dataset.emoji) {
        matchedPairs++;
        playSound('match');
        flippedCards = [];
        isLocked = false;
        
        if (matchedPairs === emojis.length) {
            setTimeout(() => {
                playSound('win');
                finalMovesEl.innerText = moves;
                modal.style.display = 'flex';
            }, 500);
        }
    } else {
        setTimeout(() => {
            card1.classList.remove('flipped');
            card2.classList.remove('flipped');
            flippedCards = [];
            isLocked = false;
        }, 1000);
    }
}

playAgainBtn.addEventListener('click', initGame);

initGame();
