const puzzles = [
    {
        gridData: [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 0, 0, 0],
            [0, 0, 1, 0, 0, 0, 0, 0, 0],
            [0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 0, 0, 1, 1, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 0],
            [0, 0, 0, 0, 0, 1, 0, 0, 0],
        ],
        answers: {
            '1,1': 'A', '1,2': 'P', '1,3': 'P', '1,4': 'L', '1,5': 'E',
            '2,2': 'E',
            '3,2': 'N', '3,3': 'U', '3,4': 'T',
            '4,4': 'R',
            '5,4': 'E',
            '6,3': 'R', '6,4': 'E', '6,5': 'D',
            '7,5': 'O',
            '8,5': 'G'
        },
        words: [
            { id: '1a', dir: 'across', row: 1, col: 1, length: 5, clue: "1. A red or green crunchy fruit", number: 1 },
            { id: '3a', dir: 'across', row: 3, col: 2, length: 3, clue: "3. Squirrels love to eat this", number: 3 },
            { id: '5a', dir: 'across', row: 6, col: 3, length: 3, clue: "5. The color of a strawberry", number: 5 },
            { id: '2d', dir: 'down',   row: 1, col: 2, length: 3, clue: "2. You write with this on paper", number: 2 },
            { id: '4d', dir: 'down',   row: 3, col: 4, length: 4, clue: "4. It is tall and has leaves", number: 4 },
            { id: '6d', dir: 'down',   row: 6, col: 5, length: 3, clue: "6. A popular pet that barks", number: 6 }
        ]
    },
    {
        gridData: [
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 0, 0, 0, 0],
            [0, 1, 0, 1, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
        ],
        answers: {
            '1,1': 'S', '1,2': 'T', '1,3': 'A', '1,4': 'R',
            '2,1': 'O',             '2,3': 'B',
            '3,1': 'A', '3,2': 'S', '3,3': 'U', '3,4': 'N',
            '4,1': 'P', '4,2': 'A', '4,3': 'G', '4,4': 'E',
                                                '5,4': 'T',
            '6,1': 'C', '6,2': 'A', '6,3': 'T', '6,4': 'S'
        },
        words: [
            { id: '1a', dir: 'across', row: 1, col: 1, length: 4, clue: "1. It twinkles in the night sky", number: 1 },
            { id: '4a', dir: 'across', row: 3, col: 2, length: 3, clue: "4. It shines in the sky during the day", number: 4 },
            { id: '5a', dir: 'across', row: 4, col: 1, length: 4, clue: "5. A sheet of paper in a book", number: 5 },
            { id: '7a', dir: 'across', row: 6, col: 1, length: 4, clue: "7. Pets that say meow", number: 7 },
            
            { id: '1d', dir: 'down',   row: 1, col: 1, length: 4, clue: "1. You use it to wash your hands", number: 1 },
            { id: '2d', dir: 'down',   row: 2, col: 3, length: 3, clue: "2. A tiny insect", number: 2 },
            { id: '3d', dir: 'down',   row: 3, col: 4, length: 4, clue: "3. Used to catch fish", number: 3 },
        ]
    }
];

let currentPuzzleIndex = 0;
let gridData, answers, words;

let activeRow = null;
let activeCol = null;
let activeWord = null;
const userGrid = {};

const gridContainer = document.getElementById('grid-container');
const hiddenInput = document.getElementById('hidden-input');
const activeClueDisplay = document.getElementById('active-clue-display');
const acrossCluesList = document.getElementById('across-clues');
const downCluesList = document.getElementById('down-clues');
const checkBtn = document.getElementById('check-btn');
const winModal = document.getElementById('win-modal');
const playAgainBtn = document.getElementById('play-again-btn');

function loadPuzzle(index) {
    currentPuzzleIndex = index % puzzles.length;
    const p = puzzles[currentPuzzleIndex];
    gridData = p.gridData;
    answers = p.answers;
    words = p.words;
    
    // Clear user input
    Object.keys(userGrid).forEach(k => delete userGrid[k]);
    activeRow = null;
    activeCol = null;
    activeWord = null;
    activeClueDisplay.innerText = "Tap a square to start!";
    
    // Clear DOM
    gridContainer.innerHTML = '';
    acrossCluesList.innerHTML = '';
    downCluesList.innerHTML = '';
    
    initGrid();
    initClues();
    highlightActive();
}

function initGrid() {
    gridContainer.style.gridTemplateColumns = `repeat(${gridData[0].length}, var(--cell-size))`;
    
    for (let r = 0; r < gridData.length; r++) {
        for (let c = 0; c < gridData[r].length; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.id = `cell-${r}-${c}`;
            
            if (gridData[r][c] === 0) {
                cell.classList.add('empty');
            } else {
                cell.addEventListener('click', () => handleCellClick(r, c));
                userGrid[`${r},${c}`] = '';
                
                // Check if this cell is a starting point for any word
                const startingWord = words.find(w => w.row === r && w.col === c);
                if (startingWord) {
                    const num = document.createElement('span');
                    num.classList.add('number');
                    num.innerText = startingWord.number;
                    cell.appendChild(num);
                }
            }
            gridContainer.appendChild(cell);
        }
    }
}

function initClues() {
    words.forEach(w => {
        const li = document.createElement('li');
        li.innerText = w.clue;
        li.id = `clue-${w.id}`;
        li.addEventListener('click', () => {
            handleCellClick(w.row, w.col, w.dir);
        });
        
        if (w.dir === 'across') {
            acrossCluesList.appendChild(li);
        } else {
            downCluesList.appendChild(li);
        }
    });
}

function getWordsForCell(r, c) {
    return words.filter(w => {
        if (w.dir === 'across' && r === w.row && c >= w.col && c < w.col + w.length) return true;
        if (w.dir === 'down' && c === w.col && r >= w.row && r < w.row + w.length) return true;
        return false;
    });
}

function handleCellClick(r, c, forceDir = null) {
    const wordsForCell = getWordsForCell(r, c);
    if (wordsForCell.length === 0) return;
    
    let nextWord = wordsForCell[0];
    
    if (forceDir) {
        nextWord = wordsForCell.find(w => w.dir === forceDir) || nextWord;
    } else if (activeRow === r && activeCol === c && wordsForCell.length > 1) {
        // Toggle direction if clicking same cell
        nextWord = wordsForCell.find(w => w.id !== activeWord.id) || nextWord;
    } else if (activeWord) {
        // Try to maintain current direction if moving to a new cell
        const wordInSameDir = wordsForCell.find(w => w.dir === activeWord.dir);
        if (wordInSameDir) nextWord = wordInSameDir;
    }
    
    activeWord = nextWord;
    activeRow = r;
    activeCol = c;
    
    highlightActive();
    hiddenInput.focus();
}

function highlightActive() {
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('active', 'highlighted'));
    document.querySelectorAll('.clue-section li').forEach(l => l.classList.remove('active-clue'));
    
    if (!activeWord) return;
    
    for (let i = 0; i < activeWord.length; i++) {
        let r = activeWord.dir === 'across' ? activeWord.row : activeWord.row + i;
        let c = activeWord.dir === 'across' ? activeWord.col + i : activeWord.col;
        const cell = document.getElementById(`cell-${r}-${c}`);
        cell.classList.add('highlighted');
    }
    
    const activeCell = document.getElementById(`cell-${activeRow}-${activeCol}`);
    if (activeCell) activeCell.classList.add('active');
    
    const activeClueLi = document.getElementById(`clue-${activeWord.id}`);
    if (activeClueLi) {
        activeClueLi.classList.add('active-clue');
        activeClueDisplay.innerText = activeWord.clue;
        // Optional: scroll clue into view if on small screen
    }
}

hiddenInput.addEventListener('input', (e) => {
    const val = hiddenInput.value.toUpperCase();
    hiddenInput.value = ''; // Reset
    
    if (!activeWord || activeRow === null) return;
    
    // Only accept letters
    if (/^[A-Z]$/.test(val)) {
        userGrid[`${activeRow},${activeCol}`] = val;
        renderGridText();
        
        // Move to next cell
        if (activeWord.dir === 'across') {
            if (activeCol < activeWord.col + activeWord.length - 1) {
                activeCol++;
            }
        } else {
            if (activeRow < activeWord.row + activeWord.length - 1) {
                activeRow++;
            }
        }
        highlightActive();
    }
});

hiddenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace') {
        if (!activeWord) return;
        
        if (userGrid[`${activeRow},${activeCol}`] !== '') {
            // Delete current
            userGrid[`${activeRow},${activeCol}`] = '';
        } else {
            // Move back and delete
            if (activeWord.dir === 'across') {
                if (activeCol > activeWord.col) activeCol--;
            } else {
                if (activeRow > activeWord.row) activeRow--;
            }
            userGrid[`${activeRow},${activeCol}`] = '';
        }
        renderGridText();
        highlightActive();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        // Basic arrow navigation could be added here
        e.preventDefault();
    }
});

function renderGridText() {
    Object.keys(userGrid).forEach(key => {
        const cell = document.getElementById(`cell-${key.replace(',', '-')}`);
        if (cell) {
            // keep the number span if it exists
            const num = cell.querySelector('.number');
            cell.innerHTML = '';
            if (num) cell.appendChild(num);
            
            cell.appendChild(document.createTextNode(userGrid[key]));
            cell.classList.remove('correct', 'error'); // Reset validation colors
        }
    });
}

checkBtn.addEventListener('click', () => {
    let allFilled = true;
    let allCorrect = true;
    
    Object.keys(answers).forEach(key => {
        const [r, c] = key.split(',');
        const cell = document.getElementById(`cell-${r}-${c}`);
        const userVal = userGrid[key];
        const correctVal = answers[key];
        
        if (!userVal) {
            allFilled = false;
        } else if (userVal !== correctVal) {
            allCorrect = false;
            cell.classList.add('error');
        } else {
            cell.classList.add('correct');
        }
    });
    
    if (allFilled && allCorrect) {
        winModal.style.display = 'flex';
    }
});

playAgainBtn.addEventListener('click', () => {
    winModal.style.display = 'none';
    loadPuzzle(currentPuzzleIndex + 1);
});

// Setup
loadPuzzle(0);
