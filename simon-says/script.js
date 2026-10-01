const pads = [
    document.getElementById('pad-0'),
    document.getElementById('pad-1'),
    document.getElementById('pad-2'),
    document.getElementById('pad-3')
];
const startBtn = document.getElementById('start-btn');
const statusText = document.getElementById('status-text');
const scoreEl = document.getElementById('score');

let sequence = [];
let playerIndex = 0;
let isPlayerTurn = false;
let score = 0;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const frequencies = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5

function playTone(index, duration = 0.4) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequencies[index], t);
    
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(t);
    osc.stop(t + duration);
}

function playWrongTone() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.5);
    
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    
    osc.start(t);
    osc.stop(t + 0.5);
}

function flashPad(index, duration = 400) {
    return new Promise(resolve => {
        pads[index].classList.add('active');
        playTone(index, duration / 1000);
        setTimeout(() => {
            pads[index].classList.remove('active');
            setTimeout(resolve, 100); // small gap
        }, duration);
    });
}

async function playSequence() {
    isPlayerTurn = false;
    statusText.innerText = "Watch...";
    
    for (let i = 0; i < sequence.length; i++) {
        await flashPad(sequence[i], 400 - (sequence.length * 10)); // speed up slightly
    }
    
    isPlayerTurn = true;
    playerIndex = 0;
    statusText.innerText = "Your Turn!";
}

function nextRound() {
    sequence.push(Math.floor(Math.random() * 4));
    score = sequence.length - 1;
    scoreEl.innerText = score;
    setTimeout(playSequence, 1000);
}

pads.forEach(pad => {
    // pointerdown for immediate feedback
    pad.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (!isPlayerTurn) return;
        
        const idx = parseInt(pad.getAttribute('data-index'));
        
        if (sequence[playerIndex] === idx) {
            flashPad(idx, 200);
            playerIndex++;
            
            if (playerIndex === sequence.length) {
                isPlayerTurn = false;
                statusText.innerText = "Correct!";
                nextRound();
            }
        } else {
            isPlayerTurn = false;
            playWrongTone();
            pad.classList.add('active');
            setTimeout(() => pad.classList.remove('active'), 500);
            statusText.innerText = "Game Over! Press Start to try again.";
            startBtn.style.display = 'block';
        }
    });
});

startBtn.addEventListener('click', () => {
    sequence = [];
    score = 0;
    scoreEl.innerText = score;
    startBtn.style.display = 'none';
    if (audioCtx.state === 'suspended') audioCtx.resume();
    nextRound();
});
