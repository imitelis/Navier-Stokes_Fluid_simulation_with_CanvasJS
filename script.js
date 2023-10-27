const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let width = canvas.width;
let height = canvas.height;

const scale = 1;
let X = width;
let Y = height;
// let iter = 12;

let mouse = {
  x: undefined,
  y: undefined,
};

/*
Function of diffuse
- b : int
- x : float[]
- x0 : float[]
- diff : float
- dt : flaot
*/

function diffuse(b, x, x0, diff, dt) {
  let a = dt * diff * (X - 2) * (Y - 2);
  lin_solve(b, x, x0, a, 1 + 6 * a);
}

/*
Function of solving linear differential equation
- b : int
- x : float[]
- x0 : float[]
- a : float
- c : float
*/

function lin_solve(b, x, x0, a, c) {
  let cRecip = 1.0 / c;
  // for (let t = 0; t < iter; t++) {
  for (let j = 1; j < Y - 1; j++) {
    for (let i = 1; i < X - 1; i++) {
      x[IX(i, j)] =
        (x0[IX(i, j)] +
          a *
            (x[IX(i + 1, j)] +
              x[IX(i - 1, j)] +
              x[IX(i, j + 1)] +
              x[IX(i, j - 1)])) *
        cRecip;
    }
  }
  set_bnd(b, x);
  // }
}

/*
Function of project : This operation runs through all the cells and fixes them up so everything is in equilibrium.
- velocX : float[]
- velocY : float[]
- p : float[]
- div : float[]
*/

function project(velocX, velocY, p, div) {
  for (let j = 1; j < Y - 1; j++) {
    for (let i = 1; i < X - 1; i++) {
      div[IX(i, j)] =
        (-0.5 *
          (velocX[IX(i + 1, j)] -
            velocX[IX(i - 1, j)] +
            velocY[IX(i, j + 1)] -
            velocY[IX(i, j - 1)])) /
        X;
      p[IX(i, j)] = 0;
    }
  }

  set_bnd(0, div);
  set_bnd(0, p);
  lin_solve(0, p, div, 1, 6);

  for (let j = 1; j < Y - 1; j++) {
    for (let i = 1; i < X - 1; i++) {
      velocX[IX(i, j)] -= 0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)]) * X;
      velocY[IX(i, j)] -= 0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)]) * Y;
    }
  }

  set_bnd(1, velocX);
  set_bnd(2, velocY);
}

/*
Function of advect: responsible for actually moving things around
- b : int
- d : float[]
- d0 : float[]
- velocX : float[]
- velocY : float[]
- velocZ : float[]
- dt : float[]
*/

function advect(b, d, d0, velocX, velocY, dt) {
  let i0, i1, j0, j1;

  let dtx = dt * (X - 2);
  let dty = dt * (Y - 2);

  let s0, s1, t0, t1;
  let tmp1, tmp2, tmp3, x, y;

  let Xfloat = X - 2;
  let Yfloat = Y - 2;
  let ifloat, jfloat;
  let i, j, k;

  for (j = 1, jfloat = 1; j < Yfloat - 1; j++, jfloat++) {
    for (i = 1, ifloat = 1; i < Xfloat - 1; i++, ifloat++) {
      tmp1 = dtx * velocX[IX(i, j)];
      tmp2 = dty * velocY[IX(i, j)];
      x = ifloat - tmp1;
      y = jfloat - tmp2;

      if (x < 0.5) x = 0.5;
      if (x > Xfloat + 0.5) x = Xfloat + 0.5;
      i0 = Math.floor(x);
      i1 = i0 + 1.0;
      if (y < 0.5) y = 0.5;
      if (y > Yfloat + 0.5) y = Yfloat + 0.5;
      j0 = Math.floor(y);
      j1 = j0 + 1.0;

      s1 = x - i0;
      s0 = 1.0 - s1;
      t1 = y - j0;
      t0 = 1.0 - t1;

      let i0i = parseInt(i0);
      let i1i = parseInt(i1);
      let j0i = parseInt(j0);
      let j1i = parseInt(j1);

      d[IX(i, j)] =
        s0 * (t0 * d0[IX(i0i, j0i)] + t1 * d0[IX(i0i, j1i)]) +
        s1 * (t0 * d0[IX(i1i, j0i)] + t1 * d0[IX(i1i, j1i)]);
    }
  }

  set_bnd(b, d);
}

/*
Function of dealing with situation with boundary cells.
- b : int
- x : float[]
*/

function set_bnd(b, x) {
  for (let i = 1; i < X - 1; i++) {
    x[IX(i, 0)] = b == 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
    x[IX(i, Y - 1)] = b == 2 ? -x[IX(i, Y - 2)] : x[IX(i, Y - 2)];
  }
  for (let j = 1; j < Y - 1; j++) {
    x[IX(0, j)] = b == 1 ? -x[IX(1, j)] : x[IX(1, j)];
    x[IX(X - 1, j)] = b == 1 ? -x[IX(X - 2, j)] : x[IX(X - 2, j)];
  }

  x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
  x[IX(0, Y - 1)] = 0.5 * (x[IX(1, Y - 1)] + x[IX(0, Y - 2)]);
  x[IX(X - 1, 0)] = 0.5 * (x[IX(X - 2, 0)] + x[IX(X - 1, 1)]);
  x[IX(X - 1, Y - 1)] = 0.5 * (x[IX(X - 2, Y - 1)] + x[IX(X - 1, Y - 2)]);
}

// function to use 1D array and fake the extra two dimensions --> 3D
function IX(x, y) {
  return x + y * X;
}

function drawLine(x1, y1, x2, y2, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.stroke();
}

// Fluid cube class
class Fluid {
  constructor(dt, diffusion, viscosity) {
    // this.size = N;
    this.dt = dt;
    this.diff = diffusion;
    this.visc = viscosity;

    this.s = new Array(X * Y).fill(0);
    this.density = new Array(X * Y).fill(0);

    this.Vx = new Array(X * Y).fill(0);
    this.Vy = new Array(X * Y).fill(0);

    this.Vx0 = new Array(X * Y).fill(0);
    this.Vy0 = new Array(X * Y).fill(0);
  }

  // step method
  step() {
    let visc = this.visc;
    let diff = this.diff;
    let dt = this.dt;
    let Vx = this.Vx;
    let Vy = this.Vy;
    let Vx0 = this.Vx0;
    let Vy0 = this.Vy0;
    let s = this.s;
    let density = this.density;

    diffuse(1, Vx0, Vx, visc, dt);
    diffuse(2, Vy0, Vy, visc, dt);

    project(Vx0, Vy0, Vx, Vy);

    advect(1, Vx, Vx0, Vx0, Vy0, dt);
    advect(2, Vy, Vy0, Vx0, Vy0, dt);

    project(Vx, Vy, Vx0, Vy0);
    diffuse(40, s, density, diff, dt);
    advect(0, density, s, Vx, Vy, dt);
  }

  // method to add density
  addDensity(x, y, amount) {
    let index = IX(x, y);
    this.density[index] += amount;
  }

  // method to add velocity
  addVelocity(x, y, amountX, amountY) {
    let index = IX(x, y);
    this.Vx[index] += amountX * 48;
    this.Vy[index] += amountY * 48;
  }

  // function to render density
  renderD() {
    for (let i = 0; i < X; i++) {
      for (let j = 0; j < Y; j++) {
        let x = i;
        let y = j;
        let d = this.density[IX(i, j)] * 0.00392156862; // * 1/255
        ctx.fillStyle = `rgba(255, 105, 180, ${d})`;
        ctx.strokeStyle = "transparent";
        ctx.fillRect(x, y, scale, scale);
        // fill(d);
        // noStroke();
        // rect(x, y, scale, scale);
      }
    }
  }

  // function to render velocity
  renderV() {
    for (let i = 0; i < X; i++) {
      for (let j = 0; j < Y; j++) {
        let x = i;
        let y = j;
        let vx = this.Vx[IX(i, j)];
        let vy = this.Vy[IX(i, j)];
        ctx.strokeStyle = "black";

        if (!(abs(vx) < 0.1 && abs(vy) <= 0.1)) {
          drawLine(x, y, x + vx * scale, y + vy * scale, "rgb(255, 105, 180)");
          // line(x, y, x + vx * scale, y + vy * scale)
        }
      }
    }
  }
}

// default: new Fluid(0.2, 0, 0.0000001);
const fluid = new Fluid(0.2, 0, 0.000001);

let t = 0; // Initialize time variable
let num = Math.floor(Math.random() * 4) + 1;

function draw() {
  ctx.clearRect(0, 0, width, height);
  // ctx.strokeStyle = '#FF69B4';
  ctx.lineWidth = 2;

  const cx = Math.floor(0.5 * width);
  const cy = Math.floor(0.5 * height);
  const fx1 = Math.floor(0.5 * width);
  const fy1 = Math.floor(0.2 * height);
  const fx2 = Math.floor(0.3 * width);
  const fy2 = Math.floor(0.8 * height);
  const fx3 = Math.floor(0.7 * width);
  const fy3 = Math.floor(0.8 * height);
  const rx1 = Math.floor(Math.random() * width);
  const ry1 = Math.floor(Math.random() * height);
  const rx2 = Math.floor(Math.random() * width);
  const ry2 = Math.floor(Math.random() * height);
  const rx3 = Math.floor(Math.random() * width);
  const ry3 = Math.floor(Math.random() * height);

  const currentTime = new Date().getTime();
  const rotationSpeed = 0.0002;
  const angle = currentTime * rotationSpeed;
  const vx = Math.cos(angle) * 0.2;
  const vy = Math.sin(angle) * 0.2;

  if (t < 960) {
    if (num == 1) {
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          fluid.addDensity(rx1 + i, ry1 + j, Math.random() * 100 + 50);
          fluid.addDensity(rx2 + i, ry2 + j, Math.random() * 100 + 50);
          fluid.addDensity(rx3 + i, ry3 + j, Math.random() * 100 + 50);
        }
      }
      fluid.addVelocity(rx1, ry1, vx, vy);
      fluid.addVelocity(rx2, ry2, vx, vy);
      fluid.addVelocity(rx3, ry3, vx, vy);
    } else if (num == 2) {
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          fluid.addDensity(cx + i, cy + j, Math.random() * 100 + 50);
        }
      }
      fluid.addVelocity(cx, cy, vx, vy);
    } else if (num == 3) {
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          fluid.addDensity(fx1 + i, fy1 + j, Math.random() * 100 + 50);
          fluid.addDensity(fx2 + i, fy2 + j, Math.random() * 100 + 50);
          fluid.addDensity(fx3 + i, fy3 + j, Math.random() * 100 + 50);
        }
      }
      fluid.addVelocity(fx1, fy1, vx, vy);
      fluid.addVelocity(fx2, fy2, vx, vy);
      fluid.addVelocity(fx3, fy3, vx, vy);
    }
    t += 1;
  }

  if (isMousePressed) {
    for (let i = -2; i <= 2; i++) {
      for (let j = -2; j <= 2; j++) {
        fluid.addDensity(mouse.x, mouse.y, Math.random() * 100 + 50);
        fluid.addVelocity(mouse.x, mouse.y, vx, vy);
      }
    }
  } else {
    if (isMouseIn) {
      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          fluid.addVelocity(mouse.x, mouse.y, vx, vy);
        }
      }
    }
  }

  fluid.step();
  fluid.renderD(ctx);

  requestAnimationFrame(draw);
}

let isMousePressed = false;
let isMouseIn = false;

window.addEventListener("mouseover", function (e) {
  mouse.x = e.x;
  mouse.y = e.y;
  isMouseIn = true;
});

window.addEventListener("mouseout", function (e) {
  mouse.x = undefined;
  mouse.y = undefined;
  isMouseIn = false;
});

window.addEventListener("mousemove", function (e) {
  // const rect = canvas.getBoundingClientRect();
  mouse.x = e.x; // * (rect.width/300) // x / (1600/300)
  mouse.y = e.y; // * (rect.height/300) // y / 720/150
  // console.log(rect.width) // w = 1600, h * 720
  // console.log(rect.height)
});

canvas.addEventListener("mousedown", function (e) {
  isMousePressed = true;
});

canvas.addEventListener("mouseup", function (e) {
  isMousePressed = false;
});

draw();
