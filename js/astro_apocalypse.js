/************************************************************************************
 * astro_apocalypse.js
 * 
 * Copyright 2014, Tara Mathers
 * 
 * Requires:
 *     - canvas element with id="canvas"
 *     - call initialize() on load 
 * 
 * Coordinate system is relative to the camera. That is, (0, 0, 20) is always at the
 * middle of the screen, with the y-axis inverted and positive z-axis pointing in the
 * direction of the camera.
 ****************************************/


/******************************************
 * initialize()
 * Initial function called on page load
 *****************************************/

function initialize() {

    // Global variables:
    
    CANVAS_WIDTH = window.innerWidth;
    CANVAS_HEIGHT = window.innerHeight;
    
    REFRESH_RATE = 30;
    
    
    EYE_TO_SCREEN_DIST = 20;
    
    X_MAX = CANVAS_WIDTH;
    Y_MAX = CANVAS_HEIGHT;
    Z_MAX = 1000;
    
    
    CUBE_SPEED = 12;    // amount of z-units per frame
    
    MOVE_SPEED = 50;    // space ship's speed

    MAX_CUBES = 40;     // max number of cubes displayed at any time

    laserLength = 30;
    
    lasers = new Array();
    
    LASER_DELAY = 250;  // min time between laser shots in ms
    
    laserDelayOn = false;
    
    squareSize = 200;
    
    // The increment to rotate camera by
    r_inc = Math.PI/180; 
    
    titleFlashText = 20;
    
    gameStarted = 0;
    
    score = 0;
    
    gameState = {
        TITLE:     0,
        GAME:      1,
        GAME_OVER: 2
    }
    
    currentState = gameState.TITLE;
    
    // Create canvas and context objects
    canvas = document.getElementById('canvas'); 
    context = canvas.getContext('2d');
    
    screenImage = context.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Add key event listeners      
    document.onkeydown = keyListener;
    //document.onkeypress = keyListener;
    document.onkeyup = keyUpListener;
    
    
    // Call the draw() function at the specified refresh interval
    setInterval(draw, REFRESH_RATE);
    
    // prevent the arrow and space keys from scrolling the page
    window.addEventListener("keydown", function(e) {
        // space and arrow keys
        if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }, false);
    
}

/**
 * Initialize the cube object data.
 */
function initGameState() {
    
    // initialize cubes 
    squares = new Array(MAX_CUBES);       // (x, y, z) coordinates of each square
    
    for (var i = 0; i < MAX_CUBES; i++) {
        squares[i] = new Square();
    }
    
    squares.sort(sortCubes);
    
    // initialize lasers
    lasers = new Array();
    
    // reset score
    score = 0;
    
    moveUp = 0;
    moveLeft = 0;
    moveDown = 0;
    moveRight = 0;
    
    rotate = 0; // keeps track of current rotation of the camera in radians
    
    // Init terrain object
    terrain = new Terrain(50);

}

function draw() {

    canvas.width  = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
  
    switch (currentState) {
        case gameState.TITLE: 
            drawTitleScreen();
            break;
        case gameState.GAME:
            drawGame();
            break;
        case gameState.GAME_OVER:
            drawTitleScreen();
            break;
    }
}


function drawTitleScreen() {

    if ( currentState == gameState.TITLE ) {
        titleText ="Astro Apocalypse";
        subText = "Press Enter";
    } 
    else {
        titleText ="Game Over";
        subText = "Replay";
    }

    context.fillStyle = "rgb(0, 0, 0)";
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Set shadow and fill styles
    context.fillStyle = "rgb(0, 255, 0)";
    
    context.shadowOffsetX=4;
    context.shadowOffsetY=4;
    context.shadowBlur=2;
    context.shadowColor="rgba(0, 255, 0, 0.5)";
    
    // Draw title text 
    context.font = "bold 50px courier new";
    context.textAlign = "center";
    context.fillText(titleText, CANVAS_WIDTH/2, CANVAS_HEIGHT/2-25);
    
    
    // Draw 'Press Enter' flashing
    if (titleFlashText > 0) {
        context.font = "bold 22px courier new";
        context.fillText(subText, CANVAS_WIDTH/2, 2*CANVAS_HEIGHT/3);
        titleFlashText--;
        if (titleFlashText == 0) {
            titleFlashText = -19;
        }
    }
    else {
        context.save();
        context.fillStyle = "rgb(0, 0, 0)";
        context.fillRect(0, CANVAS_HEIGHT/2, CANVAS_WIDTH, CANVAS_HEIGHT/2);
        context.restore();
        titleFlashText++;
        if (titleFlashText == -1) {
            titleFlashText = 20;
        }
    }
    
    // Turn off shadowing
    context.shadowOffsetX=0;
    context.shadowOffsetY=0;
    context.shadowBlur=0;
    context.shadowColor="rgba(0, 0, 0, 0)";
    
    context.font = "bold 12px courier new";
    context.fillText(String.fromCharCode(169) + " 2014 Tara Mathers", CANVAS_WIDTH/2, 4*CANVAS_HEIGHT/5);
    
    
    // Draw cross-hairs:    
    context.save();
    context.translate(187, -38);

    context.strokeStyle = "rgba(255, 255, 255, 0.4)";
    context.lineWidth = 4;
    context.beginPath();
    context.moveTo(CANVAS_WIDTH/2 + 77, CANVAS_HEIGHT/2);
    context.lineTo(CANVAS_WIDTH/2 - 77, CANVAS_HEIGHT/2);
    context.stroke();
    context.beginPath();
    context.moveTo(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 77);
    context.lineTo(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 77);
    context.stroke();
    context.beginPath();
    context.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 55, 0, Math.PI*2, true);
    context.stroke();
    context.restore();
    
    
    if ( currentState == gameState.GAME_OVER ) {
        context.font = "bold 16px courier new";
        context.fillStyle = "rgb(0, 255, 0)";
        context.fillText("You Scored: " + score, CANVAS_WIDTH/2, CANVAS_HEIGHT/5);
    }


}


/*******************************************************************************
 * drawGame()
 * -----------------------------------------------------------------------------
 * Draws each frame at the refresh interval
 *******************************************************************************/
function drawGame() {

    
    context.fillStyle = "rgb(0, 0, 0)";
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    context.save();
    
    this.updateCameraPosition();
    
    
/*   var sky = new Image();
    sky.src = 'Mandelbulb2-large.jpg';
    context.drawImage(sky, -50, -50, CANVAS_WIDTH+100, 3*CANVAS_HEIGHT/4);
    
/*
    var ground = new Image();
    ground.src = 'Mandelbulb_spirals___low_res_by_KrzysztofMarczak.jpg';
    context.drawImage(ground, -50, CANVAS_HEIGHT/2, CANVAS_WIDTH+100, CANVAS_HEIGHT/2+ 50);
*/  
       
    terrain.draw();
    
    for (var i = 0; i < MAX_CUBES; i++) {
    
        if (squares[i].z > 0) {
        
            // calculate screen coordinates of each corner of the cube:
            
            var frontX1 = squares[i].x * (EYE_TO_SCREEN_DIST / squares[i].z);
            var frontX2 = (squares[i].x + squareSize) * (EYE_TO_SCREEN_DIST / squares[i].z);
            
            var frontY1 = squares[i].y * (EYE_TO_SCREEN_DIST / squares[i].z);
            var frontY2 = (squares[i].y + squareSize) * (EYE_TO_SCREEN_DIST / squares[i].z);
            
            var backX1 = squares[i].x * (EYE_TO_SCREEN_DIST / (squares[i].z+squareSize/20));
            var backX2 = (squares[i].x + squareSize) * (EYE_TO_SCREEN_DIST / (squares[i].z+squareSize/20));
            
            var backY1 = squares[i].y * (EYE_TO_SCREEN_DIST / (squares[i].z+squareSize/20));
            var backY2 = (squares[i].y + squareSize) * (EYE_TO_SCREEN_DIST / (squares[i].z+squareSize/20));
            
            
            
            context.lineWidth = 1.5;
            context.strokeStyle = "rgb(0, 255, 0)";
            context.fillStyle = "rgb(0, 0, 0)";
            context.lineCap = "butt";
            
            context.fillRect(backX1+ CANVAS_WIDTH/2, 
                             backY1 + CANVAS_HEIGHT/2,
                             backX2-backX1, 
                             backY2-backY1);
            context.strokeRect(backX1+ CANVAS_WIDTH/2, 
                               backY1 + CANVAS_HEIGHT/2,
                               backX2-backX1, 
                               backY2-backY1);      
        
            context.beginPath();
            
            backX1 += CANVAS_WIDTH/2;
            backY1 += CANVAS_HEIGHT/2;
            backX2 += CANVAS_WIDTH/2;
            backY2 += CANVAS_HEIGHT/2;
            frontX1 += CANVAS_WIDTH/2;
            frontY1 += CANVAS_HEIGHT/2;
            frontX2 += CANVAS_WIDTH/2;
            frontY2 += CANVAS_HEIGHT/2;
            
            if (squares[i].y + CANVAS_HEIGHT/2 > CANVAS_HEIGHT/2) {
                context.beginPath();
                context.moveTo(backX1, backY1);
                context.lineTo(frontX1, frontY1);
                context.lineTo(frontX2, frontY1);
                context.lineTo(backX2, backY1);
                context.lineTo(backX1, backY1);
                context.stroke();
                context.fill();
            }
            
            else if (squares[i].y + CANVAS_HEIGHT/2 + squareSize < CANVAS_HEIGHT/2) {
                context.beginPath();
                context.moveTo(backX1, backY2);
                context.lineTo(frontX1, frontY2);
                context.lineTo(frontX2, frontY2);
                context.lineTo(backX2, backY2);
                context.lineTo(backX1, backY2);
                context.fill();
                context.stroke();
            }
            
            if (squares[i].x + CANVAS_WIDTH/2 > CANVAS_WIDTH/2) {
                context.beginPath();
                context.moveTo(backX1, backY1);
                context.lineTo(frontX1, frontY1);
                context.lineTo(frontX1, frontY2);
                context.lineTo(backX1, backY2);
                context.lineTo(backX1, backY1);
                context.fill();
                context.stroke();
            }
            
            else if (squares[i].x + CANVAS_WIDTH/2 + squareSize < CANVAS_WIDTH/2) {
                context.beginPath();
                context.moveTo(backX2, backY1);
                context.lineTo(frontX2, frontY1);
                context.lineTo(frontX2, frontY2);
                context.lineTo(backX2, backY2);
                context.lineTo(backX2, backY1);
                context.fill();
                context.stroke();
            }
                               
                               
            context.fillRect(frontX1, 
                             frontY1,
                             frontX2-frontX1, 
                             frontY2-frontY1);
            context.strokeRect(frontX1, 
                               frontY1,
                               frontX2-frontX1, 
                               frontY2-frontY1);    

            
            squares[i].z -= CUBE_SPEED;
            
            // If laser shot intersects the cube, delete it
            for (var j = 0; j < lasers.length; j++) {
                if (squares[i].y <= lasers[j].laser1Y && squares[i].y + squareSize  >= lasers[j].laser1Y
                        && squares[i].x <= lasers[j].laser1X && squares[i].x + squareSize >= lasers[j].laser1X
                        && squares[i].z <= lasers[j].laserZ + laserLength) {
                        
                    squares[i] = new Square();
                    lasers.splice(j-1, 1);
                    
                    score += 100;
                    
                }
                
                // If laser passes Z_MAX, delete it
                if ( lasers[j].laserZ > Z_MAX ) {
                    lasers.splice(j-1, 1);
                }
            }
            
            // End game if the spaceship gets hit by the cube 
            if ( 0 >= squares[i].y && 0 <= squares[i].y + squareSize
                && 0 >= squares[i].x && 0 <= squares[i].x + squareSize
                && EYE_TO_SCREEN_DIST >= squares[i].z && EYE_TO_SCREEN_DIST <= squares[i].z + squareSize ) {
                
                currentState = gameState.GAME_OVER;
            }
        }
        
        else {
            squares[i] = new Square();
            squares.sort(sortCubes);
        }
        
            
    }
    
    // Draw laser beams:
    for (var i = 0; i < lasers.length; i++) {
            
        context.lineWidth = 3;
        context.strokeStyle = "rgb(0, 255, 255)";
            
            
        var laser1screenX = lasers[i].laser1X * (EYE_TO_SCREEN_DIST / lasers[i].laserZ) + CANVAS_WIDTH/2;
        var laser1screenY = lasers[i].laser1Y * (EYE_TO_SCREEN_DIST / lasers[i].laserZ) + CANVAS_HEIGHT/2;
        
        var laser1screenXend = lasers[i].laser1X * (EYE_TO_SCREEN_DIST / (lasers[i].laserZ + laserLength)) + CANVAS_WIDTH/2;
        var laser1screenYend = lasers[i].laser1Y * (EYE_TO_SCREEN_DIST / (lasers[i].laserZ + laserLength)) + CANVAS_HEIGHT/2;
            
        var laser2screenX = lasers[i].laser2X * (EYE_TO_SCREEN_DIST / lasers[i].laserZ) + CANVAS_WIDTH/2;
        var laser2screenY = lasers[i].laser2Y * (EYE_TO_SCREEN_DIST / lasers[i].laserZ) + CANVAS_HEIGHT/2;
        
        var laser2screenXend = lasers[i].laser2X * (EYE_TO_SCREEN_DIST / (lasers[i].laserZ + laserLength)) + CANVAS_WIDTH/2;
        var laser2screenYend = lasers[i].laser2Y * (EYE_TO_SCREEN_DIST / (lasers[i].laserZ + laserLength)) + CANVAS_HEIGHT/2;
            
                
        context.beginPath();
        context.moveTo(laser1screenX, laser1screenY);
        context.lineTo(laser1screenXend, laser1screenYend);
        context.stroke();
        
        context.beginPath();
        
        context.moveTo(laser2screenX, laser2screenY);
        context.lineTo(laser2screenXend, laser2screenYend);
        context.stroke();
                
            
        lasers[i].laserZ += 5;

    }
    
    // Draw cross-hairs:
    context.strokeStyle = "rgba(255, 255, 255, 0.75)";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(CANVAS_WIDTH/2 + 15, CANVAS_HEIGHT/2);
    context.lineTo(CANVAS_WIDTH/2 - 15, CANVAS_HEIGHT/2);
    context.stroke();
    context.beginPath();
    context.moveTo(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 + 15);
    context.lineTo(CANVAS_WIDTH/2, CANVAS_HEIGHT/2 - 15);
    context.stroke();
    context.beginPath();
    context.arc(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 10, 0, Math.PI*2, true);
    context.stroke();
    
        
    // restore because we always want score to be un-rotated
    context.restore();

    // Draw score:
    context.fillStyle = "rgb(0, 255, 0)";
    context.font = "bold 18px courier new";
    context.fillText("Score: " + score, 20, 20);
}

function updateCameraPosition() {

    context.translate(CANVAS_WIDTH/2, CANVAS_HEIGHT/2);
   
    // start to rotate back if we're rotated and not moving left/right
    if ( moveRight == 0 && moveLeft == 0 ) { 
        if (rotate > 0) {
            rotate -= r_inc;
            if (rotate < 0) {
                rotate = 0;
            }
            context.rotate(rotate);
        }
        else if (rotate < 0) {
            rotate += r_inc;
            if (rotate > 0) {
                rotate = 0;
            }
            context.rotate(rotate);
        }
    }
    
    // Update camera position:
    
    if (moveLeft == 1) {                            // moving left
        
        for (var i = 0; i < MAX_CUBES; i++) {
            squares[i].x += MOVE_SPEED;
        }
        
        for (var i = 0; i < lasers.length; i++) {
            lasers[i].laser1X += MOVE_SPEED;
            lasers[i].laser2X += MOVE_SPEED;
        }
        
        if (rotate < 14 * r_inc) {
        
            rotate += r_inc;

        }
        context.rotate(rotate);
    }
    
    if (moveUp == 1) {                         // moving up 
        
        for (var i = 0; i < MAX_CUBES; i++) {
            squares[i].y += MOVE_SPEED;
        }
        
        for (var i = 0; i < lasers.length; i++) {
            lasers[i].laser1Y += MOVE_SPEED;
            lasers[i].laser2Y += MOVE_SPEED;
        }
    }
    
    if (moveRight == 1) {                      // moving right
                
        for (var i = 0; i < MAX_CUBES; i++) {
            squares[i].x -= MOVE_SPEED;
        }
        
        for (var i = 0; i < lasers.length; i++) {
            lasers[i].laser1X -= MOVE_SPEED;
            lasers[i].laser2X -= MOVE_SPEED;
        }
        
        if (rotate > -14 * r_inc) {
         
            rotate -= r_inc;
           
        }
        context.rotate(rotate);
    }
    
    if (moveDown == 1) {                       // moving down
                        
        for (var i = 0; i < MAX_CUBES; i++) {
            squares[i].y -= MOVE_SPEED;
        }
        
        for (var i = 0; i < lasers.length; i++) {
            lasers[i].laser1Y -= MOVE_SPEED;
            lasers[i].laser2Y -= MOVE_SPEED;
        }
    }
    context.translate(-CANVAS_WIDTH/2, -CANVAS_HEIGHT/2);
}

/*******************************************************************************
 * Square Object
 *
 *
 *******************************************************************************/
function Square() {
     
    this.x = Math.random() * X_MAX * 4 - 2 * X_MAX;
    this.y = Math.random() * Y_MAX * 4 - 2 * Y_MAX;
    this.z = Math.random() * Z_MAX + Z_MAX/4;
    
}


/*******************************************************************************
 * Laser Object
 *
 *
 *******************************************************************************/
function Laser() {
    this.laser1X = -20;
    this.laser2X = 20;
    this.laser1Y = 50;
    this.laser2Y = 50;
        
    this.laserZ = 1;
}

/*******************************************************************************
 * Terrain Object
 *
 *
 *******************************************************************************/
function Terrain(num) {
    
    this.terrain = new Array(num);
    
    NUM_SLICES = num;
    
    TERRAIN_SPEED = 1;
    
    yMaxTerrain = Y_MAX / 2;
    var z = 0;
    
    for (var i = 0; i < NUM_SLICES; i++) {
    
        z += Z_MAX / NUM_SLICES;
        
        this.terrain[i] = newSlice(z);
        
    }
    
    function newSlice(z) {
    
        var slice = {
            y:  this.yMaxTerrain  * (EYE_TO_SCREEN_DIST / z) + this.yMaxTerrain,
            z:  z
        };
        
        return slice;
    };
    
    this.draw = function draw() {

        
        var grd = context.createLinearGradient(0, Y_MAX /2, 0, Y_MAX);

        for ( var i = 1; i < NUM_SLICES; i++ ) {
            
            var color = (i % 2 == 0) ? '#000' : '#111111';
        
            context.fillStyle = color;
            var diff = this.terrain[i].y - this.terrain[i-1].y;
            context.fillRect(-100, this.terrain[i-1].y, X_MAX + 200, diff);  
            
            
            context.fillStyle = "#fff";
            
            context.lineWidth = 1;
            context.strokeStyle = "rgb(255, 0, 255)";
            
        }
        
        for ( var i = 0; i < NUM_SLICES; i++ ) {     
            this.drawLine(i);
            
            this.updateSlice(i);
        }
        
    };
    
    this.drawLine = function drawLine(i) {
    
            
        context.lineWidth = 1;
        context.strokeStyle = "rgb(255, 0, 255)";
        
        context.beginPath();
        context.moveTo(-100, this.terrain[i].y);
        context.lineTo(X_MAX + 100, this.terrain[i].y);
        context.stroke();
    };
    
    this.updateSlice = function updateSlice(i) {
    
    
        this.terrain[i].z -= TERRAIN_SPEED;
        
        if ( this.terrain[i].z < 0 ) {
            this.terrain[i] = newSlice(Z_MAX / NUM_SLICES);
        }
        var y = Y_MAX / 2;
        this.terrain[i].y = y  * (EYE_TO_SCREEN_DIST / this.terrain[i].z) + y;
        
    }
}

/*******************************************************************************
 * keyListener(e)
 *------------------------------------------------------------------------------
 *
 * 
 *******************************************************************************/
function keyListener(e) {

    if (e.keyCode == 37) {          // left arrow key
        
        if ( ! moveRight ) {
            moveLeft = 1;
        }
    }
    
    else if (e.keyCode == 38) {     // up arrow key
        
        moveUp = 1;
    }
    
    else if (e.keyCode == 39) {     // right arrow key
                
        if ( ! moveLeft ) {
            moveRight = 1;
        }
    }
    
    else if (e.keyCode == 40) {     // down arrow key
                        
        moveDown = 1;
    }

    else if (e.keyCode == 32) {     // space key
    
        if ( ! laserDelayOn ) { 
        
            laserDelayOn = true;
            setTimeout(function() {
                laserDelayOn = false;
            }, LASER_DELAY);
            
            lasers.unshift(new Laser());
        }
    }   
    
    else if (e.keyCode == 13) {     // enter key
        
        if ( currentState != gameState.GAME ) {
            // Start game:
            initGameState();
            currentState = gameState.GAME;
        }
    }
    
}

/*******************************************************************************
 * KeyUpListener(e)
 *
 *
 *******************************************************************************/

function keyUpListener(e) {

    if (e.keyCode == 37) {  // left arrow key
        
        moveLeft = 0;
    }
    
    else if (e.keyCode == 38) {     // up arrow key
        
        moveUp = 0;
    }
    
    else if (e.keyCode == 39) {     // right arrow key
                
        moveRight = 0;
    }
    
    else if (e.keyCode == 40) {     // down arrow key
                        
        moveDown = 0;
    }
    
}

/*******************************************************************************
 * sortCubes
 *
 *
 *******************************************************************************/
function sortCubes(a,b) {
    return b.z - a.z;
}
