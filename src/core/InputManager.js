import { PLAYER_KEYS } from './Constants.js';
import { TouchControls } from '../ui/TouchControls.js';

/**
 * Handles keyboard input for 1-2 players, and touch/accelerometer on mobile.
 * Tracks key states (pressed/released) per frame.
 */
export class InputManager {
  constructor() {
    /** @type {Set<string>} Currently held keys */
    this.keysDown = new Set();
    /** @type {Set<string>} Keys pressed this frame (just pressed) */
    this.keysPressed = new Set();
    /** @type {Set<string>} Keys released this frame */
    this.keysReleased = new Set();

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    // Mobile support
    this.isMobile = false;
    this.touchControls = null;
  }

  init() {
    this.isMobile = this._detectMobile();

    if (this.isMobile) {
      this.touchControls = new TouchControls(null); // game ref set later
    }

    // Always listen for keyboard (external keyboards on tablets)
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  /** Initialize touch controls (call after game is ready) */
  async initTouch(game) {
    if (this.touchControls) {
      this.touchControls.game = game;
      await this.touchControls.init();
    }
  }

  _detectMobile() {
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const smallScreen = window.innerWidth <= 1024 && window.innerHeight <= 900;
    const mobileUA = /Android|iPhone|iPad|iPod|Mobile|webOS/i.test(navigator.userAgent);
    // iPadOS 13+ reports as desktop Mac but has touch points
    const isIPad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    return hasTouch && (smallScreen || mobileUA || isIPad);
  }

  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    if (this.touchControls) {
      this.touchControls.destroy();
    }
  }

  /** Call at end of each frame to clear per-frame states */
  endFrame() {
    this.keysPressed.clear();
    this.keysReleased.clear();
  }

  _onKeyDown(e) {
    if (!this.keysDown.has(e.code)) {
      this.keysPressed.add(e.code);
    }
    this.keysDown.add(e.code);
    // Prevent default for game keys
    if (this._isGameKey(e.code)) {
      e.preventDefault();
    }
  }

  _onKeyUp(e) {
    this.keysDown.delete(e.code);
    this.keysReleased.add(e.code);
    if (this._isGameKey(e.code)) {
      e.preventDefault();
    }
  }

  _isGameKey(code) {
    const p1 = PLAYER_KEYS.P1;
    const p2 = PLAYER_KEYS.P2;
    return Object.values(p1).includes(code) || Object.values(p2).includes(code) || code === 'Escape';
  }

  /** Check if a key is currently held */
  isDown(code) {
    return this.keysDown.has(code);
  }

  /** Check if a key was just pressed this frame */
  isPressed(code) {
    return this.keysPressed.has(code);
  }

  /** Check if a key was just released this frame */
  isReleased(code) {
    return this.keysReleased.has(code);
  }

  /**
   * Get player input state as a normalized object.
   * On mobile, player 0 uses touch/accelerometer.
   * @param {number} playerIndex - 0 for P1, 1 for P2
   * @returns {{ turn: number, thrust: number, fire: boolean, missile: boolean, altChange: number }}
   */
  getPlayerInput(playerIndex) {
    // Mobile: player 0 uses touch controls
    if (this.isMobile && playerIndex === 0 && this.touchControls) {
      return this.touchControls.getInput();
    }

    // Keyboard input
    const keys = playerIndex === 0 ? PLAYER_KEYS.P1 : PLAYER_KEYS.P2;
    let turn = 0;
    let altChange = 0;

    if (this.isDown(keys.left)) turn -= 1;
    if (this.isDown(keys.right)) turn += 1;
    if (this.isDown(keys.altUp)) altChange += 1;
    if (this.isDown(keys.altDown)) altChange -= 1;

    // Throttle: single-tap W/S (or Up/Down) to change notch
    const throttleUp = this.isPressed(keys.up);
    const throttleDown = this.isPressed(keys.down);

    return {
      turn,
      throttleUp,
      throttleDown,
      fire: this.isDown(keys.fire),
      missile: this.isPressed(keys.missile),
      altChange
    };
  }

  /** Show/hide touch controls */
  showTouchControls() {
    if (this.touchControls) this.touchControls.show();
  }

  hideTouchControls() {
    if (this.touchControls) this.touchControls.hide();
  }
}
