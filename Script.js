const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* =====================
   GAME STATE
===================== */
let level = 1;
let cols, rows, size;
let maze = [];
let player, goal;
let won = false;

/* =====================
   CELL OBJECT
===================== */
function Cell(x, y) {
  this.x = x;
  this.y = y;
  this.visited = false;
  this.walls = {
    top: true,
    right: true,
    bottom: true,
    left: true
  };
}

/* =====================
   HELPERS
===================== */
function getIndex(x, y) {
  if (x < 0 || y < 0 || x >= cols || y >= rows) return -1;
  return x + y * cols;
}

/* =====================
   MAZE GENERATION (DFS)
===================== */
function generateMaze() {
  maze = [];

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      maze.push(new Cell(x, y));
    }
  }

  let stack = [];
  let current = maze[0];
  current.visited = true;

  while (true) {
    const next = getUnvisitedNeighbor(current);
    if (next) {
      next.visited = true;
      stack.push(current);
      removeWalls(current, next);
      current = next;
    } else if (stack.length) {
      current = stack.pop();
    } else {
      break;
    }
  }
}

function getUnvisitedNeighbor(cell) {
  const neighbors = [];
  const { x, y } = cell;

  const top = maze[getIndex(x, y - 1)];
  const right = maze[getIndex(x + 1, y)];
  const bottom = maze[getIndex(x, y + 1)];
  const left = maze[getIndex(x - 1, y)];

  if (top && !top.visited) neighbors.push(top);
  if (right && !right.visited) neighbors.push(right);
  if (bottom && !bottom.visited) neighbors.push(bottom);
  if (left && !left.visited) neighbors.push(left);

  return neighbors.length
    ? neighbors[Math.floor(Math.random() * neighbors.length)]
    : null;
}

function removeWalls(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  if (dx === 1) {
    a.walls.left = false;
    b.walls.right = false;
  }
  if (dx === -1) {
    a.walls.right = false;
    b.walls.left = false;
  }
  if (dy === 1) {
    a.walls.top = false;
    b.walls.bottom = false;
  }
  if (dy === -1) {
    a.walls.bottom = false;
    b.walls.top = false;
  }
}

/* =====================
   EXTRA PATHS (LOOPS)
===================== */
function createExtraPaths(count) {
  for (let i = 0; i < count; i++) {
    const cell = maze[Math.floor(Math.random() * maze.length)];

    // Protect start & goal
    if (
      (cell.x === 0 && cell.y === 0) ||
      (cell.x === cols - 1 && cell.y === rows - 1)
    ) continue;

    const dirs = [];

    if (getIndex(cell.x + 1, cell.y) !== -1) dirs.push("right");
    if (getIndex(cell.x - 1, cell.y) !== -1) dirs.push("left");
    if (getIndex(cell.x, cell.y + 1) !== -1) dirs.push("bottom");
    if (getIndex(cell.x, cell.y - 1) !== -1) dirs.push("top");

    if (!dirs.length) continue;

    const dir = dirs[Math.floor(Math.random() * dirs.length)];
    let next;

    if (dir === "right") next = maze[getIndex(cell.x + 1, cell.y)];
    if (dir === "left") next = maze[getIndex(cell.x - 1, cell.y)];
    if (dir === "bottom") next = maze[getIndex(cell.x, cell.y + 1)];
    if (dir === "top") next = maze[getIndex(cell.x, cell.y - 1)];

    if (!next) continue;

    cell.walls[dir] = false;
    if (dir === "right") next.walls.left = false;
    if (dir === "left") next.walls.right = false;
    if (dir === "bottom") next.walls.top = false;
    if (dir === "top") next.walls.bottom = false;
  }
}

/* =====================
   DRAWING
===================== */
function drawMaze() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;

  maze.forEach(cell => {
    const x = cell.x * size;
    const y = cell.y * size;

    if (cell.walls.top) drawLine(x, y, x + size, y);
    if (cell.walls.right) drawLine(x + size, y, x + size, y + size);
    if (cell.walls.bottom) drawLine(x + size, y + size, x, y + size);
    if (cell.walls.left) drawLine(x, y + size, x, y);
  });

  ctx.font = `${size * 0.6}px serif`;
  ctx.fillText("😊", player.x * size + size * 0.15, player.y * size + size * 0.8);
  ctx.fillText("🏠", goal.x * size + size * 0.15, goal.y * size + size * 0.8);
}

function drawLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/* =====================
   PLAYER MOVEMENT
===================== */
function move(dx, dy) {
  if (won) return;

  const cell = maze[getIndex(player.x, player.y)];
  if (!cell) return;

  if (dx === 1 && !cell.walls.right) player.x++;
  if (dx === -1 && !cell.walls.left) player.x--;
  if (dy === 1 && !cell.walls.bottom) player.y++;
  if (dy === -1 && !cell.walls.top) player.y--;

  if (player.x === goal.x && player.y === goal.y) {
    won = true;
    document.getElementById("win").style.display = "flex";
    setTimeout(nextLevel, 1500);
  }

  drawMaze();
}

document.addEventListener("keydown", e => {
  if (e.key === "ArrowUp") move(0, -1);
  if (e.key === "ArrowDown") move(0, 1);
  if (e.key === "ArrowLeft") move(-1, 0);
  if (e.key === "ArrowRight") move(1, 0);
});

/* =====================
   LEVEL CONTROL
===================== */
function startLevel() {
  won = false;
  document.getElementById("win").style.display = "none";

  cols = 8 + level * 4;
  rows = 6 + level * 3;
  size = Math.floor(600 / cols);

  canvas.width = cols * size;
  canvas.height = rows * size;

  document.getElementById("levelText").innerText = "Level " + level;

  generateMaze();
  createExtraPaths(level + 1);

  player = { x: 0, y: 0 };
  goal = { x: cols - 1, y: rows - 1 };

  drawMaze();
}

function nextLevel() {
  level++;
  startLevel();
}

/* =====================
   START GAME
===================== */
function startGame() {
  document.getElementById("instructions").style.display = "none";
  startLevel();
}
