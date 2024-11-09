// Function to load a new simulation script
function loadSimulation(scriptName) {
  // Remove any existing simulation script
  const oldScript = document.getElementById('simulationScript');
  if (oldScript) {
    oldScript.remove();
  }

  // Optionally, clear the canvas to reset the simulation
  const canvas = document.getElementById('testCanvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Create a new script element
  const newScript = document.createElement('script');
  newScript.src = scriptName;
  newScript.id = 'simulationScript';

  // Set the onload handler to start the simulation after the script has loaded
  newScript.onload = function () {
    console.log(`Loaded script: ${scriptName}`);
    if (typeof startSimulation === 'function') {
      startSimulation();
    } else {
      console.error(`startSimulation function not found in ${scriptName}`);
    }
  };

  document.body.appendChild(newScript);
}

// Load the default simulation when the page loads using addEventListener
window.addEventListener('load', function () {
  loadSimulation('test3sim1_script.js'); // Set your default simulation script here
});
