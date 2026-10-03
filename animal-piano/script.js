const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const synthTypeSelect = document.getElementById('synth-type');
const songSelect = document.getElementById('song-select');
const playSongBtn = document.getElementById('play-song-btn');
const keys = document.querySelectorAll('.key');

// Store active oscillators for multi-touch
const activeOscillators = new Map();
let isPlayingSong = false;
let songTimeout = null;

function playTone(frequency, keyElement) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const type = synthTypeSelect.value;
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = parseFloat(frequency);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Simple envelope to avoid clicks
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);

    oscillator.start();

    // Store the node so we can stop it later
    activeOscillators.set(keyElement, { oscillator, gainNode });
    keyElement.classList.add('active');
}

function stopTone(keyElement) {
    const nodes = activeOscillators.get(keyElement);
    if (nodes) {
        const { oscillator, gainNode } = nodes;
        
        // Release envelope
        gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        oscillator.stop(audioCtx.currentTime + 0.1);
        activeOscillators.delete(keyElement);
        keyElement.classList.remove('active');
    }
}

// Event Listeners for Multi-touch and Mouse
keys.forEach(key => {
    key.addEventListener('mousedown', (e) => {
        if(isPlayingSong) stopAutoplay();
        playTone(e.target.dataset.note, e.target);
    });
    
    key.addEventListener('mouseup', (e) => stopTone(e.target));
    key.addEventListener('mouseleave', (e) => stopTone(e.target));

    key.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        if(isPlayingSong) stopAutoplay();
        playTone(e.target.dataset.note, e.target);
    });
    
    key.addEventListener('touchend', (e) => {
        e.preventDefault();
        stopTone(e.target);
    });
    
    key.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        stopTone(e.target);
    });
});

// Autoplay Songs
// Multiplier to slow down the songs
const tempoMultiplier = 1.5; 

const songs = {
    twinkle: [
        { note: 'c4', d: 400 }, { note: 'c4', d: 400 }, { note: 'g4', d: 400 }, { note: 'g4', d: 400 },
        { note: 'a4', d: 400 }, { note: 'a4', d: 400 }, { note: 'g4', d: 800 },
        { note: 'f4', d: 400 }, { note: 'f4', d: 400 }, { note: 'e4', d: 400 }, { note: 'e4', d: 400 },
        { note: 'd4', d: 400 }, { note: 'd4', d: 400 }, { note: 'c4', d: 800 },
        { note: 'g4', d: 400 }, { note: 'g4', d: 400 }, { note: 'f4', d: 400 }, { note: 'f4', d: 400 },
        { note: 'e4', d: 400 }, { note: 'e4', d: 400 }, { note: 'd4', d: 800 },
        { note: 'g4', d: 400 }, { note: 'g4', d: 400 }, { note: 'f4', d: 400 }, { note: 'f4', d: 400 },
        { note: 'e4', d: 400 }, { note: 'e4', d: 400 }, { note: 'd4', d: 800 },
        { note: 'c4', d: 400 }, { note: 'c4', d: 400 }, { note: 'g4', d: 400 }, { note: 'g4', d: 400 },
        { note: 'a4', d: 400 }, { note: 'a4', d: 400 }, { note: 'g4', d: 800 },
        { note: 'f4', d: 400 }, { note: 'f4', d: 400 }, { note: 'e4', d: 400 }, { note: 'e4', d: 400 },
        { note: 'd4', d: 400 }, { note: 'd4', d: 400 }, { note: 'c4', d: 800 }
    ],
    mary: [
        { note: 'e4', d: 400 }, { note: 'd4', d: 400 }, { note: 'c4', d: 400 }, { note: 'd4', d: 400 },
        { note: 'e4', d: 400 }, { note: 'e4', d: 400 }, { note: 'e4', d: 800 },
        { note: 'd4', d: 400 }, { note: 'd4', d: 400 }, { note: 'd4', d: 800 },
        { note: 'e4', d: 400 }, { note: 'g4', d: 400 }, { note: 'g4', d: 800 },
        { note: 'e4', d: 400 }, { note: 'd4', d: 400 }, { note: 'c4', d: 400 }, { note: 'd4', d: 400 },
        { note: 'e4', d: 400 }, { note: 'e4', d: 400 }, { note: 'e4', d: 400 }, { note: 'e4', d: 400 },
        { note: 'd4', d: 400 }, { note: 'd4', d: 400 }, { note: 'e4', d: 400 }, { note: 'd4', d: 400 },
        { note: 'c4', d: 1600 }
    ],
    shark: [
        { note: 'd4', d: 400 }, { note: 'e4', d: 400 },
        { note: 'g4', d: 250 }, { note: 'g4', d: 250 }, { note: 'g4', d: 250 }, { note: 'g4', d: 250 },
        { note: 'g4', d: 250 }, { note: 'g4', d: 250 }, { note: 'g4', d: 400 }, { note: 'rest', d: 200 },
        { note: 'd4', d: 400 }, { note: 'e4', d: 400 },
        { note: 'g4', d: 250 }, { note: 'g4', d: 250 }, { note: 'g4', d: 250 }, { note: 'g4', d: 250 },
        { note: 'g4', d: 250 }, { note: 'g4', d: 250 }, { note: 'g4', d: 400 }, { note: 'rest', d: 200 },
        { note: 'd4', d: 400 }, { note: 'e4', d: 400 },
        { note: 'g4', d: 250 }, { note: 'g4', d: 250 }, { note: 'g4', d: 250 }, { note: 'g4', d: 250 },
        { note: 'g4', d: 250 }, { note: 'g4', d: 250 }, { note: 'g4', d: 400 }, { note: 'rest', d: 200 },
        { note: 'g4', d: 400 }, { note: 'g4', d: 400 }, { note: 'f4', d: 1200 }
    ],
    jingle: [
        { note: 'e4', d: 400 }, { note: 'e4', d: 400 }, { note: 'e4', d: 800 },
        { note: 'e4', d: 400 }, { note: 'e4', d: 400 }, { note: 'e4', d: 800 },
        { note: 'e4', d: 400 }, { note: 'g4', d: 400 }, { note: 'c4', d: 600 }, { note: 'd4', d: 200 },
        { note: 'e4', d: 1600 },
        { note: 'f4', d: 400 }, { note: 'f4', d: 400 }, { note: 'f4', d: 600 }, { note: 'f4', d: 200 },
        { note: 'f4', d: 400 }, { note: 'e4', d: 400 }, { note: 'e4', d: 400 }, { note: 'e4', d: 200 }, { note: 'e4', d: 200 },
        { note: 'e4', d: 400 }, { note: 'd4', d: 400 }, { note: 'd4', d: 400 }, { note: 'e4', d: 400 },
        { note: 'd4', d: 800 }, { note: 'g4', d: 800 }
    ],
    mcdonald: [
        { note: 'g4', d: 400 }, { note: 'g4', d: 400 }, { note: 'g4', d: 400 }, { note: 'd4', d: 400 },
        { note: 'e4', d: 400 }, { note: 'e4', d: 400 }, { note: 'd4', d: 800 },
        { note: 'b4', d: 400 }, { note: 'b4', d: 400 }, { note: 'a4', d: 400 }, { note: 'a4', d: 400 },
        { note: 'g4', d: 1200 }, { note: 'rest', d: 400 },
        { note: 'd4', d: 200 }, { note: 'd4', d: 200 },
        { note: 'g4', d: 400 }, { note: 'g4', d: 400 }, { note: 'g4', d: 400 }, { note: 'd4', d: 400 },
        { note: 'e4', d: 400 }, { note: 'e4', d: 400 }, { note: 'd4', d: 800 },
        { note: 'b4', d: 400 }, { note: 'b4', d: 400 }, { note: 'a4', d: 400 }, { note: 'a4', d: 400 },
        { note: 'g4', d: 1200 }
    ]
};

function playNoteSequence(sequence, index) {
    if (!isPlayingSong || index >= sequence.length) {
        isPlayingSong = false;
        playSongBtn.innerText = "Play!";
        return;
    }

    let { note, d } = sequence[index];
    d = d * tempoMultiplier; // Slow down the song here
    
    if (note === 'rest') {
        songTimeout = setTimeout(() => playNoteSequence(sequence, index + 1), d);
        return;
    }

    const keyElement = document.getElementById(`key-${note}`);
    if (keyElement) {
        playTone(keyElement.dataset.note, keyElement);
        
        // Stop note slightly before next note starts to create articulation
        setTimeout(() => stopTone(keyElement), d - 50);
    }

    songTimeout = setTimeout(() => playNoteSequence(sequence, index + 1), d);
}

function stopAutoplay() {
    isPlayingSong = false;
    clearTimeout(songTimeout);
    playSongBtn.innerText = "Play!";
    keys.forEach(k => stopTone(k));
}

playSongBtn.addEventListener('click', () => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (isPlayingSong) {
        stopAutoplay();
        return;
    }

    const selectedSong = songSelect.value;
    if (!selectedSong) return;

    isPlayingSong = true;
    playSongBtn.innerText = "Stop";
    playNoteSequence(songs[selectedSong], 0);
});
