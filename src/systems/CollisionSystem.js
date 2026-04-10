import { Explosion } from '../entities/Explosion.js';

/**
 * Detects collisions between projectiles and targets,
 * and between targets and defense sites.
 */
export class CollisionSystem {
  constructor(game) {
    this.game = game;
  }

  update(dt) {
    this._checkBulletHits();
    this._checkMissileHits();
    this._checkTargetAttacks(dt);
  }

  _checkBulletHits() {
    const bullets = this.game.entities.bullets;
    const targets = this.game.entities.targets;

    for (const bullet of bullets) {
      if (bullet.dead) continue;
      for (const target of targets) {
        if (target.dead) continue;

        // Altitude check - bullets only hit at similar altitude
        const altDiff = Math.abs(bullet.altitude - target.altitude);
        if (altDiff > 1000) continue;

        const dist = bullet.pos.distanceTo(target.pos);
        if (dist < bullet.size + target.size) {
          target.takeDamage(bullet.damage);
          bullet.kill();

          if (target.dead) {
            this._spawnExplosion(target.pos.x, target.pos.y, target.size * 1.5);
            this.game.addScore(bullet.ownerPlayerIndex, target.points || 100);
            this.game.audio.playExplosion(0.5);
          }
          break;
        }
      }
    }
  }

  _checkMissileHits() {
    const missiles = this.game.entities.missiles;
    const targets = this.game.entities.targets;

    for (const missile of missiles) {
      if (missile.dead || missile.aborted) continue;

      const target = this.game.entities.get(missile.targetId);
      if (!target || target.dead) continue;

      // Altitude check
      const altDiff = Math.abs(missile.altitude - target.altitude);
      if (altDiff > 1500) continue;

      const dist = missile.pos.distanceTo(target.pos);
      if (dist < missile.size + target.size + 5) {
        target.takeDamage(missile.damage);
        missile.kill();

        this._spawnExplosion(
          (missile.pos.x + target.pos.x) / 2,
          (missile.pos.y + target.pos.y) / 2,
          35
        );
        this.game.audio.playExplosion(1.0);

        if (target.dead) {
          this.game.addScore(missile.ownerPlayerIndex, target.points || 100);
        }
      }
    }
  }

  /**
   * Targets that reach defense sites deal damage.
   */
  _checkTargetAttacks(dt) {
    const targets = this.game.entities.targets;
    const sites = this.game.entities.defenseSites;

    for (const target of targets) {
      if (target.dead) continue;

      for (const site of sites) {
        if (site.dead) continue;

        const dist = target.pos.distanceTo(site.pos);
        // If target is close to defense site and at low enough altitude
        if (dist < site.size + target.size + 20 && target.altitude < 3000) {
          site.takeDamage(target.damage * dt * 2);
          // Target also takes some damage from site defenses
          target.takeDamage(5 * dt);

          if (target.dead) {
            this._spawnExplosion(target.pos.x, target.pos.y, target.size);
          }

          if (site.dead) {
            this._spawnExplosion(site.pos.x, site.pos.y, 50, 1.0);
            this._checkGameOver();
          }
        }
      }
    }
  }

  _spawnExplosion(x, y, radius = 30, duration = 0.6) {
    const explosion = new Explosion(x, y, radius, duration);
    this.game.entities.add(explosion);
  }

  _checkGameOver() {
    const sites = this.game.entities.defenseSites;
    const allDestroyed = sites.every(s => s.dead);
    if (allDestroyed) {
      this.game.gameOver(false);
    }
  }
}
