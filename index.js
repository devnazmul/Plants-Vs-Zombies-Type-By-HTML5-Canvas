
const canvas = document.getElementById('canvas');
canvas.width = 1000;
canvas.height = 600;

const ctx = canvas.getContext('2d');

// GLOBAL VARIABLES 
const cellSize = 50;
const cellGap = 5;
const gameGrid = [];

const defenders = [];
let defenderShootingX = 0;
const projectiles = [];

const enemies = [];
const enemiesPositions = [];
let enemiesInterval = 400;

const enemyCharacter = [
    'greenSnake',
    'graySnake',
    'bear',
    'wolf',
];

let numberOfResources = 500;
let points = 0;
let frame = 0;

let gameOver = false;
let win = false;
// MOUSE 
const mouse = {
    x: undefined,
    y: undefined,
    width: 0.1,
    height: 0.1
}

let canvasPosition = canvas.getBoundingClientRect();

canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.x - canvasPosition.left;
    mouse.y = e.y - canvasPosition.top;
});

canvas.addEventListener('mouseleave', () => {
    mouse.x = undefined;
    mouse.y = undefined;
})

// COLLISION 
const collision = (firstObject, secondObject) => {
    if (
        !(
            (firstObject.x > secondObject.x + secondObject.width) ||
            (firstObject.y > secondObject.y + secondObject.height) ||
            (firstObject.x + firstObject.width < secondObject.x) ||
            (firstObject.y + firstObject.height < secondObject.y)
        )
    ) {
        return true;
    }

}
// GAME BOARD 
const controlBars = {
    width: canvas.width,
    height: cellSize * 2
}



// GAME GRID
class Cell {
    constructor(x, y, image) {
        this.x = x;
        this.y = y;
        this.width = cellSize;
        this.height = cellSize;
        this.image = new Image();
        this.image.src = image;
    }
    draw() {
            ctx.drawImage(this.image, this.x,this.y,cellSize,cellSize)
        if (mouse.x && mouse.y && collision(this, mouse) && mouse.x > cellSize) {
            ctx.strokeStyle = "rgba(244,244,244,0.1)";
            ctx.fillStyle = "rgba(244,244,244,0.02)";
            ctx.fillRect(this.x, 0, this.width, canvas.height)
            ctx.fillRect(this.x, this.y, this.width, this.height)
            ctx.fillRect(this.x, this.y, canvas.width, this.height)
        }
    }
}
const createGrid = () => {
    for (let y = cellSize*2; y <= canvas.height; y += cellSize) {
        for (let x = 0; x <= canvas.width; x += cellSize) {
            gameGrid.push(new Cell(x, y, (((x/cellSize)+(y/cellSize))%2==0) ? "./assets/floor_1.png":"./assets/floor_1.png"))
        }
    }
}
createGrid();
const handleGrid = () => {
    for (let i = 0; i < gameGrid.length; i++) {
        gameGrid[i].draw()
    }
}


// PROJECTILES 
class Projectile {
    constructor(x, y, defenderProjectile) {
        this.x = x;
        this.y = y;
        this.width = defenderProjectile.width;
        this.height = defenderProjectile.height;
        this.power = defenderProjectile.power;
        this.speed = defenderProjectile.speed;
        this.image = defenderProjectile.image;
        this.projectilesFrame = 0;
        this.timer = 0;

    }
    update() {
        this.x += this.speed;
        if (this.timer % 10 === 0) {
            if (this.projectilesFrame <= 26 * 2) {
                this.projectilesFrame += 26
            }
            else {
                this.projectilesFrame = 0
            }
        }
        this.timer++
    }
    draw() {
        ctx.drawImage(this.image, this.projectilesFrame, 0, 26, 26, this.x, this.y, this.width, this.height)
    }
}
const handleProjectiles = () => {
    for (let i = 0; i < projectiles.length; i++) {
        projectiles[i].update();
        projectiles[i].draw();
        if (projectiles[i] && projectiles[i].x > canvas.width - cellSize) {
            projectiles.splice(i, 1);
            i--
        }
    }
}


// DEFENDERS 
const greenArcherImage = new Image();
const redArcherImage = new Image();
const witchImage = new Image();
const witchProjectile = new Image();


greenArcherImage.src = './assets/d1.png'
redArcherImage.src = './assets/d3_.png'
witchImage.src = './assets/d3_.png'
witchProjectile.src = './assets/w_p.png';

const greenArcher = {
        image: greenArcherImage,
        health: 100,
        height: 0,
        width: 0,
        idle: {
            startingFrame: 0,
            endingFrame: 6
        },
        shooting: {
            startingFrame: 8,
            endingFrame: 0
        },
        getHit: {
            startingFrame: 0,
            endingFrame: 0
        },
    }
const redArcher = {
        image: redArcherImage,
        health: 100,
        height: 0,
        width: 0,
        idle: {
            startingFrame: 0,
            endingFrame: 0
        },
        shooting: {
            startingFrame: 0,
            endingFrame: 0
        },
        getHit: {
            startingFrame: 0,
            endingFrame: 0
        },
    }
const witch = {
        image: witchImage,
        health: 100,
        projectile:{
            width : 15,
            height : 15,
            power : 10,
            speed :1.5,
            image : witchProjectile,
        },
        idle: {
            x:231,
            y:0,
            startingFrame: 0,
            endingFrame: 6,
            width: 220,
            height: 90,
        },
        shooting: {
            x:231,
            y:1,
            startingFrame: 0,
            endingFrame: 6,
            width: 220,
            height: 90,
        },
        getHit: {
            startingFrame: 0,
            endingFrame: 0
        },
    }


class Defender {
    constructor(x, y, defender) {
        this.x = x;
        this.y = y;
        this.width = cellSize - cellGap;
        this.height = cellSize - cellGap;
        this.shotting = false;
        this.projectiles = [];
        this.timer = 0;
        
        this.health = defender.health;
        this.maxHealth = this.health;
        this.image = defender.image;

        // THIS IS CONSTANT 
        this.defenderShootingX = defender.shooting.x;

        this.defenderShootingFrameX = this.defenderShootingX;
        this.defenderShootingY = defender.shooting.y;
        this.defenderShootingFrameWidth = defender.shooting.width
        this.defenderShootingFrameHeight = defender.shooting.height
        this.defenderShootingStartingFrame = defender.shooting.height
        this.defenderShootingEndingFrame = defender.shooting.endingFrame

        this.defenderProjectile = defender.projectile
        
    }
    draw() {
        
        // DRAW DEFENDER 
        ctx.drawImage(this.image, this.defenderShootingX, this.defenderShootingY * this.defenderShootingFrameHeight, this.defenderShootingFrameWidth, this.defenderShootingFrameHeight, this.x, this.y, cellSize + this.defenderShootingFrameHeight, cellSize)

        // DAW HEALTH BAR 
        ctx.strokeStyle = 'white'; 
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x, this.y + cellSize - 5, (cellSize * this.health) / this.maxHealth, 2)
        ctx.lineWidth = .1;
        ctx.strokeRect(this.x, this.y + cellSize - 5, cellSize, 2)
    }
    update() {
        if (this.timer % 10 === 0) {
            if (this.defenderShootingX <= this.defenderShootingFrameX * this.defenderShootingEndingFrame) {
                this.defenderShootingX += this.defenderShootingFrameX
                this.shotting = false
                if (this.defenderShootingX / this.defenderShootingFrameX === this.defenderShootingEndingFrame-2) {
                    this.shotting=true
                }
            }
            else {
                this.defenderShootingX = 0
                this.shotting=false
            }
        }
        this.timer++
        if (this.timer % 10 === 0 && this.shotting) {
            projectiles.push(new Projectile((this.x + cellSize), this.y + 10, this.defenderProjectile ))
        }
    }
}
canvas.addEventListener('click', (e) => {
    const gridPositionX = mouse.x - (mouse.x % cellSize);
    const gridPositionY = mouse.y - (mouse.y % cellSize);
    if (gridPositionY < cellSize * 2) return;
    if (gridPositionX < cellSize) return;
    for (let i = 0; i < defenders.length; i++) {
        if ((defenders[i].x === gridPositionX) && (defenders[i].y === gridPositionY)) return;
    }
    let defenderCost = 100;
    if (defenderCost <= numberOfResources) {
        defenders.push(new Defender(gridPositionX, gridPositionY,witch));
        numberOfResources -= defenderCost;
    }
})
const handleDefenders = () => {
    for (let i = 0; i < defenders.length; i++) {
        defenders[i].draw();
        defenders[i].update();

        for (let j = 0; j < enemies.length; j++) {
            if (defenders[i] && enemies[j] && collision(defenders[i], enemies[j])) {
                defenders[i].health -= Math.floor(enemies[j].power / 200);
                enemies[j].movement = 0
                if (defenders[i] && defenders[i].health <= 0) {
                    defenders.splice(i, 1);
                    i--;
                    enemies[j].movement = enemies[j].speed
                }
            }
        }
    }
}


// ENEMIES 
class Enemy {
    constructor(verticalPosition, character) {
        this.x = canvas.width;
        this.y = verticalPosition;
        this.width = cellSize;
        this.height = cellSize;

        this.character = character

        switch (character) {
            case 'greenSnake':
                this.power = 100;
                this.speed = 0.1;
                this.movement = this.speed;
                this.health = 100;
                this.maxHealth = this.health;
                break;
            case 'graySnake':
                this.power = 150;
                this.speed = 0.1;
                this.movement = this.speed;
                this.health = 100;
                this.maxHealth = this.health;
                break;
            case 'bear':
                this.power = 200;
                this.speed = 0.2;
                this.movement = this.speed;
                this.health = 300;
                this.maxHealth = this.health;
                break;
            default:
                this.power = 250;
                this.speed = 0.4;
                this.movement = this.speed;
                this.health = 200;
                this.maxHealth = this.health;
                break;
        }
        this.image = new Image();
        this.image.src = './assets/spritesheet.png';
        this.defenderShootingX = defenderShootingX
        this.timer = 0

    }
    update() {
        this.x -= this.movement;
        if (this.timer % 10 === 0) {
            if (this.character == 'bear' || this.character == 'wolf') {
                if (this.defenderShootingX < 16 * 3) {
                    this.defenderShootingX += 16
                }
                else {
                    this.defenderShootingX = 0
                }
            } else {
                if (this.defenderShootingX < 16 * 7) {
                    this.defenderShootingX += 16
                }
                else {
                    this.defenderShootingX = 0
                }
            }
        }
        this.timer++
    }
    draw() {
        if (this.character == 'greenSnake') {
            ctx.drawImage(this.image, this.defenderShootingX, 0, 16, 16, this.x, this.y, cellSize, cellSize)

        }
        if (this.character == 'graySnake') {
            ctx.drawImage(this.image, this.defenderShootingX, 16 * 3, 16, 16, this.x, this.y, cellSize, cellSize)

        }
        if (this.character == 'bear') {
            ctx.drawImage(this.image, this.defenderShootingX + (16 * 4), 16 * 18, 16, 16, this.x, this.y, cellSize, cellSize)
        }
        if (this.character == 'wolf') {
            ctx.drawImage(this.image, this.defenderShootingX + (16 * 4), 16 * 24, 16, 16, this.x, this.y, cellSize, cellSize)
        }
        ctx.strokeStyle = 'white';
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y, (cellSize * this.health) / this.maxHealth, 2)
        ctx.lineWidth = .1;
        ctx.strokeRect(this.x, this.y, cellSize, 2)
    }
}
const handleEnemies = () => {
    if (frame % enemiesInterval === 0) {
        let verticalPosition = Math.floor(Math.random() * 5 + 1) * cellSize * 2;
        enemies.push(new Enemy(verticalPosition, enemyCharacter[Math.floor(Math.random() * (enemyCharacter.length + 0))]));
        enemiesPositions.push(verticalPosition);
        if (enemiesInterval > 120) {
            enemiesInterval -= 5;
        }
    }
    for (let i = 0; i < enemies.length; i++) {
        if (enemies[i]) {
            enemies[i].update();
            enemies[i].draw();
            if (enemies[i].x <= 0) {
                gameOver = true;
            }
        }
        for (let j = 0; j < projectiles.length; j++) {
            if (enemies[i] && projectiles[j] && collision(enemies[i], projectiles[j])) {
                enemies[i].health -= projectiles[j].power;
                projectiles.splice(j, 1);
                j--;
                if (enemies[i] && enemies[i].health <= 0) {
                    numberOfResources += Math.floor(enemies[i].maxHealth / 3);
                    points += Math.floor(enemies[i].maxHealth);
                    enemies.splice(i, 1);
                    i--;
                    if (enemies.length <= 0) {
                        setTimeout(() => {
                            win = true
                        }, 100)

                    }
                }
            }

        }

    }
}

// UTILITIES 
const handleGameStatus = () => {
    ctx.fillStyle = 'white';
    ctx.font = '30px Creepster';
    ctx.fillText(`Resources: ${numberOfResources}`, 20, 55);
    ctx.font = '20px Creepster';
    ctx.fillText(`Points: ${points}`, 20, 80);
}

const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'blue'
    ctx.fillRect(0, 0, controlBars.width, controlBars.height)
    handleGrid()
    handleDefenders()
    handleEnemies()
    handleProjectiles()
    handleGameStatus()
    frame++;

    if (!gameOver && !win) {
        requestAnimationFrame(animate);
    } else {
        if (win) {
            ctx.fillStyle = 'white';
            ctx.font = '50px Creepster';
            ctx.fillText(`Win with ${points} points`, canvas.width / 2 - 150, canvas.height / 2 + 30)
        } else {

            ctx.fillStyle = 'white';
            ctx.font = '50px Creepster';
            ctx.fillText(`Game Over`, canvas.width / 2 - 100, canvas.height / 2 )
            // ctx.fillStyle = 'white'
            // ctx.fillRect(canvas.width/2 - (cellSize+100)/2, canvas.height/2 + cellSize, cellSize+100,cellSize)
        }

    }
}
animate()
