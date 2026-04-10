import { Vec2 } from '../core/Math2D.js';

/**
 * Base entity class. All game objects extend this.
 */
export class Entity {
  constructor(type, x = 0, y = 0) {
    this.id = null; // assigned by EntityManager
    this.type = type;
    this.pos = new Vec2(x, y);
    this.vel = new Vec2(0, 0);
    this.heading = 0;       // radians, 0 = right/east
    this.speed = 0;         // scalar speed px/s
    this.altitude = 5000;   // meters
    this.size = 10;         // collision radius in px
    this.health = 100;
    this.maxHealth = 100;
    this.dead = false;
    this.age = 0;           // seconds alive
  }

  /** Mark entity for removal */
  kill() {
    this.dead = true;
  }

  /** Apply damage, kill if health depleted */
  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.kill();
    }
  }

  /** Update position based on heading and speed */
  updatePosition(dt) {
    this.vel.x = Math.cos(this.heading) * this.speed;
    this.vel.y = Math.sin(this.heading) * this.speed;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.age += dt;
  }
}
