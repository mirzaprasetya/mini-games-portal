const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const palette = document.getElementById('palette');

const colors = ['#FF5733', '#FFC300', '#DAF7A6', '#33FF57', '#33E0FF', '#C733FF'];
let selectedColor = colors[0];

// Initialize palette
colors.forEach((color, index) => {
    const div = document.createElement('div');
    div.className = 'color';
    if (index === 0) div.classList.add('selected');
    div.style.backgroundColor = color;
    div.addEventListener('click', () => {
        document.querySelectorAll('.color').forEach(c => c.classList.remove('selected'));
        div.classList.add('selected');
        selectedColor = color;
    });
    palette.appendChild(div);
});

// Draw shapes
function drawShapes() {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000000';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Sun (Circle)
    ctx.beginPath();
    ctx.arc(150, 150, 80, 0, Math.PI * 2);
    ctx.stroke();

    // House
    ctx.beginPath();
    ctx.moveTo(350, 400); // Bottom left
    ctx.lineTo(550, 400); // Bottom right
    ctx.lineTo(550, 250); // Top right
    ctx.lineTo(350, 250); // Top left
    ctx.closePath();
    ctx.stroke();

    // Roof
    ctx.beginPath();
    ctx.moveTo(330, 250);
    ctx.lineTo(570, 250);
    ctx.lineTo(450, 150);
    ctx.closePath();
    ctx.stroke();
    
    // Door
    ctx.beginPath();
    ctx.moveTo(425, 400);
    ctx.lineTo(475, 400);
    ctx.lineTo(475, 320);
    ctx.lineTo(425, 320);
    ctx.closePath();
    ctx.stroke();

    // Tree
    ctx.beginPath();
    ctx.moveTo(700, 400); // Trunk bottom right
    ctx.lineTo(660, 400); // Trunk bottom left
    ctx.lineTo(660, 300); // Trunk top left
    ctx.lineTo(700, 300); // Trunk top right
    ctx.closePath();
    ctx.stroke();

    // Tree Leaves
    ctx.beginPath();
    ctx.arc(680, 260, 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(640, 220, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(720, 220, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(680, 180, 60, 0, Math.PI * 2);
    ctx.stroke();
}

drawShapes();

// Flood fill algorithm
function hexToRgb(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return [
        (bigint >> 16) & 255,
        (bigint >> 8) & 255,
        bigint & 255,
        255
    ];
}

function matchStartColor(pixelPos, imgData, startR, startG, startB) {
    const r = imgData.data[pixelPos];
    const g = imgData.data[pixelPos + 1];
    const b = imgData.data[pixelPos + 2];
    
    // Exact match or close enough
    return (r === startR && g === startG && b === startB);
}

function colorPixel(pixelPos, imgData, fillColor) {
    imgData.data[pixelPos] = fillColor[0];
    imgData.data[pixelPos + 1] = fillColor[1];
    imgData.data[pixelPos + 2] = fillColor[2];
    imgData.data[pixelPos + 3] = 255;
}

function floodFill(startX, startY, fillColorHex) {
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const startPos = (startY * canvas.width + startX) * 4;
    
    const startR = imgData.data[startPos];
    const startG = imgData.data[startPos + 1];
    const startB = imgData.data[startPos + 2];
    
    const fillColor = hexToRgb(fillColorHex);
    
    if (startR === fillColor[0] && startG === fillColor[1] && startB === fillColor[2]) {
        return;
    }
    
    // Tolerant check for black boundaries
    if (startR < 50 && startG < 50 && startB < 50) {
        return;
    }

    const pixelStack = [[startX, startY]];
    
    while (pixelStack.length) {
        const newPos = pixelStack.pop();
        const x = newPos[0];
        let y = newPos[1];
        
        let pixelPos = (y * canvas.width + x) * 4;
        
        while (y >= 0 && matchStartColor(pixelPos, imgData, startR, startG, startB)) {
            y--;
            pixelPos -= canvas.width * 4;
        }
        
        pixelPos += canvas.width * 4;
        y++;
        
        let reachLeft = false;
        let reachRight = false;
        
        while (y < canvas.height && matchStartColor(pixelPos, imgData, startR, startG, startB)) {
            colorPixel(pixelPos, imgData, fillColor);
            
            if (x > 0) {
                if (matchStartColor(pixelPos - 4, imgData, startR, startG, startB)) {
                    if (!reachLeft) {
                        pixelStack.push([x - 1, y]);
                        reachLeft = true;
                    }
                } else if (reachLeft) {
                    reachLeft = false;
                }
            }
            
            if (x < canvas.width - 1) {
                if (matchStartColor(pixelPos + 4, imgData, startR, startG, startB)) {
                    if (!reachRight) {
                        pixelStack.push([x + 1, y]);
                        reachRight = true;
                    }
                } else if (reachRight) {
                    reachRight = false;
                }
            }
            
            y++;
            pixelPos += canvas.width * 4;
        }
    }
    
    ctx.putImageData(imgData, 0, 0);
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = Math.floor((e.clientX - rect.left) * scaleX);
    const y = Math.floor((e.clientY - rect.top) * scaleY);
    
    floodFill(x, y, selectedColor);
});
