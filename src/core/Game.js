import { InputManager } from './InputManager.js';
import { GAME_STATES, WORLD_WIDTH, WORLD_HEIGHT } from './Constants.js';
import { EntityManager } from '../entities/EntityManager.js';
import { MovementSystem } from '../systems/MovementSystem.js';
import { RadarSystem } from '../systems/RadarSystem.js';
import { CombatSystem } from '../systems/CombatSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { WaveSystem } from '../systems/WaveSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import { HUDSystem } from '../systems/HUDSystem.js';
import { MenuSystem } from '../ui/MenuSystem.js';
import { AudioManager } from './AudioManager.js';

/**
 * Main game controller. Owns the loop, canvas, and all subsystems.
 */
export class Game {
  constructor(canvas, uiOverlay) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.uiOverlay = uiOverlay;

    this.state = GAME_STATES.MENU;
    this.playerCount = 1;
    this.currentLevel = 0;
    this.score = [0, 0];
    this.paused = false;

    // Timing
    this.lastTime = 0;
    this.deltaTime = 0;
    this.elapsed = 0;
    this.frameCount = 0;
    this.fps = 0;
    this._fpsAccum = 0;
    this._fpsFrames = 0;

    // Systems
    this.input = new InputManager();
    this.audio = new AudioManager();
    this.entities = null;
    this.systems = {};
    this.menu = null;

    // Camera (for scrolling maps later)
    this.camera = { x: 0, y: 0, zoom: 1 };

    // Bound loop
    this._loop = this._loop.bind(this);
    this._running = false;
  }

  async init() {
    this._resizeCanvas();
    window.addEventListener('resize', () => this._resizeCanvas());

    this.input.init();
    this.audio.init();

    // Initialize entity manager
    this.entities = new EntityManager();

    // Initialize systems
    this.systems.movement = new MovementSystem(this);
    this.systems.radar = new RadarSystem(this);
    this.systems.combat = new CombatSystem(this);
    this.systems.collision = new CollisionSystem(this);
    this.systems.wave = new WaveSystem(this);
    this.systems.render = new RenderSystem(this);
    this.systems.hud = new HUDSystem(this);

    // Menu system
    this.menu = new MenuSystem(this);
    this.menu.init();
  }

  _resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.displayWidth = rect.width;
    this.displayHeight = rect.height;
    // Compute scale to fit world
    this.worldScale = Math.min(
      this.displayWidth / WORLD_WIDTH,
      this.displayHeight / WORLD_HEIGHT
    );
    this.worldOffsetX = (this.displayWidth - WORLD_WIDTH * this.worldScale) / 2;
    this.worldOffsetY = (this.displayHeight - WORLD_HEIGHT * this.worldScale) / 2;
  }

  start() {
    if (this._running) return;
    this._running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this._loop);
  }

  stop() {
    this._running = false;
  }

  _loop(timestamp) {
    if (!this._running) return;
    requestAnimationFrame(this._loop);

    // Delta time in seconds, capped at 100ms to avoid spiral of death
    this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    this.elapsed += this.deltaTime;
    this.frameCount++;

    // FPS counter
    this._fpsAccum += this.deltaTime;
    this._fpsFrames++;
    if (this._fpsAccum >= 1.0) {
      this.fps = Math.round(this._fpsFrames / this._fpsAccum);
      this._fpsAccum = 0;
      this._fpsFrames = 0;
    }

    this._update();
    this._render();

    this.input.endFrame();
  }

  _update() {
    // Pause toggle
    if (this.input.isPressed('Escape')) {
      if (this.state === GAME_STATES.PLAYING) {
        this.state = GAME_STATES.PAUSED;
        this.menu.showPause();
        return;
      } else if (this.state === GAME_STATES.PAUSED) {
        this.state = GAME_STATES.PLAYING;
        this.menu.hidePause();
      }
    }

    if (this.state !== GAME_STATES.PLAYING) return;

    const dt = this.deltaTime;

    // Update systems in order
    this.systems.wave.update(dt);
    this.systems.movement.update(dt);
    this.systems.radar.update(dt);
    this.systems.combat.update(dt);
    this.systems.collision.update(dt);

    // Clean up dead entities
    this.entities.cleanup();
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.displayWidth, this.displayHeight);

    if (this.state === GAME_STATES.MENU) {
      // Menu renders via DOM overlay
      return;
    }

    // Save and apply world transform
    ctx.save();
    ctx.translate(this.worldOffsetX, this.worldOffsetY);
    ctx.scale(this.worldScale, this.worldScale);

    this.systems.render.render(ctx);

    ctx.restore();

    // HUD renders in screen space
    this.systems.hud.render(ctx);
  }

  /**
   * Start a level with given config.
   */
  startLevel(levelIndex, playerCount) {
    this.playerCount = playerCount;
    this.currentLevel = levelIndex;
    this.score = [0, 0];
    this.elapsed = 0;

    // Clear all entities
    this.entities.clear();

    // Load level
    this.systems.wave.loadLevel(levelIndex, playerCount);

    // Hide menu, start playing
    this.menu.hide();
    this.state = GAME_STATES.PLAYING;
  }

  addScore(playerIndex, points) {
    if (playerIndex >= 0 && playerIndex < 2) {
      this.score[playerIndex] += points;
    }
  }

  gameOver(won) {
    this.state = won ? GAME_STATES.VICTORY : GAME_STATES.GAME_OVER;
    this.menu.showEndScreen(won, this.score);
  }

  /** Convert world coordinates to screen coordinates */
  worldToScreen(wx, wy) {
    return {
      x: this.worldOffsetX + wx * this.worldScale,
      y: this.worldOffsetY + wy * this.worldScale
    };
  }
}
