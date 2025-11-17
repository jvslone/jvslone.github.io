let myCnnModel;
const CLASSES = ['Bird', 'Cat', 'Fish', 'Horse', 'Rabbit', 'Penguin'];

function updateLogitsBar(logitsArray) {
    const container = document.getElementById('logits-readout');
    if (!container || !logitsArray) return;

    const logits = Array.from(logitsArray);
    if (logits.length !== CLASSES.length) return;

    const maxVal = Math.max(...logits);
    const maxIdx = logits.indexOf(maxVal);

    container.innerHTML = '';

    logits.forEach((val, i) => {
        const span = document.createElement('span');
        span.classList.add('logit-item');
        if (i === maxIdx) span.classList.add('max-logit');

        span.textContent = `${CLASSES[i]}: ${val.toFixed(3)}`;

        container.appendChild(span);
    });
}

updateLogitsBar(new Array(CLASSES.length).fill(0.0));

(async () => {
    try {
        myCnnModel = await tf.loadGraphModel('tfjs_model/model.json');
        console.log("Model loaded!");
        const outputElement = document.getElementById('prediction-output');
        if (outputElement) {
            outputElement.innerText = "Model loaded. Draw a bird, cat, fish, horse, or rabbit!";
        }
    } catch (e) {
        console.error("Error loading model:", e);
        const outputElement = document.getElementById('prediction-output');
        if (outputElement) {
            outputElement.innerText = "Error loading model. See console.";
        }
    }
})();

async function classifyDrawing(pixelData) {
    if (!myCnnModel) {
        console.log("Model not loaded yet.");
        return;
    }

    const W = 512;
    const H = 512;
    const TARGET_W = 28;
    const TARGET_H = 28;

    let logits, label;

    try {
        const inputTensor = tf.tensor(pixelData, [H, W], 'float32').div(255.0);

        const maxVal = (await inputTensor.max().data())[0];
        if (maxVal === 0 || isNaN(maxVal)) {
            console.log("Empty canvas detected.");
            logits = [0, 0, 0, 0, 0, 0];
            label = 0;
            inputTensor.dispose();
        } else {
            const nonZeroMask = inputTensor.greater(0);
            const nonZeroCoordsT = await tf.whereAsync(nonZeroMask);
            const nonZeroCoords = await nonZeroCoordsT.array();

            nonZeroMask.dispose();
            nonZeroCoordsT.dispose();

            if (nonZeroCoords.length === 0) {
                console.log("No non-zero pixels found.");
                logits = [0, 0, 0, 0, 0, 0];
                label = 0;
                inputTensor.dispose();
            } else {
                let yMin = H, yMax = 0, xMin = W, xMax = 0;
                for (const [y, x] of nonZeroCoords) {
                    if (y < yMin) yMin = y;
                    if (y > yMax) yMax = y;
                    if (x < xMin) xMin = x;
                    if (x > xMax) xMax = x;
                }

                const boxPad = 20;
                const yMinPad = Math.max(0, yMin - boxPad);
                const yMaxPad = Math.min(H - 1, yMax + boxPad);
                const xMinPad = Math.max(0, xMin - boxPad);
                const xMaxPad = Math.min(W - 1, xMax + boxPad);

                let height = yMaxPad - yMinPad + 1;
                let width  = xMaxPad - xMinPad + 1;
                if (height <= 0) height = 1;
                if (width  <= 0) width  = 1;

                const croppedTensor = inputTensor.slice([yMinPad, xMinPad], [height, width]);

                const maxDim = Math.max(height, width);
                const padH = Math.floor((maxDim - height) / 2);
                const padW = Math.floor((maxDim - width) / 2);

                const paddedSquare = croppedTensor.pad(
                    [[padH, maxDim - height - padH], [padW, maxDim - width - padW]],
                    0
                );

                const reshaped = paddedSquare.reshape([1, maxDim, maxDim, 1]);
                const resizedTensor = tf.image.resizeBilinear(reshaped, [TARGET_H, TARGET_W]);

                const logitsT = myCnnModel.predict(resizedTensor);
                const labelT  = logitsT.argMax(1);

                logits = await logitsT.data();
                label  = (await labelT.data())[0];

                logitsT.dispose();
                labelT.dispose();
                resizedTensor.dispose();
                reshaped.dispose();
                paddedSquare.dispose();
                croppedTensor.dispose();
                inputTensor.dispose();
            }
        }
    } catch (e) {
        console.error("Error during classifyDrawing:", e);
        logits = [0, 0, 0, 0, 0, 0];
        label = 0;
    }

    console.log("Logits (raw model output):", logits);
    const predictionName = CLASSES[label];
    console.log("Prediction (inferred label):", label, predictionName);

    updateLogitsBar(logits);

    const outputElement = document.getElementById('prediction-output');
    if (outputElement) {
        outputElement.innerText = `Prediction: ${predictionName}`;
    }
}


(() => {
    const canvas = document.getElementById('drawing_canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

   
    const W = 512, H = 512; 
    const ON = 255; 
    const OFF = 0;
    const BRUSH_SIZE = 5;
    const pix = new Uint8Array(W * H);

    const history = [];
    const MAX_HISTORY = 50;

    canvas.width = W;
    canvas.height = H;

    let imgData = ctx.createImageData(W, H);

    function render() {
        const data = imgData.data;
        for (let p = 0, i = 0; p < pix.length; p++, i += 4) {
            const v = 255 - pix[p];
            data[i] = v; data[i+1] = v; data[i+2] = v; data[i+3] = 255;
        }
        ctx.putImageData(imgData, 0, 0);
    }

    function setPixel(x, y, v = ON) {
        if (isNaN(x) || isNaN(y)) {
            console.error("Invalid coordinates passed to setPixel:", x, y);
            return;
        }
        for (let i = -BRUSH_SIZE; i < BRUSH_SIZE; i++) {
            for (let j = -BRUSH_SIZE; j < BRUSH_SIZE; j++) {
                const px = x + i;
                const py = y + j;
                if (px >= 0 && py >= 0 && px < W && py < H) {
                    pix[py * W + px] = v;
                }
            }
        }
    }

    function line(x0, y0, x1, y1, v = ON) {
        if (isNaN(x0) || isNaN(y0) || isNaN(x1) || isNaN(y1)) {
            console.error("Invalid coordinates passed to line:", x0, y0, x1, y1);
            return;
        }
        let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let err = dx + dy;
        while (true) {
            setPixel(x0, y0, v);
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 >= dy) { err += dy; x0 += sx; }
            if (e2 <= dx) { err += dx; y0 += sy; }
        }
    }

    function eventToPixel(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = (e.clientX ?? e.touches?.[0]?.clientX);
        const clientY = (e.clientY ?? e.touches?.[0]?.clientY);
        if (clientX == null || clientY == null) return null;

        const cx = clientX - rect.left;
        const cy = clientY - rect.top;
        const sx = canvas.width / rect.width;
        const sy = canvas.height / rect.height;
        return { x: Math.floor(cx * sx), y: Math.floor(cy * sy) };
    }

    let drawing = false;
    let last = null;

    function pushHistorySnapshot() {
        history.push(pix.slice());
        if (history.length > MAX_HISTORY) {
            history.shift();
        }
    }

    function undoLastStroke() {
        if (history.length === 0) {
            console.log("Nothing to undo.");
            pix.fill(OFF);
        } else {
            const prev = history.pop();
            pix.set(prev);
        }
        render();
        classifyDrawing(pix);
    }

    const start = (e) => {
        const p = eventToPixel(e);
        if (!p) return;

        pushHistorySnapshot();

        drawing = true;
        last = p;
        setPixel(last.x, last.y);
        render();
    };

    const move  = (e) => {
        if (!drawing) return;
        const p = eventToPixel(e);
        if (!p || !last) {
            drawing = false;
            last = null;
            return;
        };
        line(last.x, last.y, p.x, p.y);
        last = p;
        render();
    };

    const end   = () => {
        if (!drawing) return;
        drawing = false;
        last = null;
        classifyDrawing(pix);
    };

    // Mouse
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', end);
    canvas.addEventListener('mouseleave', end);

    // Touch
    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); start(e); }, { passive: false });
    canvas.addEventListener('touchmove',  (e) => { e.preventDefault(); move(e);  }, { passive: false });
    canvas.addEventListener('touchend', end);

    // Undo button
    const undoButton = document.getElementById('undo-button');
    if (undoButton) {
        undoButton.addEventListener('click', () => {
            undoLastStroke();
        });
    }

    // Ctrl+Z for undo
    document.addEventListener('keydown', (e) => {
        const isUndoKey = (e.key === 'z' || e.key === 'Z') && (e.ctrlKey || e.metaKey);
        if (isUndoKey) {
            e.preventDefault();
            undoLastStroke();
        }
    });

    // Initialize white canvas
    pix.fill(OFF);
    render();
})();

console.log("Script loaded. Ready to draw and classify!");