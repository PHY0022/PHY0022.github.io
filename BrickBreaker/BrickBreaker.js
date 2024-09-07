"use strict";

const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
const ballRadius = 5;

const x = canvas.width / 2;
const y = canvas.height;
let start_x = x;
let start_y = y;
let dx = 4;
let dy = -4;
let click_x = 0;
let click_y = 0;

const initBrickRowCount = 5;
let brickColumnCount = 3;
const brickWidth = 65;
const brickHeight = 65;
const brickPadding = 25;
const brickOffsetTop = 25;
const brickOffsetLeft = 25;
let brick_adding_num = 10;
let ball_adding_num = 3;
let maximum_ballNum = 200;

let ballNum = 5;
let pos_diff = 5;
let hit_bottom = 0;
let round = 0;
let add_balls = 0;
let brick_brocken = 0;

let ball_color = "white";
let balls = [];
let bricks = [];

let waiting = true;
let live = true;

(function printRule() {
    ctx.fillStyle = "#7FFFD4";
    ctx.font = "50px Arial";
    drawCenteredText("Brick Breaker", canvas.width / 2, canvas.height / 2 - 200);

    ctx.font = "15px Arial";
    let left_pos = canvas.width / 2 - 150;
    ctx.fillText("Rules:", left_pos, canvas.height / 2 - 150);
    ctx.fillText("1. Shoot the balls to break the bricks.", left_pos, canvas.height / 2 - 130);
    ctx.fillText("2. Don't let the bricks hit the bottom.", left_pos, canvas.height / 2 - 110);
    ctx.fillText("3. There 8 types of bricks:", left_pos, canvas.height / 2 - 90);
    ctx.fillText("        - Normal: Normal brick.", left_pos, canvas.height / 2 - 70);
    ctx.fillText("        - Add balls: Add one more ball.", left_pos, canvas.height / 2 - 50);
    ctx.fillText("        - Double: Double the count of the brick.", left_pos, canvas.height / 2 - 30);
    ctx.fillText("        - Half: Half the count of the brick.", left_pos, canvas.height / 2 - 10);
    ctx.fillText("        - Cross ( # ): Decrease the count of the", left_pos, canvas.height / 2 + 10);
    ctx.fillText("          bricks in the same row and column.", left_pos, canvas.height / 2 + 30);
    ctx.fillText("        - Bomb ( * ): Decrease the count of the", left_pos, canvas.height / 2 + 50);
    ctx.fillText("          bricks in the 3x3 area.", left_pos, canvas.height / 2 + 70);
    ctx.fillText("        - Vertical ( ^ ): Decrease the count of", left_pos, canvas.height / 2 + 90);
    ctx.fillText("          the bricks in the same column.", left_pos, canvas.height / 2 + 110);
    ctx.fillText("        - Horizontal ( < ): Decrease the count", left_pos, canvas.height / 2 + 130);
    ctx.fillText("          of the bricks in the same row.", left_pos, canvas.height / 2 + 150);
    ctx.fillText("4. Have fun, good luck!", left_pos, canvas.height / 2 + 170);

    drawCenteredText("Warning: The reflected dashed line of the balls is not accurate.", canvas.width / 2, canvas.height / 2 + 200);
    drawCenteredText("Recommand browser: MS Edge.", canvas.width / 2, canvas.height / 2 + 220);

    ctx.fillStyle = "yellow";
    drawCenteredText("Click to start the game", canvas.width / 2, canvas.height / 2 + 250);
    drawCenteredText("|", canvas.width / 2, canvas.height / 2 + 275);
    drawCenteredText("|", canvas.width / 2, canvas.height / 2 + 280);
    drawCenteredText("\\/", canvas.width / 2, canvas.height / 2 + 285);
    // ctx.fillStyle = 'white';
})();

// brik types
// 1: normal
// 2: add balls
// 3: double
// 4: half
// 5: cross
// 6: bomb
// 7: vertical
// 8: horizontal

let brick_count_color = ["#62fff7", "#3ab0ff", "#0080ff", "#004cff", "#4c58ff", "#a200ff", "#6a00ff", "#ec5a97"];
let spacial_brick_color = "red";

for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < initBrickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 5, count: 10 };
    }
}

function drawStartPoint() {
    ctx.beginPath();
    ctx.arc(start_x, start_y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = ball_color;
    ctx.fill();
    ctx.closePath();
    ctx.fillStyle = ball_color;
    ctx.font = "20px Arial";
    let pos_x = start_x + 20;
    let pos_y = start_y - 20;
    if (pos_x > canvas.width) {
        pos_x = start_x - 20;
    }
    if (ballNum >= maximum_ballNum) {
        drawCenteredText("MAX " + ballNum, pos_x, pos_y);
    } else {
        drawCenteredText(ballNum, pos_x, pos_y);
    }
}

function firstCollisionPoint(x, y, mouseX, mouseY) {
    // let centerX = window.innerWidth / 2 - x;
    // let diff_x = mouseX - centerX - x;
    let diff_x = mouseX - x;
    let diff_y = mouseY - y;
    let vec = Math.sqrt(diff_x * diff_x + diff_y * diff_y);
    diff_x *= 3 / vec;
    diff_y *= 3 / vec;

    let current_x = x;
    let current_y = y;
    while (true) {
        let next_x = current_x + diff_x;
        let next_y = current_y + diff_y;
        
        if (next_x < 0 || next_x > canvas.width || next_y < 0 || next_y > canvas.height) {
            return { x: current_x, y: current_y, diff_x: diff_x, diff_y: diff_y};
        }
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = initBrickRowCount-1; r >= 0; r--) {
                let b = bricks[c][r];
                if (b.status >= 1) {
                    if (
                        next_x > b.x&&
                        next_x < b.x + brickWidth&&
                        next_y > b.y&&
                        next_y < b.y + brickHeight
                    ) {
                        return { x: current_x, y: current_y, diff_x: diff_x, diff_y: diff_y};
                    }
                }
            }
        }
        current_x = next_x;
        current_y = next_y;
    }
}

function secondCollisionPoint(x, y, diff_x, diff_y) {
    let current_x = x;
    let current_y = y;
    while (true) {
        let next_x = current_x + diff_x;
        let next_y = current_y + diff_y;
        
        if (next_x < 0 || next_x > canvas.width || next_y < 0 || next_y > canvas.height) {
            return { x: current_x, y: current_y, diff_x: diff_x, diff_y: diff_y};
        }
        for (let c = 0; c < brickColumnCount; c++) {
            for (let r = initBrickRowCount-1; r >= 0; r--) {
                let b = bricks[c][r];
                if (b.status >= 1) {
                    if (
                        next_x > b.x&&
                        next_x < b.x + brickWidth&&
                        next_y > b.y&&
                        next_y < b.y + brickHeight
                    ) {
                        return { x: current_x, y: current_y, diff_x: diff_x, diff_y: diff_y};
                    }
                }
            }
        }
        current_x = next_x;
        current_y = next_y;
    }
}

// Function to draw the line
function drawLine(mouseX, mouseY) {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStartPoint();
    drawBricks();

    // Set line style
    ctx.strokeStyle = 'white';
    ctx.setLineDash([5, 5]); // Dashed line
    ctx.lineWidth = 2;

    // let centerX = window.innerWidth / 2 - x;
    let target = firstCollisionPoint(start_x, start_y, mouseX, mouseY);
    // console.log(target.x, target.y);
    // Begin drawing
    ctx.beginPath();
    ctx.moveTo(start_x, start_y); // Start at the center of the canvas
    ctx.lineTo(target.x, target.y + ballRadius*2);   // Draw line to the mouse position
    ctx.stroke(); // Draw the line

    // Draw the reflection line
    let diff_x = target.diff_x;
    let diff_y = target.diff_y;
    // console.log(diff_x, diff_y);
    if (target.x <= ballRadius || target.x >= canvas.width - ballRadius) {
        diff_x = -diff_x;
        diff_y = -diff_y;
    }
    ctx.moveTo(target.x, target.y);
    target = secondCollisionPoint(target.x, target.y, diff_x, - diff_y);
    ctx.lineTo(target.x, target.y);
    ctx.stroke();
}

// Event listener to track mouse movement
let mouseLine = function(event) {
    // Get the mouse position
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Draw the line
    drawLine(mouseX, mouseY);
}

function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2); // Create a circle
    ctx.fillStyle = ball_color;
    ctx.fill();
    ctx.closePath();
}

function speedUpBalls() {
    for (let i = 0; i < ballNum; i++) {
        balls[i].dx *= 2;
        balls[i].dy *= 2;
    }
}

function drawCenteredText(text, x, y) {
    ctx.beginPath();
    ctx.textBaseline = 'middle';  // Center the text vertically

    // Measure the width of the text
    const textWidth = ctx.measureText(text).width;

    // Calculate the position to start the text so that it is centered
    const startX = x - textWidth / 2;

    // Draw the text on the canvas
    ctx.fillText(text, startX, y);
    ctx.closePath();
}

function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < initBrickRowCount; r++) {
            if (bricks[c][r].status >= 1) {
                let b = bricks[c][r];
                const brickX = r * (brickWidth + brickPadding) + brickOffsetLeft;
                const brickY = (brickColumnCount - c - 1) * (brickHeight + brickPadding) + brickOffsetTop;
                b.x = brickX;
                b.y = brickY;

                if (b.y + brickHeight >= y) {
                    live = false;
                }

                ctx.beginPath();
                ctx.lineWidth = "6";
                ctx.setLineDash([]);
                if (b.status == 2) {        // add balls
                    ctx.strokeStyle = "white";
                    ctx.fillStyle = "white";
                    ctx.lineWidth = "2";
                    ctx.setLineDash([5, 5]);
                } else if (b.status == 5) { // cross
                    ctx.strokeStyle = spacial_brick_color;
                    ctx.fillStyle = spacial_brick_color;
                } else if (b.status == 6) { // bomb
                    ctx.fillStyle = spacial_brick_color;
                    ctx.strokeStyle = spacial_brick_color;
                } else if (b.status == 7) { // vertical
                    ctx.fillStyle = spacial_brick_color;
                    ctx.strokeStyle = spacial_brick_color;
                } else if (b.status == 8) { // horizontal
                    ctx.fillStyle = spacial_brick_color;
                    ctx.strokeStyle = spacial_brick_color;
                } else {
                    // fill color based on the count
                    if (b.count > 2000) {
                        ctx.strokeStyle = brick_count_color[7];
                        ctx.fillStyle = brick_count_color[7];
                    } else if (b.count > 1000) {
                        ctx.strokeStyle = brick_count_color[6];
                        ctx.fillStyle = brick_count_color[6];
                    } else if (b.count > 500) {
                        ctx.strokeStyle = brick_count_color[5];
                        ctx.fillStyle = brick_count_color[5];
                    } else if (b.count > 200) {
                        ctx.strokeStyle = brick_count_color[4];
                        ctx.fillStyle = brick_count_color[4];
                    } else if (b.count > 80) {
                        ctx.strokeStyle = brick_count_color[3];
                        ctx.fillStyle = brick_count_color[3];
                    } else if (b.count > 40) {
                        ctx.strokeStyle = brick_count_color[2];
                        ctx.fillStyle = brick_count_color[2];
                    } else if (b.count > 20) {
                        ctx.strokeStyle = brick_count_color[1];
                        ctx.fillStyle = brick_count_color[1];
                    } else {
                        ctx.strokeStyle = brick_count_color[0];
                        ctx.fillStyle = brick_count_color[0];
                    }
                }
                // ctx.fill();
                ctx.rect(brickX+ballRadius, brickY+ballRadius+2, brickWidth-ballRadius-2, brickHeight-ballRadius-2);
                ctx.stroke();
                ctx.closePath();
                
                // ctx.fillStyle = "white";
                ctx.font = "20px Arial";
                if (b.status == 2) {        // add balls
                    drawCenteredText("+" + ball_adding_num, brickX + brickWidth / 2, brickY + brickHeight / 2);
                } else if (b.status == 5) { // cross
                    drawCenteredText("#" + b.count, brickX + brickWidth / 2, brickY + brickHeight / 2);
                } else if (b.status == 6) { // bomb
                    drawCenteredText("*" + b.count, brickX + brickWidth / 2, brickY + brickHeight / 2);
                } else if (b.status == 7) { // vertical
                    drawCenteredText("^" + b.count, brickX + brickWidth / 2, brickY + brickHeight / 2);
                } else if (b.status == 8) { // horizontal
                    drawCenteredText("<" + b.count, brickX + brickWidth / 2, brickY + brickHeight / 2);
                } else {
                    drawCenteredText(b.count, brickX + brickWidth / 2, brickY + brickHeight / 2);
                }
            }
        }
    }
}

function collisionDetection(ball) {
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < initBrickRowCount; r++) {
            let b = bricks[c][r];
            if (b.status >= 1) {
                if (
                    ball.x + ball.dx > b.x &&
                    ball.x + ball.dx < b.x + brickWidth &&
                    ball.y + ball.dy > b.y &&
                    ball.y + ball.dy < b.y + brickHeight
                ) {
                    // detect the collision direction
                    if (ball.x <= b.x || ball.x >= b.x + brickWidth) {
                        ball.dx = -ball.dx;
                        // dy = -dy;
                    }
                    if (ball.y <= b.y || ball.y >= b.y + brickHeight) {
                        ball.dy = -ball.dy;
                        // dx = -dx;
                    }
                    if (b.status == 5) {
                        cross_collision(c, r);
                    } else if (b.status == 6) {
                        bomb_collision(c, r);
                    } else if (b.status == 7) {
                        vertical_collision(c, r);
                    } else if (b.status == 8) {
                        horizontal_collision(c, r);
                    } else {
                        b.count--;
                    }
                    brick_status(c, r);
                }
            }
        }
    }
}

function brick_status(i, j) {
    let b = bricks[i][j];
    if (b.count == 0) {
        if (b.status == 2) { add_balls+=ball_adding_num; }
        b.status = 0;
        ctx.clearRect(b.x, b.y, b.x + brickWidth, b.y + brickHeight);
        brick_brocken++;
    }
}

function cross_collision(c, r) {
    ctx.beginPath();
    ctx.rect(bricks[c][r].x, 0, brickWidth, canvas.height);
    ctx.fillStyle = "red"; 
    ctx.fill();
    ctx.rect(0, bricks[c][r].y, canvas.width, brickHeight);
    ctx.fillStyle = "red"; 
    ctx.fill();
    ctx.closePath();
    for (let i = 0; i < brickColumnCount; i++) {
        if (bricks[i][r].status >= 1) {
            bricks[i][r].count--;
            brick_status(i, r);
        }
    }
    for (let j = 0; j < initBrickRowCount; j++) {
        if (bricks[c][j].status >= 1) {
            bricks[c][j].count--;
            brick_status(c, j);
        }
    }
}

function bomb_collision(c, r) {
    ctx.beginPath();
    ctx.rect(bricks[c][r].x - brickWidth, bricks[c][r].y - brickHeight, brickWidth*3, brickHeight*3);
    ctx.fillStyle = "red"; 
    ctx.fill();
    ctx.closePath();
    for (let i = c - 1; i <= c + 1; i++) {
        for (let j = r - 1; j <= r + 1; j++) {
            if (i >= 0 && i < brickColumnCount && j >= 0 && j < initBrickRowCount) {
                if (bricks[i][j].status >= 1) {
                    bricks[i][j].count--;
                    brick_status(i, j);
                }
            }
        }
    }
}

function vertical_collision(c, r) {
    ctx.beginPath();
    ctx.rect(bricks[c][r].x, 0, brickWidth, canvas.height);
    ctx.fillStyle = "red"; 
    ctx.fill();
    ctx.closePath();
    for (let i = 0; i < brickColumnCount; i++) {
        if (bricks[i][r].status >= 1) {
            bricks[i][r].count--;
            brick_status(i, r);
        }
    }
}

function horizontal_collision(c, r) {
    ctx.beginPath();
    ctx.rect(0, bricks[c][r].y, canvas.width, brickHeight);
    ctx.fillStyle = "red"; 
    ctx.fill();
    ctx.closePath();
    for (let j = 0; j < initBrickRowCount; j++) {
        if (bricks[c][j].status >= 1) {
            bricks[c][j].count--;
            brick_status(c, j);
        }
    }
}

function addBricks() {
    // let tmp = []
    bricks[brickColumnCount] = [];
    for (let r = 0; r < initBrickRowCount; r++) {
        // different brik types
        let rand = Math.floor(Math.random() * 100);
        // tmp.push(rand);
        if (rand < 5) {         // vertical
            bricks[brickColumnCount][r] = { x: 0, y: 0, status: 7, count: brick_adding_num };
        } else if (rand < 10) { // horizontal
            bricks[brickColumnCount][r] = { x: 0, y: 0, status: 8, count: brick_adding_num };
        } else if (rand < 20) { // double
            bricks[brickColumnCount][r] = { x: 0, y: 0, status: 3, count: brick_adding_num * 2 };
        } else if (rand < 70) { // add balls
            bricks[brickColumnCount][r] = { x: 0, y: 0, status: 2, count: 1 };
        } else if (rand > 95) { // cross
            bricks[brickColumnCount][r] = { x: 0, y: 0, status: 5, count: brick_adding_num };
        } else if (rand > 90) { // bomb
            bricks[brickColumnCount][r] = { x: 0, y: 0, status: 6, count: brick_adding_num };
        } else if (rand > 80) { // half
            bricks[brickColumnCount][r] = { x: 0, y: 0, status: 4, count: brick_adding_num / 2 };
        } else {                // normal
            bricks[brickColumnCount][r] = { x: 0, y: 0, status: 1, count: brick_adding_num };
        }
    }
    // console.log(tmp);
    brickColumnCount++;
}
  
// Function to get mouse position relative to the canvas
function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

// Function that waits for a click on the canvas and returns the position
function waitForClick(canvas) {
    return new Promise((resolve) => {
            canvas.addEventListener('click', function handleClick(event) {
            const mousePos = getMousePos(canvas, event);
            canvas.removeEventListener('click', handleClick);
            resolve(mousePos);
        });
    });
}

async function wait() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!waiting) {
          clearInterval(interval);
          resolve();
        }
      }, 100); // Check every 100ms
    });
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < ballNum; i++) {
        let ball = balls[i];
        if (ball.status == 0) {
            continue;
        }
        // console.log(ball, i);
        //ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBall(ball);
        drawBricks();
        collisionDetection(ball);

        ball.x += ball.dx;
        ball.y += ball.dy;

        // check if the ball hits the wall
        if (ball.y < canvas.height) { // check if the ball is in the canvas
            if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) {
                ball.dx = -ball.dx;
            }
        }
        if (ball.y + ball.dy < ballRadius) {
            ball.dy = -ball.dy;
        // (ball.dy >= 0) to check the ball is moving down
        } else if (ball.dy >= 0 && ball.y + ball.dy > canvas.height - ballRadius) {
            // ball.dy = -ball.dy;
            ball.status = 0;
            hit_bottom++;
            if (hit_bottom == 1) {
                start_x = ball.x;
            }
            if (hit_bottom == ballNum) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                round++;
                drawBricks();
                waiting = false;
                // console.log("go");
                return;
            }
        }
    }

    requestAnimationFrame(draw);
}

function countBricks() {
    let count = 0;
    for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < initBrickRowCount; r++) {
            if (bricks[c][r].status >= 1) {
                count++;
            }
        }
    }
    return count;
}

async function gameStart() {
    canvas.addEventListener('mousemove', mouseLine);
    while (true) {
        ballNum += add_balls;
        if (ballNum > maximum_ballNum) {
            ballNum = maximum_ballNum;
        }
        add_balls = 0;
        // console.log(ballNum);
        
        
        // console.log(countBricks());
        if (countBricks() == 0) {
            round++;
            addBricks();
            continue;
        }

        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBricks();
        drawStartPoint();

        if (!live) {
            break;
        }

        // decide the direction of the balls
        await waitForClick(canvas).then((mousePos) => {
            click_x = mousePos.x;
            click_y = mousePos.y;
        });
        const diff_x = click_x - start_x;
        const diff_y = click_y - start_y;
        const vec = Math.sqrt(diff_x * diff_x + diff_y * diff_y);
        // console.log('dx:', diff_x * (3 / vec), 'dy:', diff_y * (3 / vec));
        
        dx = diff_x * (3 / vec);
        dy = diff_y * (3 / vec);
        
        balls = [];
        for (let i = 0; i < ballNum; i++) {
            balls.push({ x: start_x-pos_diff*i*dx, y: start_y-pos_diff*i*dy, dx: dx, dy: dy, status: 1 });
        }
        
        // condictions before draw
        hit_bottom = 0;
        waiting = true;
        const interval = setInterval(speedUpBalls, 3000);

        draw();

        // wait for all balls to hit the bottom
        // console.log("wait here", waiting);
        await wait();
        clearInterval(interval);

        if (round % 2 == 0 || round >= 40) {
            addBricks();
            if (brick_adding_num < 1000) {
                brick_adding_num += brick_adding_num;
            }
        }
    }
    // console.log("out of loop");
    waiting = true;
    drawBricks();
    waiting = false;
    await wait();
    gameOver();
    canvas.removeEventListener('mousemove', mouseLine);
}

function gameOver() {
    alert("GAME OVER");
    printScoe()
}

function printScoe() {
    ctx.beginPath();
    ctx.fillStyle = "#7FFFD4";
    ctx.rect(0, canvas.height / 5 * 2, canvas.width, canvas.height / 5);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.rect(0, canvas.height / 5 * 2 + 10, canvas.width, canvas.height / 5 - 20);
    ctx.fill();

    ctx.font = "30px Arial";
    ctx.fillStyle = "yellow";
    drawCenteredText("Your score: " + brick_brocken, x, y/2-20);
    ctx.font = "25px Arial";
    if (brick_brocken > 150) {
        drawCenteredText("GODLIKE!", x, y/2+20);
    } else if (brick_brocken > 100) {
        drawCenteredText("Excellent!", x, y/2+20);
    } else if (brick_brocken >= 80) {
        drawCenteredText("Great!", x, y/2+20);
    } else if (brick_brocken >= 60) {
        drawCenteredText("Good!", x, y/2+20);
    } else if (brick_brocken >= 30) {
        drawCenteredText("Nice!", x, y/2+20);
    } else {
        drawCenteredText("Try again!", x, y/2+20);
    }
}

document.getElementById("start").addEventListener("click", function () {
    gameStart();
    this.disabled = true;
    this.addEventListener("mouseout", function() {
        this.style.color = "#00ffaa80";
        this.style.background = "black";
        this.style.border = "2px solid #00ffaa80";
    });
});
