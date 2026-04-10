import { COLORS, WORLD_WIDTH, WORLD_HEIGHT } from '../core/Constants.js';

/**
 * Heads-Up Display: renders player info, radar minimap, ammo, lock status, wave info.
 * Renders in screen-space (no world transform).
 */
export class HUDSystem {
  constructor(game) {
    this.game = game;
  }

  render(ctx) {
    const jets = this.game.entities.jets;

    for (let i = 0; i < jets.length; i++) {
      const jet = jets[i];
      const isP1 = jet.playerIndex === 0;
      const hudX = isP1 ? 15 : this.game.displayWidth - 235;
      const hudY = 15;
      const color = isP1 ? COLORS.HUD_TEXT : COLORS.HUD_TEXT_P2;

      this._drawPlayerHUD(ctx, jet, hudX, hudY, color);
    }

    // Wave info (center top)
    this._drawWaveInfo(ctx);

    // FPS counter
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px "Share Tech Mono", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${this.game.fps} FPS`, this.game.displayWidth - 10, this.game.displayHeight - 10);

    // Defense site status bar (bottom center)
    this._drawDefenseSiteStatus(ctx);
  }

  _drawPlayerHUD(ctx, jet, x, y, color) {
    const w = 220;
    const h = 200;

    // Background panel
    ctx.fillStyle = COLORS.HUD_BG;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 4);
    ctx.fill();
    ctx.stroke();

    // Player label
    ctx.fillStyle = color;
    ctx.font = 'bold 14px "Rajdhani", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`PLAYER ${jet.playerIndex + 1}`, x + 10, y + 20);

    // Speed + throttle
    ctx.font = '11px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`SPD: ${Math.round(jet.speed)}`, x + 10, y + 38);

    // Heading
    const headingDeg = Math.round(((jet.heading * 180 / Math.PI) % 360 + 360) % 360);
    ctx.fillText(`HDG: ${headingDeg}°`, x + 120, y + 38);

    // Throttle bar
    const tPct = jet.throttlePct;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('THR:', x + 10, y + 52);
    // Bar background
    const tBarX = x + 42;
    const tBarW = 88;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(tBarX, y + 44, tBarW, 8);
    // Notch markers
    for (let n = 0; n < jet.throttleNotches.length; n++) {
      const nx = tBarX + jet.throttleNotches[n] * tBarW;
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(nx - 0.5, y + 43, 1, 10);
    }
    // Filled portion
    const tColor = tPct >= 75 ? '#ff9100' : tPct >= 50 ? '#00e5ff' : '#76ff03';
    ctx.fillStyle = tColor;
    ctx.fillRect(tBarX, y + 44, tBarW * (tPct / 100), 8);
    // Percentage label
    ctx.fillStyle = tColor;
    ctx.fillText(`${tPct}%`, x + 135, y + 52);

    // Altitude
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`ALT: ${Math.round(jet.altitude)}m`, x + 10, y + 66);

    // Health bar
    ctx.fillText('HP:', x + 10, y + 82);
    const hpPct = jet.health / jet.maxHealth;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(x + 40, y + 74, 100, 8);
    ctx.fillStyle = hpPct > 0.5 ? '#76ff03' : hpPct > 0.25 ? '#ffab00' : '#ff1744';
    ctx.fillRect(x + 40, y + 74, 100 * hpPct, 8);

    // Ammo
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(`GUN: ${jet.cannonAmmo}/${jet.maxCannonAmmo}`, x + 10, y + 102);
    ctx.fillText(`MSL: ${jet.missileCount}/${jet.maxMissiles}`, x + 120, y + 102);

    // Lock status
    const lockColor = jet.lockedTarget ? COLORS.LOCK_INDICATOR : 'rgba(255,255,255,0.3)';
    ctx.fillStyle = lockColor;
    ctx.font = 'bold 12px "Share Tech Mono", monospace';
    if (jet.lockedTarget) {
      const pulse = Math.sin(this.game.elapsed * 8) > 0;
      ctx.fillText(pulse ? '◆ LOCKED' : '◇ LOCKED', x + 10, y + 122);
    } else {
      // Show best tracking progress
      let bestProgress = 0;
      for (const [, time] of jet.trackingTime) {
        bestProgress = Math.max(bestProgress, time / jet.lockTime);
      }
      if (bestProgress > 0) {
        ctx.fillStyle = COLORS.LOCK_ACQUIRING;
        ctx.fillText(`TRACKING ${Math.round(bestProgress * 100)}%`, x + 10, y + 122);
      } else {
        ctx.fillText('NO LOCK', x + 10, y + 122);
      }
    }

    // Mini radar
    this._drawMiniRadar(ctx, jet, x + 10, y + 132, 90, color);
  }

  _drawMiniRadar(ctx, jet, x, y, size, color) {
    const half = size / 2;
    const cx = x + half;
    const cy = y + half * 0.6;

    // Radar background circle
    ctx.beginPath();
    ctx.arc(cx, cy, half, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 20, 30, 0.8)';
    ctx.fill();
    ctx.strokeStyle = `${color}44`;
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Range rings
    ctx.strokeStyle = `${color}22`;
    ctx.beginPath();
    ctx.arc(cx, cy, half * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot (player)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, 2, 0, Math.PI * 2);
    ctx.fill();

    // Heading line
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(jet.heading) * half * 0.4,
      cy + Math.sin(jet.heading) * half * 0.4
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Detected targets as blips
    const radarScale = half / jet.radarRange;
    for (const targetId of jet.detectedTargets) {
      const target = this.game.entities.get(targetId);
      if (!target) continue;

      const dx = (target.pos.x - jet.pos.x) * radarScale;
      const dy = (target.pos.y - jet.pos.y) * radarScale;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > half) continue;

      const isLocked = jet.lockedTarget === targetId;
      ctx.fillStyle = isLocked ? COLORS.LOCK_INDICATOR : COLORS.RADAR_BLIP;
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, isLocked ? 3 : 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawWaveInfo(ctx) {
    const wave = this.game.systems.wave;
    if (!wave.levelConfig) return;

    const cx = this.game.displayWidth / 2;

    ctx.fillStyle = COLORS.HUD_BG;
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(cx - 100, 10, 200, 35, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 13px "Rajdhani", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`WAVE ${wave.currentWaveNumber} / ${wave.totalWaves}`, cx, 25);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '10px "Share Tech Mono", monospace';
    const targetsAlive = this.game.entities.targets.length;
    ctx.fillText(`HOSTILES: ${targetsAlive}`, cx, 39);

    // Score
    ctx.fillStyle = '#76ff03';
    ctx.font = 'bold 12px "Share Tech Mono", monospace';
    ctx.textAlign = 'center';
    const totalScore = this.game.score[0] + this.game.score[1];
    ctx.fillText(`SCORE: ${totalScore}`, cx, 58);
  }

  _drawDefenseSiteStatus(ctx) {
    const sites = this.game.entities.defenseSites;
    if (sites.length === 0) return;

    const totalW = sites.length * 120;
    const startX = (this.game.displayWidth - totalW) / 2;
    const y = this.game.displayHeight - 40;

    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      const x = startX + i * 120;

      ctx.fillStyle = COLORS.HUD_BG;
      ctx.strokeStyle = site.dead ? 'rgba(255,23,68,0.5)' : 'rgba(255,215,64,0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, 110, 28, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = site.dead ? '#ff1744' : '#ffd740';
      ctx.font = '10px "Share Tech Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(site.name, x + 6, y + 12);

      if (!site.dead) {
        const pct = site.health / site.maxHealth;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(x + 6, y + 16, 98, 5);
        ctx.fillStyle = pct > 0.5 ? '#76ff03' : pct > 0.25 ? '#ffab00' : '#ff1744';
        ctx.fillRect(x + 6, y + 16, 98 * pct, 5);
      } else {
        ctx.fillStyle = '#ff1744';
        ctx.fillText('DESTROYED', x + 6, y + 23);
      }
    }
  }
}
