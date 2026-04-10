/**
 * Game-wide constants and configuration.
 */

// Canvas / World
export const WORLD_WIDTH = 1920;
export const WORLD_HEIGHT = 1080;

// Physics
export const PIXELS_PER_KM = 50; // scale factor

// Fighter Jet defaults
export const JET_SPEED_MIN = 60;          // px/s  (idle / loiter)
export const JET_SPEED_MAX = 350;         // px/s  (afterburner)
export const JET_SPEED_DEFAULT = 150;     // px/s  (50 % throttle)

// Throttle notches  (fraction of speed range above MIN)
export const THROTTLE_NOTCHES = [0.0, 0.25, 0.50, 0.75, 1.0];
export const THROTTLE_DEFAULT_INDEX = 2;  // start at 50 %
export const JET_TURN_RATE = 2.2;         // rad/s
export const JET_ALTITUDE_DEFAULT = 5000; // meters
export const JET_ALTITUDE_MIN = 500;
export const JET_ALTITUDE_MAX = 15000;
export const JET_ALTITUDE_RATE = 500;     // m/s climb/descend rate
export const JET_HEALTH = 100;

// Cannon
export const CANNON_FIRE_RATE = 8;        // rounds per second
export const CANNON_BULLET_SPEED = 800;   // px/s
export const CANNON_RANGE = 300;          // px
export const CANNON_DAMAGE = 8;
export const CANNON_AMMO = 200;

// Missiles
export const MISSILE_COUNT = 6;
export const MISSILE_SPEED = 450;         // px/s
export const MISSILE_TURN_RATE = 4.0;     // rad/s
export const MISSILE_RANGE = 600;         // px max travel
export const MISSILE_DAMAGE = 50;
export const MISSILE_LOCK_TIME = 2.0;     // seconds of continuous tracking to lock
export const MISSILE_SEEKER_RANGE = 80;   // px - short range terminal radar
export const MISSILE_LIFETIME = 5.0;      // seconds before self-destruct

// Radar
export const RADAR_RANGE = 500;           // px
export const RADAR_HALF_ANGLE = Math.PI / 4; // 45 deg half-angle = 90 deg cone
export const RADAR_SWEEP_RATE = 0;        // 0 = fixed forward cone

// Targets / Enemies
export const TARGET_TYPES = {
  DRONE: {
    name: 'Drone',
    speed: 80,
    health: 20,
    damage: 10,
    size: 12,
    color: '#ff5252',
    altitude: 3000,
    points: 100
  },
  BOMBER: {
    name: 'Bomber',
    speed: 60,
    health: 80,
    damage: 40,
    size: 22,
    color: '#ff9100',
    altitude: 6000,
    points: 250
  },
  FIGHTER: {
    name: 'Fighter',
    speed: 180,
    health: 40,
    damage: 20,
    size: 16,
    color: '#ff1744',
    altitude: 5000,
    points: 200
  },
  CRUISE_MISSILE: {
    name: 'Cruise Missile',
    speed: 250,
    health: 10,
    damage: 80,
    size: 8,
    color: '#d500f9',
    altitude: 1000,
    points: 300
  },
  STEALTH: {
    name: 'Stealth',
    speed: 150,
    health: 35,
    damage: 30,
    size: 14,
    color: '#424242',
    altitude: 7000,
    radarCrossSection: 0.3, // harder to detect
    points: 400
  }
};

// Defense Sites
export const DEFENSE_SITE_HEALTH = 200;
export const DEFENSE_SITE_RADIUS = 30;

// Game states
export const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LEVEL_COMPLETE: 'level_complete',
  GAME_OVER: 'game_over',
  VICTORY: 'victory'
};

// Colors
export const COLORS = {
  RADAR_CONE: 'rgba(0, 229, 255, 0.08)',
  RADAR_EDGE: 'rgba(0, 229, 255, 0.25)',
  RADAR_BLIP: '#00e5ff',
  LOCK_INDICATOR: '#ff1744',
  LOCK_ACQUIRING: '#ffab00',
  FRIENDLY: '#00e5ff',
  FRIENDLY_P2: '#76ff03',
  ENEMY: '#ff5252',
  DEFENSE_SITE: '#ffd740',
  MISSILE_TRAIL: 'rgba(255, 171, 0, 0.6)',
  BULLET: '#ffeb3b',
  HUD_TEXT: '#00e5ff',
  HUD_TEXT_P2: '#76ff03',
  HUD_BG: 'rgba(10, 14, 23, 0.85)',
  MAP_BG: '#0d1117',
  MAP_GRID: 'rgba(0, 229, 255, 0.06)',
  EXPLOSION: ['#ff5252', '#ff9100', '#ffab00', '#ffeb3b', '#ffffff']
};

// Player key bindings
export const PLAYER_KEYS = {
  P1: {
    up: 'KeyW',
    down: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    fire: 'Space',
    missile: 'KeyE',
    altUp: 'KeyR',
    altDown: 'KeyF'
  },
  P2: {
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    fire: 'Numpad0',
    missile: 'NumpadDecimal',
    altUp: 'NumpadAdd',
    altDown: 'NumpadSubtract'
  }
};
