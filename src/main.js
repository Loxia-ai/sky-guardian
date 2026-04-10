import { Game } from './core/Game.js';

const canvas = document.getElementById('game-canvas');
const uiOverlay = document.getElementById('ui-overlay');
const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingText = document.getElementById('loading-text');

function updateLoading(progress, text) {
  loadingBar.style.width = `${progress}%`;
  loadingText.textContent = text;
}

async function init() {
  try {
    updateLoading(20, 'LOADING CORE SYSTEMS...');

    const game = new Game(canvas, uiOverlay);

    updateLoading(50, 'INITIALIZING SUBSYSTEMS...');
    await game.init();

    updateLoading(80, 'CALIBRATING RADAR...');
    await new Promise(r => setTimeout(r, 300));

    updateLoading(100, 'SYSTEMS ONLINE');
    await new Promise(r => setTimeout(r, 400));

    loadingScreen.style.opacity = '0';
    loadingScreen.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 500);

    game.start();
  } catch (err) {
    console.error('Failed to initialize Sky Guardian:', err);
    loadingText.textContent = 'SYSTEM FAILURE — CHECK CONSOLE';
    loadingText.style.color = '#ff1744';
  }
}

init();
