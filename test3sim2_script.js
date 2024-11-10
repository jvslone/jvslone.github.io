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
              dx: (Math.random() - 0.5) * 5,
              dy: (Math.random() - 0.5) * 5,
              radius: 1.5,
          });
      }
  }

  function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
          // Draw the particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
          ctx.fillStyle = `hsl(${100 + 100*Math.sign(particle.dx)*(Math.sign(particle.dy))}, 100%, 50%)`;
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
          else {
            if (Math.random() < numParticles/50000) {
              particle.dx = (Math.random() - 0.5) * 5;
              particle.dy = (Math.random() - 0.5) * 5;
            }
            if (Math.random() < numParticles/250000) {
              particle.dx = (Math.random() - 0.5) * 7.5;
              particle.dy = (Math.random() - 0.5) * 7.5;
            }
          }
      });

      requestAnimationFrame(animate);
  }

  createParticles();
  animate();
  console.log("Simulation started.");
}

startSimulation2();
