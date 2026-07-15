(() => {
  const canvas = document.getElementById('pong');
  const ctx = canvas.getContext('2d');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  // Paddle configuration
  const PADDLE_WIDTH = 12;
  const PADDLE_HEIGHT = 100;
  const PADDLE_MARGIN = 10;
  const PLAYER_SPEED = 6; // for keyboard control
  const AI_SPEED = 4.0; // computer paddle speed

  // Ball configuration
  const BALL_RADIUS = 8;
  const BALL_START_SPEED = 5;
  const SPEED_INCREASE_ON_HIT = 1.05;
  const MAX_BOUNCE_ANGLE = Math.PI / 3; // max angle from horizontal

  let running = false;

  const player = {
    x: PADDLE_MARGIN,
    y: (HEIGHT - PADDLE_HEIGHT) / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dy: 0,
    score: 0
  };

  const computer = {
    x: WIDTH - PADDLE_WIDTH - PADDLE_MARGIN,
    y: (HEIGHT - PADDLE_HEIGHT) / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    score: 0
  };

  const ball = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    radius: BALL_RADIUS,
    speed: BALL_START_SPEED,
    vx: BALL_START_SPEED,
    vy: 0
  };

  // Utility
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function resetBall(direction = null) {
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    ball.speed = BALL_START_SPEED;
    const angle = (Math.random() * 0.6 - 0.3); // small random vertical offset
    const dir = direction !== null ? direction : (Math.random() < 0.5 ? -1 : 1);
    ball.vx = dir * ball.speed * Math.cos(angle);
    ball.vy = ball.speed * Math.sin(angle);
    running = true;
  }

  function drawRect(x, y, w, h, color = '#fff') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
  }

  function drawCircle(x, y, r, color = '#fff') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNet() {
    const segment = 12;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    for (let y = 0; y < HEIGHT; y += segment * 2) {
      ctx.fillRect(WIDTH / 2 - 1, y, 2, segment);
    }
  }

  function drawScores() {
    ctx.fillStyle = '#9feffd';
    ctx.font = '40px system-ui,Arial';
    ctx.textAlign = 'center';
    ctx.fillText(player.score, WIDTH * 0.25, 60);
    ctx.fillText(computer.score, WIDTH * 0.75, 60);
  }

  function draw() {
    // clear
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    // background gradient already from CSS; keep canvas clear then draw items
    drawNet();
    // paddles
    drawRect(player.x, player.y, player.width, player.height, '#00d1ff');
    drawRect(computer.x, computer.y, computer.width, computer.height, '#ffd166');
    // ball
    drawCircle(ball.x, ball.y, ball.radius, '#ffffff');
    // scores
    drawScores();
  }

  function update() {
    if (!running) return;

    // Move player by keyboard velocity
    player.y += player.dy;
    player.y = clamp(player.y, 0, HEIGHT - player.height);

    // Simple AI: move toward ball center
    const targetY = ball.y - computer.height / 2;
    if (computer.y + computer.height / 2 < ball.y - 6) {
      computer.y += AI_SPEED;
    } else if (computer.y + computer.height / 2 > ball.y + 6) {
      computer.y -= AI_SPEED;
    }
    computer.y = clamp(computer.y, 0, HEIGHT - computer.height);

    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top/bottom collision
    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.vy = -ball.vy;
    } else if (ball.y + ball.radius >= HEIGHT) {
      ball.y = HEIGHT - ball.radius;
      ball.vy = -ball.vy;
    }

    // Left paddle collision
    if (ball.x - ball.radius <= player.x + player.width) {
      if (ball.y >= player.y && ball.y <= player.y + player.height) {
        // collision - compute bounce angle
        const relativeY = (player.y + player.height / 2) - ball.y;
        const normalized = relativeY / (player.height / 2); // -1 .. 1 (inverted)
        const bounceAngle = normalized * MAX_BOUNCE_ANGLE;
        const direction = 1; // ball goes right
        ball.speed *= SPEED_INCREASE_ON_HIT;
        ball.vx = direction * ball.speed * Math.cos(bounceAngle);
        ball.vy = -ball.speed * Math.sin(bounceAngle);
        // nudge ball out to avoid stuckness
        ball.x = player.x + player.width + ball.radius + 0.5;
      } else if (ball.x - ball.radius < 0) {
        // missed - computer scores
        computer.score += 1;
        running = false;
        setTimeout(() => resetBall(1), 700);
      }
    }

    // Right paddle collision
    if (ball.x + ball.radius >= computer.x) {
      if (ball.y >= computer.y && ball.y <= computer.y + computer.height) {
        const relativeY = (computer.y + computer.height / 2) - ball.y;
        const normalized = relativeY / (computer.height / 2);
        const bounceAngle = normalized * MAX_BOUNCE_ANGLE;
        const direction = -1; // ball goes left
        ball.speed *= SPEED_INCREASE_ON_HIT;
        ball.vx = direction * ball.speed * Math.cos(bounceAngle);
        ball.vy = -ball.speed * Math.sin(bounceAngle);
        ball.x = computer.x - ball.radius - 0.5;
      } else if (ball.x + ball.radius > WIDTH) {
        // missed - player scores
        player.score += 1;
        running = false;
        setTimeout(() => resetBall(-1), 700);
      }
    }
  }

  // Game loop
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // Input: mouse for paddle
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseY = e.clientY - rect.top;
    // center paddle on mouse
    player.y = clamp(mouseY - player.height / 2, 0, HEIGHT - player.height);
  });

  // Keyboard controls
  const keys = {};
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      player.dy = -PLAYER_SPEED;
      keys['ArrowUp'] = true;
    } else if (e.key === 'ArrowDown') {
      player.dy = PLAYER_SPEED;
      keys['ArrowDown'] = true;
    } else if (e.key === ' ' || e.key === 'Spacebar') {
      // space toggles start/pause
      running = !running;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp') {
      keys['ArrowUp'] = false;
      if (keys['ArrowDown']) player.dy = PLAYER_SPEED;
      else player.dy = 0;
    } else if (e.key === 'ArrowDown') {
      keys['ArrowDown'] = false;
      if (keys['ArrowUp']) player.dy = -PLAYER_SPEED;
      else player.dy = 0;
    }
  });

  // Restart on click
  canvas.addEventListener('click', () => {
    if (!running) {
      // if not running, start with random direction
      resetBall();
    }
  });

  // Initialize
  resetBall(); // start game automatically
  loop();

  // Expose some tuning via console if needed
  window._pong = {
    player,
    computer,
    ball,
    resetBall
  };
})();
