import { Entity } from './Entity.js';
import { CANNON_BULLET_SPEED, CANNON_RANGE, CANNON_DAMAGE, COLORS } from '../core/Constants.js';

/**
 * Cannon bullet entity.
 */
export class Bullet extends Entity {
  constructor(x, y, heading, ownerPlayerIndex) {
    super('bullet', x, y);
    this.heading = heading;
    this.speed = CANNON_BULLET_SPEED;
    this.damage = CANNON_DAMAGE;
    this.size = 3;
    this.maxRange = CANNON_RANGE;
    this.distanceTraveled = 0;
    this.ownerPlayerIndex = ownerPlayerIndex;
    this.altitude = 5000;
    this.color = COLORS.BULLET;
  }

  update(dt) {
    const prevX = this.pos.x;
    const prevY = this.pos.y;
    this.updatePosition(dt);
    const dx = this.pos.x - prevX;
    const dy = this.pos.y - prevY;
    this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);

    if (this.distanceTraveled >= this.maxRange) {
      this.kill();
    }
  }
}
