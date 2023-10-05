fetch('coordinates.json')
  .then(response => response.json())
  .then(data => {
    poiList = Object.entries(data).map(entry => {
      return [entry[0], [entry[1].latitude, entry[1].longitude, entry[2].type]];
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
