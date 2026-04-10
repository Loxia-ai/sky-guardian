import { Bullet } from '../entities/Bullet.js';
import { Missile } from '../entities/Missile.js';
import { Vec2 } from '../core/Math2D.js';

/**
 * Handles weapon firing for player jets.
 */
export class CombatSystem {
  constructor(game) {
    this.game = game;
  }

  update(dt) {
    const entities = this.game.entities;
    const jets = entities.jets;

    for (const jet of jets) {
      const input = this.game.input.getPlayerInput(jet.playerIndex);

      // Cannon fire
      if (input.fire && jet.canFireCannon()) {
        if (jet.fireCannon()) {
          this._spawnBullet(jet);
          this.game.audio.playCannon();
        }
      }

      // Missile launch
      if (input.missile && jet.canFireMissile()) {
        if (jet.fireMissile()) {
          this._spawnMissile(jet);
          this.game.audio.playMissileLaunch();
        }
      }
    }
  }

  _spawnBullet(jet) {
    // Spawn slightly ahead of jet
    const offset = Vec2.fromAngle(jet.heading, jet.size + 5);
    const bullet = new Bullet(
      jet.pos.x + offset.x,
      jet.pos.y + offset.y,
      jet.heading,
      jet.playerIndex
    );
    bullet.altitude = jet.altitude;
    this.game.entities.add(bullet);
  }

  _spawnMissile(jet) {
    const offset = Vec2.fromAngle(jet.heading, jet.size + 8);
    const missile = new Missile(
      jet.pos.x + offset.x,
      jet.pos.y + offset.y,
      jet.heading,
      jet.lockedTarget,
      jet.playerIndex
    );
    missile.altitude = jet.altitude;
    this.game.entities.add(missile);
  }
}
