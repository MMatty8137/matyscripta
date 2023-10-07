var map = L.map('map', {
    minZoom: 6,
}).setView([50.0, 14.0], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 10,
}).addTo(map);

var marker;
var currentPoiIndex = 0;
var actualCoords;
var poiList; // Declare poiList globally
var previousPoiName = '';

function onMapClick(e) {
    if (marker) {
        map.removeLayer(marker);
    }
    marker = L.marker(e.latlng).addTo(map);
}
map.on('click', onMapClick);

function submitGuess() {
    if (marker) {
        var guessCoords = marker.getLatLng();
        var distance = calculateDistance(guessCoords, actualCoords);
        document.getElementById('result').innerHTML = 'Tvůj odhad byl přibližně ' + distance.toFixed(1) + ' kilometrů od cíle.';
        L.marker(guessCoords).addTo(map);
        L.marker(actualCoords, {
            icon: L.divIcon({
                className: 'poi-marker'
            })
        }).addTo(map);
        currentPoiIndex++;
        if (currentPoiIndex < poiList.length) {
            setNewPoi();
        } else {
            document.getElementById('result').innerHTML += "<br>End of the game.";
        }
    } else {
        document.getElementById('result').innerHTML = 'Please set a pin on the map first.';
    }
}

function calculateDistance(guessCoords, actualCoords) {
    return L.latLng(guessCoords).distanceTo(actualCoords) / 1000;
}

function setNewPoi() {
    if (marker) {
        map.removeLayer(marker);
    }

    // Store the current term as the previous term
    previousPoiName = document.getElementById('poi-name').innerHTML;

    var currentPoi = poiList[currentPoiIndex];
    actualCoords = currentPoi[1];
    document.getElementById('poi-name').innerHTML = currentPoi[0];
    document.getElementById('previous-poi').innerHTML = previousPoiName;

    function intepretPoi(poiType) {
        if (Array.isArray(poiType)) {
            poiType = poiType[0]; // Pick the first value from the list
        }

        if (poiType === "řeka") {
            return "řeku";
          } else if (poiType === "přehrada") {
            return "přehradu";
          } else if (poiType === "pahorkatina") {
            return "pahorkatinu";
          } else if (poiType === "hora") {
            return "horu";
          } else if (poiType === "nížina") {
            return "nížinu";
          } else if (poiType === "brána") {
            return "bránu";

          } else {
            return poiType;
          }
        }
    document.getElementById('poi-type').innerHTML = intepretPoi(currentPoi[1][2]); // Access 'type' from currentPoi[1]
  }
  

// Move the code that is trying to access the poiList variable inside of the then() callback
const submitButton = document.getElementById('submitGuess');
submitButton.addEventListener('click', submitGuess);

fetch('coordinates.json')
    .then(response => response.json())
    .then(data => {
        poiList = Object.entries(data).map(entry => {
            return [entry[0], [entry[1].latitude, entry[1].longitude, entry[1].type]];
        });

        // Randomize the order of poiList
        poiList = shuffleArray(poiList);

        // Move the code that is trying to access the poiList variable inside of the then() callback
        setNewPoi();
    })
    .catch(error => console.error('Error loading coordinates:', error));
    
// Function to shuffle an array
function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

document.addEventListener('DOMContentLoaded', function() {
    const poiNameElement = document.getElementById('poi-name');

    poiNameElement.addEventListener('click', function() {
        const poiName = this.innerText; // Get the text content of #poi-name

        // Open mapy.cz with the query
        window.open(`https://mapy.cz/?q=${encodeURIComponent(poiName)}`);
    });

    const previousPoiElement = document.getElementById('previous-poi');
    previousPoiElement.addEventListener('click', function() {
        const previousPoiName = this.innerText; // Get the text content of #previous-poi

        // Open mapy.cz with the query of the previous term
        window.open(`https://mapy.cz/?q=${encodeURIComponent(previousPoiName)}`);
    });
});