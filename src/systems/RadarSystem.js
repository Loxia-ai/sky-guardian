import { isInCone } from '../core/Math2D.js';
import { MISSILE_LOCK_TIME } from '../core/Constants.js';

/**
 * Manages radar detection for each player jet.
 * - Targets inside the radar cone are detected
 * - Targets outside vanish from the player's view
 * - Continuous tracking builds lock-on
 * - Altitude difference affects detection (large diff = harder to detect)
 */
export class RadarSystem {
  constructor(game) {
    this.game = game;
  }

  update(dt) {
    const entities = this.game.entities;
    const jets = entities.jets;
    const targets = entities.targets;

    for (const jet of jets) {
      const prevDetected = new Set(jet.detectedTargets);
      jet.detectedTargets.clear();

      for (const target of targets) {
        if (target.dead) continue;

        const detected = this._isDetected(jet, target);

        if (detected) {
          jet.detectedTargets.add(target.id);
          target.detectedBy.set(jet.playerIndex, true);

          // Build tracking time
          const prevTime = jet.trackingTime.get(target.id) || 0;
          jet.trackingTime.set(target.id, prevTime + dt);
        } else {
          target.detectedBy.set(jet.playerIndex, false);
          // Reset tracking time when target leaves radar
          jet.trackingTime.delete(target.id);
        }
      }

      // Update lock-on
      this._updateLock(jet, dt);

      // Clean up tracking for dead/removed targets
      for (const [targetId] of jet.trackingTime) {
        if (!jet.detectedTargets.has(targetId)) {
          jet.trackingTime.delete(targetId);
        }
      }
    }
  }

  /**
   * Check if a target is detected by a jet's radar.
   */
  _isDetected(jet, target) {
    // Altitude difference penalty
    const altDiff = Math.abs(jet.altitude - target.altitude);
    const altPenalty = altDiff / 5000; // 0 at same alt, 1 at 5km diff
    const effectiveRange = jet.radarRange * Math.max(0.3, 1 - altPenalty * 0.5);

    // Radar cross section affects detection range
    const rcs = target.radarCrossSection || 1.0;
    const detectionRange = effectiveRange * Math.sqrt(rcs);

    // Check if target is within radar cone
    return isInCone(
      target.pos,
      jet.pos,
      jet.heading,
      jet.radarHalfAngle,
      detectionRange
    );
  }

  /**
   * Update lock-on state for a jet.
   * Lock is acquired when a target is continuously tracked for MISSILE_LOCK_TIME.
   * Lock is lost when the locked target leaves detection.
   */
  _updateLock(jet) {
    // If we have a lock, check if it's still valid
    if (jet.lockedTarget) {
      if (!jet.detectedTargets.has(jet.lockedTarget)) {
        // Lost detection on locked target
        jet.lockedTarget = null;
      } else {
        // Lock maintained
        return;
      }
    }

    // Try to acquire lock on best tracked target
    let bestTarget = null;
    let bestTime = 0;

    for (const [targetId, time] of jet.trackingTime) {
      if (time >= MISSILE_LOCK_TIME && time > bestTime) {
        bestTarget = targetId;
        bestTime = time;
      }
    }

    if (bestTarget) {
      jet.lockedTarget = bestTarget;
    }
  }
}
