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

        // Altitude check - bullets converge toward nearby target altitude
        const altDiff = Math.abs(bullet.altitude - target.altitude);
        const dist = bullet.pos.distanceTo(target.pos);

        // Auto-converge bullet altitude when close to a target
        if (dist < 200 && altDiff > 100) {
          bullet.altitude += Math.sign(target.altitude - bullet.altitude) * 2000 * this.game.deltaTime;
        }

        if (altDiff > 2000) continue;

        // Altitude proximity bonus: reduce effective distance based on altitude match
        const altFactor = 1 + altDiff / 5000; // slight penalty for alt mismatch
        const hitRadius = (bullet.size + target.size) * 1.5;

        if (dist < hitRadius * altFactor) {
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

      // Altitude check (generous — missile actively guides altitude)
      const altDiff = Math.abs(missile.altitude - target.altitude);
      if (altDiff > 3000) continue;

      // Swept collision: check along the missile's travel path this frame
      // to prevent fast missiles from passing through targets
      const dx = missile.vel.x * this.game.deltaTime;
      const dy = missile.vel.y * this.game.deltaTime;
      const moveLen = Math.sqrt(dx * dx + dy * dy);
      const hitRadius = missile.size + target.size + 8;

      // Current distance check
      const dist = missile.pos.distanceTo(target.pos);
      let hit = dist < hitRadius;

      // Swept check: if missile moved far enough, sample along path
      if (!hit && moveLen > hitRadius) {
        const steps = Math.ceil(moveLen / hitRadius);
        for (let s = 1; s <= steps && !hit; s++) {
          const t = s / steps;
          const sx = missile.pos.x - dx * t;
          const sy = missile.pos.y - dy * t;
          const sdx = sx - target.pos.x;
          const sdy = sy - target.pos.y;
          const sDist = Math.sqrt(sdx * sdx + sdy * sdy);
          if (sDist < hitRadius) hit = true;
        }
      }

      if (hit) {
        // Apply altitude proximity as damage multiplier (closer alt = more damage)
        const altMultiplier = altDiff < 500 ? 1.0 : altDiff < 1500 ? 0.8 : 0.5;
        target.takeDamage(missile.damage * altMultiplier);
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
   * Targets dive to low altitude on approach (handled by Target._updateAltitude).
   * Burst damage on first contact + continuous DPS while lingering.
   */
  _checkTargetAttacks(dt) {
    const targets = this.game.entities.targets;
    const sites = this.game.entities.defenseSites;

    for (const target of targets) {
      if (target.dead) continue;

      for (const site of sites) {
        if (site.dead) continue;

        const dist = target.pos.distanceTo(site.pos);
        // Generous proximity: targets near the site and at low-enough altitude deal damage
        // Altitude check is lenient — the attack dive brings them low, but even
        // partial dives should still deal reduced damage
        const proximityRadius = site.size + target.size + 60;
        const inRange = dist < proximityRadius;
        const altitudeFactor = target.altitude < 500 ? 1.0
          : target.altitude < 2000 ? 0.7
          : target.altitude < 5000 ? 0.3
          : 0.1; // even high-altitude bombers do some damage if in range

        if (inRange) {
          // Burst damage on first contact with this site
          if (!target._hitSites) target._hitSites = new Set();
          if (!target._hitSites.has(site.id)) {
            target._hitSites.add(site.id);
            // Impact burst: significant one-time damage
            const burstDamage = target.damage * 1.5 * altitudeFactor;
            site.takeDamage(burstDamage);
            this._spawnExplosion(
              (target.pos.x + site.pos.x) / 2,
              (target.pos.y + site.pos.y) / 2,
              25
            );
            this.game.audio.playExplosion(0.6);
          }

          // Continuous DPS while target lingers near site
          const dps = target.damage * altitudeFactor;
          site.takeDamage(dps * dt);

          // Site defenses fight back — kill target faster
          target.takeDamage(25 * dt);

          if (target.dead) {
            this._spawnExplosion(target.pos.x, target.pos.y, target.size + 10);
            this.game.audio.playExplosion(0.8);
          }

          if (site.dead) {
            this._spawnExplosion(site.pos.x, site.pos.y, 50, 1.0);
            this.game.audio.playExplosion(1.0);
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
