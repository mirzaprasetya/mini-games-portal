const WORD_LIST = {
    'ANIMALS': ['DOG', 'CAT', 'BIRD', 'FISH', 'BEAR', 'FROG', 'MONKEY', 'LION', 'TIGER', 'ELEPHANT', 'ZEBRA', 'HORSE', 'MOUSE', 'RABBIT', 'SNAKE'],
    'COLORS': ['RED', 'BLUE', 'YELLOW', 'GREEN', 'ORANGE', 'PURPLE', 'BLACK', 'WHITE', 'BROWN', 'PINK'],
    'FOOD': ['APPLE', 'BANANA', 'MILK', 'WATER', 'JUICE', 'BREAD', 'CHEESE', 'EGG', 'MEAT', 'PIZZA', 'BURGER', 'COOKIE', 'CANDY'],
    'SPACE': ['MOON', 'SUN', 'STAR', 'EARTH', 'ROCKET', 'PLANET', 'ALIEN', 'COMET', 'GALAXY']
};

const MAX_MISTAKES = 8;
let currentWord = '';
let currentCategory = '';
let guessedLetters = new Set();
let mistakes = 0;

const wordCategoryEl = document.getElementById('word-category');
const wordDisplayEl = document.getElementById('word-display');
const keyboardEl = document.getElementById('keyboard');
const guessesLeftEl = document.getElementById('guesses-left');
const gameOverModal = document.getElementById('game-over-modal');
const modalTitle = document.getElementById('modal-title');
const modalMessage = document.getElementById('modal-message');
const revealWordEl = document.getElementById('reveal-word');
const nextBtn = document.getElementById('next-btn');

function initGame() {
    guessedLetters.clear();
    mistakes = 0;
    
    // Pick random category and word
    const categories = Object.keys(WORD_LIST);
    currentCategory = categories[Math.floor(Math.random() * categories.length)];
    const words = WORD_LIST[currentCategory];
    currentWord = words[Math.floor(Math.random() * words.length)];
    
    wordCategoryEl.innerText = `Category: ${currentCategory}`;
    updateDrawing();
    renderWord();
    renderKeyboard();
    gameOverModal.style.display = 'none';
}

function updateDrawing() {
    guessesLeftEl.innerText = `Oxygen: ${MAX_MISTAKES - mistakes}/${MAX_MISTAKES}`;
    
    for (let i = 1; i <= MAX_MISTAKES; i++) {
        const part = document.getElementById(`part-${i}`);
        if (part) {
            if (i <= mistakes) {
                part.classList.add('show-part');
            } else {
                part.classList.remove('show-part');
            }
        }
    }
}

function renderWord() {
    wordDisplayEl.innerHTML = '';
    currentWord.split('').forEach(letter => {
        const letterBox = document.createElement('div');
        letterBox.classList.add('letter-box');
        letterBox.innerText = guessedLetters.has(letter) ? letter : '';
        wordDisplayEl.appendChild(letterBox);
    });
}

function renderKeyboard() {
    keyboardEl.innerHTML = '';
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    letters.forEach(letter => {
        const btn = document.createElement('button');
        btn.classList.add('key');
        btn.innerText = letter;
        
        if (guessedLetters.has(letter)) {
            btn.disabled = true;
            if (currentWord.includes(letter)) {
                btn.classList.add('correct');
            } else {
                btn.classList.add('wrong');
            }
        }
        
        btn.addEventListener('click', () => handleGuess(letter));
        keyboardEl.appendChild(btn);
    });
}

// Audio setup
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
        
        gainNode.gain.setValueAtTime(0.5, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.15);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(80, t + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, t);
        gainNode.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.25);
    }
}

function handleGuess(letter) {
    if (guessedLetters.has(letter) || mistakes >= MAX_MISTAKES) return;
    
    guessedLetters.add(letter);
    
    if (!currentWord.includes(letter)) {
        mistakes++;
        updateDrawing();
        playSound('wrong');
    } else {
        playSound('correct');
    }
    
    renderWord();
    renderKeyboard();
    checkGameOver();
}

function checkGameOver() {
    const isWon = currentWord.split('').every(letter => guessedLetters.has(letter));
    
    if (isWon) {
        showModal(true);
    } else if (mistakes >= MAX_MISTAKES) {
        showModal(false);
    }
}

function showModal(isWon) {
    if (isWon) {
        modalTitle.innerText = "Mission Complete! 🎉";
        modalTitle.style.color = "#2ecc71";
        modalMessage.innerText = "You guessed the word and saved the mission!";
    } else {
        modalTitle.innerText = "Oh no! 💥";
        modalTitle.style.color = "#e74c3c";
        modalMessage.innerText = "You ran out of oxygen!";
    }
    revealWordEl.innerText = currentWord;
    gameOverModal.style.display = 'flex';
}

nextBtn.addEventListener('click', initGame);

// Add physical keyboard support
window.addEventListener('keydown', (e) => {
    if (gameOverModal.style.display === 'flex') {
        if (e.key === 'Enter' || e.key === ' ') {
            initGame();
        }
        return;
    }
    
    const key = e.key.toUpperCase();
    if (/^[A-Z]$/.test(key)) {
        handleGuess(key);
    }
});

// Setup
initGame();
