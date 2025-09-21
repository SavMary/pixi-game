import {Application, Assets, Sprite, Graphics, Text, Container} from "pixi.js";

(async () => {
    const app = new Application();
    await app.init({background: "#000", width: 1280, height: 720});
    document.getElementById("pixi-container").appendChild(app.canvas);

    let gameEnded = false;

    // ================== START BUTTON ==================
    const startBtn = document.getElementById("start-btn");
    app.ticker.stop();

    startBtn.addEventListener("click", () => {
        app.ticker.start();
        startBtn.style.display = "none";
    });


    // ================== BACKGROUND ==================
    const bgTexture = await Assets.load("/assets/space.webp");
    const bg = new Sprite(bgTexture);
    bg.width = app.screen.width;
    bg.height = app.screen.height;
    app.stage.addChild(bg);

    // ================== SHOOTER ==================
    const shooterTexture = await Assets.load("/assets/shooter.webp");
    const shooter = new Sprite(shooterTexture);
    shooter.width = 200;
    shooter.height = 130;
    shooter.anchor.set(0.5);
    shooter.position.set(app.screen.width / 2, app.screen.height - shooter.height);
    app.stage.addChild(shooter);

    const keys = {};
    window.addEventListener("keydown", (e) => {
        if (e.code === "Space") createPlayerBullet(shooter.x, shooter.y - shooter.height / 2);
        keys[e.code] = true;
    });
    window.addEventListener("keyup", (e) => (keys[e.code] = false));

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    app.ticker.add((time) => {
        if (gameEnded) return;
        const speed = 5;
        if (keys["ArrowLeft"]) shooter.x -= speed * time.deltaTime;
        if (keys["ArrowRight"]) shooter.x += speed * time.deltaTime;
        shooter.x = clamp(shooter.x, shooter.width / 2, app.screen.width - shooter.width / 2);
    });

    // ================== ASTEROIDS ==================
    const asteroidsTextures = await Assets.load([
        {alias: "a1", src: "/assets/asteroid3.webp"},
        {alias: "a2", src: "/assets/asteroid6.png"},
        {alias: "a3", src: "/assets/asteroid7.webp"},
    ]);
    const textures = [
        asteroidsTextures["a1"],
        asteroidsTextures["a2"],
        asteroidsTextures["a3"]
    ];

    const asteroids = [];

    function createAsteroid() {
        const texture = textures[Math.floor(Math.random() * textures.length)];
        const a = new Sprite(texture);
        const size = 100 + Math.random() * 40;
        a.width = a.height = size;
        a.anchor.set(0.5);

        let x, y, collides, attempts = 0;
        do {
            collides = false;
            x = size / 2 + Math.random() * (app.screen.width - size);
            y = size / 2 + Math.random() * (app.screen.height / 3);
            for (let other of asteroids) {
                const dx = x - other.x, dy = y - other.y;
                if (Math.sqrt(dx * dx + dy * dy) < (size + other.width) / 2) {
                    collides = true;
                    break;
                }
            }
            attempts++;
        } while (collides && attempts < 100);

        a.position.set(x, y);
        app.stage.addChild(a);
        app.ticker.add(() => (a.rotation += 0.01));
        asteroids.push(a);
    }

    for (let i = 0; i < 8; i++) createAsteroid();

    // ================== BULLETS ==================
    const bullets = [];
    let bulletsLeft = 10;
    const bulletsText = new Text(
        `Bullets: ${bulletsLeft}/10`,
        {fill: 0xffcc00, fontSize: 20});
    bulletsText.position.set(20, 20);
    app.stage.addChild(bulletsText);

    function createPlayerBullet(x, y) {
        if (bulletsLeft <= 0 || gameEnded) return;
        const b = new Graphics().beginFill(0xffcc33).drawCircle(0, 0, 5).endFill();
        b.x = x;
        b.y = y;
        b.vy = -10;
        app.stage.addChild(b);
        bullets.push(b);
        bulletsLeft--;
    }

    app.ticker.add((time) => {
        bulletsText.text = `Bullets: ${bulletsLeft}/10`;
        for (let b of bullets) b.y += b.vy * time.deltaTime;
    });

    // ================== EXPLOSION ==================
    function createExplosion(x, y, s) {
        const e = new Graphics().beginFill(0xff6600).drawCircle(0, 0, s).endFill();
        e.position.set(x, y);
        app.stage.addChild(e);

        let scale = 1, alpha = 1;
        const ticker = () => {
            scale += 0.1;
            alpha -= 0.05;
            e.scale.set(scale);
            e.alpha = alpha;
            if (alpha <= 0) {
                app.stage.removeChild(e);
                app.ticker.remove(ticker);
            }
        };
        app.ticker.add(ticker);
    }

    // ================== GAME INFO ==================
    function gameInfo(msg, color) {
        gameEnded = true;
        const t = new Text({text: msg, style: {fontSize: 34, fill: color}});
        t.anchor.set(0.5);
        t.position.set(app.screen.width / 2, app.screen.height / 2);
        app.stage.addChild(t);
    }

    // ================== TIMER ==================
    let timeLeft = 60, elapsed = 0;
    const timerText = new Text(` ${timeLeft}`, {fill: 0xffcc00, fontSize: 20});
    timerText.position.set(app.screen.width - 60, 20);
    app.stage.addChild(timerText);

    app.ticker.add(() => {
        if (gameEnded) return;
        elapsed += app.ticker.deltaMS;
        if (elapsed >= 1000) {
            elapsed = 0;
            timerText.text = ` ${--timeLeft}`;
        }
        if (timeLeft <= 0) {
            gameInfo("YOU LOSE", 0xff1010);
            app.ticker.stop();
        }
    });

    // ================== COLLISIONS ==================
    function checkCollision(a, b) {
        if (gameEnded) return;
        const A = a.getBounds(), B = b.getBounds();
        return A.x < B.x + B.width && A.x + A.width > B.x && A.y < B.y + B.height && A.y + A.height > B.y;
    }
    let loseTimeout = null;
    app.ticker.add(() => {
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            for (let ai = asteroids.length - 1; ai >= 0; ai--) {
                if (checkCollision(bullets[bi], asteroids[ai])) {
                    createExplosion(asteroids[ai].x, asteroids[ai].y, 10);
                    app.stage.removeChild(bullets[bi]);
                    app.stage.removeChild(asteroids[ai]);
                    bullets.splice(bi, 1);
                    asteroids.splice(ai, 1);
                    break;
                }
            }
        }
        // lose condition: no bullets left and asteroids still alive
        if (bulletsLeft <= 0 && asteroids.length > 0) {
            if (!loseTimeout) {
                loseTimeout = setTimeout(() => {
                    if (!gameEnded && asteroids.length > 0) {
                        gameInfo("YOU LOSE", 0xff1010);
                    }
                }, 1500);
            }        }
    });

    // ================== BOSS ==================
    const boss = new Sprite(asteroidsTextures["a2"]);
    boss.width = boss.height = 300;
    boss.anchor.set(0.5);
    boss.position.set(app.screen.width / 2, -boss.height );
    app.stage.addChild(boss);

    let bossHP = 4, bossAlive = false;
    const bossHpBar = new Container();
    bossHpBar.visible = false;
    app.stage.addChild(bossHpBar);

    const hpBg = new Graphics().beginFill(0xff0000).drawRect(0, 0, 200, 20).endFill();
    const hpFill = new Graphics().beginFill(0x00ff00).drawRect(0, 0, 200, 20).endFill();
    bossHpBar.addChild(hpBg, hpFill);
    bossHpBar.position.set(20, 100);

    const bossHpLabel = new Text({text: "Boss HP", style: {fontFamily: "Arial", fontSize: 18, fill: 0xffffff,}});
    bossHpLabel.x = 0;
    bossHpLabel.y = -25;
    bossHpBar.addChild(bossHpLabel);

    function updateBossHp() {
        hpFill.clear().beginFill(0x00ff00).drawRect(0, 0, (bossHP / 4) * 200, 20).endFill();
    }

    function slideInBoss(time) {
        if (gameEnded) return;

        boss.y += 0.2 * time.deltaTime;
        if (boss.y >= boss.height / 2) {
            boss.y = boss.height / 2;
            app.ticker.remove(slideInBoss);
            bossHpBar.visible = true;
            bossAlive = true;
            bulletsLeft = 10;
            timeLeft = 60;

            if (bossAlive) {
                app.ticker.add(updateBossMovement);
                startBossShooting();
            }
        }
    }

    app.ticker.add(() => {
        if (asteroids.length === 0 && !bossAlive) app.ticker.add(slideInBoss);
    });

    // Boss movement
    let bossSpeedX = 3, bossMoving = false, moveTimer = 0, switchInterval = 120;

    function updateBossMovement(time) {
        if (gameEnded) return;
        if (!bossAlive) return;
        if (bossMoving) {
            boss.x += bossSpeedX * time.deltaTime;
            const halfW = boss.width / 2;
            if (boss.x < halfW || boss.x > app.screen.width - halfW) bossSpeedX *= -1;
        }
        moveTimer += time.deltaTime;
        if (moveTimer >= switchInterval) {
            moveTimer = 0;
            bossMoving = !bossMoving;
            if (bossMoving) bossSpeedX = Math.random() > 0.5 ? 3 : -3;
        }
    }

    // Boss bullets
    const bossBullets = [];

    function createBossBullet(x, y) {
        if (gameEnded) return;
        const b = new Graphics().beginFill(0xff0000).drawCircle(0, 0, 6).endFill();
        b.position.set(x, y);
        b.vy = 5;
        app.stage.addChild(b);
        bossBullets.push(b);
    }

    let bossShootInterval = null;

    function startBossShooting() {
        if (bossShootInterval) return;
        bossShootInterval = setInterval(() => {
            if (bossAlive) createBossBullet(boss.x, boss.y + boss.height / 2);
        }, 2000);
    }

    function stopBossShooting() {
        clearInterval(bossShootInterval);
        bossShootInterval = null;
    }

    app.ticker.add((time) => {
        for (let i = bossBullets.length - 1; i >= 0; i--) {
            const b = bossBullets[i];

            for (let j = bullets.length - 1; j >= 0; j--) {
                const p = bullets[j];

                if (checkCollision(b, p)) {
                    createExplosion((b.x + p.x) / 2, (b.y + p.y) / 2, 10);

                    app.stage.removeChild(b);
                    bossBullets.splice(i, 1);

                    app.stage.removeChild(p);
                    bullets.splice(j, 1);

                    break;
                }
            }
            b.y += b.vy * time.deltaTime;
            if (b.y > app.screen.height) {
                app.stage.removeChild(b);
                bossBullets.splice(i, 1);
                continue;
            }
            if (checkCollision(b, shooter)) {
                createExplosion(shooter.x, shooter.y, 30);
                app.stage.removeChild(shooter);
                app.stage.removeChild(b);
                stopBossShooting();
                gameInfo("YOU LOSE", 0xff1010);
            }
        }
    });

    // Player bullets vs Boss
    app.ticker.add(() => {
        if (!bossAlive) return;
        for (let bi = bullets.length - 1; bi >= 0; bi--) {
            if (checkCollision(bullets[bi], boss)) {
                bossHP--;
                updateBossHp();
                createExplosion(boss.x, boss.y, 15);
                app.stage.removeChild(bullets[bi]);
                bullets.splice(bi, 1);
                if (bossHP <= 0) {
                    createExplosion(boss.x, boss.y, 50);
                    app.stage.removeChild(boss);
                    bossAlive = false;
                    stopBossShooting();
                    gameInfo("YOU WIN", 0x10ff10);
                }
            }
        }
    });

})();