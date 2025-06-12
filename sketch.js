// ---------------------------
// Global Parameters
// ---------------------------
let fr;                   // P5.js paragraph to display frame rate
let cols, rows;           // Number of columns & rows in the flow field grid
let flowfield = [];       // Array storing the vector field (p5.Vector)
let particles = [];       // Array of Particle objects
let colOffset = [];       // Per-column random offsets to break perfect repetition
let startTime = 0;        // Time when sketch started
const mirrorInfluence = 0.6;  // Blend factor for mirrored particles

// Time limit (ms)
const MAX_TIME       = 180 * 1000;

// Flow field parameters
const scl            = 10;      // Grid cell size
const inc            = 0.95;    // Noise increment for y-axis
let   zoff           = 0.002;  // Time slice for 3D noise

// Tileable noise parameters (wraparound)
const TILE           = 100;     // Tile size for noise repetition
const RADI         = 5;      // Radius for circular noise domain

// Column bias: each column gets a slight angular offset
const X_OFFSET_STEP  = .05; //0.05

// Number of particles
const particleCount  = 300;
const PETALS = 2;    // number of radial mirror axes


// ---------------------------
// p5.js Lifecycle
// ---------------------------
function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas-container');
  canvas.style('display', 'block');
  canvas.style('margin', '0 auto');
  
  startTime = millis();

  colorMode(HSB, 350, 100, 100, 100);
  cols = floor(width / scl);
  rows = floor(height / scl);
  fr = createP('').style('text-align', 'center');

  flowfield = new Array(cols * rows);

  for (let x = 0; x < cols; x++) {
    colOffset[x] = random(1000);
  }

  for (let i = 0; i < particleCount; i++) {
    particles[i] = new Particle();
  }

  background(95);
}

function draw() {
  // Stop after MAX_TIME
  if (millis() - startTime > MAX_TIME) {
    noLoop();
    return;
  }

  updateFlowField();                    // Recompute vector field each frame

  // Update and draw each particle
  for (let p of particles) {
    p.follow(flowfield);                // Apply flow field force
    p.update();                         // Move according to velocity
    p.edges();                          // Handle wrapping or bouncing
    // p.show();                        // Optionally draw particle itself
    p.showMirror();                     // Draw mirrored trail
  }

  fr.html(floor(frameRate()));         // Display FPS
}

// ---------------------------
// Compute flow field
// ---------------------------
function updateFlowField() {
  let yoff = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let idx = x + y * cols;
      let u = cos(TWO_PI * x / TILE) * RADI;
      
      let n = noise(u + colOffset[x], yoff, zoff);
      let bias = (x - cols/2) * X_OFFSET_STEP;
      let ang = n * TWO_PI * 3 + bias;
      flowfield[idx] = p5.Vector.fromAngle(ang).setMag(0.5);
    }
    yoff += inc;
  }
  zoff += 0.001;
}

