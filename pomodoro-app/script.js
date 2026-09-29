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
let targetSessions = 1;
let currentSession = 1;
let timeLeft = workMinutes * 60;
let isRunning = false;
let isWorkMode = true;
let timerId = null;

let quoteHistory = [];
let currentQuoteHistoryIndex = -1;
let quoteInterval = null;

let dynamicBackgrounds = [];
let currentBgIndex = 0;

// Daily stats
let dailyStats = JSON.parse(localStorage.getItem('pomodoroStats')) || { date: '', count: 0 };
const todayDate = new Date().toDateString();
if (dailyStats.date !== todayDate) {
    dailyStats = { date: todayDate, count: 0 };
    localStorage.setItem('pomodoroStats', JSON.stringify(dailyStats));
}

const timeDisplay = document.getElementById('time-display');
const modeText = document.getElementById('mode-text');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const workVal = document.getElementById('work-val');
const restVal = document.getElementById('rest-val');
const sessionVal = document.getElementById('session-val');
const dailySessionsVal = document.getElementById('daily-sessions-val');
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

const fullscreenBtn = document.getElementById('fullscreen-btn');
fullscreenBtn.onclick = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
};

let lastTap = 0;
let lastToggle = 0;
function handleZenModeToggle(e) {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('button')) return;
    const now = Date.now();
    if (now - lastToggle < 300) return; // Prevent double-fire
    lastToggle = now;
    document.body.classList.toggle('zen-mode');
}

document.body.addEventListener('dblclick', handleZenModeToggle);

document.body.addEventListener('touchend', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('button')) return;
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    if (tapLength < 500 && tapLength > 0) {
        handleZenModeToggle(e);
        e.preventDefault();
    }
    lastTap = currentTime;
});

// Wake Lock API for keeping screen on
let wakeLock = null;

async function requestWakeLock() {
    if ('wakeLock' in navigator) {
        try {
            wakeLock = await navigator.wakeLock.request('screen');
        } catch (err) {
            console.log(`Wake Lock error: ${err.message}`);
        }
    }
}

function releaseWakeLock() {
    if (wakeLock !== null) {
        wakeLock.release();
        wakeLock = null;
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && isRunning) {
        requestWakeLock();
    }
});

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
    requestWakeLock();
    
    timerId = setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(timerId);
            isRunning = false;
            
            if (isWorkMode) {
                // Switching to Rest Mode
                isWorkMode = false;
                timeLeft = restMinutes * 60;
                modeText.innerText = `Rest Time (Round ${currentSession}/${targetSessions})`;
                nextQuote();
                nextBackground();
                startTimer();
                updateDisplay();
            } else {
                // Finished a complete round (Work + Rest)
                dailyStats.count++;
                localStorage.setItem('pomodoroStats', JSON.stringify(dailyStats));
                
                currentSession++;
                if (currentSession <= targetSessions) {
                    isWorkMode = true;
                    timeLeft = workMinutes * 60;
                    modeText.innerText = `Work Session (Round ${currentSession}/${targetSessions})`;
                    nextQuote();
                    nextBackground();
                    startTimer();
                    updateDisplay();
                } else {
                    // Target reached, stop completely
                    modeText.innerText = "All Rounds Complete! 🎉";
                    isWorkMode = true;
                    currentSession = 1;
                    timeLeft = workMinutes * 60;
                    startBtn.style.display = 'block';
                    pauseBtn.style.display = 'none';
                    releaseWakeLock();
                    updateDisplay();
                }
            }
        } else {
            updateDisplay();
        }
    }, 1000);
}

function updateDisplay() {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timeDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    dailySessionsVal.innerText = dailyStats.count;
    
    // Optional: only show round info if target is > 1
    if (isRunning || timeLeft > 0) {
        // Just maintain current mode text set by resetTimer or startTimer
    }
}

function pauseTimer() {
    isRunning = false;
    clearInterval(timerId);
    startBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
    releaseWakeLock();
}

function resetTimer() {
    pauseTimer();
    isWorkMode = true;
    currentSession = 1;
    modeText.innerText = targetSessions > 1 ? `Work Session (Round 1/${targetSessions})` : "Work Session";
    timeLeft = workMinutes * 60;
    updateDisplay();
    displayQuoteFromHistory();
    updateBackground();
}

// Stepper logic
function adjustSetting(type, amount) {
    if (isRunning) return;
    
    if (type === 'work') {
        workMinutes = Math.max(1, workMinutes + amount);
        workVal.innerText = workMinutes;
        if (isWorkMode) {
            timeLeft = workMinutes * 60;
            updateDisplay();
        }
    } else if (type === 'rest') {
        restMinutes = Math.max(1, restMinutes + amount);
        restVal.innerText = restMinutes;
        if (!isWorkMode) {
            timeLeft = restMinutes * 60;
            updateDisplay();
        }
    } else if (type === 'session') {
        targetSessions = Math.max(1, targetSessions + amount);
        sessionVal.innerText = targetSessions;
        if (!isRunning) {
            modeText.innerText = targetSessions > 1 ? `Work Session (Round 1/${targetSessions})` : "Work Session";
        }
    }
}

document.getElementById('work-minus').onclick = () => adjustSetting('work', -5);
document.getElementById('work-plus').onclick = () => adjustSetting('work', 5);
document.getElementById('rest-minus').onclick = () => adjustSetting('rest', -1);
document.getElementById('rest-plus').onclick = () => adjustSetting('rest', 1);
document.getElementById('session-minus').onclick = () => adjustSetting('session', -1);
document.getElementById('session-plus').onclick = () => adjustSetting('session', 1);

startBtn.onclick = startTimer;
pauseBtn.onclick = pauseTimer;
resetBtn.onclick = resetTimer;

// Init
updateDisplay();
nextQuote(); // Fetches first quote
fetchBackgrounds(); // Fetches dynamic backgrounds
resetQuoteTimer();

// Prayer Time Logic
let prayerTimes = null;
let userLocationStr = null;
const prayerTimerEl = document.getElementById('prayer-timer');

async function getCoordinatesAndLocation() {
    try {
        const ipRes = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const ipData = await ipRes.json();
        return { 
            latitude: ipData.latitude, 
            longitude: ipData.longitude,
            city: ipData.city,
            country: ipData.country
        };
    } catch (e) {
        return null;
    }
}

async function fetchPrayerTimes() {
    try {
        const locData = await getCoordinatesAndLocation();
        if (!locData) return;
        const { latitude, longitude, city, country } = locData;
        
        if (city && country) {
            userLocationStr = `${city}, ${country}`;
        }
        
        const prayerRes = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
        const prayerData = await prayerRes.json();
        
        const timings = prayerData.data.timings;
        prayerTimes = {
            Fajr: timings.Fajr,
            Dhuhr: timings.Dhuhr,
            Asr: timings.Asr,
            Maghrib: timings.Maghrib,
            Isha: timings.Isha
        };
        updatePrayerTimer();
        setInterval(updatePrayerTimer, 60000);
    } catch (err) {
        console.log("Error fetching prayer times:", err);
    }
}

function updatePrayerTimer() {
    if (!prayerTimes) return;
    
    const now = new Date();
    const currentMs = now.getTime();
    
    let nextPrayerName = null;
    let nextPrayerMs = Infinity;
    
    for (const [name, timeStr] of Object.entries(prayerTimes)) {
        const [hours, mins] = timeStr.split(':');
        const prayerDate = new Date();
        prayerDate.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
        
        let prayerMs = prayerDate.getTime();
        
        if (prayerMs > currentMs && prayerMs < nextPrayerMs) {
            nextPrayerMs = prayerMs;
            nextPrayerName = name;
        }
    }
    
    if (!nextPrayerName) {
        nextPrayerName = 'Fajr';
        const [hours, mins] = prayerTimes.Fajr.split(':');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(parseInt(hours, 10), parseInt(mins, 10), 0, 0);
        nextPrayerMs = tomorrow.getTime();
    }
    
    const diffMs = nextPrayerMs - currentMs;
    const diffMins = Math.ceil(diffMs / 1000 / 60);
    
    let locationHtml = userLocationStr ? `<div style="font-weight: 600; font-size: 15px; margin-bottom: 2px;">${userLocationStr}</div>` : '';
    
    if (diffMins > 60) {
        const h = Math.floor(diffMins / 60);
        const m = diffMins % 60;
        prayerTimerEl.innerHTML = `${locationHtml}${h}h ${m}m to ${nextPrayerName} Prayer`;
    } else {
        prayerTimerEl.innerHTML = `${locationHtml}${diffMins} mins to ${nextPrayerName} Prayer`;
    }
}

fetchPrayerTimes();
