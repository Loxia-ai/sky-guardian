/**
 * 2D Vector and math utilities for the game engine.
 */
export class Vec2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  clone() { return new Vec2(this.x, this.y); }
  set(x, y) { this.x = x; this.y = y; return this; }
  copy(v) { this.x = v.x; this.y = v.y; return this; }

  add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
  sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
  scale(s) { return new Vec2(this.x * s, this.y * s); }
  
  addMut(v) { this.x += v.x; this.y += v.y; return this; }
  subMut(v) { this.x -= v.x; this.y -= v.y; return this; }
  scaleMut(s) { this.x *= s; this.y *= s; return this; }

  dot(v) { return this.x * v.x + this.y * v.y; }
  cross(v) { return this.x * v.y - this.y * v.x; }

  length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  lengthSq() { return this.x * this.x + this.y * this.y; }

  normalize() {
    const len = this.length();
    if (len === 0) return new Vec2(0, 0);
    return new Vec2(this.x / len, this.y / len);
  }

  normalizeMut() {
    const len = this.length();
    if (len > 0) { this.x /= len; this.y /= len; }
    return this;
  }

  distanceTo(v) { return this.sub(v).length(); }
  distanceSqTo(v) { return this.sub(v).lengthSq(); }

  angle() { return Math.atan2(this.y, this.x); }
  angleTo(v) { return Math.atan2(v.y - this.y, v.x - this.x); }

  rotate(angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Vec2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  lerp(v, t) {
    return new Vec2(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t
    );
  }

  static fromAngle(angle, length = 1) {
    return new Vec2(Math.cos(angle) * length, Math.sin(angle) * length);
  }
}

/** Normalize angle to [-PI, PI] */
export function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

/** Shortest signed angle difference from a to b */
export function angleDiff(a, b) {
  return normalizeAngle(b - a);
}

/** Linear interpolation */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Clamp value between min and max */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/** Random float in range [min, max) */
export function randRange(min, max) {
  return min + Math.random() * (max - min);
}

/** Random integer in range [min, max] inclusive */
export function randInt(min, max) {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/** Check if point is inside a cone/sector defined by origin, direction angle, and half-angle */
export function isInCone(point, origin, dirAngle, halfAngle, maxRange) {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const distSq = dx * dx + dy * dy;
  if (distSq > maxRange * maxRange) return false;
  const angleToPoint = Math.atan2(dy, dx);
  const diff = Math.abs(normalizeAngle(angleToPoint - dirAngle));
  return diff <= halfAngle;
}

/**
 * Evaluate a quadratic Bezier curve at parameter t.
 * @param {Vec2} p0 - Start point
 * @param {Vec2} p1 - Control point
 * @param {Vec2} p2 - End point
 * @param {number} t - Parameter [0, 1]
 * @returns {Vec2}
 */
export function quadBezier(p0, p1, p2, t) {
  const mt = 1 - t;
  return new Vec2(
    mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y
  );
}

/**
 * Evaluate a cubic Bezier curve at parameter t.
 * @param {Vec2} p0 - Start point
 * @param {Vec2} p1 - Control point 1
 * @param {Vec2} p2 - Control point 2
 * @param {Vec2} p3 - End point
 * @param {number} t - Parameter [0, 1]
 * @returns {Vec2}
 */
export function cubicBezier(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return new Vec2(
    mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x,
    mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y
  );
}

/**
 * Approximate length of a cubic bezier by sampling.
 */
export function cubicBezierLength(p0, p1, p2, p3, samples = 20) {
  let length = 0;
  let prev = p0;
  for (let i = 1; i <= samples; i++) {
    const pt = cubicBezier(p0, p1, p2, p3, i / samples);
    length += prev.distanceTo(pt);
    prev = pt;
  }
  return length;
}

/** DEG <-> RAD helpers */
export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;
