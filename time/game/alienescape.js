// Definições iniciais
let board;
let boardWidth = 800; // Largura da tela para 3:4
let boardHeight = 800; // Altura da tela para 3:4
let context;

let shipWidth = 74;
let shipHeight = 64;
let shipX = boardWidth / 8;
let shipY = boardHeight / 2 - shipHeight / 2;
let shipImg;

// Objeto representando a nave espacial
let ship = {
    x: shipX,
    y: shipY,
    width: shipWidth,
    height: shipHeight
};

// Caixa de colisão da nave
let shipCollisionBox = {
    x: ship.x,
    y: ship.y,
    width: ship.width,
    height: ship.height
};

// Obstáculos
let obstacleArray = []; // Array que armazena os obstáculos
let obstacleWidth = 64;
let obstacleHeight = 512;
let obstacleX = boardWidth; // Inicialmente, os obstáculos são criados fora da tela
let obstacleY = 0;

let topObstacleImg;
let bottomObstacleImg;

// Física do jogo
let velocityX = -4; // Velocidade dos obstáculos (se movem para a esquerda)
let velocityY = 0; // Velocidade vertical da nave
let gravity = 0.3; // Gravidade aplicada à nave
let thrust = -6; // Força aplicada ao "pular"

// Estado do jogo
let gameOver = false;
let score = 0; // Pontuação do jogador
let obstacleInterval = 2000; // Intervalo entre a geração de obstáculos
let obstacleSpawner; // Intervalo de spawn dos obstáculos

// Contagem regressiva do tempo
let timeLeft = 60; // Tempo restante (em segundos)
let timer;

// Tela de fim de jogo
let timeUp = false;

// Menu do jogo
let menuVisible = true;

// Sons
let sfx = {
    score: new Audio('./sfx/score.wav'), // Som de pontuação
    die: new Audio('./sfx/die.wav') // Som de morte
};

// Inicialização do jogo
window.onload = function () {
    score = 0; // Zera a pontuação ao recarregar a página
    let playerName = prompt("Digite seu nome:") || 'Jogador'; // Define o nome como 'Jogador' se a entrada estiver vazia
    localStorage.setItem('playerName', playerName); // Armazena o nome no localStorage


    board = document.getElementById("board");
    board.height = boardHeight;
    board.width = boardWidth;
    context = board.getContext("2d");

    // Carrega a imagem da nave
    shipImg = new Image();
    shipImg.src = "../res/imgs/spaceship.png";

    // Carrega as imagens dos obstáculos
    topObstacleImg = new Image();
    topObstacleImg.src = "../res/imgs/cima.png";
    bottomObstacleImg = new Image();
    bottomObstacleImg.src = "../res/imgs/baixo.png";

    // Certifica que todas as imagens foram carregadas antes de começar o jogo
    Promise.all([
        new Promise((resolve) => shipImg.onload = resolve),
        new Promise((resolve) => topObstacleImg.onload = resolve),
        new Promise((resolve) => bottomObstacleImg.onload = resolve)
    ]).then(() => {
        requestAnimationFrame(update); // Começa o loop de atualização
        document.addEventListener("keydown", moveShip); // Adiciona evento para mover a nave
        showMenu(); // Exibe o menu inicial
    });
};

// Função principal de atualização
function update() {
    requestAnimationFrame(update); // Continua o loop de animação

    if (gameOver || timeUp) { // Se o jogo acabar ou o tempo esgotar
        showFinalScore(); // Exibe a pontuação final
        return;
    }

    if (menuVisible) { // Se o menu estiver visível, pausa o jogo
        return;
    }

    context.clearRect(0, 0, board.width, board.height); // Limpa o canvas

    // Aplica gravidade na nave
    velocityY += gravity;
    ship.y = Math.max(ship.y + velocityY, 0); // Atualiza a posição da nave

    // Atualiza a caixa de colisão da nave
    shipCollisionBox.x = ship.x;
    shipCollisionBox.y = ship.y;

    context.drawImage(shipImg, ship.x, ship.y, ship.width, ship.height); // Desenha a nave

    // Se a nave sair da tela, o jogo reinicia
    if (ship.y > board.height) {
        resetGame();
        return;
    }

    // Atualiza os obstáculos
    for (let i = 0; i < obstacleArray.length; i++) {
        let obstacle = obstacleArray[i];
        obstacle.x += velocityX; // Move o obstáculo para a esquerda
        context.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);

        // Verifica se a nave passou pelo obstáculo e aumenta a pontuação
        if (!obstacle.passed && ship.x > obstacle.x + obstacle.width) {
            score += 0.5; // A pontuação aumenta em 0.5 ao passar por cada obstáculo
            sfx.score.play(); // Toca o som de pontuação
            obstacle.passed = true; // Marca o obstáculo como "passado"
        }

        // Caixa de colisão do obstáculo
        let obstacleCollisionBox = {
            x: obstacle.x,
            y: obstacle.y,
            width: obstacle.width,
            height: obstacle.height
        };

        // Verifica colisão entre a nave e o obstáculo
        if (checkCollision(shipCollisionBox, obstacleCollisionBox)) {
            resetGame(); // Reinicia o jogo se houver colisão
            return;
        }
    }

    // Remove obstáculos que saíram da tela
    while (obstacleArray.length > 0 && obstacleArray[0].x < -obstacleWidth) {
        obstacleArray.shift();
    }

    // Exibe a pontuação na tela
    context.fillStyle = "white";
    context.font = "45px 'Alien', sans-serif";
    context.strokeStyle = "lightgray";
    context.lineWidth = 4;

    let scoreText = score.toString();
    context.strokeText(scoreText, 10, 45);
    context.fillText(scoreText, 10, 45);

    // Exibe o tempo restante na tela
    let timerText = `${timeLeft}s`;
    let timerWidth = context.measureText(timerText).width;
    context.strokeText(timerText, board.width - timerWidth - 10, 45);
    context.fillText(timerText, board.width - timerWidth - 10, 45);
}

// Atualiza o timer do jogo
function updateTimer() {
    if (timeLeft > 0) {
        timeLeft--;
    } else {
        timeUp = true;
        clearInterval(timer);
        clearInterval(obstacleSpawner); // Para de gerar novos obstáculos
    }
}

// Exibe a pontuação final e o melhor score
function showFinalScore() {
    context.clearRect(0, 0, board.width, board.height);
    context.fillStyle = "white";
    context.font = "50px 'Alien', sans-serif";

    let playerName = localStorage.getItem('playerName') || 'Jogador';
    let bestScore = parseFloat(localStorage.getItem('bestScore')) || 0;

    let nameText = `${playerName}`;
    let scoreText = `Melhor Pontuação: ${Math.floor(bestScore)}`;

    let nameTextWidth = context.measureText(nameText).width;
    let scoreTextWidth = context.measureText(scoreText).width;

    let textHeight = 50;
    let totalHeight = textHeight * 2;

    let startY = (board.height / 2) - (totalHeight / 2) + textHeight;

    context.strokeText(nameText, (board.width - nameTextWidth) / 2, startY);
    context.fillText(nameText, (board.width - nameTextWidth) / 2, startY);

    context.strokeText(scoreText, (board.width - scoreTextWidth) / 2, startY + textHeight);
    context.fillText(scoreText, (board.width - scoreTextWidth) / 2, startY + textHeight);
}

// Função que posiciona obstáculos
function placeObstacle() {
    if (gameOver) {
        return;
    }

    let randomObstacleY = obstacleY - obstacleHeight / 5 - Math.random() * (obstacleHeight / 2);
    let openingSpace = (board.height / 6) + 10;

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

// Função que move a nave
function moveShip(e) {
    if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyX") {
        velocityY = thrust; // Aplica o impulso de pulo

        if (menuVisible) {
            menuVisible = false; // Inicia o jogo se o menu estiver visível
            obstacleSpawner = setInterval(placeObstacle, obstacleInterval);
            timer = setInterval(updateTimer, 1000); // Começa o timer quando o jogo começa
        }
    }
}

// Função que verifica colisões
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Verifica e atualiza a melhor pontuação
function checkBestScore() {
    let bestScore = parseFloat(localStorage.getItem('bestScore')) || 0; // Melhor pontuação ou 0

    if (score > bestScore) {
        localStorage.setItem('bestScore', Math.floor(score)); // Armazena a nova melhor pontuação
        console.log("Nova melhor pontuação:", score); // Adiciona um log para verificar
    }
}

// Reinicia o jogo
function resetGame() {
    checkBestScore(); // Verifica e atualiza a melhor pontuação

    ship.y = shipY;
    obstacleArray = [];
    velocityX = -4;
    velocityY = 0;
    obstacleInterval = 2000;
    clearInterval(obstacleSpawner);
    gameOver = false;
    obstacleSpawner = setInterval(placeObstacle, obstacleInterval);
    sfx.die.play(); // Toca o som de morte
    score = 0;
}

// Exibe o menu inicial
function showMenu() {
    menuVisible = true;
    context.clearRect(0, 0, board.width, board.height);
    context.fillStyle = "white";

    context.font = "30px 'Alien', sans-serif";
    if (!context.font.match(/Alien/i)) {
        context.font = "30px Arial, sans-serif"; // Fonte alternativa se 'Alien' não estiver disponível
    }

    let menuText = "START";
    let textWidth = context.measureText(menuText).width;
    context.strokeText(menuText, (board.width - textWidth) / 2, board.height / 2);
    context.fillText(menuText, (board.width - textWidth) / 2, board.height / 2);
}
