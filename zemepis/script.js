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
var lastMarker = [];
var lastPOI = []
var lastLine = []
const maxPins = 5
var userGuess = []

function sumFloats(floatList) {
    let sum = 0;

    for (let i = 0; i < floatList.length; i++) {
        sum += parseFloat(floatList[i]);
    }

    return sum;
}

function averageFloats(floatList) {
    const totalSum = sumFloats(floatList);
    const numberOfFloats = floatList.length;
    
    return totalSum / numberOfFloats;
}

function getMarkSchool(result) {
    if (result < 10) {return 1}
    if (result < 20) {return 2}
    if (result < 30) {return 3}
    if (result < 40) {return 4}
    if (result > 40) {return 5}

}

function submitGuess() {
    if (marker) {
        var guessCoords = marker.getLatLng();
        var distance = calculateDistance(guessCoords, actualCoords);
        document.getElementById('result').innerHTML = 'a tvůj odhad byl asi <b>' + distance.toFixed(1) + '</b> kilometrů od cíle.';
        
        userGuess[currentPoiIndex] = distance.toFixed(1)
        if (lastMarker.length > maxPins) {
            map.removeLayer(lastMarker[currentPoiIndex-maxPins]);
        } 
        if (lastPOI.length > maxPins) {
            map.removeLayer(lastPOI[currentPoiIndex-maxPins]);
        } 
        if (lastLine.length > maxPins) {
            map.removeLayer(lastLine[currentPoiIndex-maxPins]);
        } 
        lastMarker[currentPoiIndex] = L.marker(guessCoords).addTo(map);
        lastPOI[currentPoiIndex] = L.marker(actualCoords, {
            icon: L.divIcon({
                className: 'poi-marker'
            })
        }).addTo(map);
        lastLine[currentPoiIndex] = L.polyline([guessCoords, actualCoords], {
            color: 'blue', // You can change the color to your preference
            dashArray: '5, 10' // This sets the dash pattern to 5 pixels on, 10 pixels off
        }).addTo(map);
        currentPoiIndex++;
        if (currentPoiIndex < poiList.length) {
            setNewPoi();
        } else {
            result = averageFloats(userGuess)
            markSchool = getMarkSchool(result)
            document.getElementById('result').innerHTML += "<br>Konec, průměrná odchylka <b> " + result.toFixed(1) + ' </b> kilometrů od cíle, <br> za to by ti Pavlíček dal tak za ' + markSchool + ".";
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