const startScreen = document.querySelector('#startScreen');
const gameOverScreen = document.querySelector('#gameOverScreen');
const winScreen = document.querySelector('#winScreen');

const startBtn = document.querySelector('#startBtn');
const restartBtn = document.querySelector('#restartBtn');
const restartBtnWin = document.querySelector('#restartBtnWin');

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

const scoreEl = document.querySelector('#scoreEl');
const livesEl = document.querySelector('#livesEl');

canvas.width = innerWidth;
canvas.height = innerHeight;

// ====================== CLASSES ======================

class Boundary {
  static width = 40;
  static height = 40;
  constructor({ position, image }) {
    this.position = position;
    this.width = 40;
    this.height = 40;
    this.image = image;
  }

  draw() {
    c.drawImage(this.image, this.position.x, this.position.y);
  }
}

class Player {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 15;
    this.radians = 0.75;
    this.openRate = 0.12;
    this.rotation = 0;
    this.speed = 5;
  }

  draw() {
    c.save();
    c.translate(this.position.x, this.position.y);
    c.rotate(this.rotation);
    c.translate(-this.position.x, -this.position.y);
    c.beginPath();
    c.arc(
      this.position.x,
      this.position.y,
      this.radius,
      this.radians,
      Math.PI * 2 - this.radians
    );
    c.lineTo(this.position.x, this.position.y);
    c.fillStyle = 'yellow';
    c.fill();
    c.closePath();
    c.restore();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (this.radians < 0 || this.radians > 0.75) this.openRate = -this.openRate;
    this.radians += this.openRate;
  }
}

class Ghost {
  constructor({ position, velocity, color = 'red' }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 15;
    this.color = color;
    this.baseSpeed = 2;
    this.speed = this.baseSpeed;
    this.prevCollisions = [];
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }

  reset(startPosition, velocity) {
    this.position = { ...startPosition };
    this.velocity = { ...velocity };
    this.speed = this.baseSpeed;
    this.color = 'red';
    this.prevCollisions = [];
  }
}

class Pellet {
  constructor({ position }) {
    this.position = position;
    this.radius = 3;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = 'white';
    c.fill();
    c.closePath();
  }
}

class PowerUp {
  constructor({ position }) {
    this.position = position;
    this.radius = 10;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = 'white';
    c.fill();
    c.closePath();
  }
}

// ====================== FUNÇÕES ======================

function createImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function circleCollidesWithRectangle({ circle, rectangle }) {
  const padding = Boundary.width / 2 - circle.radius - 1;
  return (
    circle.position.y - circle.radius + circle.velocity.y <= rectangle.position.y + rectangle.height + padding &&
    circle.position.x + circle.radius + circle.velocity.x >= rectangle.position.x - padding &&
    circle.position.y + circle.radius + circle.velocity.y >= rectangle.position.y - padding &&
    circle.position.x - circle.radius + circle.velocity.x <= rectangle.position.x + rectangle.width + padding
  );
}

// ====================== OBJETOS ======================

const boundaries = [];
const powerUps = [];
const pellets = [];

const pelletSound = new Audio('./sounds/pellet.wav');
const powerUpSound = new Audio('./sounds/powerup.wav');
const deathSound = new Audio('./sounds/death.wav');
const victorySound = new Audio('./sounds/victory.wav');

pelletSound.load();
powerUpSound.load();
deathSound.load();
victorySound.load();

const ghosts = [
  new Ghost({
    position: { x: Boundary.width * 6 + Boundary.width / 2, y: Boundary.height + Boundary.height / 2 },
    velocity: { x: 2, y: 0 },
    color: 'purple'
  }),
  new Ghost({
    position: { x: Boundary.width * 6 + Boundary.width / 2, y: Boundary.height * 3 + Boundary.height / 2 },
    velocity: { x: 2, y: 0 },
    color: 'blue'
  })
];

const player = new Player({
  position: { x: Boundary.width + Boundary.width / 2, y: Boundary.height + Boundary.height / 2 },
  velocity: { x: 0, y: 0 }
});

const keys = { w: { pressed: false }, a: { pressed: false }, s: { pressed: false }, d: { pressed: false } };
let lastKey = '';
let score = 0;
let lives = 3;
let gameOver = false;

// ====================== MAPA ======================

const map = [
  ['1', '-', '-', '-', '-', '-', '-', '-', '-', '-', '2'],
  ['|', '.', '.', '.', '.', 'p', '.', '.', '.', '.', '|'],
  ['|', '.', 'b', '.', '[', '7', ']', '.', 'b', '.', '|'],
  ['|', '.', '.', '.', '.', '_', '.', '.', '.', '.', '|'],
  ['|', '.', '[', ']', '.', '.', '.', '[', ']', '.', '|'],
  ['|', '.', '.', '.', '.', '^', '.', '.', '.', '.', '|'],
  ['|', '.', 'b', '.', '[', '+', ']', '.', 'b', '.', '|'],
  ['|', '.', '.', '.', '.', '_', '.', '.', '.', '.', '|'],
  ['|', '.', '[', ']', '.', '.', '.', '[', ']', '.', '|'],
  ['|', '.', '.', '.', '.', '^', '.', '.', '.', '.', '|'],
  ['|', '.', 'b', '.', '[', '5', ']', '.', 'b', '.', '|'],
  ['|', '.', '.', '.', '.', 'p', '.', '.', '.', '.', '|'],
  ['4', '-', '-', '-', '-', '-', '-', '-', '-', '-', '3']
];

function loadMap() {
  boundaries.length = 0;
  pellets.length = 0;
  powerUps.length = 0;

  let powerUpCount = 0; // só permite 2 power-ups

  map.forEach((row, i) => {
    row.forEach((symbol, j) => {
      const position = { x: j * Boundary.width, y: i * Boundary.height };
      switch (symbol) {
        case '-': boundaries.push(new Boundary({ position, image: createImage('./img/pipeHorizontal.png') })); break;
        case '|': boundaries.push(new Boundary({ position, image: createImage('./img/pipeVertical.png') })); break;
        case '1': boundaries.push(new Boundary({ position, image: createImage('./img/pipeCorner1.png') })); break;
        case '2': boundaries.push(new Boundary({ position, image: createImage('./img/pipeCorner2.png') })); break;
        case '3': boundaries.push(new Boundary({ position, image: createImage('./img/pipeCorner3.png') })); break;
        case '4': boundaries.push(new Boundary({ position, image: createImage('./img/pipeCorner4.png') })); break;
        case 'b': boundaries.push(new Boundary({ position, image: createImage('./img/block.png') })); break;
        case '[': boundaries.push(new Boundary({ position, image: createImage('./img/capLeft.png') })); break;
        case ']': boundaries.push(new Boundary({ position, image: createImage('./img/capRight.png') })); break;
        case '_': boundaries.push(new Boundary({ position, image: createImage('./img/capBottom.png') })); break;
        case '^': boundaries.push(new Boundary({ position, image: createImage('./img/capTop.png') })); break;
        case '+': boundaries.push(new Boundary({ position, image: createImage('./img/pipeCross.png') })); break;
        case '5': boundaries.push(new Boundary({ position, image: createImage('./img/pipeConnectorTop.png') })); break;
        case '6': boundaries.push(new Boundary({ position, image: createImage('./img/pipeConnectorRight.png') })); break;
        case '7': boundaries.push(new Boundary({ position, image: createImage('./img/pipeConnectorBottom.png') })); break;
        case '8': boundaries.push(new Boundary({ position, image: createImage('./img/pipeConnectorLeft.png') })); break;
        case '.':
          pellets.push(new Pellet({
            position: { x: position.x + Boundary.width / 2, y: position.y + Boundary.height / 2 }
          }));
          break;
        case 'p':
          if (powerUpCount < 2) {
            powerUps.push(new PowerUp({
              position: { x: position.x + Boundary.width / 2, y: position.y + Boundary.height / 2 }
            }));
            powerUpCount++;
          } else {
            pellets.push(new Pellet({
              position: { x: position.x + Boundary.width / 2, y: position.y + Boundary.height / 2 }
            }));
          }
          break;
      }
    });
  });
}

loadMap();

// ====================== LOOP DO JOGO ======================

let animationId;

function animate() {
  if (gameOver) return;

  animationId = requestAnimationFrame(animate);
  c.clearRect(0, 0, canvas.width, canvas.height);

  // Movimento do player
  player.velocity.x = 0;
  player.velocity.y = 0;

  if (keys.w.pressed && lastKey === 'w') movePlayer(0, -player.speed);
  else if (keys.a.pressed && lastKey === 'a') movePlayer(-player.speed, 0);
  else if (keys.s.pressed && lastKey === 's') movePlayer(0, player.speed);
  else if (keys.d.pressed && lastKey === 'd') movePlayer(player.speed, 0);

  boundaries.forEach(boundary => boundary.draw());

  // Pellets
  pellets.forEach((pellet, i) => {
    pellet.draw();
    const dist = Math.hypot(pellet.position.x - player.position.x, pellet.position.y - player.position.y);
    if (dist < pellet.radius + player.radius) {
      pellets.splice(i, 1);
      score += 10;
      scoreEl.innerHTML = score;
      pelletSound.play();
    }
  });

  // Power-ups
  powerUps.forEach((powerUp, i) => {
    powerUp.draw();
    const dist = Math.hypot(powerUp.position.x - player.position.x, powerUp.position.y - player.position.y);
    if (dist < powerUp.radius + player.radius) {
      powerUps.splice(i, 1);
      powerUpSound.play();
      ghosts.forEach(ghost => {
        ghost.color = 'cyan';
        ghost.speed = ghost.baseSpeed / 2;
        setTimeout(() => {
          ghost.color = 'red';
          ghost.speed = ghost.baseSpeed;
        }, 5000);
      });
    }
  });

  player.update();

  // Fantasmas
  ghosts.forEach(ghost => {
    ghost.update();

    let collisions = [];
    boundaries.forEach(boundary => {
      if (circleCollidesWithRectangle({ circle: { ...ghost, velocity: { x: ghost.speed, y: 0 } }, rectangle: boundary })) collisions.push('right');
      if (circleCollidesWithRectangle({ circle: { ...ghost, velocity: { x: -ghost.speed, y: 0 } }, rectangle: boundary })) collisions.push('left');
      if (circleCollidesWithRectangle({ circle: { ...ghost, velocity: { x: 0, y: -ghost.speed } }, rectangle: boundary })) collisions.push('up');
      if (circleCollidesWithRectangle({ circle: { ...ghost, velocity: { x: 0, y: ghost.speed } }, rectangle: boundary })) collisions.push('down');
    });

    if (collisions.length > ghost.prevCollisions.length) ghost.prevCollisions = collisions;

    if (JSON.stringify(collisions) !== JSON.stringify(ghost.prevCollisions)) {
      const pathways = ['up', 'down', 'left', 'right'].filter(dir => !collisions.includes(dir));
      const direction = pathways[Math.floor(Math.random() * pathways.length)];
      switch (direction) {
        case 'right': ghost.velocity.x = ghost.speed; ghost.velocity.y = 0; break;
        case 'left': ghost.velocity.x = -ghost.speed; ghost.velocity.y = 0; break;
        case 'up': ghost.velocity.x = 0; ghost.velocity.y = -ghost.speed; break;
        case 'down': ghost.velocity.x = 0; ghost.velocity.y = ghost.speed; break;
      }
      ghost.prevCollisions = [];
    }

    // Colisão Pac-Man x Fantasma
    const dist = Math.hypot(ghost.position.x - player.position.x, ghost.position.y - player.position.y);
    if (dist < ghost.radius + player.radius) {
      if (ghost.color === 'cyan') {
        ghosts.splice(ghosts.indexOf(ghost), 1);
        score += 200;
        scoreEl.innerHTML = score;
      } else {
        deathSound.play();
        lives--;
        livesEl.innerHTML = lives;
        if (lives > 0) {
          resetPositions();
        } else {
          gameOver = true;
          cancelAnimationFrame(animationId);
          gameOverScreen.style.display = 'flex';
        }
      }
    }
  });

  // Checa vitória
  if (pellets.length === 0) {
    victorySound.currentTime = 0;
    victorySound.play();
    cancelAnimationFrame(animationId);
    winScreen.style.display = 'flex';
    return;
  }

  if (player.velocity.x > 0) player.rotation = 0;
  else if (player.velocity.x < 0) player.rotation = Math.PI;
  else if (player.velocity.y > 0) player.rotation = Math.PI / 2;
  else if (player.velocity.y < 0) player.rotation = Math.PI * 1.5;
}

// ====================== RESET ======================

function resetGame() {
  score = 0;
  lives = 3;
  scoreEl.innerHTML = score;
  livesEl.innerHTML = lives;
  gameOver = false;

  loadMap();
  resetPositions();
  animate();
}

function resetPositions() {
  player.position = { x: Boundary.width + Boundary.width / 2, y: Boundary.height + Boundary.height / 2 };
  player.velocity = { x: 0, y: 0 };

  ghosts.length = 0; // reseta fantasmas
  ghosts.push(
    new Ghost({
      position: { x: Boundary.width * 6 + Boundary.width / 2, y: Boundary.height + Boundary.height / 2 },
      velocity: { x: 2, y: 0 },
      color: 'purple'
    }),
    new Ghost({
      position: { x: Boundary.width * 6 + Boundary.width / 2, y: Boundary.height * 3 + Boundary.height / 2 },
      velocity: { x: 2, y: 0 },
      color: 'blue'
    })
  );
}

// ====================== CONTROLE ======================

function movePlayer(x, y) {
  for (let boundary of boundaries) {
    if (circleCollidesWithRectangle({ circle: { ...player, velocity: { x, y } }, rectangle: boundary })) return;
  }
  player.velocity.x = x;
  player.velocity.y = y;
}

addEventListener('keydown', ({ key }) => {
  switch (key) {
    case 'w': keys.w.pressed = true; lastKey = 'w'; break;
    case 'a': keys.a.pressed = true; lastKey = 'a'; break;
    case 's': keys.s.pressed = true; lastKey = 's'; break;
    case 'd': keys.d.pressed = true; lastKey = 'd'; break;
  }
});

addEventListener('keyup', ({ key }) => {
  if (keys[key] !== undefined) keys[key].pressed = false;
});

startBtn.addEventListener('click', () => {
  startScreen.style.display = 'none';
  resetGame();
});

restartBtn.addEventListener('click', () => {
  gameOverScreen.style.display = 'none';
  resetGame();
});

restartBtnWin.addEventListener('click', () => {
  winScreen.style.display = 'none';
  resetGame();
});
