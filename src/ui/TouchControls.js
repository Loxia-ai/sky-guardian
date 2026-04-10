/**
 * On-screen touch controls for mobile devices.
 * Provides: accelerometer-based steering + throttle, thumb buttons for weapons & altitude.
 *
 * Accelerometer mapping:
 *   Tilt left/right (gamma)  → turn left/right
 *   Push forward / pull back (beta) → throttle up / throttle down
 *
 * Touch buttons:
 *   Left side:  Altitude Up / Down
 *   Right side: FIRE (cannon, large) + MISSILE
 */
export class TouchControls {
  constructor(game) {
    this.game = game;
    this.container = null;

    // Touch button states
    this.buttons = {
      fire: false,
      missile: false,
      altUp: false,
      altDown: false
    };

    // Single-frame triggers (like keyPressed — true for one frame only)
    this._justPressed = {
      missile: false
    };

    // Accelerometer state
    this.tiltX = 0; // left/right tilt (-1 to 1) → turn
    this.tiltY = 0; // forward/back tilt (-1 to 1) → throttle
    this.calibrationBeta = null; // neutral tilt angle
    this.calibrationGamma = null;
    this.hasAccelerometer = false;
    this._orientationHandler = null;

    // Throttle from tilt: discrete triggers with cooldown
    this._throttleTiltCooldown = 0;
    this._lastThrottleTrigger = 0; // timestamp
    this._throttleUpTriggered = false;
    this._throttleDownTriggered = false;

    // Pause
    this.pauseRequested = false;
  }

  async init() {
    this._createUI();
    this._initAccelerometer();
  }

  /**
   * Initialize accelerometer.
   * On iOS 13+ the permission must be requested from a user gesture (tap).
   * We detect this and show a one-time "Enable Tilt" button instead of
   * auto-requesting (which Safari silently rejects).
   */
  _initAccelerometer() {
    this._needsIOSPermission = (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function');

    if (this._needsIOSPermission) {
      // Show a button the user must tap (user gesture requirement)
      this._showIOSPermissionButton();
    } else if ('DeviceOrientationEvent' in window) {
      // Android / non-iOS — just start
      this._startAccelerometer();
    }
  }

  /** Show a one-time iOS permission button that the user taps to enable tilt */
  _showIOSPermissionButton() {
    const btn = document.createElement('button');
    btn.id = 'ios-tilt-permission';
    btn.textContent = '🔄 TAP TO ENABLE TILT CONTROLS';
    btn.style.cssText = `
      position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
      z-index: 200; padding: 18px 32px; border-radius: 10px;
      font-family: 'Rajdhani', sans-serif; font-size: 1.2rem; font-weight: 700;
      color: #00e5ff; background: rgba(0, 30, 60, 0.95);
      border: 2px solid rgba(0, 229, 255, 0.5);
      letter-spacing: 0.1em; cursor: pointer;
      animation: pulse-glow 2s ease-in-out infinite;
    `;

    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 15px rgba(0,229,255,0.3); }
        50% { box-shadow: 0 0 30px rgba(0,229,255,0.6); }
      }
    `;
    document.head.appendChild(style);

    btn.addEventListener('click', async () => {
      try {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm === 'granted') {
          this._startAccelerometer();
        }
      } catch (e) {
        console.warn('Accelerometer permission denied:', e);
      }
      // Remove button regardless of result
      btn.remove();
      style.remove();
    });

    document.body.appendChild(btn);
  }

  _startAccelerometer() {
    this._orientationHandler = (e) => this._onOrientation(e);
    window.addEventListener('deviceorientation', this._orientationHandler);
    this.hasAccelerometer = true;

    // Auto-recalibrate when screen orientation changes (portrait <-> landscape)
    // Use three listeners for maximum iOS/Android compatibility:
    //  1. screen.orientation.change — standard (Android, desktop)
    //  2. orientationchange — legacy (most iOS)
    //  3. resize — final fallback (iPadOS may skip orientationchange but always fires resize)
    this._screenOrientationHandler = () => this.recalibrate();
    if (screen.orientation) {
      screen.orientation.addEventListener('change', this._screenOrientationHandler);
    }
    window.addEventListener('orientationchange', this._screenOrientationHandler);

    // Debounced resize handler — detects orientation change on iPadOS
    this._lastWidth = window.innerWidth;
    this._lastHeight = window.innerHeight;
    this._resizeHandler = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Only recalibrate if the aspect ratio flipped (actual rotation, not keyboard)
      const wasLandscape = this._lastWidth > this._lastHeight;
      const isLandscape = w > h;
      if (wasLandscape !== isLandscape) {
        this._lastWidth = w;
        this._lastHeight = h;
        this.recalibrate();
      }
    };
    window.addEventListener('resize', this._resizeHandler);
  }

  /**
   * Get current screen orientation angle.
   * 0 = portrait, 90 = landscape-left, 180 = portrait-upside-down, 270/-90 = landscape-right
   *
   * Priority:
   *  1. screen.orientation.angle (Android, desktop) — most reliable
   *  2. window.orientation (legacy, still works on most iOS)
   *  3. Viewport dimension heuristic (final fallback for iPadOS where
   *     screen.orientation is missing and window.orientation may be 0)
   */
  _getScreenAngle() {
    // Detect landscape from multiple sources, most reliable first.
    // IMPORTANT: Some APIs (screen.orientation on iPadOS) may exist but
    // return 0 even in landscape. We only trust non-zero values from
    // angle-based APIs, and fall through to viewport check otherwise.

    // 1. screen.orientation.angle — reliable on Android/desktop
    //    Only trust if non-zero (0 could be portrait OR broken)
    if (screen.orientation && screen.orientation.angle) {
      return screen.orientation.angle;
    }

    // 2. window.orientation — legacy, works on most iOS
    //    Only trust if non-zero
    if (typeof window.orientation === 'number' && window.orientation !== 0) {
      return window.orientation < 0 ? window.orientation + 360 : window.orientation;
    }

    // 3. Viewport dimensions — most reliable cross-platform fallback
    //    Works on ALL devices, checked every frame
    if (window.innerWidth > window.innerHeight) {
      return 90; // landscape (can't distinguish left/right)
    }

    return 0; // portrait
  }

  _onOrientation(e) {
    const rawBeta = e.beta;   // always relative to portrait: front-back tilt
    const rawGamma = e.gamma; // always relative to portrait: left-right tilt

    if (rawBeta === null || rawGamma === null) return;

    // === Axis mapping based on screen orientation ===
    //
    // DeviceOrientation reports beta/gamma in the DEVICE's native portrait frame
    // on BOTH iOS and Android. In landscape the physical axes are swapped.
    //
    // We need:
    //   turnAxis:   positive = user tilts RIGHT, negative = tilts LEFT
    //   thrustAxis: positive = user pushes FORWARD (away), negative = pulls BACK
    //
    // Detection: use _getScreenAngle() which checks screen.orientation,
    // window.orientation, and matchMedia as fallbacks.

    const angle = this._getScreenAngle();
    let turnAxis, thrustAxis;

    switch (angle) {
      case 90: {
        // Landscape-left: device rotated 90° CW
        // Physical left/right tilt = beta axis
        // Physical forward/back = gamma axis (inverted)
        turnAxis = rawBeta;
        thrustAxis = -rawGamma;
        break;
      }
      case -90:
      case 270: {
        // Landscape-right: device rotated 90° CCW
        turnAxis = -rawBeta;
        thrustAxis = rawGamma;
        break;
      }
      case 180: {
        // Portrait upside-down
        turnAxis = -rawGamma;
        thrustAxis = -rawBeta;
        break;
      }
      default: {
        // Portrait (0°) — no remapping needed
        turnAxis = rawGamma;
        thrustAxis = rawBeta;
        break;
      }
    }

    // Calibrate on first reading (user's natural hold position)
    if (this.calibrationBeta === null) {
      this.calibrationBeta = thrustAxis;
      this.calibrationGamma = turnAxis;
    }

    // Relative tilt from calibration point
    const relTurn = turnAxis - this.calibrationGamma;
    const relThrust = thrustAxis - this.calibrationBeta;

    // Debug overlay — shows sensor values on screen for diagnostics
    this._updateDebugOverlay(angle, rawBeta, rawGamma, turnAxis, thrustAxis, relTurn, relThrust);

    // === TURN: physical left/right tilt ===
    // ±25° = full turn, 3° dead zone
    const turnDeadZone = 3;
    const turnMaxAngle = 25;

    if (Math.abs(relTurn) < turnDeadZone) {
      this.tiltX = 0;
    } else {
      const adjusted = relTurn - Math.sign(relTurn) * turnDeadZone;
      this.tiltX = Math.max(-1, Math.min(1, adjusted / (turnMaxAngle - turnDeadZone)));
    }

    // === THROTTLE: physical push forward / pull back ===
    // Push forward = positive = throttle UP
    // Pull back = negative = throttle DOWN
    const throttleDeadZone = 5;
    const throttleThreshold = 12;

    if (Math.abs(relThrust) < throttleDeadZone) {
      this.tiltY = 0;
    } else {
      const adjusted = relThrust - Math.sign(relThrust) * throttleDeadZone;
      this.tiltY = Math.max(-1, Math.min(1, adjusted / (30 - throttleDeadZone)));
    }

    // Generate discrete throttle triggers when tilt exceeds threshold
    const now = Date.now();
    const cooldownMs = 400;

    if (now - this._lastThrottleTrigger > cooldownMs) {
      if (relThrust > throttleThreshold) {
        this._throttleUpTriggered = true;
        this._lastThrottleTrigger = now;
      } else if (relThrust < -throttleThreshold) {
        this._throttleDownTriggered = true;
        this._lastThrottleTrigger = now;
      }
    }
  }

  /** Recalibrate accelerometer to current hold position */
  recalibrate() {
    this.calibrationBeta = null;
    this.calibrationGamma = null;
    this._throttleUpTriggered = false;
    this._throttleDownTriggered = false;
    this._lastThrottleTrigger = Date.now();
  }

  /** Debug overlay — shows accelerometer values on screen. Remove after debugging. */
  _updateDebugOverlay(angle, rawBeta, rawGamma, turnAxis, thrustAxis, relTurn, relThrust) {
    if (!this._debugEl) {
      this._debugEl = document.createElement('div');
      this._debugEl.style.cssText = `
        position: fixed; top: 8px; left: 50%; transform: translateX(-50%);
        z-index: 9999; background: rgba(0,0,0,0.85); color: #0f0;
        font: 11px/1.4 monospace; padding: 6px 10px; border-radius: 6px;
        pointer-events: none; white-space: pre;
      `;
      document.body.appendChild(this._debugEl);
    }
    const w = window.innerWidth, h = window.innerHeight;
    const mL = window.matchMedia?.('(orientation: landscape)').matches;
    this._debugEl.textContent =
      `ang:${angle} wO:${window.orientation??'?'} mL:${mL} ${w}x${h}\n` +
      `β:${rawBeta?.toFixed(1)} γ:${rawGamma?.toFixed(1)}\n` +
      `turn:${turnAxis?.toFixed(1)} thr:${thrustAxis?.toFixed(1)}\n` +
      `rel T:${relTurn?.toFixed(1)} R:${relThrust?.toFixed(1)}\n` +
      `tiltX:${this.tiltX?.toFixed(2)} tiltY:${this.tiltY?.toFixed(2)}`;
  }

  _createUI() {
    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 100; user-select: none;
      -webkit-user-select: none; -webkit-touch-callout: none;
    `;

    this.container.innerHTML = `
      <!-- Left side: Altitude -->
      <div style="position:absolute; left:16px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:12px; pointer-events:auto;">
        ${this._btn('altUp', '▲', '60px', '60px', '#76ff03')}
        <div style="text-align:center; font-family:'Share Tech Mono',monospace; font-size:10px; color:rgba(118,255,3,0.5); letter-spacing:0.1em;">ALT</div>
        ${this._btn('altDown', '▼', '60px', '60px', '#76ff03')}
      </div>

      <!-- Right side: Weapons -->
      <div style="position:absolute; right:16px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:16px; align-items:center; pointer-events:auto;">
        ${this._btn('missile', 'MSL', '70px', '56px', '#ff9100')}
        ${this._btn('fire', 'FIRE', '90px', '90px', '#ff1744', true)}
      </div>

      <!-- Top center: Calibrate + Pause -->
      <div style="position:absolute; top:8px; left:50%; transform:translateX(-50%); display:flex; gap:12px; pointer-events:auto;">
        <button id="touch-calibrate" style="
          font-family:'Share Tech Mono',monospace; font-size:10px;
          color:rgba(0,229,255,0.6); background:rgba(0,229,255,0.08);
          border:1px solid rgba(0,229,255,0.2); border-radius:4px;
          padding:6px 14px; letter-spacing:0.1em;
        ">⟳ CALIBRATE</button>
        <button id="touch-pause" style="
          font-family:'Share Tech Mono',monospace; font-size:10px;
          color:rgba(255,171,0,0.7); background:rgba(255,171,0,0.08);
          border:1px solid rgba(255,171,0,0.2); border-radius:4px;
          padding:6px 14px; letter-spacing:0.1em;
        ">❚❚ PAUSE</button>
      </div>

      <!-- Bottom center: Tilt indicator -->
      <div id="tilt-indicator" style="
        position:absolute; bottom:12px; left:50%; transform:translateX(-50%);
        font-family:'Share Tech Mono',monospace; font-size:9px;
        color:rgba(0,229,255,0.4); letter-spacing:0.1em;
        pointer-events:none; text-align:center;
      ">
        TILT: L/R steer · FWD/BACK throttle
      </div>
    `;

    document.body.appendChild(this.container);

    // Wire up touch events
    this._wireButtons();

    // Calibrate button
    const calBtn = this.container.querySelector('#touch-calibrate');
    calBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.recalibrate();
      calBtn.style.color = '#00e5ff';
      setTimeout(() => { calBtn.style.color = 'rgba(0,229,255,0.6)'; }, 300);
    });

    // Pause button
    const pauseBtn = this.container.querySelector('#touch-pause');
    pauseBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.pauseRequested = true;
    });
  }

  _btn(name, label, w, h, color, isLarge = false) {
    const fontSize = isLarge ? '18px' : '14px';
    const borderW = isLarge ? '2px' : '1px';
    return `<button data-touch-btn="${name}" style="
      width:${w}; height:${h}; border-radius:${isLarge ? '50%' : '10px'};
      background:rgba(${this._hexToRgb(color)},0.12);
      border:${borderW} solid rgba(${this._hexToRgb(color)},0.4);
      color:${color}; font-family:'Rajdhani',sans-serif;
      font-size:${fontSize}; font-weight:700; letter-spacing:0.1em;
      display:flex; align-items:center; justify-content:center;
      -webkit-tap-highlight-color:transparent;
    ">${label}</button>`;
  }

  _hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  }

  _wireButtons() {
    const buttons = this.container.querySelectorAll('[data-touch-btn]');

    buttons.forEach(btn => {
      const name = btn.dataset.touchBtn;

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.buttons[name] = true;
        // Track single-frame press for discrete actions
        if (name in this._justPressed) {
          this._justPressed[name] = true;
        }
        // Visual feedback
        btn.style.background = btn.style.background.replace(/0\.12/, '0.35');
        btn.style.transform = 'scale(0.93)';
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.buttons[name] = false;
        btn.style.background = btn.style.background.replace(/0\.35/, '0.12');
        btn.style.transform = 'scale(1)';
      }, { passive: false });

      btn.addEventListener('touchcancel', (e) => {
        this.buttons[name] = false;
        btn.style.background = btn.style.background.replace(/0\.35/, '0.12');
        btn.style.transform = 'scale(1)';
      });
    });
  }

  /**
   * Get mobile player input matching the keyboard input contract.
   * Turn: accelerometer left/right tilt
   * Throttle: accelerometer push forward / pull back (discrete triggers)
   * @returns {{ turn: number, throttleUp: boolean, throttleDown: boolean, fire: boolean, missile: boolean, altChange: number }}
   */
  getInput() {
    const input = {
      turn: this.tiltX,  // -1 to 1 from accelerometer L/R
      throttleUp: this._throttleUpTriggered,   // from accelerometer push forward
      throttleDown: this._throttleDownTriggered, // from accelerometer pull back
      fire: this.buttons.fire,
      missile: this._justPressed.missile,
      altChange: (this.buttons.altUp ? 1 : 0) + (this.buttons.altDown ? -1 : 0)
    };

    // Clear single-frame triggers
    this._justPressed.missile = false;
    this._throttleUpTriggered = false;
    this._throttleDownTriggered = false;

    return input;
  }

  show() {
    if (this.container) this.container.style.display = '';
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
  }

  destroy() {
    if (this._orientationHandler) {
      window.removeEventListener('deviceorientation', this._orientationHandler);
    }
    if (this._screenOrientationHandler) {
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', this._screenOrientationHandler);
      }
      window.removeEventListener('orientationchange', this._screenOrientationHandler);
    }
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler);
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
