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
        blockSize = size / gridSize;
        drawMaze();
        drawBall(x, y, '#c80000');
        drawBall(EndX, EndY, 'black');
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
            drawBall(xPos, yPos, 'yellow');
        }
    }

    function drawBoosts() {
        for (let boost of boosts) {
            const xPos = boost[0];
            const yPos = boost[1];
            drawBall(xPos, yPos, 'boost');
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

            ctx.beginPath();
            ctx.moveTo(centerX, centerY - radius);
            ctx.lineTo(centerX, centerY + radius);
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.moveTo(centerX - radius, centerY);
            ctx.lineTo(centerX + radius, centerY);
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, Math.PI / 4, (3 * Math.PI) / 4);
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, (5 * Math.PI) / 4, (7 * Math.PI) / 4);
            ctx.stroke();
            ctx.closePath();
        } else if (color === 'yellow') {
            // Draw cobweb
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.fill();
            ctx.closePath();

            ctx.strokeStyle = '#000000';
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
            const boostColor = '#FFFF00'; // Gold color for boost
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = boostColor;
            ctx.fill();
            ctx.closePath();

            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;

            for (let i = 0; i < 4; i++) {
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(centerX + radius * Math.cos(i * Math.PI / 2), centerY + radius * Math.sin(i * Math.PI / 2));
                ctx.stroke();
                ctx.closePath();
            }

            for (let i = 1; i < 2; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius * i / 2, 0, Math.PI * 2);
                ctx.stroke();
                ctx.closePath();
            }
        } else {
            // Draw hole
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'black';
            ctx.fill();
            ctx.closePath();
        }
    }

    function move(direction) {
        if (offense) {
            socket.emit('move', direction);
        }
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp' || e.key === 'w') {
            move('up');
        } else if (e.key === 'ArrowDown' || e.key === 's') {
            move('down');
        } else if (e.key === 'ArrowLeft' || e.key === 'a') {
            move('left');
        } else if (e.key === 'ArrowRight' || e.key === 'd') {
            move('right');
        }
    });

    const btnPermission = document.getElementById('btnPermission');
    btnPermission.addEventListener('click', () => {
        socket.emit('requestPermission');
    });

    const restartButton = document.getElementById('restartButton');
    restartButton.addEventListener('click', () => {
        socket.emit('restart');
    });

    const startButton = document.getElementById('startButton');
    startButton.addEventListener('click', () => {
        if (rickroll) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
        rickroll = !rickroll;
    });

    const opposeButton = document.getElementById('opposeButton');
    opposeButton.addEventListener('click', () => {
        move('oppose');
    });

    const defendButton = document.getElementById('defendButton');
    defendButton.addEventListener('click', () => {
        move('defend');
    });
});