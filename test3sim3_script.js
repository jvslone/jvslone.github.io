// flowField.js
function startSimulation3() {
  // Canvas Setup
  const canvas = document.getElementById('testCanvas');
  const ctx = canvas.getContext('2d');
  // Clear any existing content
  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  // resizeCanvas();
  const lines = []; // Array to store all drawn lines
  const maxLines = 8000; // Maximum number of lines to keep


  //window.addEventListener('resize', resizeCanvas);

  //function resizeCanvas() {
  //  canvas.width = window.innerWidth;
  //  canvas.height = window.innerHeight;
  //}

  // Parameters (Easy to tune)
  const params = {
    cols: 5*80,              // Number of columns in the flow field
    rows: 5*60,              // Number of rows in the flow field
    noiseScale: 0.005,      // Scale of the Perlin noise
    particleCount: 8000,    // Number of particles
    particleSpeed: 8,       // Speed of particles
    lineWidth: 2.25,           // Width of the flow lines
    fadeAlpha: 0.075,        // Alpha value for fading effect (0 - 1)
    perturbRadius: 100,      // Radius for perturbing the field on mouse drag
    perturbStrength: Math.PI/32, // Maximum angle change when perturbing
    fadeStartAge: 1000,      // Time in ms before fading starts (1 second)
    maxLineAge: 5000
  };

  
  // Utility: Perlin Noise Implementation
  // Using a simple implementation; for better performance and quality, consider using a library like simplex-noise.js
  class PerlinNoise {
    constructor() {
      this.permutation = [];
      for (let i = 0; i < 256; i++) {
        this.permutation[i] = i;
      }
      // Shuffle the array
      for (let i = 255; i > 0; i--) {
        const swap = Math.floor(Math.random() * (i + 1));
        [this.permutation[i], this.permutation[swap]] = [this.permutation[swap], this.permutation[i]];
      }
      // Duplicate the permutation array
      this.permutation = this.permutation.concat(this.permutation);
    }

    fade(t) {
      return t * t * t * (t * (t * 6 - 15) + 10);
    }

    lerp(t, a, b) {
      return a + t * (b - a);
    }

    grad(hash, x, y) {
      const h = hash & 3;
      const u = h < 2 ? x : y;
      const v = h < 2 ? y : x;
      return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    noise(x, y) {
      const X = Math.floor(x) & 255;
      const Y = Math.floor(y) & 255;

      const xf = x - Math.floor(x);
      const yf = y - Math.floor(y);

      const u = this.fade(xf);
      const v = this.fade(yf);

      const aa = this.permutation[this.permutation[X] + Y];
      const ab = this.permutation[this.permutation[X] + Y + 1];
      const ba = this.permutation[this.permutation[X + 1] + Y];
      const bb = this.permutation[this.permutation[X + 1] + Y + 1];

      const gradAA = this.grad(this.permutation[aa], xf, yf);
      const gradBA = this.grad(this.permutation[ba], xf - 1, yf);
      const gradAB = this.grad(this.permutation[ab], xf, yf - 1);
      const gradBB = this.grad(this.permutation[bb], xf - 1, yf - 1);

      const lerpX1 = this.lerp(u, gradAA, gradBA);
      const lerpX2 = this.lerp(u, gradAB, gradBB);

      return this.lerp(v, lerpX1, lerpX2);
    }
  }

  const noise = new PerlinNoise();

  // Vector Field Setup
  const field = [];
  const fieldCols = params.cols;
  const fieldRows = params.rows;
  let cellWidth = canvas.width / fieldCols;
  let cellHeight = canvas.height / fieldRows;

  function generateField() {
    field.length = 0; // Clear existing field
    for (let y = 0; y < fieldRows; y++) {
      for (let x = 0; x < fieldCols; x++) {
        const angle = noise.noise(x * params.noiseScale, y * params.noiseScale) * Math.PI * 2;
        const vector = {
          x: Math.cos(angle),
          y: Math.sin(angle),
        };
        field.push(vector);
      }
    }
  }

  generateField();

  // Particle Setup
  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.prevX = this.x;
      this.prevY = this.y;
      this.speed = params.particleSpeed * (0.15 + Math.random() * 0.85);
    }

    update() {
      const col = Math.floor(this.x / cellWidth);
      const row = Math.floor(this.y / cellHeight);
      if (col >= 0 && col < fieldCols && row >= 0 && row < fieldRows) {
        const index = col + row * fieldCols;
        const vector = field[index];
        this.prevX = this.x;
        this.prevY = this.y;
        this.x += vector.x * this.speed;
        this.y += vector.y * this.speed;

        // Wrap around edges
        // if (this.x < 0) this.x = canvas.width;
        // if (this.x > canvas.width) this.x = 0;
        // if (this.y < 0) this.y = canvas.height;
        // if (this.y > canvas.height) this.y = 0;
        if (this.x < 0) this.reset();
        if (this.x > canvas.width) this.reset();
        if (this.y < 0) this.reset();
        if (this.y > canvas.height) this.reset();
      } else {
        this.reset();
      }
    }

    draw(currentTime) {
      const angle = Math.atan2(this.y - this.prevY, this.x - this.prevX);
      const hue = (angle * 180 / Math.PI) % 360; // Convert angle to degrees
      const randomizedHue = hue + 8.5 * Math.random();
  
      // Create a new line object
      const line = {
        x1: this.prevX,
        y1: this.prevY,
        x2: this.x,
        y2: this.y,
        hue: randomizedHue,
        creationTime: currentTime
      };
  
      // Add the line to the lines array
      lines.push(line);
  
      // Ensure the lines array doesn't exceed the maximum size
      if (lines.length > maxLines) {
        lines.shift(); // Remove the oldest line
      }
    }
  }

  const particles = [];
  for (let i = 0; i < params.particleCount; i++) {
    particles.push(new Particle());
  }


  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async function perturbWithDelay(mouseX, mouseY, times, waitTime) {
    for (let i = 0; i < times; i++) {
      perturbField(mouseX, mouseY);
      await delay(waitTime);
    }
  }
  


  // Visual Effects Setup
  ctx.lineWidth = params.lineWidth;

  // Handle Mouse Interaction for Perturbation
  let isDragging = false;
  let mouseX = 0;
  let mouseY = 0;

  canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    // Example: Call perturbField 12 times with a 100ms delay between each
  perturbWithDelay(mouseX, mouseY, 24, 25);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      //perturbField(mouseX, mouseY);
    }
  });

  canvas.addEventListener('mouseup', () => {
    isDragging = false;
  });

  canvas.addEventListener('mouseleave', () => {
    isDragging = false;
  });

  function perturbField(x, y) {
    for (let row = 0; row < fieldRows; row++) {
      for (let col = 0; col < fieldCols; col++) {
        const cellX = col * cellWidth + cellWidth / 2;
        const cellY = row * cellHeight + cellHeight / 2;
        const dx = cellX - x;
        const dy = cellY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < params.perturbRadius) {
          const index = col + row * fieldCols;
          const currentVector = field[index];
          const theta = Math.atan2(currentVector.y, currentVector.x); // Current angle of the vector
  
          // Determine the perpendicular direction
          // We'll rotate vectors to the left or right based on their position relative to the mouse
          // Compute the angle from the perturbation center to the cell
          const angleToCell = Math.atan2(dy, dx);
          
          // Determine on which side the cell is relative to the flow direction
          // Compute the dot product between the flow vector and the vector from center to cell
          const flowDotPosition = currentVector.x * (dx / distance) + currentVector.y * (dy / distance);
          
          // If the dot product is positive, rotate one way; if negative, rotate the other way
          const rotateDirection = flowDotPosition >= 0 ? 1 : -1;
          
          // Compute the rotation magnitude based on distance (closer cells get more rotation)
          const rotationMagnitude = rotateDirection * params.perturbStrength * (1 - distance / params.perturbRadius);
          
          // Compute the new angle by adding the rotation magnitude
          const newTheta = theta + rotationMagnitude;
          
          // Update the vector
          field[index] = {
            x: Math.cos(newTheta),
            y: Math.sin(newTheta),
          };
        }
      }
    }
  }
  

  // Animation Loop
  function animate(currentTime) {
    ctx.fillStyle = `rgba(255, 255, 255, ${params.fadeAlpha})`; // Adjust alpha for desired fade speed
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Optionally, clear the entire canvas if needed
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Alternatively, fill with a solid background color
    //ctx.fillStyle = 'white';
    //ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    // Update and draw particles, creating lines
    particles.forEach((p) => {
      p.update();
      p.draw(currentTime);
    });
  
    // Iterate over the lines array and draw them
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      const age = currentTime - line.creationTime;
  
      if (age > params.maxLineAge) { // 2000 milliseconds = 2 seconds
        // Remove the line from the array
        lines.splice(i, 1);
        continue;
      }
  
      // Calculate opacity based on age
      let opacity;
      if (age < params.fadeStartAge) {
        opacity = 1; // Fully opaque
      } else {
        // Calculate opacity between 1 and 0 based on age
        opacity = 1 - ((age - params.fadeStartAge) / (params.maxLineAge - params.fadeStartAge));
        opacity = Math.max(opacity, 0); // Ensure opacity doesn't go below 0
      }

  
      // Set stroke style with the calculated opacity
      ctx.strokeStyle = `hsla(${line.hue}, 100%, 50%, ${opacity})`;
      ctx.lineWidth = params.lineWidth;
  
      // Draw the line
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y1);
      ctx.lineTo(line.x2, line.y2);
      ctx.stroke();
    }
  
    requestAnimationFrame(animate);
  }
  

  // Initialize canvas with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  animate();
  console.log("Flow Fields simulation started.");
}

// // Uncomment the following line if you want the simulation to start automatically without menu_script.js
startSimulation3();
