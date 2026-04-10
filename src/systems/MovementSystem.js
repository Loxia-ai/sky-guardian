import { WORLD_WIDTH, WORLD_HEIGHT } from '../core/Constants.js';

/**
 * Handles movement for all entities: player jets, targets, missiles, bullets.
 */
export class MovementSystem {
  constructor(game) {
    this.game = game;
  }

  update(dt) {
    const entities = this.game.entities;

    // Update player jets
    for (const jet of entities.jets) {
      const input = this.game.input.getPlayerInput(jet.playerIndex);
      jet.applyInput(input, dt);
      jet.updatePosition(dt);
      jet.updateTrail();

      // Clamp to world bounds
      jet.pos.x = Math.max(0, Math.min(WORLD_WIDTH, jet.pos.x));
      jet.pos.y = Math.max(0, Math.min(WORLD_HEIGHT, jet.pos.y));
    }

    // Update targets along their routes
    for (const target of entities.targets) {
      target.updateRoute(dt);

      // Remove only if out of bounds (NOT on route complete — they attack the site)
      if (target.isOutOfBounds(WORLD_WIDTH, WORLD_HEIGHT)) {
        target.kill();
      }

      // Targets that completed their route linger at the site attacking
      // They are destroyed by the collision system's site defense counter-damage
      // or after a maximum linger time
      if (target.routeComplete) {
        target.lingerTime = (target.lingerTime || 0) + dt;
        // Self-destruct after 8 seconds of attacking (kamikaze run complete)
        if (target.lingerTime > 8) {
          target.kill();
        }
      }
    }

    // Update missiles
    for (const missile of entities.missiles) {
      const target = entities.get(missile.targetId);
      // Check if parent jet still has lock on this target
      const jets = entities.jets;
      let parentHasLock = false;
      for (const jet of jets) {
        if (jet.playerIndex === missile.ownerPlayerIndex && jet.lockedTarget === missile.targetId) {
          parentHasLock = true;
          break;
        }
      }
      missile.guide(target, parentHasLock, dt);
    }

    // Update bullets
    for (const bullet of entities.bullets) {
      bullet.update(dt);
    }

    // Update explosions
    for (const explosion of entities.explosions) {
      explosion.update(dt);
    }

    // Update defense sites
    for (const site of entities.defenseSites) {
      site.update(dt);
    }
  }
}
