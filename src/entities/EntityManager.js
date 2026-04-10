/**
 * Central registry for all game entities.
 * Provides typed access and cleanup of dead entities.
 */
export class EntityManager {
  constructor() {
    /** @type {Map<string, import('./Entity.js').Entity>} */
    this.all = new Map();
    this._nextId = 1;
  }

  /** Generate a unique entity ID */
  generateId(prefix = 'e') {
    return `${prefix}_${this._nextId++}`;
  }

  /** Add an entity */
  add(entity) {
    if (!entity.id) entity.id = this.generateId(entity.type || 'e');
    this.all.set(entity.id, entity);
    return entity;
  }

  /** Remove an entity by ID */
  remove(id) {
    this.all.delete(id);
  }

  /** Get entity by ID */
  get(id) {
    return this.all.get(id);
  }

  /** Get all entities of a given type */
  getByType(type) {
    const result = [];
    for (const entity of this.all.values()) {
      if (entity.type === type) result.push(entity);
    }
    return result;
  }

  /** Convenience getters */
  get jets() { return this.getByType('jet'); }
  get targets() { return this.getByType('target'); }
  get missiles() { return this.getByType('missile'); }
  get bullets() { return this.getByType('bullet'); }
  get defenseSites() { return this.getByType('defenseSite'); }
  get explosions() { return this.getByType('explosion'); }

  /** Remove all entities marked as dead */
  cleanup() {
    for (const [id, entity] of this.all) {
      if (entity.dead) {
        this.all.delete(id);
      }
    }
  }

  /** Remove all entities */
  clear() {
    this.all.clear();
    this._nextId = 1;
  }

  /** Total entity count */
  get count() {
    return this.all.size;
  }
}
