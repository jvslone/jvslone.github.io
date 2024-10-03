// Select the canvas and get its context
const canvas = document.getElementById('networkCanvas');
const ctx = canvas.getContext('2d');

//Constants
const node_color = '#B9975B';
const node_outline = '#000000';
const edge_color = '#115740';
const radius = 7;

// Define the neural network structure (simple 3-layer network)
const layers = [
    { nodes: 3, x: 100 },
    { nodes: 5, x: 200 },
    { nodes: 7, x: 300 },
    { nodes: 9, x: 400 },
    { nodes: 7, x: 500 },
    { nodes: 5, x: 600 },
    { nodes: 3, x: 700 }
];


// Draw nodes and connections
function drawNeuralNetwork() {
    for (let layerIndex = 0; layerIndex < layers.length; layerIndex++) {
        const layer = layers[layerIndex];
        const ySpacing = canvas.height / (layer.nodes + 1);

        for (let nodeIndex = 0; nodeIndex < layer.nodes; nodeIndex++) {
            const x = layer.x;
            const y = ySpacing * (nodeIndex + 1);

            // Draw nodes
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = node_color;
            ctx.fill();
            ctx.strokeStyle = node_outline;
            ctx.stroke();

            // Draw connections to next layer
            if (layerIndex < layers.length - 1) {
                const nextLayer = layers[layerIndex + 1];
                const nextYSpacing = canvas.height / (nextLayer.nodes + 1);
                for (let nextNodeIndex = 0; nextNodeIndex < nextLayer.nodes; nextNodeIndex++) {
                    const nextX = nextLayer.x;
                    const nextY = nextYSpacing * (nextNodeIndex + 1);

                    // Draw Connections
                    ctx.beginPath();
                    ctx.moveTo(x + radius, y);
                    ctx.lineTo(nextX - radius, nextY);
                    ctx.strokeStyle = edge_color;
                    ctx.stroke();
                }
            }
        }
    }
}

// Call the function to draw the neural network
drawNeuralNetwork();
