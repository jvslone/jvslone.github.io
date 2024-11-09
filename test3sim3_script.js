// flowField.js
function startSimulation3() {
  // Canvas Setup
  const canvas = document.getElementById('testCanvas');
  const ctx = canvas.getContext('2d');
  resizeCanvas();

  window.addEventListener('resize', resizeCanvas);

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  // Parameters (Easy to tune)
  const params = {
    cols: 100,              // Number of columns in the flow field
    rows: 100,              // Number of rows in the flow field
    noiseScale: 0.005,      // Scale of the Perlin noise
    particleCount: 5000,    // Number of particles
    particleSpeed: 3,       // Speed of particles
    lineWidth: 1,           // Width of the flow lines
    fadeAlpha: 0.08,        // Alpha value for fading effect (0 - 1)
    perturbRadius: 50,      // Radius for perturbing the field on mouse drag
    perturbStrength: Math.PI / 16, // Maximum angle change when perturbing
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
      this.speed = params.particleSpeed * (0.5 + Math.random() * 0.5);
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
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      } else {
        this.reset();
      }
    }

    draw(ctx) {
      const angle = Math.atan2(this.y - this.prevY, this.x - this.prevX);
      const hue = (angle * 180 / Math.PI) % 360; // Convert angle to degrees
      ctx.strokeStyle = `hsl(${hue}, 100%, 50%)`;
      
      // Calculate distance between previous and current positions
      const dx = this.x - this.prevX;
      const dy = this.y - this.prevY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const maxDistance = 100; // Threshold to prevent drawing long lines from wrap-around
      
      if (distance < maxDistance) { // Only draw if the distance is reasonable
        ctx.beginPath();
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
      }
    }
  }

  const particles = [];
  for (let i = 0; i < params.particleCount; i++) {
    particles.push(new Particle());
  }

  // Visual Effects Setup
  ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
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
    perturbField(mouseX, mouseY);
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
      perturbField(mouseX, mouseY);
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
          const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * params.perturbStrength;
          field[index] = {
            x: Math.cos(angle),
            y: Math.sin(angle),
          };
        }
      }
    }
  }

  // Animation Loop
  function animate() {
    // Draw a semi-transparent rectangle for fading effect
    ctx.fillStyle = `rgba(255, 255, 255, ${params.fadeAlpha})`; //!MUST MATCH BACKGROUND COLOR
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Optionally, set stroke style based on noise or other factors for colorful effects
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)';

    // Update and draw particles
    particles.forEach((p) => {
      p.update();
      p.draw(ctx);
    });

    requestAnimationFrame(animate);
  }

  // Initialize canvas with white background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  animate();
  console.log("Flow Fields simulation started.");
}

// // Uncomment the following line if you want the simulation to start automatically without menu_script.js
// startSimulation3();
