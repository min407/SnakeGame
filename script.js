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
    

    
    // 触摸事件监听
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    
    // 点击事件监听
    canvas.addEventListener('click', handleCanvasClick);
    
    // 触摸坐标
    let touchStartX = 0;
    let touchStartY = 0;
    
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
    
    // 改变蛇的方向 - 键盘控制
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
    

    
    // 处理触摸开始事件
    function handleTouchStart(event) {
        event.preventDefault();
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }
    
    // 处理触摸移动事件
    function handleTouchMove(event) {
        if (!touchStartX || !touchStartY) {
            return;
        }
        
        event.preventDefault();
        
        const touchEndX = event.touches[0].clientX;
        const touchEndY = event.touches[0].clientY;
        
        const diffX = touchStartX - touchEndX;
        const diffY = touchStartY - touchEndY;
        
        // 设置最小滑动距离阈值，避免误触
        const minSwipeDistance = 30;
        
        // 判断滑动方向，只有滑动距离超过阈值才改变方向
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
            // 水平滑动
            if (diffX > 0) {
                // 向左滑动
                changeDirection({ key: 'ArrowLeft' });
            } else {
                // 向右滑动
                changeDirection({ key: 'ArrowRight' });
            }
            // 重置触摸起始点，避免连续触发
            touchStartX = 0;
            touchStartY = 0;
        } else if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > minSwipeDistance) {
            // 垂直滑动
            if (diffY > 0) {
                // 向上滑动
                changeDirection({ key: 'ArrowUp' });
            } else {
                // 向下滑动
                changeDirection({ key: 'ArrowDown' });
            }
            // 重置触摸起始点，避免连续触发
            touchStartX = 0;
            touchStartY = 0;
        }
        // 如果滑动距离不够，不重置触摸起始点，等待更大的滑动距离
    }
    
    // 处理画布点击事件
    function handleCanvasClick(event) {
        if (!gameRunning) {
            // 如果游戏未运行，点击任何区域都开始游戏
            startGame();
            return;
        }
        
        // 获取点击位置相对于画布的坐标
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        
        // 计算画布中心点
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // 计算点击位置相对于中心的偏移
        const diffX = clickX - centerX;
        const diffY = clickY - centerY;
        
        // 判断点击区域
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // 水平方向点击
            if (diffX > 0) {
                // 右侧区域
                changeDirection({ key: 'ArrowRight' });
            } else {
                // 左侧区域
                changeDirection({ key: 'ArrowLeft' });
            }
        } else {
            // 垂直方向点击
            if (diffY > 0) {
                // 下方区域
                changeDirection({ key: 'ArrowDown' });
            } else {
                // 上方区域
                changeDirection({ key: 'ArrowUp' });
            }
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
        // 绘制蛇身 - 从尾部到头部
        for (let i = snake.length - 1; i >= 0; i--) {
            ctx.save();
            
            const x = snake[i].x * gridSize;
            const y = snake[i].y * gridSize;
            const centerX = x + gridSize / 2;
            const centerY = y + gridSize / 2;
            
            if (i === 0) {
                // 绘制蛇头 - 更大更突出
                const headSize = gridSize * 0.9;
                const headRadius = headSize / 2;
                
                // 蛇头渐变
                const headGradient = ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, headRadius
                );
                headGradient.addColorStop(0, '#ff6b6b');
                headGradient.addColorStop(0.7, '#ee5a52');
                headGradient.addColorStop(1, '#c44569');
                
                // 绘制蛇头圆形
                ctx.beginPath();
                ctx.arc(centerX, centerY, headRadius, 0, Math.PI * 2);
                ctx.fillStyle = headGradient;
                ctx.fill();
                
                // 添加蛇头边框
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();
                
            } else {
                // 绘制蛇身 - 圆形，大小递减
                const bodySize = gridSize * (0.8 - (i * 0.02)); // 身体逐渐变小
                const bodyRadius = Math.max(bodySize / 2, gridSize * 0.3); // 最小尺寸限制
                
                // 蛇身渐变 - 根据位置变化颜色
                const bodyGradient = ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, bodyRadius
                );
                const intensity = Math.max(0.3, 1 - (i * 0.1));
                bodyGradient.addColorStop(0, `rgba(78, 205, 196, ${intensity})`);
                bodyGradient.addColorStop(0.7, `rgba(68, 160, 141, ${intensity * 0.8})`);
                bodyGradient.addColorStop(1, `rgba(9, 54, 55, ${intensity * 0.6})`);
                
                // 绘制蛇身圆形
                ctx.beginPath();
                ctx.arc(centerX, centerY, bodyRadius, 0, Math.PI * 2);
                ctx.fillStyle = bodyGradient;
                ctx.fill();
                
                // 添加蛇身边框
                ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.6})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            
            ctx.restore();
        }
        
        // 绘制蛇眼 - 在蛇头上
        const headX = snake[0].x * gridSize;
        const headY = snake[0].y * gridSize;
        const headCenterX = headX + gridSize / 2;
        const headCenterY = headY + gridSize / 2;
        const eyeSize = gridSize * 0.15;
        
        ctx.save();
        
        // 根据蛇的移动方向绘制眼睛
        if (velocityX === 1) { // 向右
            // 右眼
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(headCenterX + gridSize * 0.15, headCenterY - gridSize * 0.1, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(headCenterX + gridSize * 0.18, headCenterY - gridSize * 0.1, eyeSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
            // 左眼
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(headCenterX + gridSize * 0.15, headCenterY + gridSize * 0.1, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(headCenterX + gridSize * 0.18, headCenterY + gridSize * 0.1, eyeSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
        } else if (velocityX === -1) { // 向左
            // 右眼
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(headCenterX - gridSize * 0.15, headCenterY - gridSize * 0.1, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(headCenterX - gridSize * 0.18, headCenterY - gridSize * 0.1, eyeSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
            // 左眼
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(headCenterX - gridSize * 0.15, headCenterY + gridSize * 0.1, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(headCenterX - gridSize * 0.18, headCenterY + gridSize * 0.1, eyeSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
        } else if (velocityY === -1) { // 向上
            // 右眼
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(headCenterX - gridSize * 0.1, headCenterY - gridSize * 0.15, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(headCenterX - gridSize * 0.1, headCenterY - gridSize * 0.18, eyeSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
            // 左眼
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(headCenterX + gridSize * 0.1, headCenterY - gridSize * 0.15, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(headCenterX + gridSize * 0.1, headCenterY - gridSize * 0.18, eyeSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
        } else if (velocityY === 1) { // 向下
            // 右眼
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(headCenterX - gridSize * 0.1, headCenterY + gridSize * 0.15, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(headCenterX - gridSize * 0.1, headCenterY + gridSize * 0.18, eyeSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
            // 左眼
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(headCenterX + gridSize * 0.1, headCenterY + gridSize * 0.15, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(headCenterX + gridSize * 0.1, headCenterY + gridSize * 0.18, eyeSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
        } else { // 默认（游戏开始前）- 向右看
            // 右眼
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(headCenterX + gridSize * 0.15, headCenterY - gridSize * 0.1, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(headCenterX + gridSize * 0.18, headCenterY - gridSize * 0.1, eyeSize * 0.6, 0, Math.PI * 2);
            ctx.fill();
            
            // 左眼
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(headCenterX + gridSize * 0.15, headCenterY + gridSize * 0.1, eyeSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(headCenterX + gridSize * 0.18, headCenterY + gridSize * 0.1, eyeSize * 0.6, 0, Math.PI * 2);
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
        const gradient = ctx.createRadialGradient(x + size/2, y + size/2, 0, x + size/2, y + size/2, size/2);
        gradient.addColorStop(0, '#ffd700');
        gradient.addColorStop(0.5, '#ff6b35');
        gradient.addColorStop(1, '#f7931e');
        
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