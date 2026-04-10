import { Entity } from './Entity.js';
import { angleDiff, clamp } from '../core/Math2D.js';
import {
  MISSILE_SPEED, MISSILE_TURN_RATE, MISSILE_LIFETIME,
  MISSILE_DAMAGE, MISSILE_SEEKER_RANGE, COLORS
} from '../core/Constants.js';

/**
 * AA Missile entity. Guides toward a locked target.
 */
export class Missile extends Entity {
  /**
   * @param {number} x - launch position
   * @param {number} y
   * @param {number} heading - initial heading
   * @param {string} targetId - locked target entity ID
   * @param {number} ownerPlayerIndex
   */
  constructor(x, y, heading, targetId, ownerPlayerIndex) {
    super('missile', x, y);
    this.heading = heading;
    this.speed = MISSILE_SPEED;
    this.targetId = targetId;
    this.ownerPlayerIndex = ownerPlayerIndex;
    this.damage = MISSILE_DAMAGE;
    this.size = 5;
    this.lifetime = MISSILE_LIFETIME;
    this.turnRate = MISSILE_TURN_RATE;
    this.seekerRange = MISSILE_SEEKER_RANGE;
    this.altitude = 5000;

    // State
    this.hasRadarLock = true;     // starts with lock from parent jet
    this.seekerActive = false;    // terminal seeker mode
    this.aborted = false;
    this.distanceTraveled = 0;

    // Trail
    this.trailPositions = [];
  }

  /**
   * Guide missile toward target.
   * @param {import('./Entity.js').Entity|null} target - the target entity
   * @param {boolean} parentHasLock - whether the launching jet still has radar lock
   * @param {number} dt
   */
  guide(target, parentHasLock, dt) {
    this.lifetime -= dt;
    if (this.lifetime <= 0) {
      this.kill();
      return;
    }

    if (!target || target.dead) {
      // Target gone - check if seeker can still track
      if (!this.seekerActive) {
        this.abort();
        return;
      }
    }

    if (target && !target.dead) {
      const dist = this.pos.distanceTo(target.pos);

      // Check if terminal seeker can activate
      if (dist <= this.seekerRange) {
        this.seekerActive = true;
      }

      // If parent lost lock and seeker not active, abort
      if (!parentHasLock && !this.seekerActive) {
        this.abort();
        return;
      }

      this.hasRadarLock = parentHasLock || this.seekerActive;

      // Proportional navigation guidance
      if (this.hasRadarLock) {
        const desiredAngle = this.pos.angleTo(target.pos);
        const diff = angleDiff(this.heading, desiredAngle);
        const maxTurn = this.turnRate * dt;
        this.heading += clamp(diff, -maxTurn, maxTurn);
      }
    }

    // Move
    const prevX = this.pos.x;
    const prevY = this.pos.y;
    this.updatePosition(dt);
    
    const dx = this.pos.x - prevX;
    const dy = this.pos.y - prevY;
    this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);

    // Trail
    this.trailPositions.push({ x: this.pos.x, y: this.pos.y });
    if (this.trailPositions.length > 25) {
      this.trailPositions.shift();
    }
  }

  abort() {
    this.aborted = true;
    this.hasRadarLock = false;
    // Missile flies straight for a bit then dies
    this.lifetime = Math.min(this.lifetime, 0.5);
  }
}
