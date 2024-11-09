// menu_script.js

function loadSimulation(scriptName, startFunctionName) {
  console.log(`Attempting to load simulation script: ${scriptName}`);

  // Remove any existing simulation script
  const oldScript = document.getElementById('simulationScript');
  if (oldScript) {
    oldScript.remove();
    console.log(`Removed old simulation script.`);
  }

  // Clear the canvas to reset the simulation
  const canvas = document.getElementById('testCanvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log(`Canvas cleared.`);
  }

  // Create a new script element
  const newScript = document.createElement('script');
  newScript.src = scriptName;
  newScript.id = 'simulationScript';

  // Set the onload handler to start the simulation after the script has loaded
  newScript.onload = function () {
    console.log(`Loaded script: ${scriptName}`);
    if (typeof window[startFunctionName] === 'function') {
      window[startFunctionName]();
    } else {
      console.error(`Function ${startFunctionName} not found in ${scriptName}`);
    }
  };

  newScript.onerror = function () {
    console.error(`Failed to load script: ${scriptName}`);
  };

  document.body.appendChild(newScript);
}

// Load the default simulation when the page loads
window.addEventListener('load', function () {
  loadSimulation('test3sim1_script.js', 'startBouncingBallsSimulation'); // Default simulation
});
