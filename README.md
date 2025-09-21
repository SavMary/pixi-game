### 🚀 Pixi Space Shooter
An arcade shooter game on [Pixi.js](https://pixijs.com/), where the player controls a spaceship, destroys asteroids and bosses.
The project is created for practicing working with WebGL and game logic in the browser.

### 🎮 Demo
👉 [Play here](https://savmary.github.io/pixi-game/)

### Features

- Ship movement left and right
- Fire with limited bullets
- Randomly placed asteroids
- Boss with HP scale, movement and attacks
- Explosions on hit
- Countdown timer
- Notification of victory or defeat

### 🛠️ Technologies

- Pixi.js v7 — rendering
- Vite — build and dev server
- JavaScript (ES6+)

### 🚀 Run locally
1. Clone repository:
`git clone https://github.com/SavMary/pixi-game.git`
`cd pixi-game`
2. Install dependencies:
`npm install`
3. Start a local server:
`npm run dev`
The game will be available at http://localhost:8080/pixi-game (or whatever Vite shows).
4. Build:
   `npm run build`
   
### 📂 The structure of the project

pixi-game/
<br/>
├── public/          - static assets (pictures, sprites)
<br/>
├── src/             - source code
<br/>
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &nbsp;└── main.js      - basic game logic
<br/>
├── index.html
<br/>
├── vite.config.js
<br/>
└── package.json


