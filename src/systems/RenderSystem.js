import { WORLD_WIDTH, WORLD_HEIGHT, COLORS, RADAR_RANGE } from '../core/Constants.js';
import { Vec2 } from '../core/Math2D.js';

/**
 * Renders all game entities and effects on the canvas.
 * Draws in world-space (the Game applies the world transform before calling render).
 */
export class RenderSystem {
  constructor(game) {
    this.game = game;
    this.gridSpacing = 100;
  }

  render(ctx) {
    this._drawBackground(ctx);
    this._drawGrid(ctx);
    this._drawDefenseSites(ctx);
    this._drawRadarCones(ctx);
    this._drawTargets(ctx);
    this._drawBullets(ctx);
    this._drawMissiles(ctx);
    this._drawJets(ctx);
    this._drawExplosions(ctx);
  }

  _drawBackground(ctx) {
    // Dark terrain background
    ctx.fillStyle = COLORS.MAP_BG;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Subtle terrain noise via gradient patches
    const grd = ctx.createRadialGradient(WORLD_WIDTH * 0.3, WORLD_HEIGHT * 0.4, 50, WORLD_WIDTH * 0.3, WORLD_HEIGHT * 0.4, 400);
    grd.addColorStop(0, 'rgba(20, 40, 30, 0.3)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    const grd2 = ctx.createRadialGradient(WORLD_WIDTH * 0.7, WORLD_HEIGHT * 0.6, 30, WORLD_WIDTH * 0.7, WORLD_HEIGHT * 0.6, 350);
    grd2.addColorStop(0, 'rgba(15, 25, 40, 0.4)');
    grd2.addColorStop(1, 'transparent');
    ctx.fillStyle = grd2;
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  _drawGrid(ctx) {
    ctx.strokeStyle = COLORS.MAP_GRID;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= WORLD_WIDTH; x += this.gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WORLD_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= WORLD_HEIGHT; y += this.gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WORLD_WIDTH, y);
      ctx.stroke();
    }
  }

  _drawDefenseSites(ctx) {
    for (const site of this.game.entities.defenseSites) {
      const flash = site.damageFlash > 0;
      
      // Outer ring
      ctx.beginPath();
      ctx.arc(site.pos.x, site.pos.y, site.size + 8, 0, Math.PI * 2);
      ctx.strokeStyle = flash ? '#ff5252' : 'rgba(255, 215, 64, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Inner filled circle
      ctx.beginPath();
      ctx.arc(site.pos.x, site.pos.y, site.size, 0, Math.PI * 2);
      const alpha = flash ? 0.5 : 0.2;
      ctx.fillStyle = flash ? `rgba(255, 82, 82, ${alpha})` : `rgba(255, 215, 64, ${alpha})`;
      ctx.fill();
      ctx.strokeStyle = flash ? '#ff5252' : site.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Icon - simple building shape
      ctx.fillStyle = site.color;
      const bx = site.pos.x;
      const by = site.pos.y;
      ctx.fillRect(bx - 6, by - 10, 12, 16);
      ctx.fillRect(bx - 10, by - 4, 20, 10);
      // Roof triangle
      ctx.beginPath();
      ctx.moveTo(bx - 8, by - 10);
      ctx.lineTo(bx, by - 18);
      ctx.lineTo(bx + 8, by - 10);
      ctx.fill();

      // Health bar
      const hpPct = site.health / site.maxHealth;
      const barW = 40;
      const barH = 4;
      const barX = site.pos.x - barW / 2;
      const barY = site.pos.y + site.size + 12;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = hpPct > 0.5 ? '#76ff03' : hpPct > 0.25 ? '#ffab00' : '#ff1744';
      ctx.fillRect(barX, barY, barW * hpPct, barH);

      // Name label
      ctx.fillStyle = 'rgba(255,215,64,0.7)';
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(site.name, site.pos.x, barY + 14);
    }
  }

  _drawRadarCones(ctx) {
    for (const jet of this.game.entities.jets) {
      const range = jet.radarRange;
      const startAngle = jet.heading - jet.radarHalfAngle;
      const endAngle = jet.heading + jet.radarHalfAngle;

      // Filled cone
      ctx.beginPath();
      ctx.moveTo(jet.pos.x, jet.pos.y);
      ctx.arc(jet.pos.x, jet.pos.y, range, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS.RADAR_CONE;
      ctx.fill();

      // Edge lines
      ctx.beginPath();
      ctx.moveTo(jet.pos.x, jet.pos.y);
      ctx.lineTo(
        jet.pos.x + Math.cos(startAngle) * range,
        jet.pos.y + Math.sin(startAngle) * range
      );
      ctx.moveTo(jet.pos.x, jet.pos.y);
      ctx.lineTo(
        jet.pos.x + Math.cos(endAngle) * range,
        jet.pos.y + Math.sin(endAngle) * range
      );
      ctx.strokeStyle = COLORS.RADAR_EDGE;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Radar arc
      ctx.beginPath();
      ctx.arc(jet.pos.x, jet.pos.y, range, startAngle, endAngle);
      ctx.strokeStyle = COLORS.RADAR_EDGE;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Sweep line animation
      const sweepAngle = jet.heading + Math.sin(this.game.elapsed * 3) * jet.radarHalfAngle * 0.8;
      ctx.beginPath();
      ctx.moveTo(jet.pos.x, jet.pos.y);
      ctx.lineTo(
        jet.pos.x + Math.cos(sweepAngle) * range,
        jet.pos.y + Math.sin(sweepAngle) * range
      );
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  _drawTargets(ctx) {
    const jets = this.game.entities.jets;

    for (const target of this.game.entities.targets) {
      // Only draw if detected by at least one player
      let detected = false;
      for (const jet of jets) {
        if (jet.detectedTargets.has(target.id)) {
          detected = true;
          break;
        }
      }

      if (!detected) continue;

      // Draw target
      ctx.save();
      ctx.translate(target.pos.x, target.pos.y);
      ctx.rotate(target.heading);

      // Body shape varies by type
      ctx.fillStyle = target.color;
      ctx.strokeStyle = target.color;
      ctx.lineWidth = 1.5;

      const s = target.size;
      if (target.targetType === 'CRUISE_MISSILE') {
        // Slim elongated shape
        ctx.beginPath();
        ctx.moveTo(s, 0);
        ctx.lineTo(-s * 0.6, -s * 0.25);
        ctx.lineTo(-s * 0.8, 0);
        ctx.lineTo(-s * 0.6, s * 0.25);
        ctx.closePath();
        ctx.fill();
      } else if (target.targetType === 'BOMBER') {
        // Wide body
        ctx.beginPath();
        ctx.moveTo(s, 0);
        ctx.lineTo(-s * 0.3, -s * 0.7);
        ctx.lineTo(-s * 0.8, -s * 0.5);
        ctx.lineTo(-s, 0);
        ctx.lineTo(-s * 0.8, s * 0.5);
        ctx.lineTo(-s * 0.3, s * 0.7);
        ctx.closePath();
        ctx.fill();
      } else {
        // Default triangle fighter shape
        ctx.beginPath();
        ctx.moveTo(s, 0);
        ctx.lineTo(-s * 0.6, -s * 0.5);
        ctx.lineTo(-s * 0.3, 0);
        ctx.lineTo(-s * 0.6, s * 0.5);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // Lock indicator
      for (const jet of jets) {
        if (jet.lockedTarget === target.id) {
          this._drawLockIndicator(ctx, target, jet);
        } else if (jet.trackingTime.has(target.id)) {
          const progress = (jet.trackingTime.get(target.id) || 0) / jet.lockTime;
          if (progress > 0) {
            this._drawTrackingIndicator(ctx, target, progress, jet);
          }
        }
      }

      // Altitude indicator (small text)
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '8px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(target.altitude / 100) * 100}m`, target.pos.x, target.pos.y + target.size + 10);
    }
  }

  _drawLockIndicator(ctx, target, jet) {
    const size = target.size + 8;
    const pulse = 1 + Math.sin(this.game.elapsed * 10) * 0.15;
    const s = size * pulse;

    ctx.strokeStyle = COLORS.LOCK_INDICATOR;
    ctx.lineWidth = 2;

    // Corner brackets
    const c = s;
    const l = s * 0.4;
    const x = target.pos.x;
    const y = target.pos.y;

    ctx.beginPath();
    // Top-left
    ctx.moveTo(x - c, y - c + l); ctx.lineTo(x - c, y - c); ctx.lineTo(x - c + l, y - c);
    // Top-right
    ctx.moveTo(x + c - l, y - c); ctx.lineTo(x + c, y - c); ctx.lineTo(x + c, y - c + l);
    // Bottom-right
    ctx.moveTo(x + c, y + c - l); ctx.lineTo(x + c, y + c); ctx.lineTo(x + c - l, y + c);
    // Bottom-left
    ctx.moveTo(x - c + l, y + c); ctx.lineTo(x - c, y + c); ctx.lineTo(x - c, y + c - l);
    ctx.stroke();

    // LOCK text
    ctx.fillStyle = COLORS.LOCK_INDICATOR;
    ctx.font = 'bold 9px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LOCK', x, y - size - 6);
  }

  _drawTrackingIndicator(ctx, target, progress, jet) {
    const size = target.size + 6;
    ctx.strokeStyle = COLORS.LOCK_ACQUIRING;
    ctx.lineWidth = 1.5;

    // Partial circle showing lock progress
    ctx.beginPath();
    ctx.arc(target.pos.x, target.pos.y, size, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
    ctx.stroke();
  }

  _drawBullets(ctx) {
    for (const bullet of this.game.entities.bullets) {
      ctx.fillStyle = bullet.color;
      ctx.beginPath();
      ctx.arc(bullet.pos.x, bullet.pos.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawMissiles(ctx) {
    for (const missile of this.game.entities.missiles) {
      // Trail
      if (missile.trailPositions.length > 1) {
        ctx.beginPath();
        ctx.moveTo(missile.trailPositions[0].x, missile.trailPositions[0].y);
        for (let i = 1; i < missile.trailPositions.length; i++) {
          ctx.lineTo(missile.trailPositions[i].x, missile.trailPositions[i].y);
        }
        ctx.strokeStyle = COLORS.MISSILE_TRAIL;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Missile body
      ctx.save();
      ctx.translate(missile.pos.x, missile.pos.y);
      ctx.rotate(missile.heading);

      ctx.fillStyle = '#ffab00';
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-4, -3);
      ctx.lineTo(-4, 3);
      ctx.closePath();
      ctx.fill();

      // Engine glow
      ctx.fillStyle = 'rgba(255, 100, 0, 0.8)';
      ctx.beginPath();
      ctx.arc(-5, 0, 2 + Math.random(), 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Seeker range indicator when active
      if (missile.seekerActive) {
        ctx.beginPath();
        ctx.arc(missile.pos.x, missile.pos.y, missile.seekerRange, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 171, 0, 0.2)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  _drawJets(ctx) {
    for (const jet of this.game.entities.jets) {
      // Contrail
      if (jet.trailPositions.length > 1) {
        for (let i = 1; i < jet.trailPositions.length; i++) {
          const alpha = (i / jet.trailPositions.length) * 0.3;
          ctx.beginPath();
          ctx.moveTo(jet.trailPositions[i - 1].x, jet.trailPositions[i - 1].y);
          ctx.lineTo(jet.trailPositions[i].x, jet.trailPositions[i].y);
          ctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // Jet body
      ctx.save();
      ctx.translate(jet.pos.x, jet.pos.y);
      ctx.rotate(jet.heading);

      const s = jet.size;

      // Wings
      ctx.fillStyle = jet.color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-s * 0.5, -s * 0.8);
      ctx.lineTo(-s * 0.3, 0);
      ctx.lineTo(-s * 0.5, s * 0.8);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Fuselage
      ctx.fillStyle = jet.color;
      ctx.beginPath();
      ctx.moveTo(s, 0);
      ctx.lineTo(-s * 0.2, -s * 0.3);
      ctx.lineTo(-s * 0.7, -s * 0.15);
      ctx.lineTo(-s * 0.8, 0);
      ctx.lineTo(-s * 0.7, s * 0.15);
      ctx.lineTo(-s * 0.2, s * 0.3);
      ctx.closePath();
      ctx.fill();

      // Canopy
      ctx.fillStyle = 'rgba(100, 200, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(s * 0.2, 0, s * 0.25, s * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Engine glow
      ctx.fillStyle = `rgba(100, 180, 255, ${0.4 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(-s * 0.85, 0, 3 + (jet.speed / jet.maxSpeed) * 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Player label
      ctx.fillStyle = jet.color;
      ctx.font = 'bold 10px "Share Tech Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`P${jet.playerIndex + 1}`, jet.pos.x, jet.pos.y - jet.size - 8);
    }
  }

  _drawExplosions(ctx) {
    for (const exp of this.game.entities.explosions) {
      const progress = exp.progress;

      // Main flash
      if (progress < 0.3) {
        const flashAlpha = 1 - progress / 0.3;
        const flashRadius = exp.maxRadius * 0.5 * (progress / 0.3);
        ctx.beginPath();
        ctx.arc(exp.pos.x, exp.pos.y, flashRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.8})`;
        ctx.fill();
      }

      // Ring
      const ringRadius = exp.maxRadius * progress;
      const ringAlpha = 1 - progress;
      ctx.beginPath();
      ctx.arc(exp.pos.x, exp.pos.y, ringRadius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 171, 0, ${ringAlpha * 0.6})`;
      ctx.lineWidth = 3 * (1 - progress);
      ctx.stroke();

      // Particles
      for (const p of exp.particles) {
        if (p.life <= 0) continue;
        const pAlpha = p.life / p.maxLife;
        const colorIdx = Math.floor((1 - pAlpha) * (exp.colors.length - 1));
        ctx.fillStyle = exp.colors[colorIdx];
        ctx.globalAlpha = pAlpha;
        ctx.beginPath();
        ctx.arc(exp.pos.x + p.x, exp.pos.y + p.y, p.size * pAlpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
}
