let board;
let boardWidth = 360;
let boardHeight = 640;
let context;

// Spaceship
let shipWidth = 74;
let shipHeight = 64;
let shipX = boardWidth / 8;
let shipY = boardHeight / 2 - shipHeight / 2;
let shipImg;

let ship = {
    x: shipX,
    y: shipY,
    width: shipWidth,
    height: shipHeight
};

// Collision box adjustment
let shipCollisionBox = {
    x: ship.x,
    y: ship.y,
    width: ship.width,
    height: ship.height
};

// Obstacles
let obstacleArray = [];
let obstacleWidth = 64;
let obstacleHeight = 512;
let obstacleX = boardWidth;
let obstacleY = 0;

let topObstacleImg;
let bottomObstacleImg;

// Physics
let velocityX = -2;
let velocityY = 0;
let gravity = 0.3;

// Game State
let gameOver = false;
let score = 0;
let obstacleInterval = 2000;
let obstacleSpawner;

// Countdown
let timeLeft = 90;
let timer;

// Game over screen
let timeUp = false;

// Menu
let menuVisible = true;

window.onload = function () {
    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Load spaceship image
    shipImg = new Image();
    shipImg.src = "./imgs/spaceship.png";
    shipImg.onload = function () {
        context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);
    };

    topObstacleImg = new Image();
    topObstacleImg.src = "./imgs/cima.png";
    bottomObstacleImg = new Image();
    bottomObstacleImg.src = "./imgs/baixo.png";

    requestAnimationFrame(update);
    document.addEventListener("keydown", moveShip);

    // Show the menu
    showMenu();
};

function update() {
    requestAnimationFrame(update);

    if (gameOver || timeUp) {
        if (timeUp) {
            showFinalScore();
        }
        return;
    }

    if (menuVisible) {
        return; // Don't update the game while the menu is visible
    }

    context.clearRect(0, 0, board.width, board.height);

    // Gravity on the spaceship
    velocityY += gravity;
    ship.y = Math.max(ship.y + velocityY, 0);

    // Update collision box
    shipCollisionBox.x = ship.x;
    shipCollisionBox.y = ship.y;

    context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height);

    // Draw collision box
    context.strokeStyle = "green";
    context.lineWidth = 2;
    context.strokeRect(shipCollisionBox.x, shipCollisionBox.y, shipCollisionBox.width, shipCollisionBox.height);

    if (ship.y > board.height) {
        resetGame();
    }

    // Obstacles
    for (let i = 0; i < obstacleArray.length; i++) {
        let obstacle = obstacleArray[i];
        obstacle.x += velocityX;
        context.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        if (!obstacle.passed && ship.x > obstacle.x + obstacle.width) {
            score += 0.5;
            obstacle.passed = true;
        }

        // Obstacle collision box
        let obstacleCollisionBox = {
            x: obstacle.x,
            y: obstacle.y,
            width: obstacle.width,
            height: obstacle.height
        };

        if (checkCollision(shipCollisionBox, obstacleCollisionBox)) {
            resetGame();
        }
    }

    // Remove obstacles outside the screen
    while (obstacleArray.length > 0 && obstacleArray[0].x < -obstacleWidth) {
        obstacleArray.shift();
    }

    // Score
    context.fillStyle = "white";
    context.font = "35px 'Alien', sans-serif";
    context.strokeStyle = "lightgray";
    context.lineWidth = 4;

    let scoreText = score.toString();
    context.strokeText(scoreText, 10, 45);
    context.fillText(scoreText, 10, 45);

    // Show the timer
    let timerText = `${timeLeft}s`;
    let timerWidth = context.measureText(timerText).width;
    context.strokeText(timerText, board.width - timerWidth - 10, 45);
    context.fillText(timerText, board.width - timerWidth - 10, 45);
}

function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
    } else {
        timeUp = true;
        clearInterval(timer);
        clearInterval(obstacleSpawner);
    }
}

function showFinalScore() {
    context.clearRect(0, 0, board.width, board.height);
    context.fillStyle = "white";
    context.font = "50px 'Alien', sans-serif";
    let finalScoreText = `Score: ${Math.floor(score)}`;
    let textWidth = context.measureText(finalScoreText).width;
    context.strokeText(finalScoreText, (board.width - textWidth) / 2, board.height / 2);
    context.fillText(finalScoreText, (board.width - textWidth) / 2, board.height / 2);
}

function placeObstacle() {
    if (gameOver || timeUp) {
        return;
    }

    let randomObstacleY = obstacleY - obstacleHeight / 5 - Math.random() * (obstacleHeight / 2);
    let openingSpace = (board.height / 4) + 10;

    let topObstacle = {
        img: topObstacleImg,
        x: obstacleX,
        y: randomObstacleY,
        width: obstacleWidth,
        height: obstacleHeight,
        passed: false
    };
    obstacleArray.push(topObstacle);

    let bottomObstacle = {
        img: bottomObstacleImg,
        x: obstacleX,
        y: randomObstacleY + obstacleHeight + openingSpace,
        width: obstacleWidth,
        height: obstacleHeight,
        passed: false
    };
    obstacleArray.push(bottomObstacle);
}

function moveShip(e) {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX") {
        velocityY = -6;

        // Start the game if the menu is visible
        if (menuVisible) {
            menuVisible = false;
            obstacleSpawner = setInterval(placeObstacle, obstacleInterval);
            timer = setInterval(updateTimer, 1000); // Start the timer when the game starts
        }
    }
}

// Collision detection function
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

function resetGame() {
    ship.y = shipY;
    obstacleArray = [];
    velocityX = -2;
    velocityY = 0;
    obstacleInterval = 2000;
    clearInterval(obstacleSpawner);
    obstacleSpawner = setInterval(placeObstacle, obstacleInterval);
    score = 0;
    gameOver = false;
}

function showMenu() {
    menuVisible = true;
    context.clearRect(0, 0, board.width, board.height);
    context.fillStyle = "white";

    context.font = "30px 'Alien', sans-serif";
    if (!context.font.match(/Alien/i)) {
        context.font = "30px Arial, sans-serif"; // Use a fallback font
    }

    let menuText = "START";
    let textWidth = context.measureText(menuText).width;
    context.strokeText(menuText, (board.width - textWidth) / 2, board.height / 2);
    context.fillText(menuText, (board.width - textWidth) / 2, board.height / 2);
}
