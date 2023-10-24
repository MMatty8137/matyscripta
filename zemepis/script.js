const startTime = Date.now(); 
const urlParams = new URLSearchParams(window.location.search);
const jsonFile = urlParams.get('json') || 'povrch.json';
const limitPoiIndex = urlParams.get('max') || null;
const gameName = jsonFile.substring(0, jsonFile.length - 5);
console.log(gameName);
pageName = "Slepá mapa - " + gameName
if (limitPoiIndex != null) {
    if (limitPoiIndex == 1) {
        inflectedPojem = "pojem"
    } else if (limitPoiIndex >= 2 && limitPoiIndex <5) {
        inflectedPojem = "pojmy"
    } else {
        inflectedPojem = "pojmů"
    }

    pageName = "Slepá mapa - " + gameName + " - " + limitPoiIndex + " " + inflectedPojem;
}
document.getElementById('page-name').innerHTML += pageName;

var zoom;

console.log(jsonFile)
if (jsonFile == 'world.json') {
    minZoom = 1
    maxZoom = 4
} else {
    maxZoom = 9
    minZoom = 5
}

var map = L.map('map', {
    minZoom: minZoom,
}).setView([50.0, 15.5], 7);

map.setMaxBounds(  [[-90,-180],   [90,180]]  )
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: maxZoom,
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
var badGuesses = []

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
    if (result < 12) {return 1}
    if (result < 24) {return 2}
    if (result < 36) {return 3}
    if (result < 48) {return 4}
    if (result > 48) {return 5}

}

function generateCertificatePDF(averageDistance, timeElapsed) {
    var doc = new jspdf.jsPDF('p', 'pt', 'A4');
    // Assuming the font files are in a 'fonts' folder in your project
    doc.addFont('Inter.ttf', 'Inter', 'normal');
    doc.setFont('Inter');
    doc.setFontSize(24); // Set font size to 12 points
    doc.setTextColor(0, 0, 0); // Set text color to black


    doc.text(`Certifikát o splnění`, 70, 40);
    doc.setFontSize(16);
    doc.text(`Tímto souborem se stvrzuje, že hráč dohrál hru "Slepý zemák".`, 10, 80);
    doc.text(`Průměrná odchylka: ${averageDistance}`, 30, 120);
    doc.text(`Celkový čas: ${timeElapsed}`, 30, 140);
    doc.text(`Vydáno dne: ${new Date().toLocaleDateString()}`, 30, 160);
    doc.text(`Hash: ${(Date.now()*(averageDistance+timeElapsed)).toString(16)}`, 30, 240);

    return doc;
}

function downloadCertificatePDF(averageDistance, timeElapsed) {
    const doc = generateCertificatePDF(averageDistance, timeElapsed);
    doc.save('certificate.pdf');
}

function submitGuess() {
    if (marker) {
        var guessCoords = marker.getLatLng();
        var distance = calculateDistance(guessCoords, actualCoords);
        document.getElementById('result').innerHTML = 'a tvůj odhad byl asi <b>' + distance.toFixed(1) + '</b> kilometrů od cíle,';
        var currentPoi = document.getElementById('poi-name').innerHTML;
        console.log(distance, currentPoi)
        if (distance.toFixed(1) > 25) {
            badGuesses.push(currentPoi)
        }
        // Update how many POI's are left in session
        if (((limitPoiIndex - currentPoiIndex) == 1) || ((poiList.length - currentPoiIndex) == 1)) {
            document.getElementById('left-over').innerHTML =  ""
        } else if (limitPoiIndex != null) {
            document.getElementById('left-over').innerHTML =  "a zbývá ti " + (limitPoiIndex - currentPoiIndex - 1) + " pojmů."
        } else if ((limitPoiIndex == null) && ((poiList.length - currentPoiIndex) != 1))   {
            document.getElementById('left-over').innerHTML =  "a zbývá ti " + (poiList.length - currentPoiIndex - 1) + " pojmů."
        }
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

        result = averageFloats(userGuess);
        const endTime = Date.now(); 
        const elapsedTime = endTime - startTime;
        // markSchool = getMarkSchool(result)
        let message = '<br><br>Konec, průměrná odchylka <b>' + result.toFixed(1) + '</b> kilometrů od cíle.<br><br>A celkem ti to trvalo ' + (elapsedTime/1000) + ' sekund!<br><br><button onclick="downloadCertificatePDF(' + result + ',' + elapsedTime + ')">Download Certificate (PDF)</button>';

        // let message = "<br><br>Konec, průměrná odchylka <b>" + result.toFixed(1) + "</b> kilometrů od cíle, <br>za to by ti Pavlíček dal tak za " + markSchool + ".<br><br>A nejvíce ti nešly: "+badGuesses.join(', ');

        if (badGuesses.length > 10) {
            message = "<br><br><b> Whoah, uč se radši!</b>" + message
        }
        if (currentPoiIndex == limitPoiIndex) {
            message = "Nejvíce ti nešly" + message;
        }
        
        if (currentPoiIndex == limitPoiIndex || currentPoiIndex >= poiList.length) {
            document.getElementById('result').innerHTML += message;
        } else {
            setNewPoi();
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
    console.log(currentPoi)
    try {
    var mountainHeight = currentPoi[1][2].find(item => typeof item === 'number');
    if (mountainHeight) {
        document.getElementById('poi-name').innerHTML = currentPoi[0] + " - " + mountainHeight + " m. n. m"
    } else {
        document.getElementById('poi-name').innerHTML = currentPoi[0]
    }
    document.getElementById('previous-poi').innerHTML = previousPoiName;
    } catch {
        document.getElementById('poi-name').innerHTML = currentPoi[0]
    }

    mountainHeight = currentPoi[3]

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

fetch(jsonFile)
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

window.addEventListener('DOMContentLoaded', function() {
    if (window.innerWidth < 400) {
        var warningElement = document.createElement('div');
        warningElement.textContent = 'Varování: Stránka je optimalizovaná pro větší obrazovky.';
        warningElement.style.backgroundColor = 'red';
        warningElement.style.color = 'white';
        warningElement.style.padding = '10px';
        warningElement.style.textAlign = 'center';
        document.body.insertBefore(warningElement, document.body.firstChild);
    }
});