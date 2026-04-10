import { Entity } from './Entity.js';
import { COLORS } from '../core/Constants.js';

/**
 * Visual explosion effect.
 */
export class Explosion extends Entity {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} maxRadius
   * @param {number} duration
   */
  constructor(x, y, maxRadius = 30, duration = 0.6) {
    super('explosion', x, y);
    this.maxRadius = maxRadius;
    this.duration = duration;
    this.elapsed = 0;
    this.progress = 0; // 0 to 1
    this.colors = COLORS.EXPLOSION;
    this.particles = [];

    // Generate particles
    const count = Math.floor(8 + maxRadius / 3);
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = 30 + Math.random() * maxRadius * 2;
      const life = 0.3 + Math.random() * duration * 0.7;
      this.particles.push({
        x: 0, y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: 2 + Math.random() * 3
      });
    }
  }

  update(dt) {
    this.elapsed += dt;
    this.progress = this.elapsed / this.duration;

    if (this.progress >= 1) {
      this.kill();
      return;
    }

    // Update particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
    }
  }
}
