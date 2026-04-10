import { Vec2 } from '../core/Math2D.js';
import { FighterJet } from '../entities/FighterJet.js';
import { Target, ROUTE_TYPES } from '../entities/Target.js';
import { DefenseSite } from '../entities/DefenseSite.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../core/Constants.js';
import { getLevelConfig } from '../levels/LevelData.js';

/**
 * Manages wave spawning and level progression.
 */
export class WaveSystem {
  constructor(game) {
    this.game = game;
    this.levelConfig = null;
    this.currentWaveIndex = 0;
    this.waveTimer = 0;
    this.waveActive = false;
    this.spawned = 0;
    this.spawnTimer = 0;
    this.allWavesComplete = false;
    this.waveCooldown = 0;
  }

  loadLevel(levelIndex, playerCount) {
    this.levelConfig = getLevelConfig(levelIndex);
    this.currentWaveIndex = 0;
    this.waveTimer = 0;
    this.waveActive = false;
    this.spawned = 0;
    this.spawnTimer = 0;
    this.allWavesComplete = false;
    this.waveCooldown = 2; // 2s before first wave

    // Spawn defense sites
    for (const siteDef of this.levelConfig.defenseSites) {
      const site = new DefenseSite(siteDef.x, siteDef.y, siteDef.name);
      this.game.entities.add(site);
    }

    // Spawn player jets
    const spawnPoints = this.levelConfig.playerSpawns || [
      { x: WORLD_WIDTH / 2 - 100, y: WORLD_HEIGHT - 150 },
      { x: WORLD_WIDTH / 2 + 100, y: WORLD_HEIGHT - 150 }
    ];

    for (let i = 0; i < playerCount; i++) {
      const sp = spawnPoints[i] || spawnPoints[0];
      const jet = new FighterJet(i, sp.x, sp.y);
      this.game.entities.add(jet);
    }
  }

  update(dt) {
    if (!this.levelConfig || this.allWavesComplete) {
      // Check if all targets are gone for victory
      if (this.allWavesComplete && this.game.entities.targets.length === 0) {
        this.game.gameOver(true);
      }
      return;
    }

    // Cooldown between waves
    if (this.waveCooldown > 0) {
      this.waveCooldown -= dt;
      return;
    }

    const waves = this.levelConfig.waves;
    if (this.currentWaveIndex >= waves.length) {
      this.allWavesComplete = true;
      return;
    }

    const wave = waves[this.currentWaveIndex];

    // Spawn enemies in this wave
    if (this.spawned < wave.count) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this._spawnTarget(wave);
        this.spawned++;
        this.spawnTimer = wave.interval || 1.5;
      }
    } else {
      // Wave spawning complete, wait for all targets cleared or timeout
      this.waveTimer += dt;
      const allCleared = this.game.entities.targets.length === 0;
      const timeout = this.waveTimer > (wave.duration || 30);

      if (allCleared || timeout) {
        this.currentWaveIndex++;
        this.spawned = 0;
        this.spawnTimer = 0;
        this.waveTimer = 0;
        this.waveCooldown = wave.cooldownAfter || 3;
      }
    }
  }

  _spawnTarget(wave) {
    const route = this._generateRoute(wave);
    const config = {
      targetType: this._pickTargetType(wave),
      route,
      altitude: wave.altitude || undefined,
      altitudeChanges: wave.altitudeChanges || []
    };
    const target = new Target(config);
    this.game.entities.add(target);
  }

  _pickTargetType(wave) {
    if (Array.isArray(wave.types)) {
      return wave.types[Math.floor(Math.random() * wave.types.length)];
    }
    return wave.types || 'DRONE';
  }

  _generateRoute(wave) {
    if (wave.routes && wave.routes.length > 0) {
      const routeDef = wave.routes[Math.floor(Math.random() * wave.routes.length)];
      return this._buildRoute(routeDef);
    }

    // Default: straight line from random edge toward a defense site
    const sites = this.game.entities.defenseSites;
    const targetSite = sites.length > 0
      ? sites[Math.floor(Math.random() * sites.length)]
      : { pos: { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 } };

    const edge = Math.floor(Math.random() * 4);
    let startX, startY;
    switch (edge) {
      case 0: startX = Math.random() * WORLD_WIDTH; startY = -50; break;
      case 1: startX = WORLD_WIDTH + 50; startY = Math.random() * WORLD_HEIGHT; break;
      case 2: startX = Math.random() * WORLD_WIDTH; startY = WORLD_HEIGHT + 50; break;
      default: startX = -50; startY = Math.random() * WORLD_HEIGHT; break;
    }

    return {
      type: ROUTE_TYPES.STRAIGHT,
      start: { x: startX, y: startY },
      end: { x: targetSite.pos.x, y: targetSite.pos.y }
    };
  }

  _buildRoute(def) {
    if (def.type === 'bezier' && def.points) {
      return {
        type: ROUTE_TYPES.BEZIER,
        points: def.points.map(p => new Vec2(p.x, p.y))
      };
    }
    if (def.type === 'polygon' && def.waypoints) {
      return {
        type: ROUTE_TYPES.POLYGON,
        waypoints: def.waypoints.map(p => ({ x: p.x, y: p.y })),
        loop: def.loop || false
      };
    }
    // Default straight
    return {
      type: ROUTE_TYPES.STRAIGHT,
      start: { x: def.start?.x || 0, y: def.start?.y || 0 },
      end: { x: def.end?.x || WORLD_WIDTH / 2, y: def.end?.y || WORLD_HEIGHT / 2 }
    };
  }

  get currentWaveNumber() {
    return this.currentWaveIndex + 1;
  }

  get totalWaves() {
    return this.levelConfig ? this.levelConfig.waves.length : 0;
  }
}
