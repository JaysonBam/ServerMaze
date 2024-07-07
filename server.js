// Import required modules
const express = require('express');  // Web framework for Node.js
const path = require('path');  // Utilities for working with file and directory paths
const http = require('http');  // HTTP server module
const socketIo = require('socket.io');  // Real-time communication library
const cors = require('cors');  // Middleware for handling Cross-Origin Resource Sharing

// Initialize the Express application
const app = express();

// Create an HTTP server and integrate with the Express app
const server = http.createServer(app);

// Attach Socket.IO to the HTTP server for real-time communication
const io = socketIo(server);

// Enable CORS for all routes
app.use(cors());

// Initialize game variables
let gridSize = 5;  // Initial size of the game grid
let dx, dy, betta, gamma, x, y, EndX, EndY, vector2D;  // Position and movement variables
let level = 1;  // Initial game level
let traps = [];  // Array to hold trap positions
let boosts = [];  // Array to hold boost positions
let time = 90000;  // Game time in milliseconds
let speed = 1;  // Player speed
let speedCounter = 0;  // Speed counter for temporary speed changes
let start = false;  // Game start flag

const tickSpeed = 150;  // Game update interval in milliseconds

// Array to accumulate beta-gamma data from players
const globalDataAccumulator = [];
let MAX_DATA_POINTS = 1;  // Maximum number of data points to store

// Player management variables
let playerCount = 0;  // Current number of connected players
const players = {};  // Object to store player data

// Start the game and set up periodic updates
startGame();
setInterval(update, tickSpeed);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle Socket.IO connections
io.on('connection', (socket) => {
    // Increment the player count on new connection
    playerCount += 1;

    const maxPlayerCount = 5;  // Maximum number of players allowed
    if (playerCount > maxPlayerCount) {
        // If maximum player count is reached, disconnect the new player
        console.log(`Maximum player count reached (${maxPlayerCount}). Disconnecting user: ${socket.id}`);
        socket.disconnect(true);
        playerCount -= 1;
        return;
    }

    // Update the maximum data points based on the number of players
    MAX_DATA_POINTS = playerCount * 4;

    // Determine if the new player is the host (first player)
    const host = (playerCount == 1);

    // Send initial game data to all clients
    const data = {
        vector2D,
        gridSize,
        x,
        y,
        EndX,
        EndY,
        traps,
        host,
        boosts
    };
    io.emit('getInitialData', data);
    io.emit('start');

    console.log(`${socket.id} connected.`);

    // Add the new player to the players object
    players[socket.id] = { id: socket.id };

    // Handle beta-gamma data from clients
    socket.on('beta_gamma', (data) => {
        globalDataAccumulator.push(data);
        // Remove the oldest data point if the accumulator exceeds the maximum
        if (globalDataAccumulator.length > MAX_DATA_POINTS) {
            globalDataAccumulator.shift();
        }
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
        console.log(`${socket.id} disconnected.`);
        playerCount -= 1;

        // Remove the player from the players object
        delete players[socket.id];

        // Reset the server if no players are connected
        if (playerCount <= 0) {
            playerCount = 0;
            resetServer();
        }

        // Update the maximum data points based on the new player count
        MAX_DATA_POINTS = playerCount * 4;
    });

    // Handle server reset request from clients
    socket.on('resetServer', () => {
        resetServer();
        start = false;
        console.log('Server reset!');
    });

    // Handle start button press from clients
    socket.on('startButton', () => {
        start = !start;
        console.log(`Start: ${start}`);
    });
});

// Start the HTTP server on port 8080
const port = 8080;
server.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});

// Function to start a new game
function startGame() {
    console.log(`Starting new game with grid size: ${gridSize}`);
    getInitialData();
    generateMaze();

    // Clear traps and boosts arrays
    traps = [];
    boosts = [];
    getTraps();

    // Send initial game data to all clients
    const data = {
        vector2D,
        gridSize,
        x,
        y,
        EndX,
        EndY,
        traps,
        boosts
    };
    io.emit('getInitialData', data);
    io.emit('start');
}

// Function to initialize game data
function getInitialData() {
    dx = 0;
    dy = 0;
    betta = 0;
    gamma = 0;
    x = 1;
    y = 1;
    EndX = gridSize - 2;
    EndY = gridSize - 2;
}

// Function to generate a maze using Depth-First Search algorithm
function generateMaze() {
    vector2D = [];
    for (let i = 0; i < gridSize; i++) {
        vector2D[i] = [];
        for (let j = 0; j < gridSize; j++) {
            vector2D[i][j] = (i % 2 !== 0 && j % 2 !== 0) ? 0 : 1;
        }
    }

    const stack = [];
    const visited = [];
    for (let i = 0; i < gridSize; i++) {
        visited[i] = [];
        for (let j = 0; j < gridSize; j++) {
            visited[i][j] = false;
        }
    }

    const startX = 1;
    const startY = 1;
    stack.push([startX, startY]);
    visited[startX][startY] = true;

    while (stack.length > 0) {
        const current = stack.pop();
        const [x, y] = current;
        const directions = shuffleDirections();

        for (let direction of directions) {
            const newX = x + direction[0] * 2;
            const newY = y + direction[1] * 2;

            if (newX >= 1 && newX < gridSize - 1 && newY >= 1 && newY < gridSize - 1 && !visited[newX][newY]) {
                vector2D[(newX + x) / 2][(newY + y) / 2] = 0;
                visited[newX][newY] = true;
                stack.push([newX, newY]);
            }
        }
    }

    vector2D[startX][startY] = 0;
    vector2D[gridSize - 2][gridSize - 2] = 0;
}

// Function to shuffle directions for maze generation
function shuffleDirections() {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (let i = directions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [directions[i], directions[j]] = [directions[j], directions[i]];
    }

    return directions;
}

// Function to generate traps and boosts in the maze
function getTraps() {
    for (let i = 1; i < vector2D.length - 1; i++) {
        for (let j = 1; j < vector2D[i].length - 1; j++) {
            let adjacentWalls = 0;
            if (vector2D[i + 1][j] === 1) adjacentWalls++;
            if (vector2D[i - 1][j] === 1) adjacentWalls++;
            if (vector2D[i][j + 1] === 1) adjacentWalls++;
            if (vector2D[i][j - 1] === 1) adjacentWalls++;

            const randomValue = Math.random();
            if (adjacentWalls === 3 && !(EndX === j && EndY === i) && vector2D[i][j] === 0 && randomValue < 0.30) {
                if (randomValue < 0.10) {
                    boosts.push([j, i]);  // 10% chance for boost
                } else {
                    traps.push([j, i]);  // Remaining 20% chance for trap
                }
            }
        }
    }
}

// Function to update the game state at regular intervals
function update() {
    if (!start) return;

    time -= tickSpeed;
    speedCounter -= tickSpeed;
    if (time < 0) {
        return;
    }
    if (speedCounter < 0) {
        speed = 1;
    }

    // Calculate average beta and gamma values from accumulated data
    const averageData = globalDataAccumulator.reduce((acc, curr) => {
        acc.beta += curr.beta;
        acc.gamma += curr.gamma;
        return acc;
    }, { beta: 0, gamma: 0 });

    const dataLength = globalDataAccumulator.length || 1;
    betta = averageData.beta / dataLength;
    gamma = averageData.gamma / dataLength;

    const gammaDegrees = (gamma + 90) % 360;
    dx = Math.cos(gammaDegrees * Math.PI / 180);
    dy = Math.sin(gammaDegrees * Math.PI / 180);

    let distance = (Math.abs(betta) < 5) ? 0 : betta / 90;
    x = Math.round(x + dx * distance * speed);
    y = Math.round(y + dy * distance * speed);

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x >= gridSize) x = gridSize - 1;
    if (y >= gridSize) y = gridSize - 1;

    if (vector2D[y][x] === 1) {
        x = prevX;
        y = prevY;
    }

    for (let boost of boosts) {
        if (x === boost[0] && y === boost[1]) {
            boosts = boosts.filter(b => b[0] !== x || b[1] !== y);
            speed = 2;
            speedCounter = 10000;
        }
    }

    if (x === EndX && y === EndY) {
        start = false;
        level++;
        gridSize += 2;
        startGame();
        return;
    }

    io.emit('gameData', { x, y, betta, gamma, traps, boosts, time });
}

// Function to reset the game server
function resetServer() {
    time = 90000;
    gridSize = 5;
    level = 1;
    speed = 1;
    speedCounter = 0;
    start = false;
    players = {};
    startGame();
}