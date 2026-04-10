import { Entity } from './Entity.js';
import {
  JET_SPEED_DEFAULT, JET_SPEED_MIN, JET_SPEED_MAX,
  JET_TURN_RATE, JET_ALTITUDE_DEFAULT, JET_ALTITUDE_MIN,
  JET_ALTITUDE_MAX, JET_ALTITUDE_RATE, JET_HEALTH,
  CANNON_AMMO, CANNON_FIRE_RATE, MISSILE_COUNT,
  RADAR_RANGE, RADAR_HALF_ANGLE, MISSILE_LOCK_TIME,
  THROTTLE_NOTCHES, THROTTLE_DEFAULT_INDEX,
  COLORS
} from '../core/Constants.js';

/**
 * Player-controlled fighter jet entity.
 */
export class FighterJet extends Entity {
  /**
   * @param {number} playerIndex - 0 or 1
   * @param {number} x
   * @param {number} y
   */
  constructor(playerIndex, x, y) {
    super('jet', x, y);
    this.playerIndex = playerIndex;
    this.speed = JET_SPEED_DEFAULT;
    this.altitude = JET_ALTITUDE_DEFAULT;
    this.heading = -Math.PI / 2; // facing up
    this.health = JET_HEALTH;
    this.maxHealth = JET_HEALTH;
    this.size = 18;

    // Flight
    this.turnRate = JET_TURN_RATE;
    this.minSpeed = JET_SPEED_MIN;
    this.maxSpeed = JET_SPEED_MAX;
    this.targetAltitude = this.altitude;

    // Throttle notch system
    this.throttleIndex = THROTTLE_DEFAULT_INDEX;
    this.throttleNotches = THROTTLE_NOTCHES;
    this.targetSpeed = this._speedForNotch(this.throttleIndex);

    // Weapons
    this.cannonAmmo = CANNON_AMMO;
    this.maxCannonAmmo = CANNON_AMMO;
    this.cannonCooldown = 0;
    this.cannonFireRate = CANNON_FIRE_RATE;

    this.missileCount = MISSILE_COUNT;
    this.maxMissiles = MISSILE_COUNT;
    this.missileCooldown = 0;

    // Radar
    this.radarRange = RADAR_RANGE;
    this.radarHalfAngle = RADAR_HALF_ANGLE;
    /** @type {Set<string>} IDs of currently detected targets */
    this.detectedTargets = new Set();
    /** @type {Map<string, number>} target ID -> continuous tracking time */
    this.trackingTime = new Map();
    /** @type {string|null} ID of locked-on target */
    this.lockedTarget = null;
    this.lockTime = MISSILE_LOCK_TIME;

    // Visual
    this.color = playerIndex === 0 ? COLORS.FRIENDLY : COLORS.FRIENDLY_P2;
    this.trailPositions = []; // for contrail
  }

  /**
   * Apply player input to the jet.
   * @param {{ turn: number, thrust: number, fire: boolean, missile: boolean, altChange: number }} input
   * @param {number} dt
   */
  applyInput(input, dt) {
    // Turn
    this.heading += input.turn * this.turnRate * dt;

    // Throttle notch change (discrete steps via tap)
    if (input.throttleUp) {
      this.throttleIndex = Math.min(this.throttleIndex + 1, this.throttleNotches.length - 1);
      this.targetSpeed = this._speedForNotch(this.throttleIndex);
    }
    if (input.throttleDown) {
      this.throttleIndex = Math.max(this.throttleIndex - 1, 0);
      this.targetSpeed = this._speedForNotch(this.throttleIndex);
    }

    // Smoothly ramp actual speed toward target speed
    const speedDiff = this.targetSpeed - this.speed;
    if (Math.abs(speedDiff) > 1) {
      this.speed += Math.sign(speedDiff) * Math.min(150 * dt, Math.abs(speedDiff));
    } else {
      this.speed = this.targetSpeed;
    }

    // Altitude
    if (input.altChange !== 0) {
      this.targetAltitude += input.altChange * JET_ALTITUDE_RATE * dt;
      this.targetAltitude = Math.max(JET_ALTITUDE_MIN, Math.min(JET_ALTITUDE_MAX, this.targetAltitude));
    }

    // Smoothly adjust altitude toward target
    const altDiff = this.targetAltitude - this.altitude;
    if (Math.abs(altDiff) > 10) {
      this.altitude += Math.sign(altDiff) * Math.min(JET_ALTITUDE_RATE * dt, Math.abs(altDiff));
    }

    // Cooldowns
    this.cannonCooldown = Math.max(0, this.cannonCooldown - dt);
    this.missileCooldown = Math.max(0, this.missileCooldown - dt);
  }

  /** Check if cannon can fire */
  canFireCannon() {
    return this.cannonAmmo > 0 && this.cannonCooldown <= 0;
  }

  /** Consume a cannon round */
  fireCannon() {
    if (!this.canFireCannon()) return false;
    this.cannonAmmo--;
    this.cannonCooldown = 1 / this.cannonFireRate;
    return true;
  }

  /** Check if a missile can be launched */
  canFireMissile() {
    return this.missileCount > 0 && this.missileCooldown <= 0 && this.lockedTarget !== null;
  }

  /** Consume a missile */
  fireMissile() {
    if (!this.canFireMissile()) return false;
    this.missileCount--;
    this.missileCooldown = 1.5; // 1.5s between missile launches
    return true;
  }

  /** Convert a throttle-notch index to a speed value */
  _speedForNotch(index) {
    const frac = this.throttleNotches[index]; // 0 … 1
    return this.minSpeed + frac * (this.maxSpeed - this.minSpeed);
  }

  /** Current throttle as a 0-100 percentage */
  get throttlePct() {
    return Math.round(this.throttleNotches[this.throttleIndex] * 100);
  }

  /** Store trail position for contrail effect */
  updateTrail() {
    this.trailPositions.push({ x: this.pos.x, y: this.pos.y });
    if (this.trailPositions.length > 40) {
      this.trailPositions.shift();
    }
  }
}
