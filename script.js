document.addEventListener('DOMContentLoaded', () => {
    // 获取Canvas元素和上下文
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // 获取按钮和分数元素
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const restartBtn = document.getElementById('restartBtn');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('highScore');
    const speedSlider = document.getElementById('speedSlider');
    const speedValue = document.getElementById('speedValue');
    
    // 游戏配置
    const gridSize = 20; // 网格大小
    const tileCount = canvas.width / gridSize; // 网格数量
    let speed = 5; // 游戏初始速度（降低初始速度）
    let maxSpeed = 10; // 游戏最大速度（限制最高速度）
    
    // 游戏状态
    let gameRunning = false;
    let gamePaused = false;
    let gameOver = false;
    let score = 0;
    let highScore = localStorage.getItem('snakeHighScore') || 0;
    highScoreElement.textContent = highScore;
    
    // 蛇的初始位置和速度
    let snake = [
        { x: 10, y: 10 } // 蛇头位置
    ];
    let velocityX = 0;
    let velocityY = 0;
    let nextVelocityX = 0;
    let nextVelocityY = 0;
    
    // 食物位置
    let food = generateFood();
    
    // 游戏循环
    let gameInterval;
    
    // 按钮事件监听
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', restartGame);
    
    // 速度滑块事件监听
    speedSlider.addEventListener('input', function() {
        const newSpeed = parseInt(this.value);
        speedValue.textContent = newSpeed;
        
        // 只有在游戏未运行时才立即更新速度
        if (!gameRunning) {
            speed = newSpeed;
        }
    });
    
    // 速度滑块事件监听 - 当释放滑块时更新游戏速度
    speedSlider.addEventListener('change', function() {
        const newSpeed = parseInt(this.value);
        speed = newSpeed;
        
        // 如果游戏正在运行，重新设置游戏循环以应用新速度
        if (gameRunning && !gamePaused) {
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, 1000 / speed);
        }
    });
    
    // 键盘事件监听
    document.addEventListener('keydown', changeDirection);
    
    // 初始化游戏
    function initGame() {
        // 禁用暂停按钮
        pauseBtn.disabled = true;
        
        // 绘制初始游戏界面
        clearCanvas();
        drawFood();
        drawSnake();
        drawMessage('按"开始游戏"按钮开始');
    }
    
    // 开始游戏
    function startGame() {
        if (gameOver) {
            restartGame();
            return;
        }
        
        if (!gameRunning) {
            gameRunning = true;
            gamePaused = false;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            
            // 如果蛇还没有移动方向，设置一个默认方向
            if (velocityX === 0 && velocityY === 0) {
                velocityX = 1;
                velocityY = 0;
            }
            
            gameInterval = setInterval(gameLoop, 1000 / speed);
        }
    }
    
    // 暂停/继续游戏
    function togglePause() {
        if (!gameRunning) return;
        
        if (gamePaused) {
            // 继续游戏
            gamePaused = false;
            pauseBtn.textContent = '暂停';
            gameInterval = setInterval(gameLoop, 1000 / speed);
        } else {
            // 暂停游戏
            gamePaused = true;
            pauseBtn.textContent = '继续';
            clearInterval(gameInterval);
            drawMessage('游戏已暂停');
        }
    }
    
    // 重新开始游戏
    function restartGame() {
        // 重置游戏状态
        clearInterval(gameInterval);
        gameRunning = false;
        gamePaused = false;
        gameOver = false;
        score = 0;
        scoreElement.textContent = score;
        
        // 重置速度为滑块当前值
        speed = parseInt(speedSlider.value);
        speedValue.textContent = speed;
        
        // 重置蛇的位置和速度
        snake = [{ x: 10, y: 10 }];
        velocityX = 0;
        velocityY = 0;
        nextVelocityX = 0;
        nextVelocityY = 0;
        
        // 重新生成食物
        food = generateFood();
        
        // 重置按钮状态
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        pauseBtn.textContent = '暂停';
        
        // 重新绘制游戏
        initGame();
    }
    
    // 游戏主循环
    function gameLoop() {
        if (gameOver) {
            clearInterval(gameInterval);
            return;
        }
        
        // 更新蛇的方向
        velocityX = nextVelocityX;
        velocityY = nextVelocityY;
        
        // 移动蛇
        moveSnake();
        
        // 检查碰撞
        if (checkCollision()) {
            gameOver = true;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            drawMessage('游戏结束! 按"开始游戏"重新开始');
            return;
        }
        
        // 检查是否吃到食物
        checkFood();
        
        // 绘制游戏
        clearCanvas();
        drawFood();
        drawSnake();
    }
    
    // 移动蛇
    function moveSnake() {
        // 计算蛇头的新位置
        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
        
        // 将新的头部添加到蛇的前面
        snake.unshift(head);
        
        // 如果没有吃到食物，移除蛇尾
        if (head.x !== food.x || head.y !== food.y) {
            snake.pop();
        }
    }
    
    // 改变蛇的方向
    function changeDirection(event) {
        // 防止蛇反向移动
        switch (event.key) {
            case 'ArrowUp':
                if (velocityY !== 1) {
                    nextVelocityX = 0;
                    nextVelocityY = -1;
                }
                break;
            case 'ArrowDown':
                if (velocityY !== -1) {
                    nextVelocityX = 0;
                    nextVelocityY = 1;
                }
                break;
            case 'ArrowLeft':
                if (velocityX !== 1) {
                    nextVelocityX = -1;
                    nextVelocityY = 0;
                }
                break;
            case 'ArrowRight':
                if (velocityX !== -1) {
                    nextVelocityX = 1;
                    nextVelocityY = 0;
                }
                break;
        }
        
        // 如果游戏还没开始但按了方向键，自动开始游戏
        if (!gameRunning && !gameOver && (nextVelocityX !== 0 || nextVelocityY !== 0)) {
            startGame();
        }
    }
    
    // 检查碰撞
    function checkCollision() {
        const head = snake[0];
        
        // 检查是否撞墙
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            return true;
        }
        
        // 检查是否撞到自己的身体
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    // 检查是否吃到食物
    function checkFood() {
        const head = snake[0];
        
        if (head.x === food.x && head.y === food.y) {
            // 增加分数
            score++;
            scoreElement.textContent = score;
            
            // 更新最高分
            if (score > highScore) {
                highScore = score;
                highScoreElement.textContent = highScore;
                localStorage.setItem('snakeHighScore', highScore);
            }
            
            // 生成新的食物
            food = generateFood();
            
            // 每5分增加一次速度，但增加幅度更小，且不超过滑块设置的速度
            const sliderMaxSpeed = parseInt(speedSlider.value);
            if (score % 5 === 0 && speed < Math.min(maxSpeed, sliderMaxSpeed + 2)) {
                speed += 0.5; // 速度增加更平缓
                speedValue.textContent = speed.toFixed(1); // 更新显示的速度值
                clearInterval(gameInterval);
                gameInterval = setInterval(gameLoop, 1000 / speed);
            }
        }
    }
    
    // 生成食物
    function generateFood() {
        let newFood;
        let foodOnSnake;
        
        // 确保食物不会生成在蛇身上
        do {
            foodOnSnake = false;
            newFood = {
                x: Math.floor(Math.random() * tileCount),
                y: Math.floor(Math.random() * tileCount)
            };
            
            // 检查食物是否在蛇身上
            for (let i = 0; i < snake.length; i++) {
                if (newFood.x === snake[i].x && newFood.y === snake[i].y) {
                    foodOnSnake = true;
                    break;
                }
            }
        } while (foodOnSnake);
        
        return newFood;
    }
    
    // 清空画布
    function clearCanvas() {
        // 创建渐变背景
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制网格线
        ctx.strokeStyle = '#2a2a3e';
        ctx.lineWidth = 0.3;
        
        for (let i = 0; i <= tileCount; i++) {
            // 垂直线
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
            
            // 水平线
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }
    }
    
    // 绘制蛇
    function drawSnake() {
        // 创建渐变色
        const headGradient = ctx.createLinearGradient(
            snake[0].x * gridSize, 
            snake[0].y * gridSize, 
            snake[0].x * gridSize + gridSize, 
            snake[0].y * gridSize + gridSize
        );
        headGradient.addColorStop(0, '#6a11cb');
        headGradient.addColorStop(1, '#2575fc');
        
        const bodyGradient = ctx.createLinearGradient(
            0, 0, canvas.width, canvas.height
        );
        bodyGradient.addColorStop(0, '#8e2de2');
        bodyGradient.addColorStop(1, '#4a00e0');
        
        // 绘制蛇身
        for (let i = 1; i < snake.length; i++) {
            ctx.save();
            
            // 圆角矩形路径
            const radius = 5;
            const x = snake[i].x * gridSize;
            const y = snake[i].y * gridSize;
            
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + gridSize - radius, y);
            ctx.quadraticCurveTo(x + gridSize, y, x + gridSize, y + radius);
            ctx.lineTo(x + gridSize, y + gridSize - radius);
            ctx.quadraticCurveTo(x + gridSize, y + gridSize, x + gridSize - radius, y + gridSize);
            ctx.lineTo(x + radius, y + gridSize);
            ctx.quadraticCurveTo(x, y + gridSize, x, y + gridSize - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            
            ctx.fillStyle = bodyGradient;
            ctx.shadowColor = 'rgba(106, 17, 203, 0.2)';
            ctx.shadowBlur = 5;
            ctx.fill();
            
            ctx.restore();
        }
        
        // 绘制蛇头
        ctx.save();
        const headRadius = 5;
        const headX = snake[0].x * gridSize;
        const headY = snake[0].y * gridSize;
        
        ctx.beginPath();
        ctx.moveTo(headX + headRadius, headY);
        ctx.lineTo(headX + gridSize - headRadius, headY);
        ctx.quadraticCurveTo(headX + gridSize, headY, headX + gridSize, headY + headRadius);
        ctx.lineTo(headX + gridSize, headY + gridSize - headRadius);
        ctx.quadraticCurveTo(headX + gridSize, headY + gridSize, headX + gridSize - headRadius, headY + gridSize);
        ctx.lineTo(headX + headRadius, headY + gridSize);
        ctx.quadraticCurveTo(headX, headY + gridSize, headX, headY + gridSize - headRadius);
        ctx.lineTo(headX, headY + headRadius);
        ctx.quadraticCurveTo(headX, headY, headX + headRadius, headY);
        ctx.closePath();
        
        ctx.fillStyle = headGradient;
        ctx.shadowColor = 'rgba(106, 17, 203, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fill();
        
        // 绘制蛇眼
        const eyeSize = gridSize * 0.2;
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 0;
        
        // 根据蛇的移动方向绘制眼睛
        if (velocityX === 1) { // 向右
            ctx.beginPath();
            ctx.arc(headX + gridSize * 0.7, headY + gridSize * 0.3, eyeSize, 0, Math.PI * 2);
            ctx.arc(headX + gridSize * 0.7, headY + gridSize * 0.7, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 眼球
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(headX + gridSize * 0.75, headY + gridSize * 0.3, eyeSize/2, 0, Math.PI * 2);
            ctx.arc(headX + gridSize * 0.75, headY + gridSize * 0.7, eyeSize/2, 0, Math.PI * 2);
            ctx.fill();
        } else if (velocityX === -1) { // 向左
            ctx.beginPath();
            ctx.arc(headX + gridSize * 0.3, headY + gridSize * 0.3, eyeSize, 0, Math.PI * 2);
            ctx.arc(headX + gridSize * 0.3, headY + gridSize * 0.7, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 眼球
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(headX + gridSize * 0.25, headY + gridSize * 0.3, eyeSize/2, 0, Math.PI * 2);
            ctx.arc(headX + gridSize * 0.25, headY + gridSize * 0.7, eyeSize/2, 0, Math.PI * 2);
            ctx.fill();
        } else if (velocityY === -1) { // 向上
            ctx.beginPath();
            ctx.arc(headX + gridSize * 0.3, headY + gridSize * 0.3, eyeSize, 0, Math.PI * 2);
            ctx.arc(headX + gridSize * 0.7, headY + gridSize * 0.3, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 眼球
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(headX + gridSize * 0.3, headY + gridSize * 0.25, eyeSize/2, 0, Math.PI * 2);
            ctx.arc(headX + gridSize * 0.7, headY + gridSize * 0.25, eyeSize/2, 0, Math.PI * 2);
            ctx.fill();
        } else if (velocityY === 1) { // 向下
            ctx.beginPath();
            ctx.arc(headX + gridSize * 0.3, headY + gridSize * 0.7, eyeSize, 0, Math.PI * 2);
            ctx.arc(headX + gridSize * 0.7, headY + gridSize * 0.7, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 眼球
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(headX + gridSize * 0.3, headY + gridSize * 0.75, eyeSize/2, 0, Math.PI * 2);
            ctx.arc(headX + gridSize * 0.7, headY + gridSize * 0.75, eyeSize/2, 0, Math.PI * 2);
            ctx.fill();
        } else { // 默认（游戏开始前）
            ctx.beginPath();
            ctx.arc(headX + gridSize * 0.7, headY + gridSize * 0.3, eyeSize, 0, Math.PI * 2);
            ctx.arc(headX + gridSize * 0.7, headY + gridSize * 0.7, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            
            // 眼球
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(headX + gridSize * 0.75, headY + gridSize * 0.3, eyeSize/2, 0, Math.PI * 2);
            ctx.arc(headX + gridSize * 0.75, headY + gridSize * 0.7, eyeSize/2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // 绘制食物
    function drawFood() {
        const x = food.x * gridSize;
        const y = food.y * gridSize;
        const size = gridSize;
        const radius = 6;
        
        ctx.save();
        
        // 创建渐变
        const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
        gradient.addColorStop(0, '#FF3CAC');
        gradient.addColorStop(0.5, '#784BA0');
        gradient.addColorStop(1, '#2B86C5');
        
        // 绘制圆角矩形
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + size - radius, y);
        ctx.quadraticCurveTo(x + size, y, x + size, y + radius);
        ctx.lineTo(x + size, y + size - radius);
        ctx.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
        ctx.lineTo(x + radius, y + size);
        ctx.quadraticCurveTo(x, y + size, x, y + size - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        
        // 添加阴影和发光效果
        ctx.shadowColor = 'rgba(255, 60, 172, 0.6)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 添加食物内部的装饰
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        const innerSize = gridSize / 4;
        
        // 绘制星形装饰
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        
        // 绘制小圆点
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制四个小点
        const smallDotSize = innerSize / 4;
        const smallDotDistance = innerSize * 0.8;
        
        // 上
        ctx.beginPath();
        ctx.arc(centerX, centerY - smallDotDistance, smallDotSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 右
        ctx.beginPath();
        ctx.arc(centerX + smallDotDistance, centerY, smallDotSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 下
        ctx.beginPath();
        ctx.arc(centerX, centerY + smallDotDistance, smallDotSize, 0, Math.PI * 2);
        ctx.fill();
        
        // 左
        ctx.beginPath();
        ctx.arc(centerX - smallDotDistance, centerY, smallDotSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    // 绘制消息
    function drawMessage(message) {
        ctx.save();
        
        // 半透明背景
        const messageWidth = canvas.width - 100;
        const messageHeight = 100;
        const messageX = 50;
        const messageY = canvas.height / 2 - 50;
        const radius = 10;
        
        // 绘制圆角矩形
        ctx.beginPath();
        ctx.moveTo(messageX + radius, messageY);
        ctx.lineTo(messageX + messageWidth - radius, messageY);
        ctx.quadraticCurveTo(messageX + messageWidth, messageY, messageX + messageWidth, messageY + radius);
        ctx.lineTo(messageX + messageWidth, messageY + messageHeight - radius);
        ctx.quadraticCurveTo(messageX + messageWidth, messageY + messageHeight, messageX + messageWidth - radius, messageY + messageHeight);
        ctx.lineTo(messageX + radius, messageY + messageHeight);
        ctx.quadraticCurveTo(messageX, messageY + messageHeight, messageX, messageY + messageHeight - radius);
        ctx.lineTo(messageX, messageY + radius);
        ctx.quadraticCurveTo(messageX, messageY, messageX + radius, messageY);
        ctx.closePath();
        
        // 创建渐变背景
        const gradient = ctx.createLinearGradient(messageX, messageY, messageX, messageY + messageHeight);
        gradient.addColorStop(0, 'rgba(106, 17, 203, 0.9)');
        gradient.addColorStop(1, 'rgba(37, 117, 252, 0.9)');
        
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;
        ctx.fill();
        
        // 添加边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 文字
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Roboto, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
        
        ctx.restore();
    }
    
    // 初始化游戏
    initGame();
});