// 3) STROKE
const wMin       = 0.01;     // min strokeWeight
const wMax       = 1.8;     // max strokeWeight
const alpha      = 10;       // per-line opacity (0–100)

function Particle(){
  this.pos = createVector(random(width), random(height));
  this.vel = createVector(0, 0);
  this.acc = createVector(0, 0);
  this.maxspeed = 3.2;
  
  this.prevPos = this.pos.copy();
  
  this.update = function(){
    this.vel.add(this.acc);
    this.vel.limit(this.maxspeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }
  
  this.follow = function(vectors){
    var x = floor(this.pos.x / scl);
    var y = floor(this.pos.y / scl);
    var index = x + y * cols;
    var force = vectors[index];
    this.applyForce(force);
  }
  
  this.applyForce = function(force){
    this.acc.add(force);
  }
  
  this.show = function() {
    // choose a gentle strokeWeight by local noise
    let n = noise(this.pos.x * 0.01, this.pos.y * 0.01);
    let w = lerp(wMin, wMax, n);
    strokeWeight(w);

    // pure B/W: hue=0, sat=0; brightness by noise or fixed low
    let b = lerp(20, 40, n);       // darker (20) → lighter (40)
    stroke(0, 0, b, alpha);

    // optional: soft shadow
    drawingContext.shadowBlur  = 2;
    drawingContext.shadowColor = color(0,0,b,alpha);

    // draw the line
    line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);

    // reset
    drawingContext.shadowBlur = 0;
    this.updatePrev();
  }
  
  this.showMirror = function() {
    // 1) same stroke settings as your original
    let n = noise(this.pos.x * 0.01, this.pos.y * 0.01);
    let w = lerp(wMin, wMax, n);
    let b = lerp(20, 40, n);
    strokeWeight(w);
    stroke(0, 0, b, alpha);
    drawingContext.shadowBlur  = 2;
    drawingContext.shadowColor = color(0, 0, b, alpha);

    // 2) draw the real particle path
    line(this.pos.x,      this.pos.y,
         this.prevPos.x, this.prevPos.y);
    drawingContext.shadowBlur = 0;

    // 3) compute the mirror *world‐space* coords
    let mx  = width      - this.pos.x;
    let my  = this.pos.y;
    let pmx = width      - this.prevPos.x;
    let pmy = this.prevPos.y;

    // 4) sample flowfield at mirror cell
    let ix   = constrain(floor(mx / scl),  0, cols - 1);
    let iy   = constrain(floor(my / scl),  0, rows - 1);
    let idx  = ix + iy * cols;
    let v    = flowfield[idx];

    // 5) nudge the mirror coords by that vector
    mx  += v.x * mirrorInfluence;
    my  += v.y * mirrorInfluence;
    pmx += v.x * mirrorInfluence;
    pmy += v.y * mirrorInfluence;

    // 6) draw the mirror path in world‐space
    strokeWeight(w);
    stroke(0, 0, b, alpha);
    line(mx,  my,
         pmx, pmy);

    // 7) update for next frame
    this.updatePrev();
  }

  this.showMirror2 = function() {
    // stroke setup
    let n = noise(this.pos.x * 0.01, this.pos.y * 0.01);
    let w = lerp(wMin, wMax, n);
    let b = lerp(20, 40, n);
    strokeWeight(w);
    stroke(0, 0, b, alpha);
    drawingContext.shadowBlur = 2;
    drawingContext.shadowColor = color(0, 0, b, alpha);

    // draw real line
    line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
    drawingContext.shadowBlur = 0;

    // radial petal mirror with jittered axes
    const cx = width/2, cy = height/2;
    // current point
    const a = atan2(this.pos.y - cy, this.pos.x - cx);
    const r = dist(this.pos.x, this.pos.y, cx, cy);
    const sa = TWO_PI / PETALS;
    let idx = floor((a + PI) / sa);
    // base axis
    let axisAng = (idx + 0.5) * sa - PI/2;
    // jitter to soften seams
    let jit = (noise(this.pos.x * 0.02, this.pos.y * 0.02, zoff) - 0.5) * sa * 0.4;
    axisAng += jit;
    let reflAng = 2 * axisAng - a;
    let mx = cx + cos(reflAng) * r;
    let my = cy + sin(reflAng) * r;

    // previous point
    const pa = atan2(this.prevPos.y - cy, this.prevPos.x - cx);
    const pr = dist(this.prevPos.x, this.prevPos.y, cx, cy);
    let pidx = floor((pa + PI) / sa);
    let pAxis = (pidx + 0.5) * sa - PI/2;
    let pjit = (noise(this.prevPos.x * 0.02, this.prevPos.y * 0.02, zoff) - 0.5) * sa * 0.4;
    pAxis += pjit;
    let pRefl = 2 * pAxis - pa;
    let pmx = cx + cos(pRefl) * pr;
    let pmy = cy + sin(pRefl) * pr;

    // nudge by flow
    let ix = constrain(floor(mx / scl), 0, cols-1);
    let iy = constrain(floor(my / scl), 0, rows-1);
    let v = flowfield[ix + iy * cols];
    mx += v.x * mirrorInfluence;
    my += v.y * mirrorInfluence;
    pmx += v.x * mirrorInfluence;
    pmy += v.y * mirrorInfluence;

    // draw mirrored
    strokeWeight(w);
    stroke(0, 0, b, alpha);
    line(mx, my, pmx, pmy);

    this.updatePrev();
  }
  
  
  this.updatePrev = function(){
    this.prevPos.x = this.pos.x;
    this.prevPos.y = this.pos.y;
  }
  
  this.edges = function(){
    if (this.pos.x > width) {
      this.pos.x = 0;
      this.updatePrev();
    }
    if (this.pos.x < 0) {
      this.pos.x = width;
      this.updatePrev();
    }
    if (this.pos.y > height) {
      this.pos.y = 0;
      this.updatePrev();
    }
    if (this.pos.y < 0) {
      this.pos.y = height;
      this.updatePrev();
    }
  }
  
}