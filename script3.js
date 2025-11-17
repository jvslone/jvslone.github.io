// test3_sims.js
// Single canvas, three sims: Flow, Balls, Fluid

(() => {
  const canvas = document.getElementById("simCanvas");
  if (!canvas) {
    console.error("simCanvas not found");
    return;
  }
  const ctx = canvas.getContext("2d");
  let currentSim = null;

  let cssW = 0;
  let cssH = 0;
  let dpr = 1;

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    cssW = rect.width || 1;
    cssH = rect.height || 1;

  
    const rawDpr = window.devicePixelRatio || 1;
    dpr = Math.min(1.5, rawDpr);

    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (currentSim && typeof currentSim.onResize === "function") {
      currentSim.onResize(cssW, cssH);
    }
  }


  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Sim 1: Flow fields
  function createFlowSim() {
    const NUM_PARTICLES = 6000;
    const BASE_SPEED = 350;
    const MAX_STEP   = 15.0;
    const TIME_SCALE = 0.001;

    const COLOR1 = "rgba(17, 87, 64, 0.9)"; // W&M green
    const COLOR2 = "rgba(185, 151, 91, 0.8)"; // W&M gold

    const particles = [];
    const vortices = [];
    const VORTEX_LIFETIME = 5000;
    const VORTEX_RADIUS   = 200;
    const VORTEX_STRENGTH = 10.0;

    let lastTime = performance.now();
    let rafId = null;

    function randomPos() {
      const W = canvas.width  / dpr;
      const H = canvas.height / dpr;
      return { x: Math.random() * W, y: Math.random() * H };
    }

    function resetParticle(p) {
      const pos = randomPos();
      p.x = pos.x;
      p.y = pos.y;
      p.px = pos.x;
      p.py = pos.y;
      p.life = 0;
    }

    function initParticles() {
      particles.length = 0;
      for (let i = 0; i < NUM_PARTICLES; i++) {
        const pos = randomPos();
        particles.push({
          x: pos.x,
          y: pos.y,
          px: pos.x,
          py: pos.y,
          life: 0,
          colorIndex: i % 2
        });
      }
    }


    function baseFieldAngle(x, y, t) {
      const W = canvas.width  / dpr || 1;
      const H = canvas.height / dpr || 1;

      const u = x / W;
      const v = y / H;
      const tt = t * TIME_SCALE;
      const twoPi = Math.PI * 2;
      const sx = twoPi * u;
      const sy = twoPi * v;

      return (
        Math.sin(sx + tt * 1.3) * 1.1 +
        Math.cos(2 * sy - tt * 0.7) * 0.9 +
        Math.sin((sx + sy) * 0.7 + tt * 0.4)
      );
    }

    function addVortex(x, y) {
      vortices.push({
        x,
        y,
        created: performance.now(),
        strength: VORTEX_STRENGTH
      });
    }

    function fieldVector(x, y, t) {
      const baseAng = baseFieldAngle(x, y, t);
      let vx = Math.cos(baseAng);
      let vy = Math.sin(baseAng);

      const core2 = 20 * 20;

      for (const v of vortices) {
        const dx = x - v.x;
        const dy = y - v.y;
        const dist2 = dx * dx + dy * dy;
        if (dist2 < VORTEX_RADIUS * VORTEX_RADIUS && dist2 > 1e-4) {
          const dist = Math.sqrt(dist2);
          const falloff = 1 - dist / VORTEX_RADIUS;
          const tx = -dy;
          const ty =  dx;
          const mag = v.strength * falloff * VORTEX_RADIUS / (dist2 + core2);

          vx += tx * mag;
          vy += ty * mag;
        }
      }

      const len = Math.hypot(vx, vy) || 1;
      return { x: vx / len, y: vy / len };
    }

    function onClick(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width  / rect.width)  / dpr;
      const y = (e.clientY - rect.top)  * (canvas.height / rect.height) / dpr;
      addVortex(x, y);
    }

    function step(now) {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const W = canvas.width  / dpr;
      const H = canvas.height / dpr;

      ctx.fillStyle = "rgba(237, 234, 234, 0.15)";
      ctx.fillRect(0, 0, W, H);

      const cutoff = now - VORTEX_LIFETIME;
      for (let i = vortices.length - 1; i >= 0; i--) {
        if (vortices[i].created < cutoff) vortices.splice(i, 1);
      }

      const t = now;
      const stepLen = Math.min(MAX_STEP, BASE_SPEED * dt);

      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";

      for (const p of particles) {
        p.px = p.x;
        p.py = p.y;

        const v = fieldVector(p.x, p.y, t);

        p.x += v.x * stepLen;
        p.y += v.y * stepLen;

        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
          resetParticle(p);
          continue;
        }

        ctx.strokeStyle = p.colorIndex === 0 ? COLOR1 : COLOR2;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      rafId = requestAnimationFrame(step);
    }

    function start() {
      initParticles();
      lastTime = performance.now();
      const W = canvas.width  / dpr;
      const H = canvas.height / dpr;
      ctx.fillStyle = "#edeaea";
      ctx.fillRect(0, 0, W, H);
      rafId = requestAnimationFrame(step);
      canvas.addEventListener("click", onClick);
    }

    function stop() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      canvas.removeEventListener("click", onClick);
    }

    function onResize() {
      const W = canvas.width  / dpr;
      const H = canvas.height / dpr;
      ctx.fillStyle = "#edeaea";
      ctx.fillRect(0, 0, W, H);
    }

    start();
    return { stop, onResize };
  }

  // Sim 2: Bouncing balls
  function createBallsSim() {
    const outline = "#000000";
    const EPS = 1e-6;
    let rafId = null;
    let lastTime = performance.now();
  
    const balls = [
      { x: 120, y: 120, dx: 2000, dy:  2000, mass: 0.5, color: "#B9975B" },
      { x: 220, y: 180, dx: -2000, dy: -2000, mass: 0.5, color: "#115740" },
      { x: 340, y: 220, dx:  0, dy: 0, mass: 3, color: "#F0B323" },
      { x: 520, y: 260, dx: 0, dy:  0, mass: 3, color: "#D0D3D4" },
      { x: 420, y: 120, dx:  0, dy: 0, mass: 3, color: "#00B388" },
      { x: 600, y: 600, dx:  0, dy: 0, mass: 3, color: "#4b00b3ff" },
      { x: 700, y: 100, dx: 0, dy: 0, mass: 3, color: "#b30000ff" },
      { x: 100, y: 700, dx: 0, dy: 0, mass: 3, color: "#00b300ff" },
      { x: 300, y: 100, dx: 0, dy: 0, mass: 3, color: "#0000b3ff" },
      { x: 300, y: 200, dx: 0, dy: 0, mass: 3, color: "#b300b3ff" },
      { x: 300, y: 300, dx: 0, dy: 0, mass: 3, color: "#b3b300ff" },
      { x: 300, y: 400, dx: 0, dy: 0, mass: 3, color: "#00b3b3ff" },
      { x: 300, y: 500, dx: 0, dy: 0, mass: 3, color: "#b30000ff" },
      { x: 300, y: 600, dx: 0, dy: 0, mass: 3, color: "#0000b3ff" },
      
    ];

    function radius(m) {
      const k = 10;
      return Math.sqrt(m) * k;
    }

    const speedScale = 1;

    for (const b of balls) {
      b.dx *= speedScale;
      b.dy *= speedScale;
      b.r = radius(b.mass);
    }

    function clear() {
      ctx.fillStyle = "#edeaea";
      ctx.fillRect(0, 0, cssW, cssH);
    }

    function draw() {
      for (const b of balls) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
        ctx.strokeStyle = outline;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }

    function step(now) {
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;


      const W = canvas.width  / dpr;
      const H = canvas.height / dpr;

      clear();


      for (const b of balls) {

        b.x += b.dx * dt;
        b.y += b.dy * dt;

        if (b.x - b.r < 0) {
          b.x = b.r;
          b.dx = Math.abs(b.dx);   
        }
        if (b.x + b.r > W) {
          b.x = W - b.r;
          b.dx = -Math.abs(b.dx); 
        }


        if (b.y - b.r < 0) {
          b.y = b.r;
          b.dy = Math.abs(b.dy);
        }
        if (b.y + b.r > H) {
          b.y = H - b.r;
          b.dy = -Math.abs(b.dy); 
        }
      }

      // Collisions
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const a = balls[i];
          const b = balls[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist2 = dx * dx + dy * dy;
          const minDist = a.r + b.r;
          if (dist2 < minDist * minDist && dist2 > 1e-6) {
            const dist = Math.sqrt(dist2);
            const nx = dx / dist;
            const ny = dy / dist;

            // Separate overlap
            const overlap = minDist - dist;
            const totalMass = a.mass + b.mass;
            a.x -= nx * overlap * (b.mass / totalMass);
            a.y -= ny * overlap * (b.mass / totalMass);
            b.x += nx * overlap * (a.mass / totalMass);
            b.y += ny * overlap * (a.mass / totalMass);

            // 1D elastic along normal
            const va = a.dx * nx + a.dy * ny;
            const vb = b.dx * nx + b.dy * ny;
            const vaNew = (va * (a.mass - b.mass) + 2 * b.mass * vb) / totalMass;
            const vbNew = (vb * (b.mass - a.mass) + 2 * a.mass * va) / totalMass;

            a.dx += (vaNew - va) * nx;
            a.dy += (vaNew - va) * ny;
            b.dx += (vbNew - vb) * nx;
            b.dy += (vbNew - vb) * ny;
          }
        }
      }

      draw();
      rafId = requestAnimationFrame(step);
    }

    function start() {
      clear();
      lastTime = performance.now();
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      if (rafId !== null) cancelAnimationFrame(rafId);
    }

    function onResize() {
      clear();
    }

    start();
    return { stop, onResize };
  }


// Sim 3: Fluid-Like Illustration
function createFluidSim() {
  const numParticles = 5000;
  const particles = [];
  let rafId = null;

  function initParticles() {
    particles.length = 0;

    const W = canvas.width  / dpr;
    const H = canvas.height / dpr;

    for (let i = 0; i < numParticles; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        dx: (Math.random() - 0.5) * 5,
        dy: (Math.random() - 0.5) * 5,
        radius: 1.5
      });
    }
  }

  function step() {
    const W = canvas.width  / dpr;
    const H = canvas.height / dpr;

    // Clear background
    ctx.fillStyle = "#edeaea";
    ctx.fillRect(0, 0, W, H);

    for (const p of particles) {
      // Draw particle
      const sign = Math.sign(p.dx) * Math.sign(p.dy) || 0;
      const hue = 100 + 100 * sign;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      ctx.fill();

      // Update position
      p.x += p.dx;
      p.y += p.dy;

      // Bounce off walls
      if (p.x + p.radius > W || p.x - p.radius < 0) {
        p.dx = -p.dx;
      }
      if (p.y + p.radius > H || p.y - p.radius < 0) {
        p.dy = -p.dy;
      } else {
        if (Math.random() < numParticles / 50000) {
          p.dx = (Math.random() - 0.5) * 5;
          p.dy = (Math.random() - 0.5) * 5;
        }
        if (Math.random() < numParticles / 250000) {
          p.dx = (Math.random() - 0.5) * 7.5;
          p.dy = (Math.random() - 0.5) * 7.5;
        }
      }
    }

    rafId = requestAnimationFrame(step);
  }

  function start() {
    initParticles();
    step();
  }

  function stop() {
    if (rafId !== null) cancelAnimationFrame(rafId);
  }

  function onResize() {
    initParticles();
  }

  start();
  return { stop, onResize };
}

  // Code for switching between simulations

  function setActiveButton(simName) {
    const buttons = document.querySelectorAll(".sim-toggle");
    buttons.forEach(btn => {
      if (btn.dataset.sim === simName) btn.classList.add("active");
      else btn.classList.remove("active");
    });
  }

  function switchSim(simName) {
    if (currentSim && typeof currentSim.stop === "function") {
      currentSim.stop();
    }

    if (simName === "flow")      currentSim = createFlowSim();
    else if (simName === "balls") currentSim = createBallsSim();
    else if (simName === "fluid") currentSim = createFluidSim();
    else                          currentSim = createFlowSim();

    setActiveButton(simName);
  }

  document.querySelectorAll(".sim-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const simName = btn.dataset.sim;
      switchSim(simName);
    });
  });

  // Start with Flow
  switchSim("flow");
})();
