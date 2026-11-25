// Kuali Rush: everything the player sees, drawn on one canvas. One file, one job: the kitchen,
// the counters, the food, the chef, the tickets and the screens. It changes no state; it reads the
// world and paints it, so the same state always paints the same frame.

import { BOARD, COLORS, COUNTERS, DISH_ITEMS, INGREDIENTS, RECIPES, VIEW } from './config.js';
import { binRect, counterAt, counterFront, matchOrder, nearestCounter } from './world.js';

/** A rounded rectangle path, for counters, cards and buttons. */
function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** A soft shadow under a counter or a card. */
function shadow(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  roundRect(ctx, x + 4, y + 6, w, h, 12);
  ctx.fill();
}

/** One ingredient or finished item, drawn as a small icon centred on (x, y). */
export function drawFood(ctx, kind, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === 'rice' || kind === 'rice-cooked') {
    ctx.fillStyle = '#e8ddc0';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.55, r * 0.95, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f7f3e8';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.25, r * 0.8, r * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d8cfb4';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(-r * 0.45 + i * r * 0.22, r * 0.1 + (i % 2) * r * 0.2, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'noodle' || kind === 'noodle-cooked') {
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 0.4 + i * r * 0.4);
      ctx.bezierCurveTo(-r * 0.3, -r * 0.7 + i * r * 0.4, r * 0.3, -r * 0.1 + i * r * 0.4, r * 0.7, -r * 0.4 + i * r * 0.4);
      ctx.stroke();
    }
    ctx.strokeStyle = '#c99a2e';
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, r * 0.5);
    ctx.lineTo(r * 0.6, r * 0.5);
    ctx.stroke();
  } else if (kind === 'chicken') {
    ctx.fillStyle = '#f2a594';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.1, r * 0.75, r * 0.6, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fdf6d8';
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(r * 0.45, -r * 0.35);
    ctx.lineTo(r * 0.85, -r * 0.75);
    ctx.stroke();
    ctx.fillStyle = '#fdf6d8';
    ctx.beginPath();
    ctx.arc(r * 0.9, -r * 0.8, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'chicken-chopped') {
    ctx.fillStyle = '#e8b48a';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-r * 0.4 + i * r * 0.4, (i % 2) * r * 0.3 - r * 0.1, r * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#b57e52';
    ctx.beginPath();
    ctx.arc(-r * 0.2, r * 0.15, r * 0.12, 0, Math.PI * 2);
    ctx.arc(r * 0.3, -r * 0.2, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'chicken-grilled') {
    ctx.strokeStyle = '#d9b96a';
    ctx.lineWidth = r * 0.16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * 0.85, 0);
    ctx.lineTo(r * 0.85, 0);
    ctx.stroke();
    ctx.fillStyle = '#a8642f';
    for (let i = -1; i <= 1; i++) {
      roundRect(ctx, i * r * 0.5 - r * 0.22, -r * 0.32, r * 0.44, r * 0.64, r * 0.12);
      ctx.fill();
    }
    ctx.fillStyle = '#6e3d1c';
    ctx.beginPath();
    ctx.arc(-r * 0.5, 0, r * 0.08, 0, Math.PI * 2);
    ctx.arc(r * 0.5, 0, r * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'egg' || kind === 'egg-fried') {
    ctx.fillStyle = '#fdf6d8';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.85, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5a623';
    ctx.beginPath();
    ctx.arc(r * 0.1, r * 0.05, r * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd977';
    ctx.beginPath();
    ctx.arc(r * 0.02, -r * 0.03, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'veg' || kind === 'veg-chopped') {
    ctx.fillStyle = '#4f9a55';
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, r * 0.1, r * 0.5, r * 0.35, -0.5, 0, Math.PI * 2);
    ctx.ellipse(r * 0.3, -r * 0.1, r * 0.5, r * 0.35, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7dc383';
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.2, r * 0.45, r * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#4f9a55';
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.45);
    ctx.lineTo(0, r * 0.1);
    ctx.stroke();
  } else if (kind === 'sauce') {
    ctx.fillStyle = '#8b4513';
    roundRect(ctx, -r * 0.3, -r * 0.5, r * 0.6, r * 1.1, r * 0.15);
    ctx.fill();
    ctx.fillStyle = '#b5651d';
    roundRect(ctx, -r * 0.22, -r * 0.2, r * 0.44, r * 0.5, r * 0.1);
    ctx.fill();
    ctx.fillStyle = '#e8d5a8';
    roundRect(ctx, -r * 0.14, -r * 0.85, r * 0.28, r * 0.4, r * 0.08);
    ctx.fill();
  }
  ctx.restore();
}

/** The tiled floor and the warm wall behind the counters. */
function drawRoom(ctx) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW.width, 208);
  ctx.fillStyle = COLORS.wallTrim;
  ctx.fillRect(0, 196, VIEW.width, 12);
  ctx.fillStyle = '#93603a';
  for (let x = 40; x < VIEW.width; x += 120) {
    ctx.fillRect(x, 24, 64, 10);
    ctx.fillRect(x, 120, 64, 10);
  }
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 208, VIEW.width, VIEW.height - 208);
  const tile = 64;
  for (let y = 208; y < VIEW.height; y += tile) {
    for (let x = 0; x < VIEW.width; x += tile) {
      if (((x / tile + y / tile) | 0) % 2 === 0) {
        ctx.fillStyle = COLORS.floorTile;
        ctx.fillRect(x, y, tile, tile);
      }
    }
  }
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  for (let x = 0; x < VIEW.width; x += tile) ctx.fillRect(x, 208, 2, VIEW.height - 208);
  for (let y = 208; y < VIEW.height; y += tile) ctx.fillRect(0, y, VIEW.width, 2);
  ctx.fillStyle = '#a34d2d';
  roundRect(ctx, 520, 620, 240, 120, 16);
  ctx.fill();
  ctx.fillStyle = '#c96a3f';
  roundRect(ctx, 532, 632, 216, 96, 12);
  ctx.fill();
}

/** One counter block: wooden body, steel top, label, and a glow when it is in reach. */
function drawCounterShell(ctx, id, world, input) {
  const c = COUNTERS[id];
  const near = nearestCounter(world) === id;
  const hover = input !== null && counterAt(input.mouse.x, input.mouse.y) === id;
  shadow(ctx, c.x, c.y, c.w, c.h);
  ctx.fillStyle = COLORS.counterFront;
  roundRect(ctx, c.x, c.y, c.w, c.h, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  roundRect(ctx, c.x, c.y, c.w, 34, 12);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  ctx.fillRect(c.x, c.y + 18, c.w, 16);
  if (near || hover) {
    ctx.strokeStyle = near ? '#ffd977' : 'rgba(255,217,119,0.45)';
    ctx.lineWidth = near ? 4 : 2;
    roundRect(ctx, c.x - 3, c.y - 3, c.w + 6, c.h + 6, 14);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffe9c4';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(c.label, c.x + c.w / 2, c.y + c.h - 18);
  if (near) {
    ctx.fillStyle = '#2b1a12';
    roundRect(ctx, c.x + c.w / 2 - 16, c.y - 26, 32, 24, 8);
    ctx.fill();
    ctx.fillStyle = '#ffd977';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('E', c.x + c.w / 2, c.y - 13);
  }
}

/** The six ingredient bins, each with its food icon and name. */
function drawBins(ctx) {
  for (const kind of Object.keys(INGREDIENTS)) {
    const r = binRect(kind);
    ctx.fillStyle = COLORS.board;
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = COLORS.boardDark;
    ctx.lineWidth = 2;
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.stroke();
    drawFood(ctx, kind, r.x + r.w / 2, r.y + r.h / 2 - 12, 22);
    ctx.fillStyle = COLORS.ink;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(INGREDIENTS[kind].name, r.x + r.w / 2, r.y + r.h - 14);
  }
}

/** A cooking station: its slots, progress rings and finished items. */
function drawStation(ctx, id, world) {
  const c = COUNTERS[id];
  const station = world.stations[id];
  const slotW = id === 'chop' ? c.w - 32 : (c.w - 40) / 2;
  station.slots.forEach((slot, i) => {
    const x = c.x + 16 + i * (slotW + 8);
    const y = c.y + 52;
    const w = slotW;
    const h = 150;
    ctx.fillStyle = id === 'wok' ? '#3a3a3a' : id === 'grill' ? '#4a2f22' : COLORS.board;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    if (id === 'wok') {
      ctx.strokeStyle = '#222';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2 - 8, 26, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#c96a3f';
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h - 6, w / 2 - 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (id === 'grill') {
      ctx.strokeStyle = '#8b96a3';
      ctx.lineWidth = 3;
      for (let g = 0; g < 4; g++) {
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 26 + g * 14);
        ctx.lineTo(x + w - 10, y + 26 + g * 14);
        ctx.stroke();
      }
    }
    if (slot === null) {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = '13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('kosong', x + w / 2, y + h / 2);
      return;
    }
    const done = slot.progress >= slot.total;
    drawFood(ctx, done ? slot.out : slot.kind, x + w / 2, y + h / 2 - 8, 26);
    if (!done) {
      const frac = slot.progress / slot.total;
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2 - 8, 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#f5b942';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2 - 8, 30, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil(slot.total - slot.progress)}s`, x + w / 2, y + h - 22);
    } else {
      ctx.fillStyle = '#7dc383';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SIAP!', x + w / 2, y + h - 22);
    }
  });
}

/** The plating counter: the white plate and whatever sits on it. */
function drawPlateCounter(ctx, world) {
  const c = COUNTERS.plate;
  const cx = c.x + c.w / 2;
  const cy = c.y + 130;
  const match = matchOrder(world);
  if (match !== null) {
    ctx.strokeStyle = '#7dc383';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 74, 52, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#7dc383';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SIAP SAJI!', cx, cy - 66);
  }
  ctx.fillStyle = '#fdfdf8';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 66, 44, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cfc8b0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy, 66, 44, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, cy, 48, 30, 0, 0, Math.PI * 2);
  ctx.stroke();
  world.plate.forEach((kind, i) => {
    const angle = (i / Math.max(world.plate.length, 1)) * Math.PI * 2 - Math.PI / 2;
    drawFood(ctx, kind, cx + Math.cos(angle) * 26, cy + Math.sin(angle) * 16, 15);
  });
  if (world.plate.length === 0) {
    ctx.fillStyle = '#b8ab8d';
    ctx.font = '13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('piring kosong', cx, cy + 2);
  }
  ctx.fillStyle = '#ffe9c4';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('rakit hidangan di sini,', cx, c.y + 224);
  ctx.fillText('lalu sajikan (Q)', cx, c.y + 242);
}

/** The serving window: a hatch with a bell, glowing when a plate is ready. */
function drawServeWindow(ctx, world) {
  const c = COUNTERS.serve;
  const match = matchOrder(world);
  ctx.fillStyle = '#2b1a12';
  roundRect(ctx, c.x + 16, c.y + 52, c.w - 32, 120, 10);
  ctx.fill();
  ctx.fillStyle = match !== null ? '#ffe9c4' : '#4a3423';
  roundRect(ctx, c.x + 24, c.y + 60, c.w - 48, 104, 8);
  ctx.fill();
  if (match !== null) {
    ctx.fillStyle = COLORS.ink;
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`"${match.name}"`, c.x + c.w / 2, c.y + 96);
    ctx.fillStyle = '#7a5a2e';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.fillText('pesanan cocok — tekan Q!', c.x + c.w / 2, c.y + 124);
  } else {
    ctx.fillStyle = '#8b7355';
    ctx.font = '15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('— menunggu hidangan —', c.x + c.w / 2, c.y + 112);
  }
  ctx.fillStyle = '#f5b942';
  ctx.beginPath();
  ctx.arc(c.x + c.w / 2, c.y + 210, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a6d1f';
  ctx.fillRect(c.x + c.w / 2 - 3, c.y + 190, 6, 10);
  ctx.fillStyle = '#ffe9c4';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('ding! sajikan di sini', c.x + c.w / 2, c.y + 252);
}

/** The trash bin in the walk lane. */
function drawTrash(ctx, world) {
  const c = COUNTERS.trash;
  const near = nearestCounter(world) === 'trash';
  ctx.fillStyle = '#5a6b7a';
  roundRect(ctx, c.x, c.y, c.w, c.h, 10);
  ctx.fill();
  ctx.fillStyle = '#42505e';
  roundRect(ctx, c.x + 6, c.y + 6, c.w - 12, 14, 6);
  ctx.fill();
  if (near) {
    ctx.strokeStyle = '#ffd977';
    ctx.lineWidth = 3;
    roundRect(ctx, c.x - 3, c.y - 3, c.w + 6, c.h + 6, 12);
    ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAMPAH (T)', c.x + c.w / 2, c.y + c.h - 12);
}

/** One ticket on the order board, with its needs, patience bar and reward. */
function drawTicket(ctx, order, x, y, w, h, world) {
  const recipe = RECIPES[order.key];
  const frac = Math.max(0, order.patience / order.maxPatience);
  shadow(ctx, x, y, w, h);
  ctx.fillStyle = COLORS.ticket;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = recipe.color;
  roundRect(ctx, x, y, w, 10, 5);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`#${order.id} ${order.name}`, x + 12, y + 30);
  ctx.fillStyle = '#8a6d1f';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`🪙 ${order.reward}`, x + w - 12, y + 30);
  order.needs.forEach((kind, i) => {
    const cx = x + 30 + i * 52;
    const cy = y + 62;
    const have = world.plate.includes(kind);
    ctx.fillStyle = have ? '#dff0d8' : '#f3e8c8';
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = have ? '#4caf50' : '#d9b96a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.stroke();
    drawFood(ctx, kind, cx, cy, 13);
    if (have) {
      ctx.fillStyle = '#4caf50';
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓', cx + 14, cy - 12);
    }
  });
  const barY = y + h - 12;
  ctx.fillStyle = '#e0d3ae';
  roundRect(ctx, x + 12, barY, w - 24, 7, 3);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? '#4caf50' : frac > 0.25 ? '#f5a623' : '#d64541';
  if (frac > 0) {
    roundRect(ctx, x + 12, barY, (w - 24) * frac, 7, 3);
    ctx.fill();
  }
}

/** The order board across the top, and an empty-board hint when there are no tickets. */
function drawBoard(ctx, world) {
  ctx.fillStyle = '#3a2417';
  roundRect(ctx, BOARD.x, BOARD.y, BOARD.w, BOARD.h, 12);
  ctx.fill();
  ctx.fillStyle = '#ffe9c4';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  if (world.orders.length === 0) {
    ctx.fillText('PAPAN PESANAN — pesanan pertama segera datang…', BOARD.x + 16, BOARD.y + BOARD.h / 2);
    return;
  }
  const w = (BOARD.w - 16 - 12 * (world.orders.length - 1)) / world.orders.length;
  world.orders.forEach((order, i) => {
    drawTicket(ctx, order, BOARD.x + 8 + i * (w + 12), BOARD.y + 6, w, BOARD.h - 12, world);
  });
}

/** The top bar: name, shift timer, coins, served count and combo. */
function drawHud(ctx, world) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, VIEW.width, 64);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('🍳 KUALI RUSH', 16, 33);
  const total = Math.max(0, Math.ceil(world.timeLeft));
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  const lowTime = total <= 30;
  ctx.fillStyle = lowTime ? '#ff8a80' : COLORS.hudText;
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`⏱ ${mm}:${ss}`, VIEW.width / 2, 33);
  if (world.rush) {
    ctx.fillStyle = '#ff8a80';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText('RUSH HOUR', VIEW.width / 2, 56);
  }
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`🪙 ${world.coins}`, VIEW.width - 16, 26);
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillStyle = '#d8c49a';
  ctx.fillText(`disajikan ${world.served} · hangus ${world.missed}${world.combo >= 2 ? ` · combo x${Math.min(1 + world.combo * 0.1, 1.5).toFixed(1)}` : ''}`, VIEW.width - 16, 50);
}

/** The chef: toque, face, apron, and the carried items floating above. */
function drawChef(ctx, world) {
  const chef = world.chef;
  const bob = chef.moving ? Math.sin(world.elapsed * 14) * 3 : 0;
  const x = chef.x;
  const y = chef.y + bob * 0.3;
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(x, chef.y + 34, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b6ea5';
  roundRect(ctx, x - 18, y - 6, 36, 40, 12);
  ctx.fill();
  ctx.fillStyle = '#f4f4f4';
  roundRect(ctx, x - 14, y + 2, 28, 30, 8);
  ctx.fill();
  ctx.fillStyle = '#f2c9a0';
  ctx.beginPath();
  ctx.arc(x, y - 20, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(x - 9, y - 34, 9, 0, Math.PI * 2);
  ctx.arc(x + 9, y - 34, 9, 0, Math.PI * 2);
  ctx.arc(x, y - 38, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b1a12';
  const eyeX = chef.dir >= 0 ? 5 : -5;
  ctx.beginPath();
  ctx.arc(x - 5 + eyeX, y - 20, 2, 0, Math.PI * 2);
  ctx.arc(x + 5 + eyeX, y - 20, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1a12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + eyeX, y - 14, 4, 0.2, Math.PI - 0.2);
  ctx.stroke();
  world.carry.forEach((kind, i) => {
    const bx = x - (world.carry.length - 1) * 16 + i * 32;
    const by = y - 58;
    ctx.fillStyle = 'rgba(255,246,221,0.95)';
    ctx.beginPath();
    ctx.arc(bx, by, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9b96a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, 15, 0, Math.PI * 2);
    ctx.stroke();
    drawFood(ctx, kind, bx, by, 10);
  });
  if (chef.target !== null) {
    ctx.strokeStyle = 'rgba(255,217,119,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(chef.target.x, chef.target.y, 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(chef.target.x - 14, chef.target.y);
    ctx.lineTo(chef.target.x + 14, chef.target.y);
    ctx.moveTo(chef.target.x, chef.target.y - 14);
    ctx.lineTo(chef.target.x, chef.target.y + 14);
    ctx.stroke();
  }
}

/** Steam puffs above the hot stations. */
function drawSteam(ctx, world) {
  for (const s of world.steam) {
    ctx.fillStyle = `rgba(255,255,255,${(s.life * 0.5).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 8 + (1 - s.life) * 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Floating score popups and the bottom hint line. */
function drawOverlays(ctx, world) {
  for (const p of world.popups) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = p.color;
    ctx.font = 'bold 18px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.text, p.x, p.y);
    ctx.globalAlpha = 1;
  }
  if (world.flash.life > 0) {
    ctx.globalAlpha = Math.max(0, Math.min(1, world.flash.life));
    ctx.fillStyle = '#d64541';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.flash.text, VIEW.width / 2, 545);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = 'rgba(43,26,18,0.85)';
  roundRect(ctx, 16, VIEW.height - 36, VIEW.width - 32, 28, 8);
  ctx.fill();
  ctx.fillStyle = '#ffe9c4';
  ctx.font = '15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const hint = world.message.life > 0 ? world.message.text : 'WASD / klik: jalan · E: ambil & masak · Q: sajikan · T: buang · M: suara';
  ctx.fillText(hint, VIEW.width / 2, VIEW.height - 21);
}

/** The title screen over a quiet kitchen. */
function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(20,10,5,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#ffe9c4';
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍳 KUALI RUSH', VIEW.width / 2, 220);
  ctx.fillStyle = '#f5b942';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('Masak cepat, sajikan tepat — satu shift, 3 menit, dapurmu sendiri.', VIEW.width / 2, 268);
  const recipes = Object.values(RECIPES);
  const boxW = 880;
  const boxX = (VIEW.width - boxW) / 2;
  ctx.fillStyle = 'rgba(255,246,221,0.95)';
  roundRect(ctx, boxX, 310, boxW, 190, 14);
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('MENU HARI INI', boxX + 24, 340);
  recipes.forEach((recipe, i) => {
    const y = 372 + i * 30;
    ctx.fillStyle = recipe.color;
    ctx.beginPath();
    ctx.arc(boxX + 36, y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.ink;
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillText(`${recipe.name} — ${recipe.needs.map((k) => DISH_ITEMS[k].name).join(' + ')}`, boxX + 54, y);
    ctx.textAlign = 'right';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.fillText(`🪙 ${recipe.reward}`, boxX + boxW - 24, y);
    ctx.textAlign = 'left';
  });
  ctx.fillStyle = '#ffe9c4';
  ctx.font = '17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / klik mouse untuk berjalan · E ambil & masak · Q sajikan · T buang', VIEW.width / 2, 540);
  ctx.fillStyle = '#f5b942';
  ctx.font = 'bold 22px system-ui, sans-serif';
  const blink = Math.floor(world.elapsed * 2) % 2 === 0;
  if (blink) ctx.fillText('Tekan ENTER atau klik untuk mulai', VIEW.width / 2, 590);
}

/** The end-of-shift screen with the grade and the numbers. */
function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(20,10,5,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const o = world.over;
  ctx.fillStyle = '#ffe9c4';
  ctx.font = 'bold 52px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SHIFT SELESAI!', VIEW.width / 2, 220);
  ctx.fillStyle = '#f5b942';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText(o.grade, VIEW.width / 2, 272);
  const rows = [
    ['Koin didapat', `🪙 ${o.coins}`],
    ['Hidangan disajikan', `${o.served}`],
    ['Pesanan hangus', `${o.missed}`],
    ['Combo terbaik', `x${Math.min(1 + o.bestCombo * 0.1, 1.5).toFixed(1)} (${o.bestCombo} beruntun)`],
  ];
  ctx.fillStyle = 'rgba(255,246,221,0.95)';
  roundRect(ctx, 440, 310, 400, 200, 14);
  ctx.fill();
  rows.forEach(([label, value], i) => {
    const y = 348 + i * 40;
    ctx.fillStyle = COLORS.ink;
    ctx.font = '17px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, 470, y);
    ctx.textAlign = 'right';
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.fillText(value, 810, y);
  });
  ctx.fillStyle = '#ffe9c4';
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.textAlign = 'center';
  const blink = Math.floor(world.elapsed * 2) % 2 === 0;
  if (blink) ctx.fillText('Tekan R atau ENTER untuk main lagi', VIEW.width / 2, 570);
}

/** Paint the whole game: room, board, counters, chef, overlays, and the screen on top. */
export function renderWorld(ctx, world, input) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawRoom(ctx);
  drawBoard(ctx, world);
  drawCounterShell(ctx, 'bins', world, input);
  drawBins(ctx);
  drawCounterShell(ctx, 'chop', world, input);
  drawStation(ctx, 'chop', world);
  drawCounterShell(ctx, 'wok', world, input);
  drawStation(ctx, 'wok', world);
  drawCounterShell(ctx, 'grill', world, input);
  drawStation(ctx, 'grill', world);
  drawCounterShell(ctx, 'plate', world, input);
  drawPlateCounter(ctx, world);
  drawCounterShell(ctx, 'serve', world, input);
  drawServeWindow(ctx, world);
  drawTrash(ctx, world);
  drawSteam(ctx, world);
  drawChef(ctx, world);
  drawHud(ctx, world);
  drawOverlays(ctx, world);
  if (world.screen === 'title') drawTitle(ctx, world);
  if (world.screen === 'over') drawOver(ctx, world);
}
