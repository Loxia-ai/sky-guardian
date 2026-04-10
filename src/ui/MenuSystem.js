import { GAME_STATES } from '../core/Constants.js';

/**
 * DOM-based menu system for main menu, pause, and end screens.
 */
export class MenuSystem {
  constructor(game) {
    this.game = game;
    this.overlay = game.uiOverlay;
  }

  init() {
    this.showMainMenu();
  }

  showMainMenu() {
    this.overlay.innerHTML = `
      <div style="
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: radial-gradient(ellipse at center, rgba(0,30,60,0.9) 0%, rgba(10,14,23,0.97) 70%);
        z-index: 50;
      ">
        <div style="text-align: center;">
          <h1 style="
            font-family: 'Rajdhani', sans-serif; font-size: 4.5rem; font-weight: 700;
            color: #00e5ff; letter-spacing: 0.25em; text-transform: uppercase;
            text-shadow: 0 0 30px rgba(0,229,255,0.4), 0 0 60px rgba(0,229,255,0.15);
            margin: 0 0 0.3rem 0;
          ">Sky Guardian</h1>
          <p style="
            font-family: 'Share Tech Mono', monospace; font-size: 0.9rem;
            color: rgba(0,229,255,0.5); letter-spacing: 0.3em; margin: 0 0 3rem 0;
          ">AIR DEFENSE COMMAND</p>

          <div style="display: flex; flex-direction: column; gap: 12px; align-items: center;">
            ${this._menuButton('1 PLAYER', 'start-1p')}
            ${this._menuButton('2 PLAYERS', 'start-2p')}
          </div>

          <div style="margin-top: 2.5rem;">
            <p style="
              font-family: 'Rajdhani', sans-serif; font-size: 1rem; font-weight: 600;
              color: rgba(0,229,255,0.5); letter-spacing: 0.15em; margin-bottom: 0.8rem;
            ">SELECT MISSION</p>
            <div style="display: flex; gap: 10px; justify-content: center;" id="level-select">
              ${this._levelButton(0, 'COASTAL DEFENSE')}
              ${this._levelButton(1, 'MOUNTAIN PASS')}
              ${this._levelButton(2, 'URBAN SIEGE')}
            </div>
          </div>

          <div style="
            margin-top: 3rem; padding: 1.2rem 2rem;
            background: rgba(0,229,255,0.04); border: 1px solid rgba(0,229,255,0.1);
            border-radius: 6px; max-width: 500px;
          ">
            <p style="
              font-family: 'Share Tech Mono', monospace; font-size: 0.7rem;
              color: rgba(255,255,255,0.35); line-height: 1.8; margin: 0;
            ">
              P1: A/D turn · W/S throttle up/down · SPACE fire · E missile · R/F altitude<br>
              P2: ←/→ turn · ↑/↓ throttle · NUM0 fire · NUM. missile · NUM+/- altitude<br>
              ESC pause
            </p>
          </div>
        </div>
      </div>
    `;

    this._selectedLevel = 0;
    this._highlightLevel(0);

    // Event listeners
    this.overlay.querySelector('[data-action="start-1p"]')?.addEventListener('click', () => {
      this.game.startLevel(this._selectedLevel, 1);
    });
    this.overlay.querySelector('[data-action="start-2p"]')?.addEventListener('click', () => {
      this.game.startLevel(this._selectedLevel, 2);
    });

    this.overlay.querySelectorAll('[data-level]').forEach(btn => {
      btn.addEventListener('click', () => {
        this._selectedLevel = parseInt(btn.dataset.level);
        this._highlightLevel(this._selectedLevel);
      });
    });
  }

  _menuButton(text, action) {
    return `<button data-action="${action}" style="
      font-family: 'Rajdhani', sans-serif; font-size: 1.15rem; font-weight: 600;
      color: #00e5ff; background: rgba(0,229,255,0.06);
      border: 1px solid rgba(0,229,255,0.25); border-radius: 4px;
      padding: 10px 50px; cursor: pointer; letter-spacing: 0.15em;
      transition: all 0.2s ease; width: 260px;
    " onmouseover="this.style.background='rgba(0,229,255,0.15)';this.style.borderColor='rgba(0,229,255,0.5)'"
       onmouseout="this.style.background='rgba(0,229,255,0.06)';this.style.borderColor='rgba(0,229,255,0.25)'">
      ${text}
    </button>`;
  }

  _levelButton(index, name) {
    return `<button data-level="${index}" style="
      font-family: 'Share Tech Mono', monospace; font-size: 0.7rem;
      color: rgba(0,229,255,0.6); background: rgba(0,229,255,0.04);
      border: 1px solid rgba(0,229,255,0.15); border-radius: 3px;
      padding: 8px 16px; cursor: pointer; letter-spacing: 0.1em;
      transition: all 0.2s ease;
    " onmouseover="this.style.background='rgba(0,229,255,0.12)'"
       onmouseout="if(!this.classList.contains('selected'))this.style.background='rgba(0,229,255,0.04)'">
      ${index + 1}. ${name}
    </button>`;
  }

  _highlightLevel(index) {
    this.overlay.querySelectorAll('[data-level]').forEach(btn => {
      const isSelected = parseInt(btn.dataset.level) === index;
      btn.classList.toggle('selected', isSelected);
      btn.style.background = isSelected ? 'rgba(0,229,255,0.2)' : 'rgba(0,229,255,0.04)';
      btn.style.borderColor = isSelected ? 'rgba(0,229,255,0.5)' : 'rgba(0,229,255,0.15)';
      btn.style.color = isSelected ? '#00e5ff' : 'rgba(0,229,255,0.6)';
    });
  }

  showPause() {
    this.overlay.innerHTML = `
      <div style="
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: rgba(10,14,23,0.85); z-index: 50;
      ">
        <h2 style="
          font-family: 'Rajdhani', sans-serif; font-size: 2.5rem; font-weight: 700;
          color: #00e5ff; letter-spacing: 0.2em; margin-bottom: 2rem;
        ">PAUSED</h2>
        <div style="display: flex; flex-direction: column; gap: 12px; align-items: center;">
          ${this._menuButton('RESUME', 'resume')}
          ${this._menuButton('MAIN MENU', 'main-menu')}
        </div>
      </div>
    `;

    this.overlay.querySelector('[data-action="resume"]')?.addEventListener('click', () => {
      this.game.state = GAME_STATES.PLAYING;
      this.hidePause();
    });
    this.overlay.querySelector('[data-action="main-menu"]')?.addEventListener('click', () => {
      this.game.state = GAME_STATES.MENU;
      this.showMainMenu();
    });
  }

  hidePause() {
    this.overlay.innerHTML = '';
  }

  showEndScreen(won, scores) {
    const title = won ? 'MISSION COMPLETE' : 'MISSION FAILED';
    const titleColor = won ? '#76ff03' : '#ff1744';
    const totalScore = scores[0] + scores[1];

    this.overlay.innerHTML = `
      <div style="
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: rgba(10,14,23,0.9); z-index: 50;
      ">
        <h2 style="
          font-family: 'Rajdhani', sans-serif; font-size: 3rem; font-weight: 700;
          color: ${titleColor}; letter-spacing: 0.2em; margin-bottom: 1rem;
          text-shadow: 0 0 20px ${titleColor}40;
        ">${title}</h2>

        <div style="
          margin-bottom: 2rem; padding: 1.2rem 2.5rem;
          background: rgba(0,0,0,0.3); border-radius: 6px;
          border: 1px solid ${titleColor}30;
        ">
          <p style="
            font-family: 'Share Tech Mono', monospace; font-size: 1.2rem;
            color: #76ff03; text-align: center; margin: 0;
          ">SCORE: ${totalScore}</p>
          ${scores[1] > 0 ? `
            <p style="font-family: 'Share Tech Mono', monospace; font-size: 0.8rem; color: rgba(255,255,255,0.5); text-align: center; margin: 0.5rem 0 0;">
              P1: ${scores[0]} · P2: ${scores[1]}
            </p>
          ` : ''}
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px; align-items: center;">
          ${this._menuButton('RETRY', 'retry')}
          ${this._menuButton('MAIN MENU', 'main-menu')}
        </div>
      </div>
    `;

    this.overlay.querySelector('[data-action="retry"]')?.addEventListener('click', () => {
      this.game.startLevel(this.game.currentLevel, this.game.playerCount);
    });
    this.overlay.querySelector('[data-action="main-menu"]')?.addEventListener('click', () => {
      this.game.state = GAME_STATES.MENU;
      this.showMainMenu();
    });
  }

  hide() {
    this.overlay.innerHTML = '';
  }
}
