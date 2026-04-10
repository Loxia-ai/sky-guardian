/**
 * On-screen touch controls for mobile devices.
 * Provides: accelerometer-based steering, thumb buttons for weapons & throttle.
 *
 * Layout (landscape orientation):
 *   Left side:  Throttle Up / Throttle Down buttons
 *   Right side: FIRE (cannon) button (large) + MISSILE button + ALT Up/Down
 */
export class TouchControls {
  constructor(game) {
    this.game = game;
    this.container = null;

    // Touch button states
    this.buttons = {
      fire: false,
      missile: false,
      throttleUp: false,
      throttleDown: false,
      altUp: false,
      altDown: false
    };

    // Single-frame triggers (like keyPressed — true for one frame only)
    this._justPressed = {
      missile: false,
      throttleUp: false,
      throttleDown: false
    };

    // Accelerometer state
    this.tiltX = 0; // left/right tilt (-1 to 1)
    this.tiltY = 0; // forward/back tilt
    this.calibrationBeta = null; // neutral tilt angle
    this.calibrationGamma = null;
    this.hasAccelerometer = false;
    this._orientationHandler = null;

    // Track active touches per button to handle multi-touch
    this._activeTouches = new Map(); // touchId -> buttonName
  }

  async init() {
    this._createUI();
    await this._initAccelerometer();
  }

  async _initAccelerometer() {
    // iOS 13+ requires permission
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const perm = await DeviceOrientationEvent.requestPermission();
        if (perm === 'granted') {
          this._startAccelerometer();
        }
      } catch (e) {
        console.warn('Accelerometer permission denied:', e);
      }
    } else if ('DeviceOrientationEvent' in window) {
      this._startAccelerometer();
    }
  }

  _startAccelerometer() {
    this._orientationHandler = (e) => this._onOrientation(e);
    window.addEventListener('deviceorientation', this._orientationHandler);
    this.hasAccelerometer = true;
  }

  _onOrientation(e) {
    const beta = e.beta;   // front-back tilt (-180 to 180)
    const gamma = e.gamma; // left-right tilt (-90 to 90)

    if (beta === null || gamma === null) return;

    // Calibrate on first reading (user's natural hold position)
    if (this.calibrationBeta === null) {
      this.calibrationBeta = beta;
      this.calibrationGamma = gamma;
    }

    // Relative tilt from calibration point
    const relGamma = gamma - this.calibrationGamma;
    const relBeta = beta - this.calibrationBeta;

    // Map to -1..1 range with dead zone
    // Gamma (left/right): ±30° = full turn
    const deadZone = 3; // degrees
    const maxAngle = 30;

    if (Math.abs(relGamma) < deadZone) {
      this.tiltX = 0;
    } else {
      const adjusted = relGamma - Math.sign(relGamma) * deadZone;
      this.tiltX = Math.max(-1, Math.min(1, adjusted / (maxAngle - deadZone)));
    }

    // Beta (forward/back) — could be used for altitude later
    if (Math.abs(relBeta) < deadZone) {
      this.tiltY = 0;
    } else {
      const adjusted = relBeta - Math.sign(relBeta) * deadZone;
      this.tiltY = Math.max(-1, Math.min(1, adjusted / (maxAngle - deadZone)));
    }
  }

  /** Recalibrate accelerometer to current hold position */
  recalibrate() {
    this.calibrationBeta = null;
    this.calibrationGamma = null;
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
      <!-- Left side: Throttle -->
      <div style="position:absolute; left:16px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:12px; pointer-events:auto;">
        ${this._btn('throttleUp', '▲', '60px', '60px', '#00e5ff')}
        <div style="text-align:center; font-family:'Share Tech Mono',monospace; font-size:10px; color:rgba(0,229,255,0.5); letter-spacing:0.1em;">SPD</div>
        ${this._btn('throttleDown', '▼', '60px', '60px', '#00e5ff')}
      </div>

      <!-- Left side lower: Altitude -->
      <div style="position:absolute; left:90px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:12px; pointer-events:auto;">
        ${this._btn('altUp', '⬆', '50px', '50px', '#76ff03')}
        <div style="text-align:center; font-family:'Share Tech Mono',monospace; font-size:10px; color:rgba(118,255,3,0.5); letter-spacing:0.1em;">ALT</div>
        ${this._btn('altDown', '⬇', '50px', '50px', '#76ff03')}
      </div>

      <!-- Right side: Weapons -->
      <div style="position:absolute; right:16px; top:50%; transform:translateY(-50%); display:flex; flex-direction:column; gap:16px; align-items:center; pointer-events:auto;">
        ${this._btn('missile', 'MSL', '70px', '56px', '#ff9100')}
        ${this._btn('fire', 'FIRE', '90px', '90px', '#ff1744', true)}
      </div>

      <!-- Top center: Calibrate + Pause buttons -->
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

    // Pause button — sets a flag that Game._update reads
    this.pauseRequested = false;
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
   * @returns {{ turn: number, throttleUp: boolean, throttleDown: boolean, fire: boolean, missile: boolean, altChange: number }}
   */
  getInput() {
    const input = {
      turn: this.tiltX,  // -1 to 1 from accelerometer
      throttleUp: this._justPressed.throttleUp,
      throttleDown: this._justPressed.throttleDown,
      fire: this.buttons.fire,
      missile: this._justPressed.missile,
      altChange: (this.buttons.altUp ? 1 : 0) + (this.buttons.altDown ? -1 : 0)
    };

    // Clear single-frame triggers
    this._justPressed.missile = false;
    this._justPressed.throttleUp = false;
    this._justPressed.throttleDown = false;

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
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
