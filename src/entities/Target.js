import { Entity } from './Entity.js';
import { Vec2, cubicBezier, cubicBezierLength } from '../core/Math2D.js';
import { TARGET_TYPES } from '../core/Constants.js';

/**
 * Route types for target movement.
 */
export const ROUTE_TYPES = {
  STRAIGHT: 'straight',
  POLYGON: 'polygon',
  BEZIER: 'bezier'
};

/**
 * Enemy target entity. Follows a predefined route.
 */
export class Target extends Entity {
  /**
   * @param {object} config
   * @param {string} config.targetType - key from TARGET_TYPES
   * @param {object} config.route - route definition
   * @param {number} [config.altitude]
   * @param {object[]} [config.altitudeChanges] - [{t: 0.5, alt: 3000}]
   */
  constructor(config) {
    const typeDef = TARGET_TYPES[config.targetType] || TARGET_TYPES.DRONE;
    const startPos = Target._getStartPosition(config.route);

    super('target', startPos.x, startPos.y);

    this.targetType = config.targetType;
    this.typeDef = typeDef;
    this.speed = typeDef.speed;
    this.health = typeDef.health;
    this.maxHealth = typeDef.health;
    this.damage = typeDef.damage;
    this.size = typeDef.size;
    this.color = typeDef.color;
    this.altitude = config.altitude || typeDef.altitude;
    this.points = typeDef.points;
    this.radarCrossSection = typeDef.radarCrossSection || 1.0;

    // Route
    this.route = config.route;
    this.routeType = config.route.type;
    this.routeProgress = 0; // 0 to 1 for bezier, or waypoint index for polygon
    this.currentWaypoint = 0;
    this.routeComplete = false;

    // Altitude changes along route
    this.altitudeChanges = config.altitudeChanges || [];
    this.baseAltitude = this.altitude;

    // Pre-compute route length for bezier
    if (this.routeType === ROUTE_TYPES.BEZIER && config.route.points) {
      const pts = config.route.points;
      this.routeLength = cubicBezierLength(pts[0], pts[1], pts[2], pts[3]);
    }

    // Detection state (set by RadarSystem)
    /** @type {Map<number, boolean>} playerIndex -> detected */
    this.detectedBy = new Map();
  }

  static _getStartPosition(route) {
    switch (route.type) {
      case ROUTE_TYPES.STRAIGHT:
        return new Vec2(route.start.x, route.start.y);
      case ROUTE_TYPES.POLYGON:
        return new Vec2(route.waypoints[0].x, route.waypoints[0].y);
      case ROUTE_TYPES.BEZIER:
        return new Vec2(route.points[0].x, route.points[0].y);
      default:
        return new Vec2(0, 0);
    }
  }

  /**
   * Update target movement along its route.
   * @param {number} dt
   */
  updateRoute(dt) {
    if (this.routeComplete) return;

    switch (this.routeType) {
      case ROUTE_TYPES.STRAIGHT:
        this._moveStraight(dt);
        break;
      case ROUTE_TYPES.POLYGON:
        this._movePolygon(dt);
        break;
      case ROUTE_TYPES.BEZIER:
        this._moveBezier(dt);
        break;
    }

    // Apply altitude changes
    this._updateAltitude();
  }

  _moveStraight(dt) {
    const end = this.route.end;
    const dx = end.x - this.pos.x;
    const dy = end.y - this.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      this.routeComplete = true;
      return;
    }

    this.heading = Math.atan2(dy, dx);
    this.updatePosition(dt);
  }

  _movePolygon(dt) {
    const waypoints = this.route.waypoints;
    if (this.currentWaypoint >= waypoints.length - 1) {
      if (this.route.loop) {
        this.currentWaypoint = 0;
      } else {
        this.routeComplete = true;
        return;
      }
    }

    const target = waypoints[this.currentWaypoint + 1];
    const dx = target.x - this.pos.x;
    const dy = target.y - this.pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < this.speed * dt + 2) {
      this.currentWaypoint++;
      this.routeProgress = this.currentWaypoint / (waypoints.length - 1);
      return;
    }

    this.heading = Math.atan2(dy, dx);
    this.updatePosition(dt);
    this.routeProgress = this.currentWaypoint / (waypoints.length - 1);
  }

  _moveBezier(dt) {
    const pts = this.route.points;
    const totalLen = this.routeLength || 500;
    const step = (this.speed * dt) / totalLen;
    this.routeProgress += step;

    if (this.routeProgress >= 1) {
      this.routeProgress = 1;
      this.routeComplete = true;
    }

    const newPos = cubicBezier(pts[0], pts[1], pts[2], pts[3], this.routeProgress);
    // Compute heading from movement direction
    const dx = newPos.x - this.pos.x;
    const dy = newPos.y - this.pos.y;
    if (dx !== 0 || dy !== 0) {
      this.heading = Math.atan2(dy, dx);
    }
    this.pos.x = newPos.x;
    this.pos.y = newPos.y;
    this.age += dt;
  }

  _updateAltitude() {
    let targetAlt = this.baseAltitude;

    // Apply scripted altitude changes
    for (const change of this.altitudeChanges) {
      if (this.routeProgress >= change.t) {
        targetAlt = change.alt;
      }
    }

    // Attack dive: in the last 25% of route, descend to attack altitude
    // This ensures all target types can actually hit ground-level defense sites
    if (this.routeProgress > 0.75) {
      const diveProgress = (this.routeProgress - 0.75) / 0.25; // 0 to 1
      const attackAltitude = 200; // low attack altitude
      targetAlt = targetAlt + (attackAltitude - targetAlt) * diveProgress;
    }

    // Smoothly transition altitude (faster rate for responsive diving)
    const diff = targetAlt - this.altitude;
    if (Math.abs(diff) > 10) {
      this.altitude += Math.sign(diff) * Math.min(3000 * 0.016, Math.abs(diff));
    }
  }

  /** Check if target has left the map bounds */
  isOutOfBounds(worldW, worldH, margin = 100) {
    return this.pos.x < -margin || this.pos.x > worldW + margin ||
           this.pos.y < -margin || this.pos.y > worldH + margin;
  }
}
