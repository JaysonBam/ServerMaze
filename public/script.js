document.addEventListener('DOMContentLoaded', () => {
    // Initialization and event listeners for real-time interaction

    // Socket.IO connection setup
    const socket = io();

    // Canvas setup and drawing functions
    const canvas = document.getElementById('canvas');
    const canvasContainer = document.getElementById('canvasContainer');
    const ctx = canvas.getContext('2d');
    const size = Math.min(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    canvas.width = size;
    canvas.height = size;

    // Variables for game state and visuals
    let gridSize;
    let x;
    let y;
    let EndX;
    let EndY;
    let blockSize;
    let vector2D;
    let traps = [];
    let boosts = [];
    let offense = true;

    // Socket.IO event handlers

    // When 'start' event is received from server
    socket.on('start', () => {
        // Clear canvas and redraw maze and game elements
        ctx.clearRect(0, 0, size, size);
        blockSize = size/gridSize;
        drawMaze();
        drawBall(x, y, '#c80000');
        drawBall(EndX, EndY, 'black');
        drawTraps();
        drawBoosts();
        console.log(`Start received`);
    });

    // When 'getInitialData' event is received from server
    socket.on('getInitialData', (data) => {
        // Initialize game data and check if client is the host
        vector2D = data.vector2D;
        gridSize = data.gridSize;
        x = data.x;
        y = data.y;
        EndX = data.EndX;
        EndY = data.EndY;
        traps = data.traps;
        boosts = data.boosts;

        // Adjust UI based on host status
        if (data.host) {
            console.log('This client is host.')

            // Show/hide buttons based on host/client role
            const btnPermission = document.getElementById('btnPermission');
            btnPermission.style.display = 'none';
            const restartButton = document.getElementById('restartButton');
            restartButton.style.display = 'block';
            const startButton = document.getElementById('startButton');
            startButton.style.display = 'block';
            const opposeButton = document.getElementById('opposeButton');
            opposeButton.style.display = 'none';
            const defendButton = document.getElementById('defendButton');
            defendButton.style.display = 'none';

            // Display initial alert message for the host
            alert(`Choose 'Attack!' or 'Defend!' \n - Attackers aim for the hole.\n - Defenders sabotage them.\n - Webs slow you down for 5 seconds.\n - Gold boosts add 5s.`);
        }
    });

    // Draw maze walls on canvas
    function drawMaze() {
        for (let i = 0; i < vector2D.length; i++) {
            for (let j = 0; j < vector2D[i].length; j++) {
                if (vector2D[i][j] == 1) {
                    drawSquare(j, i, '#000000');
                }
            }
        }
    }

    // Draw a square at specific position on canvas
    function drawSquare(xPos, yPos, color) {
        ctx.fillStyle = color;
        ctx.fillRect(xPos * blockSize, yPos * blockSize, blockSize, blockSize);
    }

    // Draw traps (yellow balls) on canvas
    function drawTraps() {
        for (let trap of traps) {
            const xPos = trap[0];
            const yPos = trap[1];
            drawBall(xPos, yPos, 'yellow');
        }
    }

    // Draw boosts (custom balls) on canvas
    function drawBoosts() {
        for (let boost of boosts) {
            const xPos = boost[0];
            const yPos = boost[1];
            drawBall(xPos, yPos, 'boost');
        }
    }

    // Draw various types of balls (basketball, web, boost) on canvas
    function drawBall(xPos, yPos, color) {
        // Drawing logic for different ball types
        // Note: Only 'basketball' and 'web' have specific drawings defined in this example
    }

    // Handle device orientation data and send to server
    function handleOrientation(event) {
        let betta = event.beta;
        let gamma = event.gamma;
        data = {beta:betta, gamma:gamma};
        console.log(`Sending beta-gamma data: ${JSON.stringify(data)}`);

        // Emit beta_gamma event to server (offense variable determines frequency)
        if (offense) {
            socket.emit('beta_gamma', data);
            socket.emit('beta_gamma', data);
            socket.emit('beta_gamma', data);
        }
        socket.emit('beta_gamma', data);
    }

    // Update player position on canvas based on server data
    socket.on('pos_update', (data) => {
        // Update UI elements and visual feedback based on server data
        timeleft = Math.round(data.time / 1000);
        document.getElementById("levelTxt").innerText = `Level ${data.level}`;
        const progressBar = document.getElementById("progress-bar");
        progressBar.style.width = timeleft + "%";
        if (timeleft <= 30) {
            progressBar.style.backgroundColor = "red";
        } else {
            progressBar.style.backgroundColor = "#4CAF50";
        }
        ctx.clearRect(x * blockSize, y * blockSize, blockSize, blockSize);
        x = data.x;
        y = data.y;
        drawTraps();
        drawBall(data.x, data.y, "#c80000");
    });

    // Request permission to use device orientation sensor
    async function requestDeviceOrientation() {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                if (permissionState === 'granted') {
                    window.addEventListener('deviceorientation', handleOrientation);
                } else {
                    alert('Permission was denied');
                }
            } catch (error) {
                alert(error);
            }
        } else if ('DeviceOrientationEvent' in window) {
            window.addEventListener('deviceorientation', handleOrientation);
        } else {
            alert('Device orientation not supported');
        }
    }

    // Event listener for permission button click
    document.getElementById('btnPermission').addEventListener('click', () => {
        requestDeviceOrientation();
    });

    // Event listeners for control buttons (restart, start, attack, defend)
    document.getElementById('restartButton').addEventListener('click', () => {
        socket.emit('resetServer');
    });

    document.getElementById('startButton').addEventListener('click', () => {
        socket.emit('startButton');
    });

    document.getElementById('opposeButton').addEventListener('click', () => {
        offense = true;
    });

    document.getElementById('defendButton').addEventListener('click', () => {
        offense = false;
    });
});
