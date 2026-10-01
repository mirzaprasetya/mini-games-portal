const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const synthTypeSelect = document.getElementById('synth-type');
const keys = document.querySelectorAll('.key');

// Store active oscillators for multi-touch
const activeOscillators = new Map();

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
    // Mouse
    key.addEventListener('mousedown', (e) => {
        playTone(e.target.dataset.note, e.target);
    });
    
    key.addEventListener('mouseup', (e) => {
        stopTone(e.target);
    });
    
    key.addEventListener('mouseleave', (e) => {
        stopTone(e.target);
    });

    // Touch
    key.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scrolling/zooming
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
