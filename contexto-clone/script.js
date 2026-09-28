let gameId;
let guesses = [];
let gameOver = false;
let hintsUsed = 0;
let gaveUp = false;
let userGuesses = 0;

const form = document.getElementById('guess-form');
const input = document.getElementById('word-input');
const guessesList = document.getElementById('guesses-list');
const statsDiv = document.getElementById('stats');
const guessCountSpan = document.getElementById('guess-count');
const gameNumberSpan = document.getElementById('game-number');
const winMessage = document.getElementById('win-message');
const winTitle = document.getElementById('win-title');
const targetWordSpan = document.getElementById('target-word');
const finalGuessCountSpan = document.getElementById('final-guess-count');
const hintsUsedCountSpan = document.getElementById('hints-used-count');
const gameStatusSpan = document.getElementById('game-status');
const playAgainBtn = document.getElementById('play-again-btn');
const hintBtn = document.getElementById('hint-btn');
const giveupBtn = document.getElementById('giveup-btn');

function initGame() {
    gameId = Math.floor(Math.random() * 700) + 1;
    gameNumberSpan.innerText = gameId;
    guesses = [];
    gameOver = false;
    hintsUsed = 0;
    gaveUp = false;
    userGuesses = 0;
    guessesList.innerHTML = '';
    input.value = '';
    input.disabled = false;
    statsDiv.style.display = 'none';
    winMessage.style.display = 'none';
    guessCountSpan.innerText = '0';
    input.focus();
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (gameOver) return;

    const word = input.value.trim().toLowerCase();
    if (!word) return;

    // Check if already guessed
    if (guesses.find(g => g.word === word)) {
        input.value = '';
        return;
    }

    input.disabled = true;
    input.classList.add('loading');

    try {
        const response = await fetch(`/api/game/${gameId}/${word}`);
        const data = await response.json();

        input.disabled = false;
        input.classList.remove('loading');
        input.value = '';
        input.focus();

        if (data.error) {
            alert(data.error); // "I don't know this word"
            return;
        }

        const rank = data.distance; // distance 0 is the target word! (Wait, distance 0 or 1? In Contexto 1 is the answer. Let's assume 0 is the API return for the answer, or maybe 0 is target. Let's see).
        
        // Contexto ranks the target word as 0 in the API, but shows it as 1 in the UI. 
        // We will just use the API distance directly. 0 = target.
        const uiRank = rank === 0 ? 1 : rank + 1;

        userGuesses++;
        guesses.push({ word, rank: uiRank });
        guesses.sort((a, b) => a.rank - b.rank); // Sort lowest rank first

        updateUI();

        if (uiRank === 1) {
            handleWin(word);
        }

    } catch (err) {
        console.error(err);
        input.disabled = false;
        input.classList.remove('loading');
        alert("An error occurred connecting to the API.");
    }
});

function getBarWidth(rank) {
    if (rank <= 300) {
        return Math.max(80, 100 - (rank / 300) * 20); // 80% to 100%
    } else if (rank <= 1500) {
        return Math.max(40, 80 - ((rank - 300) / 1200) * 40); // 40% to 80%
    } else {
        return Math.max(1, 40 - ((rank - 1500) / 50000) * 39); // 1% to 40%
    }
}

function getColorClass(rank) {
    if (rank <= 300) return 'green';
    if (rank <= 1500) return 'yellow';
    return 'red';
}

function updateUI() {
    guessesList.innerHTML = '';
    statsDiv.style.display = 'block';
    guessCountSpan.innerText = guesses.length;

    guesses.forEach(g => {
        const item = document.createElement('div');
        item.className = `guess-item ${getColorClass(g.rank)}`;
        
        const widthPercent = getBarWidth(g.rank);
        item.style.setProperty('--bar-width', `${widthPercent}%`);

        const wordSpan = document.createElement('span');
        wordSpan.className = 'word-text';
        wordSpan.innerText = g.word;

        const rankSpan = document.createElement('span');
        rankSpan.className = 'word-rank';
        rankSpan.innerText = g.rank;

        item.appendChild(wordSpan);
        item.appendChild(rankSpan);
        guessesList.appendChild(item);
    });
}

function handleWin(word) {
    gameOver = true;
    input.disabled = true;
    
    if (gaveUp) {
        winTitle.innerText = "Game Over";
        winTitle.style.color = "var(--red-bar)";
        gameStatusSpan.innerText = "Gave Up";
        gameStatusSpan.style.color = "var(--red-bar)";
    } else {
        winTitle.innerText = "Congratulations!";
        winTitle.style.color = "var(--green-bar)";
        gameStatusSpan.innerText = "Found it!";
        gameStatusSpan.style.color = "var(--green-bar)";
    }

    targetWordSpan.innerText = word;
    finalGuessCountSpan.innerText = userGuesses;
    hintsUsedCountSpan.innerText = hintsUsed;
    
    winMessage.style.display = 'block';
}

playAgainBtn.addEventListener('click', initGame);

// Start first game
initGame();

hintBtn.addEventListener('click', async () => {
    if (gameOver) return;
    
    hintBtn.disabled = true;
    hintBtn.innerText = "Loading...";

    try {
        const response = await fetch(`/api/top/${gameId}`);
        const data = await response.json();
        
        const topWords = data.words;
        
        // Find the lowest rank word not guessed yet
        // topWords[0] is rank 1 (the answer). Wait, in Contexto, the target word has distance 0,
        // and topWords array index 0 is the target word.
        // Index 1 is rank 2 in UI.
        
        let hintWord = null;
        let hintRank = -1;
        
        // Start from 1 to avoid giving the actual answer
        for (let i = 1; i < topWords.length; i++) {
            if (!guesses.find(g => g.word === topWords[i])) {
                hintWord = topWords[i];
                hintRank = i + 1; // UI Rank
                break;
            }
        }

        if (hintWord) {
            hintsUsed++;
            guesses.push({ word: hintWord, rank: hintRank });
            guesses.sort((a, b) => a.rank - b.rank);
            updateUI();
        } else {
            alert("No more hints available from the top 500 words!");
        }
    } catch (err) {
        console.error(err);
        alert("Failed to load hint.");
    }

    hintBtn.disabled = false;
    hintBtn.innerText = "Give Hint";
});

giveupBtn.addEventListener('click', async () => {
    if (gameOver) return;
    
    giveupBtn.disabled = true;
    giveupBtn.innerText = "Loading...";

    try {
        const response = await fetch(`/api/top/${gameId}`);
        const data = await response.json();
        
        const targetWord = data.words[0];
        
        if (!guesses.find(g => g.word === targetWord)) {
            guesses.push({ word: targetWord, rank: 1 });
            guesses.sort((a, b) => a.rank - b.rank);
            updateUI();
        }
        
        gaveUp = true;
        handleWin(targetWord);

    } catch (err) {
        console.error(err);
        alert("Failed to fetch the answer.");
    }

    giveupBtn.disabled = false;
    giveupBtn.innerText = "Give Up";
});
