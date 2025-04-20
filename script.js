let isGameOver = false;
let enemyBullets = [];
const enemies = [];
const bullets = [];
let scoreNb = 0;
let keys = {};
let reqId;
let isWin = false;
let canShoot = true;
let isPaused = false;
let timeLeft = 90;
let timerId = null;
let gameStarted = false;
let gameAreaRect;
let lastTime = performance.now();


const gameArea = document.getElementById("gamearea");
const scoreDiv = document.getElementById("score");
const hearts = document.querySelectorAll(".heart");
const timeDisplay = document.getElementById("time");
const startBtn = document.getElementById("startBtn");
const startOverlay = document.getElementById("startOverlay");
const pauseMenu = document.getElementById("pauseMenu");
const gameOverMenu = document.getElementById("gameOverMenu");
const winMenu = document.getElementById("winMenu");
const playerElement = document.querySelector(".player");
const livesDiv = document.getElementById("lives");
const fpsDisplay = document.getElementById('fps');

let player = {
  x: 0,
  y: 0,
  width: 65,
  height: 55,
  speed: 5,
  lives: 3,
};

function updateGameAreaDimensions() {
  gameAreaRect = gameArea.getBoundingClientRect();
  player.x = gameAreaRect.width / 2 - player.width / 2;
  player.y = gameAreaRect.height - player.height - 20;
  playerElement.style.transform = `translate(${player.x}px, ${player.y}px)`;
}

function updateFPS() {
  const currentTime = performance.now();
  const fps = Math.round(1000 / (currentTime - lastTime));
  lastTime = currentTime;

  fpsDisplay.textContent = `FPS: ${fps}`;

}

function updateLives() {
  hearts.forEach((heart, index) => {
    if (index < player.lives) {
      heart.classList.remove("empty");
    } else {
      heart.classList.add("empty");
    }
  });
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `Time: ${mins}:${secs.toString().padStart(2, "0")}`;
}

function updateTimer() {
  if (timeLeft > 0) {
    timeLeft--;
    timeDisplay.textContent = formatTime(timeLeft);
  } else {
    isGameOver = true;
    showGameOver();
  }
}

function startGame() {
  if (!gameStarted) {
    gameStarted = true;
    startOverlay.style.display = "none";

    const enemyElements = document.querySelectorAll(".enemy");
    enemyElements.forEach((enemy) => {
      enemy.classList.remove("paused");
    });

    timerId = setInterval(updateTimer, 1000);
    gameLoop();
  }
}

function togglePause() {
  isPaused = !isPaused;
  pauseMenu.style.display = isPaused ? "flex" : "none";

  const enemyElements = document.querySelectorAll(".enemy");
  enemyElements.forEach((enemy) => {
    if (isPaused) {
      enemy.classList.add("paused");
    } else {
      enemy.classList.remove("paused");
    }
  });

  if (isPaused) {
    cancelAnimationFrame(reqId);
    if (timerId) clearInterval(timerId);
  } else {
    timerId = setInterval(updateTimer, 1000);
    gameLoop();
  }
}

function restartGame() {
  isPaused = false;
  isGameOver = false;
  isWin = false;
  scoreNb = 0;
  player.lives = 3;

  // Update player position based on current game area size
  playerElement.style.transform = `translate(${player.x}px, ${player.y}px)`;
  updateGameAreaDimensions();
  timeLeft = 90;
  timeDisplay.textContent = formatTime(timeLeft);
  gameStarted = false;

  bullets.forEach((bullet) => bullet.element.remove());
  bullets.length = 0;
  enemies.forEach((enemy) => enemy.element.remove());
  enemies.length = 0;
  enemyBullets.forEach((bullet) => bullet.element.remove());
  enemyBullets.length = 0;

  updateLives();
  score();

  startOverlay.style.display = "flex";
  pauseMenu.style.display = "none";
  gameOverMenu.style.display = "none";
  winMenu.style.display = "none";
  //playerElement.style.transform = `translateX(${player.x}px)`;

  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }

  createEnemy();
}

function showGameOver() {
  document.getElementById("final-score").textContent = scoreNb;
  gameOverMenu.style.display = "flex";
  if (timerId) clearInterval(timerId);
  cancelAnimationFrame(reqId);
  gameStarted = false;
}

function showWin() {
  document.getElementById("win-score").textContent = scoreNb;
  winMenu.style.display = "flex";
  if (timerId) clearInterval(timerId);
  cancelAnimationFrame(reqId);
  gameStarted = false;
}

document.addEventListener("keydown", (event) => {
  keys[event.key] = true;
  if (event.key === "Escape" && !isGameOver && gameStarted) {
    togglePause();
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.key] = false;
});

window.addEventListener("resize", () => {
  console.log("RESIIIIIZE");
  updateGameAreaDimensions();

  if (!gameStarted) {
    createEnemy();
  } else {
    restartGame();
  }
});

document.getElementById("resumeBtn").addEventListener("click", togglePause);
document.getElementById("restartBtn").addEventListener("click", restartGame);
document.getElementById("replayBtn").addEventListener("click", restartGame);
document.getElementById("winReplayBtn").addEventListener("click", restartGame);
startBtn.addEventListener("click", startGame);

function isColliding(rectA, rectB) {
  return (
    rectA.x <= rectB.x + rectB.width &&
    rectA.x + rectA.width >= rectB.x &&
    rectA.y <= rectB.y + rectB.height &&
    rectA.y + rectA.height >= rectB.y
  );
}

function createEnemy() {
  const enemyWidth = 33;
  const enemyHeight = 33;
  const horizontalSpacing = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--horizontal-spacing'));
  const verticalSpacing = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--vertical-spacing'));

  document.querySelectorAll('.enemy').forEach(enemy => enemy.remove());
  enemies.length = 0;

  for (let i = 0; i < 8; i++) {
    for (let j = i; j < 10 - i; j++) {
      const enemyElement = document.createElement("div");
      enemyElement.classList.add("enemy");

      if (!gameStarted || isPaused) {
        enemyElement.classList.add("paused");
      }

      const xPosition = (enemyWidth + horizontalSpacing) * j;
      const yPosition = (enemyHeight + verticalSpacing) * i;
      enemyElement.style.transform = `translateX(${xPosition}px)`;
      enemyElement.style.top = `${yPosition}px`;
      gameArea.appendChild(enemyElement);

      enemies.push({
        element: enemyElement,
        x: xPosition,
        y: yPosition,
        width: enemyWidth,
        height: enemyHeight,
        direction: 1,
      });
    }
  }
}


function enemyFire() {
  if (enemies.length === 0) return;
  const randomEnemy = enemies[Math.floor(Math.random() * enemies.length)];

  const enemyBullet = document.createElement("img");
  enemyBullet.setAttribute("class", "enemybullets");
  enemyBullet.setAttribute("src", "./assets/invederFire.png");

  enemyBullet.style.transform = `translateX(${randomEnemy.x + randomEnemy.width / 2 - 2.5}px)`;
  enemyBullet.style.top = `${randomEnemy.y + randomEnemy.height}px`;
  // document.getElementById("gamearea").appendChild(enemyBullet);
  gameArea.appendChild(enemyBullet);

  enemyBullets.push({
    element: enemyBullet,
    x: randomEnemy.x + randomEnemy.width / 2 - 2.5,
    y: randomEnemy.y + randomEnemy.height,
    width: 5,
    height: 10,
  });
}

function updateEnemyBullet() {
  enemyBullets.forEach((bullet, index) => {
    bullet.y += 5;
    bullet.x = parseFloat(
      bullet.element.style.transform.replace("translateX(", "")
    );
    bullet.element.style.top = `${bullet.y}px`;

    if (bullet.y + bullet.height >= 880) {
      bullet.element.remove();
      enemyBullets.splice(index, 1);
      return;
    }

    if (isColliding(bullet, player)) {
      console.log("Player hit");

      player.lives--;
      updateLives();

      bullet.element.remove();
      enemyBullets.splice(index, 1);

      if (player.lives <= 0) {
        isGameOver = true;
        showGameOver();
      }
    }
  });
}

function shoot() {
  const bulletElement = document.createElement("div");
  bulletElement.classList.add("shoot");


  const playerRect = playerElement.getBoundingClientRect();
  const gameAreaRect = gameArea.getBoundingClientRect();

  const bulletX = playerRect.left + playerRect.width / 2 - gameAreaRect.left - 15;
  const bulletY = playerRect.top - gameAreaRect.top - 10;

  bulletElement.style.transform = `translateX(${bulletX}px)`;
  bulletElement.style.top = bulletY + "px";
  gameArea.appendChild(bulletElement);

  bullets.push({
    element: bulletElement,
    initialX: bulletX,
    x: bulletX,
    y: bulletY,
    width: 20,
    height: 30,
    active: true,
  });
}

function score() {
  scoreDiv.textContent = "Score: " + scoreNb;
}

function updateShoot() {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const bullet = bullets[i];

    if (!bullet.active) continue;

    bullet.y -= 5;
    bullet.element.style.transform = `translateX(${bullet.initialX}px)`;
    bullet.element.style.top = bullet.y + "px";

    let bulletHit = false;

    if (bullet.y < 0) {
      bulletHit = true;
    } else {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        if (isColliding(bullet, enemy)) {
          scoreNb += 10;
          score();

          const explosion = document.createElement("img");
          explosion.src = "./assets/enemydeath.gif";
          explosion.className = "explosion";
          explosion.style.left = `${enemy.x}px`;
          explosion.style.top = `${enemy.y}px`;
          // document.getElementById("gamearea").appendChild(explosion);
          gameArea.appendChild(explosion);

          //console.log(enemy.element);

          enemy.element.remove();
          enemies.splice(j, 1);
          bulletHit = true;

          if (enemies.length === 0) {
            isWin = true;
            showWin();
          }
          break;
        }
      }
    }
    if (bulletHit) {
      bullet.active = false;
      bullet.element.remove();
      bullets.splice(i, 1);
    }
  }
}


function updateEnemies() {
  let gameArea = document.getElementById("gamearea").getBoundingClientRect();
  let shouldReverse = false;

  enemies.forEach((enemy) => {
    ///fix
    if (enemy.x + enemy.width > gameArea.width - 20 || enemy.x < 0) {

      shouldReverse = true;
      // console.log(enemy.y + enemy.height);
      // remove 800
    } else if (enemy.y + enemy.height > gameAreaRect.height) {
      isGameOver = true;
      showGameOver();
    }

    if (isColliding(enemy, player)) {
      player.lives = 0;
      updateLives();
      isGameOver = true;
      showGameOver();
    }
  });

  enemies.forEach((enemy) => {
    if (shouldReverse) {
      enemy.direction *= -1;
      enemy.y += 10;
      enemy.element.style.top = `${enemy.y}px`;
    }
    enemy.x += enemy.direction * 2;
    enemy.element.style.transform = `translateX(${enemy.x}px)`;
  });
}

function updatePlayer() {
  let isMoving = false;
  gameAreaRect = gameArea.getBoundingClientRect();

  const minX = 0;
  const maxX = gameAreaRect.width - player.width;

  if (keys["ArrowLeft"] && player.x > minX) {
    player.x -= player.speed;
  }
  if (keys["ArrowRight"] && player.x < maxX) {
    player.x += player.speed;
  }
  if (keys[" "]) {
    isMoving = true;
  }
  if (isMoving && canShoot) {
    shoot();
    canShoot = false;
    setTimeout(() => {
      canShoot = true;
    }, 550);
  }

  player.x = Math.max(minX, Math.min(maxX, player.x));

  playerElement.style.transform = `translate(${player.x}px, ${player.y}px)`;
}

function gameLoop() {
  if (!isPaused && !isGameOver && gameStarted) {

    updateFPS()
    updateShoot();
    updatePlayer();
    updateEnemies();
    updateEnemyBullet();

    if (Math.random() < 0.02) {
      enemyFire();
    }
    reqId = requestAnimationFrame(gameLoop);
  }
}

(function () {
  updateGameAreaDimensions();
  createEnemy();
  score();
  timeDisplay.textContent = formatTime(timeLeft);
  updateLives();
  startOverlay.style.display = "flex";
})();
