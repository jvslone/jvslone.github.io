// // Plasma MHD Simulation with Reflecting Boundaries and Density Conservation

// function startSimulation2() {
//   console.log('Simulation started');

//   // Get the canvas and context
//   var canvas = document.getElementById('testCanvas');
//   var ctx = canvas.getContext('2d');

//   // Grid dimensions
//   var gridWidth = 160;
//   var gridHeight = 120;
//   var cellSize = 8; // So the canvas will be 800x600

//   // Include the Perlin Noise function
//   var PerlinNoise = (function() {
//     // Permutation table
//     var permutation = [];
//     for (var i = 0; i < 256; i++) {
//       permutation[i] = Math.floor(Math.random() * 256);
//     }
//     permutation = permutation.concat(permutation);

//     function fade(t) {
//       return t * t * t * (t * (t * 6 - 15) + 10);
//     }

//     function lerp(t, a, b) {
//       return a + t * (b - a);
//     }

//     function grad(hash, x, y) {
//       var h = hash & 3;
//       var u = h < 2 ? x : y;
//       var v = h < 2 ? y : x;
//       return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
//     }

//     return function(x, y) {
//       // Find unit grid cell containing point
//       var xi = Math.floor(x) & 255;
//       var yi = Math.floor(y) & 255;

//       // Get relative xy coordinates of point within that cell
//       var xf = x - Math.floor(x);
//       var yf = y - Math.floor(y);

//       // Compute fade curves for x and y
//       var u = fade(xf);
//       var v = fade(yf);

//       // Hash coordinates of the 4 square corners
//       var aa = permutation[permutation[xi] + yi];
//       var ab = permutation[permutation[xi] + yi + 1];
//       var ba = permutation[permutation[xi + 1] + yi];
//       var bb = permutation[permutation[xi + 1] + yi + 1];

//       // Add blended results from 4 corners of the square
//       var x1 = lerp(u, grad(aa, xf, yf), grad(ba, xf - 1, yf));
//       var x2 = lerp(u, grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1));
//       return (lerp(v, x1, x2) + 1) / 2; // Normalize to [0,1]
//     };
//   })();

//   // Plasma grid initialization with Perlin noise
//   var plasma = [];
//   for (var x = 0; x < gridWidth; x++) {
//     plasma[x] = [];
//     for (var y = 0; y < gridHeight; y++) {
//       var noiseValue = PerlinNoise(x / 10, y / 10); // Adjust scale for desired effect
//       plasma[x][y] = {
//         density: 1.0 + noiseValue * 0.5, // Density with Perlin noise variation
//         velocityX: (PerlinNoise((x + 1000) / 10, (y + 1000) / 10) - 0.5) * 2, // Velocity X with noise
//         velocityY: (PerlinNoise((x + 2000) / 10, (y + 2000) / 10) - 0.5) * 2, // Velocity Y with noise
//         magneticFieldZ: 0.0,
//         isSource: false,
//       };
//     }
//   }

//   // Function to update plasma state
//   function updatePlasma() {
//     var dt = 0.1; // Time step

//     // Create new arrays for the updated plasma properties
//     var newPlasma = [];
//     for (var x = 0; x < gridWidth; x++) {
//       newPlasma[x] = [];
//       for (var y = 0; y < gridHeight; y++) {
//         newPlasma[x][y] = {
//           density: 0.0,
//           velocityX: 0.0,
//           velocityY: 0.0,
//           magneticFieldZ: plasma[x][y].magneticFieldZ,
//           isSource: plasma[x][y].isSource,
//         };
//       }
//     }

//     for (var x = 0; x < gridWidth; x++) {
//       for (var y = 0; y < gridHeight; y++) {
//         var cell = plasma[x][y];

//         // Apply the Lorentz force due to magnetic fields
//         var vx = cell.velocityX;
//         var vy = cell.velocityY;
//         var Bz = cell.magneticFieldZ;

//         var dvx = vy * Bz * dt;
//         var dvy = -vx * Bz * dt;

//         vx += dvx;
//         vy += dvy;

//         // Apply damping to velocities
//         var damping = 0.999; // Minimal damping
//         vx *= damping;
//         vy *= damping;

//         // Limit the velocities
//         var maxVelocity = 5;
//         var speed = Math.hypot(vx, vy);
//         if (speed > maxVelocity) {
//           vx *= maxVelocity / speed;
//           vy *= maxVelocity / speed;
//         }

//         // Update position based on velocity
//         var newX = x + vx * dt;
//         var newY = y + vy * dt;

//         // Reflecting boundary conditions for X
//         if (newX < 0) {
//           newX = -newX;
//           vx = -vx;
//         } else if (newX >= gridWidth - 1) {
//           newX = 2 * (gridWidth - 1) - newX;
//           vx = -vx;
//         }

//         // Reflecting boundary conditions for Y
//         if (newY < 0) {
//           newY = -newY;
//           vy = -vy;
//         } else if (newY >= gridHeight - 1) {
//           newY = 2 * (gridHeight - 1) - newY;
//           vy = -vy;
//         }

//         // Determine the integer grid position
//         var ix = Math.round(newX);
//         var iy = Math.round(newY);

//         // Ensure indices are within bounds
//         ix = Math.max(0, Math.min(gridWidth - 1, ix));
//         iy = Math.max(0, Math.min(gridHeight - 1, iy));

//         // Move density to the new position
//         newPlasma[ix][iy].density += cell.density;

//         // Accumulate velocities weighted by density
//         newPlasma[ix][iy].velocityX += vx * cell.density;
//         newPlasma[ix][iy].velocityY += vy * cell.density;

//         // Keep track of total density for averaging velocities later
//         newPlasma[ix][iy].totalDensity = (newPlasma[ix][iy].totalDensity || 0) + cell.density;
//       }
//     }

//     // Normalize velocities and update the plasma grid
//     for (var x = 0; x < gridWidth; x++) {
//       for (var y = 0; y < gridHeight; y++) {
//         var cell = newPlasma[x][y];
//         var totalDensity = cell.totalDensity || 0;
//         if (totalDensity > 0) {
//           cell.velocityX /= totalDensity;
//           cell.velocityY /= totalDensity;
//         } else {
//           cell.velocityX = 0;
//           cell.velocityY = 0;
//         }
//       }
//     }

//     plasma = newPlasma;
//   }

//   // Function to render plasma on canvas
//   function renderPlasma() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     for (var x = 0; x < gridWidth; x++) {
//       for (var y = 0; y < gridHeight; y++) {
//         var cell = plasma[x][y];

//         // Visualize density as brightness
//         if (cell.density > 0.01) {
//           var brightness = Math.min(255, cell.density * 80); // Adjust scaling as needed
//           ctx.fillStyle = 'rgb(' + brightness + ',' + brightness + ',' + brightness + ')';
//           ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
//         }

//         // Visualize magnetic field sources
//         if (cell.isSource) {
//           ctx.fillStyle = 'rgba(0, 0, 255, 0.5)'; // Blue for magnetic sources
//           ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
//         }
//       }
//     }
//   }

//   // Event handler for single click (place magnetic field source)
//   canvas.addEventListener('click', function (e) {
//     var rect = canvas.getBoundingClientRect();
//     var x = Math.floor((e.clientX - rect.left) / cellSize);
//     var y = Math.floor((e.clientY - rect.top) / cellSize);

//     if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
//       plasma[x][y].magneticFieldZ = 20.0; // Increased magnetic field strength
//       plasma[x][y].isSource = true;
//     }
//   });

//   // Event handler for double click (remove magnetic field source)
//   canvas.addEventListener('dblclick', function (e) {
//     var rect = canvas.getBoundingClientRect();
//     var x = Math.floor((e.clientX - rect.left) / cellSize);
//     var y = Math.floor((e.clientY - rect.top) / cellSize);

//     if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
//       plasma[x][y].magneticFieldZ = 0.0;
//       plasma[x][y].isSource = false;
//     }
//   });

//   // Animation loop
//   function loop() {
//     updatePlasma();
//     renderPlasma();
//     requestAnimationFrame(loop);
//   }

//   // Start the animation loop
//   loop();
// }


function startSimulation2() {
  const canvas = document.getElementById('testCanvas');
  const ctx = canvas.getContext('2d');

  const numParticles = 5000
  // Clear any existing content
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Example: Simple Fluid Simulation Placeholder
  let particles = [];

  function createParticles() {
      for (let i = 0; i < numParticles; i++) {
          particles.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              dx: (Math.random() - 0.5) * 2,
              dy: (Math.random() - 0.5) * 2,
              radius: 2,
              color: 'blue'
          });
      }
  }

  function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
          // Draw the particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = particle.color;
          ctx.fill();
          ctx.closePath();

          // Update particle position
          particle.x += particle.dx;
          particle.y += particle.dy;

          // Bounce off the walls
          if (particle.x + particle.radius > canvas.width || particle.x - particle.radius < 0) {
              particle.dx = -particle.dx;
          }
          if (particle.y + particle.radius > canvas.height || particle.y - particle.radius < 0) {
              particle.dy = -particle.dy;
          }
      });

      requestAnimationFrame(animate);
  }

  createParticles();
  animate();
  console.log("Fluid Simulation started.");
}

startSimulation2();
