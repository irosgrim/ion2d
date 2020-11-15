
const screen = document.getElementById('screen');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');

canvas.style.width ='100%';
canvas.style.height='100%';
canvas.width = screen.offsetWidth;
canvas.height = screen.offsetHeight;

makeItPixelated(context);
let loopId;

const gameObject = {
    gameOver: false,
    player: null,
    playerSpeed: 300,
    weapon: 2,
    bullets: {},
    get bulletSpeed() {
        this.fireRate = 0.25 / (this.weapon + 1);
        return (this.weapon * 150) + 90;
    },
    fireRate: 0.25,
    fireTimeout: 0,
    enemies: {},
    enemy: {
        y: 15,
        width: 11,
        height: 8,
        spaceBetweenEnemies: 11,
        get totalWidthAndSpace() {
            return this.width + this.spaceBetweenEnemies;
        },
        bullets: {},
        get bulletSpeed() {
            return 100;
        },
    },
    assets: {
        menuImg: null,
        playerImg: null,
        enemyImg: null,
        starImg: null,
        arsenalMenu: null,
    },
    stars: [],
    keyboardKeys: {},
    score: 0,
    lastTime: Date.now(),
};

class Bullet {
    constructor(x, y, type = 1, color, id) {
        this.x = x;
        this.y = y;
        this.w = 2;
        this.h = this.w;
        this.dy = 5;
        this.type = 1;
        this.color = color;
        this.changeDirection = 1;
        this.id = id;
    }
    draw() {
        context.beginPath();
        context.fillStyle = this.color;
        context.fillRect(this.x, this.y, this.w, this.h);
        context.closePath();
    }
    update(dt, direction = 'up') {
        this.x = this.x;
        this.y = this.y;
        if(direction === 'up') {
            for(let enemy in gameObject.enemies) {
                if(checkRectCollision(this, gameObject.enemies[enemy])) {
                    gameObject.score += 1;
                    delete gameObject.enemies[enemy];
                    delete gameObject.bullets[this.id];
                }
            }
            if((this.y < 0 - this.h || this.y > canvas.height + 5)) {
                delete gameObject.bullets[this.id];
            }
            this.y -= (dt * gameObject.bulletSpeed) * this.changeDirection;
            if(this.changeDirection < 1) {
                this.x -= 0.5;
            }
        } else {
            this.y += dt * 100;
        }
        this.draw();
    }
}

class Enemy {
    constructor(x, y, id) {
        this.id = id;
        this.initialX = x;
        this.x = x;
        this.y = y;
        this.dx = 0.32;
        this.h = 8;
        this.w = 11;
        this.shot = false;
        
    }
    draw() {
        context.drawImage(gameObject.assets.enemyImg, this.x, this.y);
    }
    drawShot() {
        context.beginPath();
        context.fillRect(this.x, this.y, 21, 21);
        context.closePath();
    }
    update(dt) {
        this.x = this.x;
        this.y = this.y;
        if(this.x <  this.initialX || this.x > this.initialX + (canvas.width - ((11 * gameObject.enemy.totalWidthAndSpace)) + gameObject.enemy.spaceBetweenEnemies - 10)) {
            this.dx = -this.dx;
            this.y = this.y + 11;
            if(this.y >= canvas.height - 48) {
                gameObject.gameOver = true;
            }
        }
        this.x += this.dx;
        
        this.draw();
    }

    shoot() {
        const x = this.x;
        const y = this.y;
        const bulletId = uid();
        gameObject.enemy.bullets[bulletId] = new Bullet(x, y, 1, 'red', bulletId);
    }
}

class Player {
    constructor() {
        this.w = 17;
        this.h = this.w;
        this.x = canvas.width/2 - (this.w/2);
        this.y = canvas.height - this.h * 2;
        this.dy = 0;
        this.dx = 0;
        this.type = 1;
    }
    draw() {
        context.drawImage(gameObject.assets.playerImg, this.x, this.y);
    }
    update(dt, playerSpeed) {
        if(gameObject.keyboardKeys) {
            if(gameObject.keyboardKeys['ArrowLeft'] && this.x > 0 + this.w) {
                this.dx = playerSpeed;
                this.x -= (dt * this.dx) / 3;
            }
            if(gameObject.keyboardKeys['ArrowRight'] && this.x < canvas.width - this.w * 2) {
                this.dx = playerSpeed;
                this.x += (dt * this.dx) / 3;
            }
            if(gameObject.keyboardKeys['ArrowUp'] && this.y > 0 + this.h && this.y >= canvas.height / 1.5) {
                this.dy = playerSpeed;
                this.y -= (dt * this.dy) / 3;
            }
            if(gameObject.keyboardKeys['ArrowDown'] && this.y < canvas.height - this.h * 2) {
                this.dy = playerSpeed;
                this.y += (dt * this.dy) / 3;
            }
            if(gameObject.keyboardKeys['Space'] && gameObject.fireTimeout <= 0) {
               shoot(this.x + 2, this.y + this.h/2);
               gameObject.fireTimeout = gameObject.fireRate;
            }
            if(gameObject.fireTimeout > 0) {
                gameObject.fireTimeout -= dt;
            }
        } else {
            this.dx = 0;
            this.dy = 0;
        }
        this.draw();
    }
}

class Star {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.dy = 25;
        this.w = (Math.random() * 7) + 3;
        this.h = this.w;
    }
    draw() {
        context.drawImage(gameObject.assets.starImg, this.x, this.y, this.w, this.w);
    }
    update(dt) {
        if(this.w <= 8) {
            this.y += dt * 10;
        } else {
            this.y += dt * this.dy;
        }

        if(this.y > canvas.height + 10) {
            this.y = -10;
        }
        
        this.draw();
    }
}

setupAssets();

window.addEventListener('DOMContentLoaded', init);
window.addEventListener('keydown', onkeydown);
window.addEventListener('keyup', onkeyup);
window.addEventListener('keypress', onKeyPress);
window.addEventListener('touchstart', function() {
    // to be continued
  });

function renderMenu() {
    const sourceY = 0;
    const sourceWidth = 103;
    const sourceHeight = 14;
    const destinationX = canvas.width - sourceWidth;
    const destinationY = canvas.height - sourceHeight;
    const destinationWidth = sourceWidth;
    const destinationHeight = sourceHeight;
    context.drawImage(gameObject.assets.menuImg, sourceWidth * gameObject.weapon, sourceY, sourceWidth, sourceHeight, destinationX, destinationY, destinationWidth, destinationHeight);
}

function init() {
    gameObject.player = new Player();
    generateStars()
    generateEnemies();
    gameLoop();
}

function setupAssets() {
    gameObject.assets.menuImg= new Image();
    gameObject.assets.menuImg.src = 'assets/arsenal-menu-103x14.png';
    gameObject.assets.playerImg = new Image();
    gameObject.assets.playerImg.src = 'assets/ship-17x17.png';
    gameObject.assets.starImg = new Image();
    gameObject.assets.starImg.src = 'assets/star-7x7.png';
    gameObject.assets.enemyImg = new Image();
    gameObject.assets.enemyImg.src = 'assets/invader-11x8.png';
}

function gameLoop() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - gameObject.lastTime) / 1000;
    const dt = deltaTime;
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    renderStars(dt);
    renderBullets(dt);
    renderPlayer(dt);
    renderEnemies(dt);
    renderScore();
    renderMenu();

    if(!Object.keys(gameObject.enemies).length) {
        gameObject.bullets = {};
        generateEnemies();
    }

    if(gameObject.gameOver) {
        gameOver();
        return;
    };

    gameObject.lastTime = currentTime;
    loopId = window.requestAnimationFrame(gameLoop);
}

function shoot(x, y) {
    const bulletId = uid();
    if(!Object.keys(gameObject.bullets).length) {
        gameObject.bullets[bulletId] = new Bullet(x + (gameObject.player.w / 2) - 3, y, 1, 'black', bulletId);
    }
}

function renderStars(dt) {
    for(let i=0; i < gameObject.stars.length; i++) {
        gameObject.stars[i].update(dt);
    }
}

function renderEnemies(dt) {
    for(let enemy in gameObject.enemies) {
        
        gameObject.enemies[enemy].update(dt);
    }
}

function renderBullets(dt) {
    for(let bullet in gameObject.bullets) {
        gameObject.bullets[bullet].update(dt);
    }
}

function renderPlayer(dt) {
    gameObject.player.update(dt, gameObject.playerSpeed);
}

function renderScore() {
    context.beginPath();
    context.fillStyle = 'black';
    context.font = "8px 'PressStart2P-Regular'";
    context.fillText("Score: " + gameObject.score , canvas.width - 100, 14);
    context.closePath();
}

function generateEnemies() {
    let y = 21;
    let rows = 5;
    let cols = 11;
    let temp = [];
    let enemyId = -1;
    for(let i = 0; i < cols; i++) {
        for(let j=0; j < rows; j++) {
            enemyId += 1;
            temp.push(new Enemy(5 + (gameObject.enemy.totalWidthAndSpace * i), (j * y) + 14, enemyId));
        }
    }
    gameObject.enemies = temp.reduce((dictionary, currentEl, index) => {
        dictionary[index] = currentEl;
        return dictionary;
    }, {});
}

function generateStars() {
    for(let i=0; i < 10; i++) {
        const randomX = Math.random() * canvas.width;
        const randomY = Math.random() * canvas.height;
        gameObject.stars.push(new Star(randomX, randomY));
    }
}

onkeydown = onkeyup= function(e){
    // e.preventDefault();
    gameObject.keyboardKeys[e.code] = e.type === 'keydown';
}

function onKeyPress(e) {
    const key = e.key;
    if(key && parseInt(key) && (parseInt(key) <= 5  && parseInt(key) >= 1)) {
        gameObject.weapon = parseInt(key) - 1;
        renderMenu();
    }
    if(key.toLowerCase() === 'p') {
        console.log('restart game');
        gameObject.gameOver = false;
        init();
    }
}

function makeItPixelated(ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
}

function valueInRange(value, min, max) {
    return (value <= max) && (value >= min);
}

function checkRectCollision(firstObject, secondObject) {
    const xOverlap = valueInRange(firstObject.x, secondObject.x, secondObject.x + secondObject.w) ||
        valueInRange(secondObject.x, firstObject.x, firstObject.x + firstObject.w);

    const yOverlap = valueInRange(firstObject.y, secondObject.y, secondObject.y + secondObject.h) ||
        valueInRange(secondObject.y, firstObject.y, firstObject.y + firstObject.h); 
    return xOverlap && yOverlap;
}

function uid() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function gameOver() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.beginPath();
    context.fillStyle = 'black';
    context.font = "16px 'PressStart2P-Regular'";
    context.fillText("Game Over", (canvas.width / 2) - 16 * 4, (canvas.height/2) - 8);
    context.closePath();

    context.beginPath();
    context.fillStyle = '#333333';
    context.font = "8px 'PressStart2P-Regular'";
    context.fillText('Press "P" to play again', (canvas.width / 2) - 8 * 11, (canvas.height/2) - 8 + 32);
    context.closePath();
}