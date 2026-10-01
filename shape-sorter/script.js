const shapes = document.querySelectorAll('.shape');
const holes = document.querySelectorAll('.hole');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playDing() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); // A6
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.5);
}

let activeShape = null;
let startX = 0, startY = 0;

shapes.forEach(shape => {
    shape.dataset.tx = 0;
    shape.dataset.ty = 0;
    shape.addEventListener('mousedown', dragStart);
    shape.addEventListener('touchstart', dragStart, {passive: false});
});

document.addEventListener('mousemove', drag);
document.addEventListener('touchmove', drag, {passive: false});
document.addEventListener('mouseup', dragEnd);
document.addEventListener('touchend', dragEnd);

function dragStart(e) {
    if (e.target.classList.contains('snapped')) return;
    
    activeShape = e.target;
    
    if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    } else {
        startX = e.clientX;
        startY = e.clientY;
    }
    
    activeShape.style.zIndex = 100;
    activeShape.style.transition = 'none';
}

function drag(e) {
    if (!activeShape) return;
    e.preventDefault();
    
    let currentX, currentY;
    if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX;
        currentY = e.touches[0].clientY;
    } else {
        currentX = e.clientX;
        currentY = e.clientY;
    }
    
    const dx = currentX - startX;
    const dy = currentY - startY;
    
    const newTx = parseFloat(activeShape.dataset.tx) + dx;
    const newTy = parseFloat(activeShape.dataset.ty) + dy;
    
    activeShape.style.transform = `translate(${newTx}px, ${newTy}px)`;
}

function dragEnd(e) {
    if (!activeShape) return;
    
    let currentX, currentY;
    if (e.type === 'touchend') {
        currentX = e.changedTouches[0].clientX;
        currentY = e.changedTouches[0].clientY;
    } else {
        currentX = e.clientX;
        currentY = e.clientY;
    }
    
    const dx = currentX - startX;
    const dy = currentY - startY;
    
    activeShape.dataset.tx = parseFloat(activeShape.dataset.tx) + dx;
    activeShape.dataset.ty = parseFloat(activeShape.dataset.ty) + dy;
    
    activeShape.style.zIndex = 10;
    
    const shapeRect = activeShape.getBoundingClientRect();
    const shapeType = activeShape.dataset.shape;
    let snapped = false;
    
    holes.forEach(hole => {
        if (hole.dataset.shape === shapeType) {
            const holeRect = hole.getBoundingClientRect();
            
            // Calculate distance between centers
            const dist = Math.hypot(
                (shapeRect.left + shapeRect.width/2) - (holeRect.left + holeRect.width/2),
                (shapeRect.top + shapeRect.height/2) - (holeRect.top + holeRect.height/2)
            );
            
            if (dist < 60) {
                snapped = true;
                const snapDx = (holeRect.left + holeRect.width/2) - (shapeRect.left + shapeRect.width/2);
                const snapDy = (holeRect.top + holeRect.height/2) - (shapeRect.top + shapeRect.height/2);
                
                activeShape.dataset.tx = parseFloat(activeShape.dataset.tx) + snapDx;
                activeShape.dataset.ty = parseFloat(activeShape.dataset.ty) + snapDy;
                
                activeShape.style.transition = 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                activeShape.style.transform = `translate(${activeShape.dataset.tx}px, ${activeShape.dataset.ty}px)`;
                activeShape.classList.add('snapped');
                
                playDing();
            }
        }
    });
    
    if (!snapped) {
        activeShape.dataset.tx = 0;
        activeShape.dataset.ty = 0;
        activeShape.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        activeShape.style.transform = `translate(0px, 0px)`;
    }
    
    activeShape = null;
}
