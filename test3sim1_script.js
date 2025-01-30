function startSimulation1() {
    // Select the canvas and get its context
    const canvas = document.getElementById('testCanvas');
    const ctx = canvas.getContext('2d');

    // Constants
    const outline_color = '#000000';
    const timeStep = 1; // Adjust as needed for performance and accuracy
    const EPSILON = 1e-6; // Small value to prevent floating-point issues
    

    // Ball Conditions
    // let balls = [
    //     { x: 100, y: 100, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#B9975B' }, // Ball 1
    //     { x: 150, y: 120, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#115740' }, // Ball 2
    //     { x: 200, y: 140, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#F0B323' }, // Ball 3
    //     { x: 250, y: 160, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#D0D3D4' }, // Ball 4
    //     { x: 300, y: 180, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#00B388' }, // Ball 5
    //     { x: 350, y: 200, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#84344E' }, // Ball 6
    //     { x: 400, y: 220, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#E56A54' }, // Ball 7
    //     { x: 450, y: 240, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#789D4A' }, // Ball 8
    //     { x: 500, y: 260, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#D83FBA' }, // Ball 9
    //     { x: 550, y: 280, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#3FCCD8' } // Ball 10
    // ];
    let balls = [
        { x: 100, y: 100, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#B9975B' }, // Ball 1
        { x: 150, y: 120, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#115740' }, // Ball 2
        { x: 200, y: 140, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#F0B323' }, // Ball 3
        { x: 250, y: 160, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#D0D3D4' }, // Ball 4
        { x: 300, y: 180, dx: 20*(Math.random() - 0.5), dy: 20*(Math.random() - 0.5), mass: 1 + 10*Math.random(), color: '#00B388' }, // Ball 5
    ];


    // Calculate radius based on mass (assuming uniform density)
    function calculateRadius(mass) {
        const radiusScale = 5; // Adjust this constant to scale the sizes
        return Math.sqrt(mass) * radiusScale;
    }

    // Drawing
    function drawBall(ball) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.strokeStyle = outline_color;
        ctx.stroke();
        ctx.closePath();
    }

    // Clear canvas
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Initialize balls (calculate radii based on masses)
    for (let i = 0; i < balls.length; i++) {
        balls[i].radius = calculateRadius(balls[i].mass);
    }

    // Function to detect and handle collisions between balls using CCD
    function handleBallCollisionsCCD() {
        let timeRemaining = timeStep;

        while (timeRemaining > EPSILON) {
            let earliestCollision = {
                time: timeRemaining,
                ball1: null,
                ball2: null,
                wall: null
            };

            // Check for collisions between balls and walls
            for (let i = 0; i < balls.length; i++) {
                let ball1 = balls[i];

                // Predict wall collisions
                let wallCollision = predictWallCollision(ball1, timeRemaining);
                if (wallCollision && wallCollision.time < earliestCollision.time - EPSILON) {
                    earliestCollision = { ...wallCollision, ball1, ball2: null };
                }

                for (let j = i + 1; j < balls.length; j++) {
                    let ball2 = balls[j];
                    let collisionTime = predictBallCollision(ball1, ball2, timeRemaining);

                    if (collisionTime !== null && collisionTime < earliestCollision.time - EPSILON) {
                        earliestCollision = {
                            time: collisionTime,
                            ball1,
                            ball2,
                            wall: null
                        };
                    }
                }
            }

            // Advance all balls to the time of earliest collision
            if (earliestCollision.time > EPSILON) {
                for (let ball of balls) {
                    ball.x += ball.dx * earliestCollision.time;
                    ball.y += ball.dy * earliestCollision.time;
                }
            }

            timeRemaining -= earliestCollision.time;

            // Prevent infinite loops
            if (timeRemaining < EPSILON) {
                timeRemaining = 0;
            }

            // Resolve the earliest collision
            if (earliestCollision.ball2) {
                resolveBallCollision(earliestCollision.ball1, earliestCollision.ball2);
            } else if (earliestCollision.wall !== null) {
                resolveWallCollision(earliestCollision.ball1, earliestCollision.wall);
            } else {
                // No collisions remaining in this time step
                // Advance the remaining time
                if (timeRemaining > EPSILON) {
                    for (let ball of balls) {
                        ball.x += ball.dx * timeRemaining;
                        ball.y += ball.dy * timeRemaining;
                    }
                }
                break;
            }
        }
    }

    // Predict collision time between two balls
    function predictBallCollision(ball1, ball2, maxTime) {
        const dvx = ball1.dx - ball2.dx;
        const dvy = ball1.dy - ball2.dy;
        const drx = ball1.x - ball2.x;
        const dry = ball1.y - ball2.y;
        const radii = ball1.radius + ball2.radius;

        const a = dvx * dvx + dvy * dvy;
        const b = 2 * (drx * dvx + dry * dvy);
        const c = drx * drx + dry * dry - radii * radii;

        if (Math.abs(a) < EPSILON) {
            // Objects are moving with the same velocity
            if (Math.abs(b) < EPSILON) {
                // Objects are stationary relative to each other
                return null;
            } else {
                const t = -c / b;
                if (t >= 0 && t <= maxTime) {
                    return t;
                } else {
                    return null;
                }
            }
        }

        const discriminant = b * b - 4 * a * c;

        if (discriminant < 0) {
            // No real roots, no collision
            return null;
        }

        const sqrtDisc = Math.sqrt(discriminant);
        const t1 = (-b - sqrtDisc) / (2 * a);
        const t2 = (-b + sqrtDisc) / (2 * a);

        let collisionTime = null;

        if (t1 >= EPSILON && t1 <= maxTime) {
            collisionTime = t1;
        }
        if (t2 >= EPSILON && t2 <= maxTime) {
            if (collisionTime === null || t2 < collisionTime) {
                collisionTime = t2;
            }
        }

        return collisionTime;
    }

    // Predict collision time with walls
    function predictWallCollision(ball, maxTime) {
        let times = [];

        // Left wall
        if (ball.dx < -EPSILON) {
            const t = (ball.radius - ball.x) / ball.dx;
            if (t >= EPSILON && t <= maxTime) {
                times.push({ time: t, wall: 'left' });
            }
        }
        // Right wall
        if (ball.dx > EPSILON) {
            const t = (canvas.width - ball.radius - ball.x) / ball.dx;
            if (t >= EPSILON && t <= maxTime) {
                times.push({ time: t, wall: 'right' });
            }
        }
        // Top wall
        if (ball.dy < -EPSILON) {
            const t = (ball.radius - ball.y) / ball.dy;
            if (t >= EPSILON && t <= maxTime) {
                times.push({ time: t, wall: 'top' });
            }
        }
        // Bottom wall
        if (ball.dy > EPSILON) {
            const t = (canvas.height - ball.radius - ball.y) / ball.dy;
            if (t >= EPSILON && t <= maxTime) {
                times.push({ time: t, wall: 'bottom' });
            }
        }

        if (times.length > 0) {
            times.sort((a, b) => a.time - b.time);
            return times[0]; // Return the earliest wall collision
        }

        return null;
    }

    // Resolve collision between two balls
    function resolveBallCollision(ball1, ball2) {
        const m1 = ball1.mass;
        const m2 = ball2.mass;

        const dx = ball1.x - ball2.x;
        const dy = ball1.y - ball2.y;
        const dist = Math.hypot(dx, dy);
        const nx = dx / dist;
        const ny = dy / dist;

        // Relative velocity
        const dvx = ball1.dx - ball2.dx;
        const dvy = ball1.dy - ball2.dy;

        // Relative velocity along the normal
        const vn = dvx * nx + dvy * ny;

        // No need to resolve if velocities are separating
        if (vn > -EPSILON) return;

        // Compute impulse scalar
        const restitution = 1; // For elastic collision
        const impulse = (-(1 + restitution) * vn) / (1 / m1 + 1 / m2);

        const impulseX = impulse * nx;
        const impulseY = impulse * ny;

        // Update velocities
        ball1.dx += impulseX / m1;
        ball1.dy += impulseY / m1;
        ball2.dx -= impulseX / m2;
        ball2.dy -= impulseY / m2;
    }

    // Resolve collision with wall
    function resolveWallCollision(ball, wall) {
        if (wall === 'left' || wall === 'right') {
            ball.dx = -ball.dx;
        } else if (wall === 'top' || wall === 'bottom') {
            ball.dy = -ball.dy;
        }
    }

    // Main animation loop
    function animate() {
        // Clear canvas
        clearCanvas();

        // Handle collisions and update positions using CCD
        handleBallCollisionsCCD();

        // Draw balls
        for (let ball of balls) {
            drawBall(ball);
        }

        // Start next frame
        requestAnimationFrame(animate);
    }

    animate();
}

startSimulation1();