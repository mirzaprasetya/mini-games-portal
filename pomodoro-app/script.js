const quotes = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.", author: "Stephen King" },
    { text: "Starve your distractions, feed your focus.", author: "Unknown" },
    { text: "Nothing is less productive than to make more efficient what should not be done at all.", author: "Peter Drucker" }
];

const backgrounds = [
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'
];

let workMinutes = 15;
let restMinutes = 5;
let timeLeft = workMinutes * 60;
let isRunning = false;
let isWorkMode = true;
let timerId = null;

let currentQuoteIndex = Math.floor(Math.random() * quotes.length);
let quoteInterval = null;

const timeDisplay = document.getElementById('time-display');
const modeText = document.getElementById('mode-text');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const workVal = document.getElementById('work-val');
const restVal = document.getElementById('rest-val');
const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');
const prevQuoteBtn = document.getElementById('prev-quote');
const nextQuoteBtn = document.getElementById('next-quote');

function updateDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timeDisplay.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function updateQuote() {
    const q = quotes[currentQuoteIndex];
    quoteText.innerText = `"${q.text}"`;
    quoteAuthor.innerText = `- ${q.author}`;
}

function nextQuote() {
    currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
    updateQuote();
    resetQuoteTimer();
}

function prevQuote() {
    currentQuoteIndex = (currentQuoteIndex - 1 + quotes.length) % quotes.length;
    updateQuote();
    resetQuoteTimer();
}

function resetQuoteTimer() {
    if (quoteInterval) clearInterval(quoteInterval);
    quoteInterval = setInterval(nextQuote, 60000);
}

prevQuoteBtn.onclick = prevQuote;
nextQuoteBtn.onclick = nextQuote;

function updateBackground() {
    const bg = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    document.body.style.backgroundImage = `url('${bg}')`;
}

function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startBtn.style.display = 'none';
    pauseBtn.style.display = 'block';
    
    timerId = setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(timerId);
            isRunning = false;
            // Switch modes
            isWorkMode = !isWorkMode;
            timeLeft = (isWorkMode ? workMinutes : restMinutes) * 60;
            modeText.innerText = isWorkMode ? "Work Session" : "Rest Time";
            updateQuote();
            updateBackground();
            
            // Auto start next session
            startTimer();
        } else {
            updateDisplay();
        }
    }, 1000);
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerId);
    startBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
}

function resetTimer() {
    pauseTimer();
    isWorkMode = true;
    modeText.innerText = "Work Session";
    timeLeft = workMinutes * 60;
    updateDisplay();
    updateQuote();
    updateBackground();
}

// Stepper logic
function adjustSetting(type, amount) {
    if (isRunning) return;
    
    if (type === 'work') {
        workMinutes = Math.max(5, workMinutes + amount);
        workVal.innerText = workMinutes;
        if (isWorkMode) {
            timeLeft = workMinutes * 60;
            updateDisplay();
        }
    } else {
        restMinutes = Math.max(5, restMinutes + amount);
        restVal.innerText = restMinutes;
        if (!isWorkMode) {
            timeLeft = restMinutes * 60;
            updateDisplay();
        }
    }
}

document.getElementById('work-minus').onclick = () => adjustSetting('work', -5);
document.getElementById('work-plus').onclick = () => adjustSetting('work', 5);
document.getElementById('rest-minus').onclick = () => adjustSetting('rest', -5);
document.getElementById('rest-plus').onclick = () => adjustSetting('rest', 5);

startBtn.onclick = startTimer;
pauseBtn.onclick = pauseTimer;
resetBtn.onclick = resetTimer;

// Init
updateDisplay();
updateQuote();
updateBackground();
resetQuoteTimer();
