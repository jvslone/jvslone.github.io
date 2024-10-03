// Select the canvas and get its context
const canvas = document.getElementById('testCanvas');
const ctx = canvas.getContext('2d');

// Constants
const outline_color = '#000000';
const radius = 7;

// Ball Conditions
let balls = [
    { x: 20, y: 20, dx: 5, dy: 3, color: '#B9975B'}, // Ball 1
    { x: 20, y: 40, dx: 6, dy: 4, color: '#115740'}, // Ball 2
    { x: 20, y: 60, dx: 7, dy: 5, color: '#F0B323'}, // Ball 3
    { x: 20, y: 80, dx: 8, dy: 6, color: '#D0D3D4'}, // Ball 4
    { x: 20, y: 100, dx: 8, dy: 6, color: '#00B388'}, // Ball 5
    { x: 20, y: 120, dx: 7, dy: 5, color: '#84344E'}, // Ball 6
    { x: 20, y: 140, dx: 6, dy: 4, color: '#E56A54'}, // Ball 7
    { x: 20, y: 160, dx: 5, dy: 3, color: '#789D4A'} // Ball 8
];

// Drawing
function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, radius, 0, 2 * Math.PI);
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

// Calculate distance between balls
function distance(ball1, ball2) {
    const Dx = ball2.x - ball1.x;
    const Dy = ball2.y - ball1.y;
    return Math.sqrt(Dx*Dx + Dy*Dy);
}

// Check collision of balls
function checkballCollision(ball1, ball2) {
    const dist = distance(ball1, ball2);
    return dist <= 2*radius;
}

// Handle ball collisions
function handleballCollisions() {
    for (let i = 0; i < balls.length; i++){
        for (let j = i + 1; j < balls.length; j++) {
            if (checkballCollision(balls[i], balls[j])) {
                balls[i].dx = -balls[i].dx;
                balls[i].dy = -balls[i].dy;
                balls[j].dx = -balls[j].dx;
                balls[j].dy = -balls[j].dy;
            }
        }
    }
}

// Handle wall collision
function handlewallCollision(ball) {
    if (ball.x + radius > canvas.width || ball.x - radius < 0) {
        ball.dx = -ball.dx; // Reverse x direction
    }
    if (ball.y + radius > canvas.height || ball.y - radius < 0) {
        ball.dy = -ball.dy; // Reverse y direction
    }
}

function animate() {
    // Clear canvas
    clearCanvas();

    // Draw loop
    for (let i = 0; i < balls.length; i++) {
        drawBall(balls[i]);
        balls[i].x += balls[i].dx;
        balls[i].y += balls[i].dy;
        handlewallCollision(balls[i]);
    }

    // Handle ball collisions
    handleballCollisions();

    // Start animation
    requestAnimationFrame(animate);
}

animate();