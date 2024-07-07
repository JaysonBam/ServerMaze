document.addEventListener('DOMContentLoaded', () => {

    const audioPlayer = document.getElementById('audioPlayer');
    let rickroll = true;

    const socket = io();

    const canvas = document.getElementById('canvas');
    const canvasContainer = document.getElementById('canvasContainer');
    const ctx = canvas.getContext('2d');
    const size = Math.min(canvasContainer.offsetWidth, canvasContainer.offsetHeight);
    
    canvas.width = size;
    canvas.height = size;

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

    socket.on('start', () => {
        ctx.clearRect(0, 0, size, size);
        // getInitialData();

        blockSize = size/gridSize;
        drawMaze();
        drawBall(x, y, '#c80000');
        // drawBall(x, y, 'boost');
        drawBall(EndX, EndY, 'black');
        // drawBall(EndX, EndY, 'boost');
        drawTraps();
        drawBoosts();

        console.log(`Start received`);
    });

    socket.on('getInitialData', (data) => {
        vector2D = data.vector2D;
        gridSize = data.gridSize;
        x = data.x;
        y = data.y;
        EndX = data.EndX;
        EndY = data.EndY;
        traps = data.traps;
        boosts = data.boosts;

        if (data.host) {

            console.log('This client is host.')

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

            alert(`Choose 'Attack!' or 'Defend!' \n - Attackers aim for the hole.\n - Defenders sabotage them.\n - Webs slow you down for 5 seconds.\n - Gold boosts add 5s.`);
        }
    });


    function drawMaze() {

        for (let i = 0; i < vector2D.length; i++) {
            for (let j = 0; j < vector2D[i].length; j++) {
                if (vector2D[i][j] == 1) {
                    drawSquare(j, i, '#000000');
                }
            }
        }
    }
    
    function drawSquare(xPos, yPos, color) {
        ctx.fillStyle = color;
        ctx.fillRect(xPos * blockSize, yPos * blockSize, blockSize, blockSize);
    }

    function drawTraps() {
        for (let trap of traps) {
            const xPos = trap[0];
            const yPos = trap[1];
            drawBall(xPos, yPos, 'yellow'); // Replace 'red' with your desired color
        }
    }

    function drawBoosts() {
        for (let boost of boosts) {
            const xPos = boost[0];
            const yPos = boost[1];
            drawBall(xPos, yPos, 'boost'); // Replace 'red' with your desired color
        }
    }

    function drawBall(xPos, yPos, color) {
        const centerX = xPos * blockSize + blockSize / 2;
        const centerY = yPos * blockSize + blockSize / 2;
        const radius = blockSize / 2 - 2;

        if (color === '#c80000') {
            // Draw basketball
            const ballColor = '#FF8C00'; // Basketball orange color
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = ballColor;
            ctx.fill();
            ctx.closePath();

            // Draw the vertical line
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - radius);
            ctx.lineTo(centerX, centerY + radius);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();

            // Draw the horizontal line
            ctx.beginPath();
            ctx.moveTo(centerX - radius, centerY);
            ctx.lineTo(centerX + radius, centerY);
            ctx.stroke();
            ctx.closePath();

            // Draw the left curve
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI / 4, (3 * Math.PI) / 4);
            ctx.stroke();
            ctx.closePath();

            // Draw the right curve
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, (5 * Math.PI) / 4, (7 * Math.PI) / 4);
            ctx.stroke();
            ctx.closePath();
        } else if (color === 'yellow') {
            // Draw cobweb
            const webColor = '#000000'; // White color for the cobweb
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.closePath();

            ctx.strokeStyle = webColor;
            ctx.lineWidth = 1;

            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX + radius * Math.cos(i * Math.PI / 4), centerY + radius * Math.sin(i * Math.PI / 4));
                ctx.stroke();
                ctx.closePath();
            }

            for (let i = 1; i < 4; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius * i / 4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.closePath();
            }
        } else if (color === 'boost') {
            const ballColor = 'orange';
            // Create gradient for shading
            const gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            radius / 4,
            centerX,
            centerY,
            radius
            );
            gradient.addColorStop(0, "white"); // Highlight color
            gradient.addColorStop(0.5, ballColor); // Main color
            gradient.addColorStop(1, "darkorange"); // Shadow color

            // Draw the ball with gradient
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            ctx.closePath();

            // Add a highlight
            ctx.beginPath();
            ctx.arc(
            centerX - radius / 3,
            centerY - radius / 3,
            radius / 4,
            0,
            Math.PI * 2
            );
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; // Highlight color with transparency
            ctx.fill();
            ctx.closePath();
        } else {
            // Default ball
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.closePath();
        }
    }

    function handleOrientation(event) {
        let betta = event.beta;
        let gamma = event.gamma;
        //give betta and gamma

        data = {beta:betta, gamma:gamma};

        console.log(`Sending beta-gamma data: ${JSON.stringify(data)}`);

        if (offense) {
            socket.emit('beta_gamma', data);
            socket.emit('beta_gamma', data);
            socket.emit('beta_gamma', data);
        }

        socket.emit('beta_gamma', data);
    }

    socket.on('pos_update', (data) => {
        console.log(`x,y: ${data.x}, ${data.y}`);

        timeleft = Math.round(data.time / 1000);
        document.getElementById("levelTxt").innerText = `Level ${data.level}`;

        const progressBar = document.getElementById("progress-bar");
        const loadingText = document.getElementById("loading-text");
        progressBar.style.width = timeleft + "%";
        if (timeleft <= 30) {
            progressBar.style.backgroundColor = "red"; // Change progress bar color to red
        } else {
            progressBar.style.backgroundColor = "#4CAF50";
        }

        ctx.clearRect(x * blockSize, y * blockSize, blockSize, blockSize);
        x = data.x;
        y = data.y;

        drawTraps();
        drawBall(data.x, data.y, "#c80000");
    });

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
            console.log("not iOS");
            window.addEventListener('deviceorientation', handleOrientation);
        } else {
            alert('not supported');
        }
    }

    document.getElementById('btnPermission').addEventListener('click', () => {
        requestDeviceOrientation();          
    });

    document.getElementById('restartButton').addEventListener('click', () => {
        socket.emit('resetServer');
        audioPlayer.pause();
        rickroll = true;
    });

    document.getElementById('startButton').addEventListener('click', () => {
        socket.emit('startButton');

        if (rickroll) {
            audioPlayer.play().catch(error => {
                console.log('Play was prevented:', error);
            });
        } else {
            audioPlayer.pause();
        }

        rickroll = !rickroll;
    });

    document.getElementById('opposeButton').addEventListener('click', () => {
        offense = true;
    });

    document.getElementById('defendButton').addEventListener('click', () => {
        offense = false;
    });
});