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
    { url: 'https://images.unsplash.com/photo-1506744626753-eba7bc81591e?auto=format&fit=crop&w=1920&q=80', location: 'Yosemite National Park, USA', photographer: 'Bailey Zindel' },
    { url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80', location: 'Mount Robson, Canada', photographer: 'David Marcu' },
    { url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1920&q=80', location: 'Mount Tamalpais, USA', photographer: 'Tim Swaan' },
    { url: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1920&q=80', location: 'Great Smoky Mountains, USA', photographer: 'Sergey Shmidt' },
    { url: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1920&q=80', location: 'Yosemite Valley, USA', photographer: 'Carmine De Fazio' }
];

let workMinutes = 15;
let restMinutes = 5;
let timeLeft = workMinutes * 60;
let isRunning = false;
let isWorkMode = true;
let timerId = null;

let currentQuoteIndex = Math.floor(Math.random() * quotes.length);
let quoteInterval = null;

let currentBgIndex = Math.floor(Math.random() * backgrounds.length);

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
const bgLocation = document.getElementById('bg-location');
const bgPhotographer = document.getElementById('bg-photographer');
const prevBgBtn = document.getElementById('prev-bg');
const nextBgBtn = document.getElementById('next-bg');
const opacitySlider = document.getElementById('opacity-slider');
const timerCard = document.querySelector('.timer-card');
const overlay = document.querySelector('.overlay');

opacitySlider.addEventListener('input', (e) => {
    const val = e.target.value; // 0 to 100
    const alpha = (val / 100) * 0.15;
    const blur = (val / 100) * 10;
    const shadow = (val / 100) * 0.3;
    const border = (val / 100) * 0.2;
    const overlayAlpha = (val / 100) * 0.4;
    
    timerCard.style.setProperty('--card-opacity', alpha);
    timerCard.style.setProperty('--card-blur', `${blur}px`);
    timerCard.style.setProperty('--card-shadow', shadow);
    timerCard.style.setProperty('--card-border', border);
    overlay.style.setProperty('--overlay-opacity', overlayAlpha);
});

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
    const bg = backgrounds[currentBgIndex];
    document.body.style.backgroundImage = `url('${bg.url}')`;
    bgLocation.innerText = bg.location;
    bgPhotographer.innerText = `Photo by ${bg.photographer}`;
}

function nextBackground() {
    currentBgIndex = (currentBgIndex + 1) % backgrounds.length;
    updateBackground();
}

function prevBackground() {
    currentBgIndex = (currentBgIndex - 1 + backgrounds.length) % backgrounds.length;
    updateBackground();
}

prevBgBtn.onclick = prevBackground;
nextBgBtn.onclick = nextBackground;

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
            nextBackground();
            
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
