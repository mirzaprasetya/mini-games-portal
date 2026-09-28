const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([20000, 0]);

let worldData = [];
let countries = [];
let targetCountry = null;
let guesses = [];
let globe;
let showAllGuesses = false;

// Elements
const input = document.getElementById('country-input');
const autocompleteList = document.getElementById('autocomplete-list');
const guessBtn = document.getElementById('guess-btn');
const guessesList = document.getElementById('guesses-list');
const winScreen = document.getElementById('win-screen');
const targetCountryNameSpan = document.getElementById('target-country-name');
const guessCountSpan = document.getElementById('guess-count');
const playAgainBtn = document.getElementById('play-again-btn');
const toastContainer = document.getElementById('toast-container');
const hintBtn = document.getElementById('hint-btn');
const giveupBtn = document.getElementById('giveup-btn');
const winTitle = document.getElementById('win-title');

function showToast(message, color = "rgba(0, 0, 0, 0.85)") {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.backgroundColor = color;
    toast.innerText = message;
    toastContainer.appendChild(toast);
    
    // Remove after animation completes
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 3000);
}

// Initialize Globe
globe = Globe()
    (document.getElementById('globeViz'))
    .width(window.innerWidth)
    .height(window.innerHeight)
    .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
    .polygonCapColor(feat => getPolygonColor(feat))
    .polygonSideColor(() => 'rgba(0, 0, 0, 0.1)')
    .polygonStrokeColor(() => '#333')
    .polygonAltitude(0.005)
    .polygonLabel(feat => {
        const guess = guesses.find(g => g.feature.properties.ISO_A2 === feat.properties.ISO_A2);
        if (guess) {
            return `
                <div style="background: rgba(0,0,0,0.8); color: white; padding: 5px 10px; border-radius: 4px; font-family: sans-serif; font-size: 14px;">
                    <b>${feat.properties.NAME}</b><br/>
                    ${guess.distance === 0 ? 'Target Found!' : Math.round(guess.distance) + ' km'}
                </div>
            `;
        }
        return '';
    })
    .onPolygonClick(feat => {
        if (feat.centroid) {
            globe.pointOfView({ lat: feat.centroid[1], lng: feat.centroid[0], altitude: 1.5 }, 500);
        }
    });

// Load Data
fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
    .then(res => res.json())
    .then(data => {
        worldData = data.features.filter(d => d.properties.ISO_A2 !== 'AQ'); // Filter out Antarctica
        
        // Calculate centroids
        worldData.forEach(feat => {
            feat.centroid = d3.geoCentroid(feat); // [lon, lat]
            feat.properties.NAME = feat.properties.ADMIN; // Use ADMIN as name
            countries.push(feat);
        });
        
        globe.polygonsData(worldData);
        startNewGame();
    });

function startNewGame() {
    guesses = [];
    guessesList.innerHTML = '';
    winScreen.style.display = 'none';
    input.value = '';
    
    // Pick random target
    targetCountry = countries[Math.floor(Math.random() * countries.length)];
    console.log("Target (shh!):", targetCountry.properties.NAME);
    
    updateGlobe();
}

// Haversine distance in km
function getDistance(lon1, lat1, lon2, lat2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1); 
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

function getPolygonColor(feat) {
    const guess = guesses.find(g => g.feature.properties.ISO_A2 === feat.properties.ISO_A2);
    if (!guess) return 'rgba(200, 200, 200, 0.2)'; // Not guessed yet
    if (guess.distance === 0) return '#8B0000'; // Dark red for target
    return colorScale(guess.distance);
}

function updateGlobe() {
    // Trigger polygon re-evaluation
    globe.polygonCapColor(feat => getPolygonColor(feat));
}

function makeGuess(countryName) {
    const country = countries.find(c => c.properties.NAME.toLowerCase() === countryName.toLowerCase());
    
    if (!country) {
        alert("Country not found!");
        return;
    }
    
    if (guesses.find(g => g.feature.properties.ISO_A2 === country.properties.ISO_A2)) {
        // Already guessed
        input.value = '';
        return;
    }

    const dist = getDistance(
        country.centroid[0], country.centroid[1],
        targetCountry.centroid[0], targetCountry.centroid[1]
    );

    // Toast Notification Logic
    if (dist === 0) {
        showToast(`🎉 You found ${country.properties.NAME}!`, '#2ecc71');
    } else {
        if (guesses.length === 0) {
            showToast(`${country.properties.NAME} is your first guess!`);
        } else {
            const bestDistance = Math.min(...guesses.map(g => g.distance));
            if (dist < bestDistance) {
                showToast(`🔥 ${country.properties.NAME} is warmer!`, '#e67e22');
            } else if (dist > bestDistance) {
                showToast(`❄️ ${country.properties.NAME} is cooler!`, '#3498db');
            } else {
                showToast(`😐 ${country.properties.NAME} is the same distance.`, '#95a5a6');
            }
        }
    }

    const guessObj = {
        feature: country,
        distance: dist
    };
    
    guesses.push(guessObj);
    
    // Sort guesses by distance ascending for the list, so closest is on top
    const sortedGuesses = [...guesses].sort((a, b) => a.distance - b.distance);
    
    renderGuesses(sortedGuesses);
    updateGlobe();
    
    // Focus globe on guessed country
    globe.pointOfView({ lat: country.centroid[1], lng: country.centroid[0], altitude: 1.5 }, 1000);
    
    input.value = '';
    autocompleteList.innerHTML = '';

    if (dist === 0) {
        // Win!
        targetCountryNameSpan.innerText = targetCountry.properties.NAME;
        guessCountSpan.innerText = guesses.length;
        winTitle.innerText = "You Won!";
        winTitle.style.color = "white";
        winScreen.style.display = 'block';
    }
}

function renderGuesses(sortedGuesses) {
    guessesList.innerHTML = '';
    
    let displayCount = showAllGuesses ? sortedGuesses.length : Math.min(5, sortedGuesses.length);
    
    for (let i = 0; i < displayCount; i++) {
        let g = sortedGuesses[i];
        const item = document.createElement('div');
        item.className = 'guess-item';
        
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = g.distance === 0 ? '#8B0000' : colorScale(g.distance);
        
        const nameNode = document.createElement('span');
        nameNode.innerText = g.feature.properties.NAME;
        
        const distNode = document.createElement('span');
        distNode.innerText = g.distance === 0 ? 'WIN!' : Math.round(g.distance) + ' km';
        distNode.style.fontWeight = 'bold';
        distNode.style.color = '#555';

        item.appendChild(colorBox);
        item.appendChild(nameNode);
        item.appendChild(distNode);
        
        guessesList.appendChild(item);
    }
    
    if (sortedGuesses.length > 5) {
        const btn = document.createElement('button');
        btn.innerText = showAllGuesses ? "Show Top 5" : `Show All (${sortedGuesses.length})`;
        btn.style.marginTop = "10px";
        btn.style.fontSize = "12px";
        btn.style.padding = "6px 12px";
        btn.style.backgroundColor = "#fff";
        btn.style.color = "#3498db";
        btn.style.border = "1px solid #3498db";
        btn.style.borderRadius = "15px";
        btn.style.pointerEvents = "auto";
        btn.style.cursor = "pointer";
        btn.style.fontWeight = "bold";
        btn.onclick = () => {
            showAllGuesses = !showAllGuesses;
            renderGuesses(sortedGuesses);
        };
        guessesList.appendChild(btn);
    }
}

// UI Events
guessBtn.addEventListener('click', () => {
    if (input.value.trim() !== '') {
        makeGuess(input.value.trim());
    }
});

hintBtn.addEventListener('click', () => {
    if (winScreen.style.display === 'block') return;
    
    const unguessed = countries.filter(c => !guesses.find(g => g.feature.properties.ISO_A2 === c.properties.ISO_A2));
    if (unguessed.length <= 1) return;
    
    const hintCandidates = unguessed.filter(c => c.properties.ISO_A2 !== targetCountry.properties.ISO_A2);
    
    hintCandidates.forEach(c => {
        c.tempDist = getDistance(c.centroid[0], c.centroid[1], targetCountry.centroid[0], targetCountry.centroid[1]);
    });
    
    hintCandidates.sort((a, b) => a.tempDist - b.tempDist);
    makeGuess(hintCandidates[0].properties.NAME);
});

giveupBtn.addEventListener('click', () => {
    if (winScreen.style.display === 'block') return;
    
    const guessObj = { feature: targetCountry, distance: 0 };
    if (!guesses.find(g => g.feature.properties.ISO_A2 === targetCountry.properties.ISO_A2)) {
        guesses.push(guessObj);
    }
    
    globe.pointOfView({ lat: targetCountry.centroid[1], lng: targetCountry.centroid[0], altitude: 1.5 }, 1000);
    
    const sortedGuesses = [...guesses].sort((a, b) => a.distance - b.distance);
    renderGuesses(sortedGuesses);
    updateGlobe();
    
    targetCountryNameSpan.innerText = targetCountry.properties.NAME;
    guessCountSpan.innerText = guesses.length;
    winTitle.innerText = "Game Over (Gave Up)";
    winTitle.style.color = "#e74c3c";
    winScreen.style.display = 'block';
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        if (autocompleteList.children.length > 0) {
            makeGuess(autocompleteList.children[0].innerText);
        } else if (input.value.trim() !== '') {
            makeGuess(input.value.trim());
        }
    }
});

playAgainBtn.addEventListener('click', startNewGame);

// Autocomplete
input.addEventListener('input', function() {
    const val = this.value;
    autocompleteList.innerHTML = '';
    if (!val) return false;
    
    let matches = countries.filter(c => c.properties.NAME.toLowerCase().startsWith(val.toLowerCase()));
    
    // Sort alphabetically
    matches.sort((a, b) => a.properties.NAME.localeCompare(b.properties.NAME));
    
    // Limit to 5
    matches = matches.slice(0, 5);
    
    matches.forEach(match => {
        const div = document.createElement('div');
        div.innerHTML = "<strong>" + match.properties.NAME.substr(0, val.length) + "</strong>";
        div.innerHTML += match.properties.NAME.substr(val.length);
        div.addEventListener('click', function() {
            input.value = match.properties.NAME;
            autocompleteList.innerHTML = '';
            makeGuess(match.properties.NAME);
        });
        autocompleteList.appendChild(div);
    });
});

// Close autocomplete when clicking outside
document.addEventListener('click', function (e) {
    if (e.target !== input) {
        autocompleteList.innerHTML = '';
    }
});

window.addEventListener('resize', () => {
    globe.width(window.innerWidth);
    globe.height(window.innerHeight);
});
