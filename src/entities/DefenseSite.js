import { Entity } from './Entity.js';
import { DEFENSE_SITE_HEALTH, DEFENSE_SITE_RADIUS, COLORS } from '../core/Constants.js';

/**
 * Defense site that players must protect.
 */
export class DefenseSite extends Entity {
  /**
   * @param {number} x
   * @param {number} y
   * @param {string} name - display name
   */
  constructor(x, y, name = 'Base') {
    super('defenseSite', x, y);
    this.name = name;
    this.health = DEFENSE_SITE_HEALTH;
    this.maxHealth = DEFENSE_SITE_HEALTH;
    this.size = DEFENSE_SITE_RADIUS;
    this.color = COLORS.DEFENSE_SITE;
    this.altitude = 0; // ground level
    this.damageFlash = 0; // visual feedback timer
  }

  takeDamage(amount) {
    super.takeDamage(amount);
    this.damageFlash = 0.3; // flash for 0.3s
  }

  update(dt) {
    if (this.damageFlash > 0) {
      this.damageFlash -= dt;
    }
  }
}
