let locations = [];
let shuffledLocations = [];
let currentRound = 0;
let map, marker, guessedLatLng, resultMap;
let selectedMode;
let timerInterval;
let timeLeft = 30;
let actualMarker;
let guessLine;
let hasSubmitted = false;
  
function getQueryParam(key) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(key);
}

function initGame() {
  selectedMode = getQueryParam("mode") || "classic";
  customRounds = parseInt(getQueryParam("rounds")) || 5;
  customTime = parseInt(getQueryParam("time")) || 30;

  if (selectedMode === "custom") {
    totalRounds = Math.min(Math.max(customRounds, 5), 20);
    roundTime = Math.min(Math.max(customTime, 10), 300);
  } else {
    totalRounds = 5;
    roundTime = selectedMode === "timed" ? 30 : 0;
  }

  shuffledLocations = shuffle([...locations]);
  loadRound();
}

function shuffle(array) {
  let currentIndex = array.length, temporaryValue, randomIndex;

  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function loadRound() {
    const location = shuffledLocations[currentRound];
    document.getElementById("locationImage").src = location.beforeImage;
    document.getElementById("roundIndicator").textContent = `Round ${currentRound + 1} of ${totalRounds}`;
    document.getElementById("scoreBadge").textContent = `Score: ${score}`;

    hasSubmitted = false;

    if (selectedMode === "timed" || selectedMode === "custom") {
        clearInterval(timerInterval);
        timeLeft = roundTime;
        document.getElementById("timer").textContent = timeLeft;
        document.getElementById("timerBar").style.display = "block";
        startTimer();
    } else {
        document.getElementById("timerBar").style.display = "none";
    }
}
  
  document.addEventListener("DOMContentLoaded", () => {
    fetch("locations.json")
      .then((res) => res.json())
      .then((data) => {
        locations = data;
        initGame();
      });

    if (!map) {
        map = L.map("map").setView([20, 0], 2);
    }
    resultMap = L.map("resultMap", {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false
      }).setView([20, 0], 2);
      
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap & CartoDB',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(resultMap);
      
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap & CartoDB',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);
  
    map.on("click", function (e) {
      guessedLatLng = e.latlng;
  
      if (marker) {
        marker.setLatLng(guessedLatLng);
      } else {
        marker = L.marker(guessedLatLng).addTo(map);
      }
    });
  });

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

let score = 0;

function submitGuess(autoSubmit = false) {
    if (hasSubmitted) return;
    hasSubmitted = true;

    const location = shuffledLocations[currentRound];
  
    if (!guessedLatLng && !autoSubmit) {
      alert("Please click on the map to make a guess before submitting.");
      return;
    }
  
    let distance = 0;
    let roundPoints = 0;
  
    if (guessedLatLng) {
      distance = calculateDistance(
        guessedLatLng.lat,
        guessedLatLng.lng,
        location.lat,
        location.lng
      );
      roundPoints = Math.max(0, Math.round(5000 - distance));
    } else {
      distance = "No guess";
      roundPoints = 0;
    }
  
    score += roundPoints;
    
    const scorePop = document.getElementById("scorePop");
    scorePop.textContent = `+${roundPoints} points!`;
    scorePop.classList.add("show");
    setTimeout(() => {
        scorePop.classList.remove("show");
    }, 1000);

    if (selectedMode === "timed") {
      clearInterval(timerInterval);
    }
  
    document.getElementById("game").style.display = "none";
    document.getElementById("result").style.display = "block";
    resultMap.invalidateSize();
  
    document.getElementById("actualLocation").textContent =
      `Actual location: ${location.name} (${location.lat.toFixed(2)}, ${location.lng.toFixed(2)})`;
    document.getElementById("afterImage").src = location.afterImage;
  
    document.getElementById("locationFacts").textContent =
      guessedLatLng
        ? `${location.facts} You were ${Math.round(distance)} km away and earned ${roundPoints} points.`
        : `${location.facts} You didn't make a guess in time. 0 points this round.`;
  
    document.getElementById("scoreBadge").textContent = `Score: ${score}`;
    document.getElementById("timer").textContent = timeLeft;
  
    // 🎉 Confetti for high score
    if (roundPoints >= 4500) {
        const duration = 2 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };
      
        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            clearInterval(interval);
            return;
          }
          const particleCount = 50 * (timeLeft / duration);
          confetti(Object.assign({}, defaults, {
            particleCount,
            origin: {
              x: Math.random(),
              y: Math.random() - 0.2
            }
          }));
        }, 250);
      }
      // Gold stuff
      if (roundPoints === 5000) {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
      
        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            clearInterval(interval);
            return;
          }
      
          confetti({
            particleCount: 6,
            angle: 90,
            spread: 120,
            origin: { x: Math.random(), y: Math.random() * 0.4 },
            shapes: ['circle'],
            scalar: 1.2,
            colors: ['#ffd700', '#ffdd33', '#ffcc00']
          });
        }, 100);
      }
      
      const actualLatLng = L.latLng(location.lat, location.lng);

      if (guessedLatLng) {
        if (guessLine) map.removeLayer(guessLine);
        if (actualMarker) map.removeLayer(actualMarker);
      
        guessLine = L.polyline([guessedLatLng, actualLatLng], {
          color: '#f44336',
          weight: 2,
          dashArray: '5, 5',
        }).addTo(map);
      
        actualMarker = L.marker(actualLatLng).addTo(map);
        map.fitBounds(L.latLngBounds([guessedLatLng, actualLatLng]), { padding: [50, 50] });
      }
      
      // Always update the resultMap (even for auto-submit / no guess)
      setTimeout(() => {
        if (guessedLatLng) {
          L.marker(guessedLatLng).addTo(resultMap);
          L.polyline([guessedLatLng, actualLatLng], {
            color: '#f44336',
            weight: 2,
            dashArray: '5, 5'
          }).addTo(resultMap);
        }
      
        L.marker(actualLatLng).addTo(resultMap);
        resultMap.fitBounds(L.latLngBounds([actualLatLng, guessedLatLng || actualLatLng]), { padding: [50, 50] });
      }, 100);      
      setTimeout(() => {
        resultMap.invalidateSize(); // Fixes gray screen
      }, 100);
  }



function nextRound() {
    hasSubmitted = false;
    currentRound++;
  
    if (currentRound >= totalRounds) {
      // End of game
      document.getElementById("result").style.display = "none";
      document.getElementById("gameOver").style.display = "block";
      document.getElementById("finalScore").textContent = `Your Final Score: ${score} / ${totalRounds * 5000}`;      
      return;
    }
    if (selectedMode === "timed") {
        document.getElementById("timerBar").style.display = "block";
        startTimer();
    }      
  
    guessedLatLng = null;
    marker && map.removeLayer(marker);
    marker = null;
    if (guessLine) { map.removeLayer(guessLine); guessLine = null; }
    if (actualMarker) { map.removeLayer(actualMarker); actualMarker = null; }
    if (marker) { map.removeLayer(marker); marker = null; }
    map.setView([20, 0], 2);

    resultMap.eachLayer(layer => {
    if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        resultMap.removeLayer(layer);
    }
    });
    resultMap.setView([20, 0], 2);

    loadRound();
  
    document.getElementById("game").style.display = "block";
    document.getElementById("result").style.display = "none";
  }

function restartGame() {
  hasSubmitted = false;
  score = 0;
  currentRound = 0;
  document.getElementById("scoreBadge").textContent = `Score: ${score}`;
  document.getElementById("roundIndicator").textContent = `Round ${currentRound + 1}`;
  guessedLatLng = null;
  marker && map.removeLayer(marker);
  marker = null;
  if (selectedMode === "timed") {
    document.getElementById("timerBar").style.display = "block";
    startTimer();
  }
    if (guessLine) { map.removeLayer(guessLine); guessLine = null; }
    if (actualMarker) { map.removeLayer(actualMarker); actualMarker = null; }
    if (marker) { map.removeLayer(marker); marker = null; }
    map.setView([20, 0], 2);

    resultMap.eachLayer(layer => {
    if (layer instanceof L.Marker || layer instanceof L.Polyline) {
        resultMap.removeLayer(layer);
    }
    });
    resultMap.setView([20, 0], 2);

  initGame()

  document.getElementById("gameOver").style.display = "none";
  document.getElementById("game").style.display = "block";
}

function startTimer() {
  timeLeft = roundTime;
  document.getElementById("timer").textContent = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer").textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      submitGuess(true);
    }
  }, 1000);
}
