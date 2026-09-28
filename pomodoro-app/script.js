// Quotes are loaded from quotes.js

const backgrounds = [
    { url: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80', location: 'Banff National Park, Canada', photographer: 'Qusai Akoud' },
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

let quoteHistory = [];
let currentQuoteHistoryIndex = -1;
let quoteInterval = null;

let dynamicBackgrounds = [];
let currentBgIndex = 0;

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
const explainQuoteBtn = document.getElementById('explain-quote');
const bgLocation = document.getElementById('bg-location');
const bgPhotographer = document.getElementById('bg-photographer');
const prevBgBtn = document.getElementById('prev-bg');
const nextBgBtn = document.getElementById('next-bg');
const opacitySlider = document.getElementById('opacity-slider');
const timerCard = document.querySelector('.timer-card');
const overlay = document.querySelector('.overlay');

opacitySlider.addEventListener('input', (e) => {
    const val = e.target.value; 
    timerCard.style.setProperty('--card-opacity', (val / 100) * 0.15);
    timerCard.style.setProperty('--card-blur', `${(val / 100) * 10}px`);
    timerCard.style.setProperty('--card-shadow', (val / 100) * 0.3);
    timerCard.style.setProperty('--card-border', (val / 100) * 0.2);
    overlay.style.setProperty('--overlay-opacity', (val / 100) * 0.4);
});

function updateDisplay() {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    timeDisplay.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function displayQuoteFromHistory() {
    const q = quoteHistory[currentQuoteHistoryIndex];
    if(q) {
        quoteText.innerText = `"${q.quote}"`;
        quoteAuthor.innerText = `- ${q.author}`;
    }
}

function nextQuote() {
    if (currentQuoteHistoryIndex < quoteHistory.length - 1) {
        currentQuoteHistoryIndex++;
        displayQuoteFromHistory();
    } else {
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        quoteHistory.push(q);
        currentQuoteHistoryIndex++;
        displayQuoteFromHistory();
    }
    resetQuoteTimer();
}

function prevQuote() {
    if (currentQuoteHistoryIndex > 0) {
        currentQuoteHistoryIndex--;
        displayQuoteFromHistory();
    }
    resetQuoteTimer();
}

function resetQuoteTimer() {
    if (quoteInterval) clearInterval(quoteInterval);
    quoteInterval = setInterval(nextQuote, 60000);
}

prevQuoteBtn.onclick = prevQuote;
nextQuoteBtn.onclick = nextQuote;

const explanationModal = document.getElementById('explanation-modal');
const closeModal = document.getElementById('close-modal');
const explanationText = document.getElementById('explanation-text');

explainQuoteBtn.onclick = () => {
    const q = quoteHistory[currentQuoteHistoryIndex];
    if (q && q.explanation) {
        explanationText.innerText = q.explanation;
        explanationModal.style.display = 'flex';
    }
};

closeModal.onclick = () => {
    explanationModal.style.display = 'none';
};

window.onclick = (e) => {
    if (e.target === explanationModal) {
        explanationModal.style.display = 'none';
    }
};

function fetchBackgrounds() {
    // Start with our curated list
    dynamicBackgrounds = [...backgrounds];
    
    fetch(`https://picsum.photos/v2/list?page=${Math.floor(Math.random() * 10) + 1}&limit=50`)
        .then(res => res.json())
        .then(data => {
            const apiBgs = data.map(item => ({
                url: `https://picsum.photos/id/${item.id}/1920/1080`,
                location: 'Global Photography',
                photographer: item.author
            }));
            
            // Mix them together and shuffle
            dynamicBackgrounds = [...backgrounds, ...apiBgs].sort(() => Math.random() - 0.5);
            updateBackground();
        });
}

function updateBackground() {
    if (dynamicBackgrounds.length > 0) {
        const bg = dynamicBackgrounds[currentBgIndex % dynamicBackgrounds.length];
        document.body.style.backgroundImage = `url('${bg.url}')`;
        bgLocation.innerText = bg.location;
        bgPhotographer.innerText = `Photo by ${bg.photographer}`;
    }
}

function nextBackground() {
    if (dynamicBackgrounds.length > 0) {
        currentBgIndex = (currentBgIndex + 1) % dynamicBackgrounds.length;
        updateBackground();
    }
}

function prevBackground() {
    if (dynamicBackgrounds.length > 0) {
        currentBgIndex = (currentBgIndex - 1 + dynamicBackgrounds.length) % dynamicBackgrounds.length;
        updateBackground();
    }
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
            nextQuote();
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
    displayQuoteFromHistory();
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
nextQuote(); // Fetches first quote
fetchBackgrounds(); // Fetches dynamic backgrounds
resetQuoteTimer();
