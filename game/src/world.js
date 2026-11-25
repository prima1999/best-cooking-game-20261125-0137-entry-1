// Kuali Rush: the rules. One file, one job: the whole game state, the chef's walk, the stations'
// cooking, the tickets' patience, serving and scoring. It draws nothing and hears nothing: the
// input arrives as an object, the render reads the state back out.

import {
  BIN_LAYOUT,
  BOARD,
  CARRY_MAX,
  CHEF_SPEED,
  CHEF_HOME,
  COMBO_MAX,
  COMBO_STEP,
  COUNTERS,
  DISH_ITEMS,
  INGREDIENTS,
  MISS_PENALTY,
  PATIENCE,
  PATIENCE_RUSH,
  PLATE_MAX,
  PROCESS,
  RECIPE_KEYS,
  RECIPES,
  REACH,
  RUSH_AT_SECONDS_LEFT,
  SHIFT_SECONDS,
  SPAWN_EVERY,
  SPAWN_EVERY_RUSH,
  TIP_MAX,
  WALK,
} from './config.js';
import { endStep, keyPressed, walkDirection } from './input.js';
import { setMuted, sfx } from './audio.js';

/** A small deterministic random source, so a staged screenshot always looks the same. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A fresh kitchen: no tickets, an empty plate, a chef at home, the clock full. */
export function createWorld(seed = 20261125) {
  const world = {
    seed,
    rng: mulberry32(seed),
    screen: 'title',
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    rush: false,
    rushBanner: 0,
    coins: 0,
    served: 0,
    missed: 0,
    combo: 0,
    bestCombo: 0,
    chef: { x: CHEF_HOME.x, y: CHEF_HOME.y, dir: 1, moving: false, target: null, pending: null },
    carry: [],
    plate: [],
    stations: {
      chop: { slots: [null] },
      wok: { slots: [null, null] },
      grill: { slots: [null, null] },
    },
    orders: [],
    nextOrderId: 1,
    spawnIn: 6,
    popups: [],
    steam: [],
    message: { text: '', life: 0 },
    flash: { text: '', life: 0 },
    over: null,
    muted: false,
    tickSecond: -1,
  };
  return world;
}

/** Put a world back to the start of a shift, keeping its seed. */
export function resetWorld(world) {
  const fresh = createWorld(world.seed);
  for (const key of Object.keys(fresh)) world[key] = fresh[key];
  world.screen = 'play';
  spawnOrder(world);
  spawnOrder(world);
}

/** The front point of a counter: where the chef stands to use it. */
export function counterFront(id) {
  const c = COUNTERS[id];
  return { x: c.x + c.w / 2, y: c.front };
}

/** Which counter, if any, the point (x, y) sits on. */
export function counterAt(x, y) {
  for (const id of ['bins', 'chop', 'wok', 'grill', 'plate', 'serve', 'trash']) {
    const c = COUNTERS[id];
    if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return id;
  }
  return null;
}

/** The counter nearest the chef's front, when it is close enough to use. */
export function nearestCounter(world) {
  let best = null;
  let bestDist = Infinity;
  for (const id of ['bins', 'chop', 'wok', 'grill', 'plate', 'serve', 'trash']) {
    const front = counterFront(id);
    const d = Math.hypot(world.chef.x - front.x, world.chef.y - front.y);
    if (d < bestDist) {
      bestDist = d;
      best = id;
    }
  }
  return bestDist <= REACH ? best : null;
}

/** The bin rectangle of one ingredient inside the BAHAN counter. */
export function binRect(kind) {
  const c = COUNTERS.bins;
  const layout = BIN_LAYOUT.find((b) => b.kind === kind);
  const bw = (c.w - 24) / 2;
  const bh = (c.h - 84) / 3;
  return { x: c.x + 12 + layout.col * bw, y: c.y + 40 + layout.row * bh, w: bw - 8, h: bh - 8 };
}

/** Which bin the point sits on, or the bin nearest the chef when no point is given. */
export function pickBin(world, point) {
  if (point !== undefined) {
    for (const kind of Object.keys(INGREDIENTS)) {
      const r = binRect(kind);
      if (point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h) return kind;
    }
    return null;
  }
  let best = null;
  let bestDist = Infinity;
  for (const kind of Object.keys(INGREDIENTS)) {
    const r = binRect(kind);
    const d = Math.hypot(world.chef.x - (r.x + r.w / 2), world.chef.y - (r.y + r.h));
    if (d < bestDist) {
      bestDist = d;
      best = kind;
    }
  }
  return best;
}

/** Whether an item string is ready to go on a plate (a finished dish item, or sauce). */
export function isPlatAble(kind) {
  return kind in DISH_ITEMS;
}

/** Whether a raw kind can go into a station, and what it becomes there. */
export function stationAccepts(station, kind) {
  return PROCESS[station][kind] ?? null;
}

/** A floating text that rises and fades above the kitchen. */
function popup(world, x, y, text, color) {
  world.popups.push({ x, y, text, color, life: 1.2 });
  if (world.popups.length > 12) world.popups.shift();
}

/** The one-line hint at the bottom of the screen, for a few seconds. */
function say(world, text) {
  world.message = { text, life: 3 };
}

/** A big centre-screen flash, for rush hour and missed tickets. */
function flash(world, text) {
  world.flash = { text, life: 2.2 };
}

/** Open a new ticket on the board, from the seeded random source. */
export function spawnOrder(world, forceRecipe) {
  if (world.orders.length >= BOARD.maxTickets) return null;
  const key = forceRecipe ?? RECIPE_KEYS[Math.floor(world.rng() * RECIPE_KEYS.length)];
  const recipe = RECIPES[key];
  const patience = world.rush ? PATIENCE_RUSH : PATIENCE;
  const order = { id: world.nextOrderId++, key, name: recipe.name, needs: [...recipe.needs], patience, maxPatience: patience, reward: recipe.reward };
  world.orders.push(order);
  return order;
}

/** The order the plate matches, oldest first, or null when the plate fits no ticket. */
export function matchOrder(world) {
  for (const order of world.orders) {
    if (order.needs.length !== world.plate.length) continue;
    const rest = [...order.needs];
    let ok = true;
    for (const item of world.plate) {
      const at = rest.indexOf(item);
      if (at < 0) {
        ok = false;
        break;
      }
      rest.splice(at, 1);
    }
    if (ok) return order;
  }
  return null;
}

/** Serve the plate to the ticket it matches; pays reward plus a speed tip times the combo. */
function servePlate(world) {
  const order = matchOrder(world);
  if (order === null) {
    sfx.error();
    say(world, world.plate.length === 0 ? 'Piring masih kosong — rakit hidangan dulu.' : 'Tidak ada pesanan yang cocok dengan piring ini.');
    return false;
  }
  const tip = Math.round(TIP_MAX * (order.patience / order.maxPatience));
  const mult = Math.min(1 + world.combo * COMBO_STEP, COMBO_MAX);
  const pay = Math.round((order.reward + tip) * mult);
  world.coins += pay;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.orders = world.orders.filter((o) => o.id !== order.id);
  world.plate = [];
  popup(world, world.chef.x, world.chef.y - 80, `+${pay}  ${order.name}`, '#f5b942');
  if (world.combo >= 2) popup(world, world.chef.x, world.chef.y - 110, `Combo x${mult.toFixed(1)}`, '#7dc383');
  sfx.serve();
  return true;
}

/** Use one counter: pick, place, take, plate, serve or throw away, by what the chef holds. */
export function interact(world, id, point) {
  const chef = world.chef;
  if (id === 'bins') {
    const kind = pickBin(world, point);
    if (kind === null) return;
    if (world.carry.length >= CARRY_MAX) {
      sfx.error();
      say(world, 'Tangan penuh — masak atau sajikan dulu.');
      return;
    }
    world.carry.push(kind);
    popup(world, chef.x, chef.y - 56, `+ ${INGREDIENTS[kind].name}`, '#ffe9c4');
    sfx.pick();
    return;
  }
  if (id === 'chop' || id === 'wok' || id === 'grill') {
    const station = world.stations[id];
    const doneAt = station.slots.findIndex((s) => s !== null && s.progress >= s.total);
    if (doneAt >= 0) {
      if (world.carry.length >= CARRY_MAX) {
        sfx.error();
        say(world, 'Tangan penuh — tidak bisa mengambil.');
        return;
      }
      const slot = station.slots[doneAt];
      world.carry.push(slot.out);
      station.slots[doneAt] = null;
      popup(world, chef.x, chef.y - 56, `+ ${DISH_ITEMS[slot.out].name}`, '#ffe9c4');
      sfx.pick();
      return;
    }
    const carried = [...world.carry].reverse().find((k) => stationAccepts(id, k) !== null);
    if (carried === undefined) {
      sfx.error();
      const names = { chop: 'Talenan: Sayur / Ayam', wok: 'Wajan: Nasi / Mie / Telur', grill: 'Panggangan: Ayam' };
      say(world, world.carry.length === 0 ? `Bawa bahan dulu — ${names[id]}.` : `${names[id]} — bahan yang dibawa tidak cocok.`);
      return;
    }
    const freeAt = station.slots.findIndex((s) => s === null);
    if (freeAt < 0) {
      sfx.error();
      say(world, 'Stasiun penuh — tunggu sampai selesai.');
      return;
    }
    const job = stationAccepts(id, carried);
    world.carry.splice(world.carry.indexOf(carried), 1);
    station.slots[freeAt] = { kind: carried, out: job.out, progress: 0, total: job.time };
    sfx.place();
    if (id === 'wok' || id === 'grill') sfx.sizzle();
    return;
  }
  if (id === 'plate') {
    const at = [...world.carry].reverse().findIndex((k) => isPlatAble(k));
    if (at < 0) {
      sfx.error();
      say(world, world.carry.length === 0 ? 'Bawa hidangan matang dulu ke piring.' : 'Yang dibawa masih mentah — masak dulu.');
      return;
    }
    const kind = [...world.carry].reverse()[at];
    if (world.plate.length >= PLATE_MAX) {
      sfx.error();
      say(world, 'Piring penuh — sajikan dulu.');
      return;
    }
    world.carry.splice(world.carry.lastIndexOf(kind), 1);
    world.plate.push(kind);
    sfx.place();
    return;
  }
  if (id === 'serve') {
    servePlate(world);
    return;
  }
  if (id === 'trash') {
    if (world.carry.length > 0) {
      const kind = world.carry.pop();
      say(world, `${DISH_ITEMS[kind]?.name ?? INGREDIENTS[kind]?.name ?? kind} dibuang.`);
      sfx.place();
      return;
    }
    if (world.plate.length > 0) {
      world.plate = [];
      say(world, 'Piring dikosongkan.');
      sfx.place();
      return;
    }
    sfx.error();
    say(world, 'Tidak ada yang bisa dibuang.');
  }
}

/** Walk the chef one step toward a direction or a target point. */
function moveChef(world, dt, dir) {
  const chef = world.chef;
  if (dir !== null) {
    chef.x += dir.x * CHEF_SPEED * dt;
    chef.y += dir.y * CHEF_SPEED * dt;
    chef.dir = dir.x < 0 ? -1 : dir.x > 0 ? 1 : chef.dir;
    chef.moving = true;
    chef.target = null;
    chef.pending = null;
    return;
  }
  if (chef.target !== null) {
    const dx = chef.target.x - chef.x;
    const dy = chef.target.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      chef.target = null;
      chef.moving = false;
      if (chef.pending !== null) {
        const id = chef.pending;
        chef.pending = null;
        if (nearestCounter(world) === id || id === 'trash') interact(world, id);
      }
      return;
    }
    const step = Math.min(dist, CHEF_SPEED * dt);
    chef.x += (dx / dist) * step;
    chef.y += (dy / dist) * step;
    chef.dir = dx < 0 ? -1 : dx > 0 ? 1 : chef.dir;
    chef.moving = true;
    return;
  }
  chef.moving = false;
}

/** Cook every busy slot forward; ding when one finishes. */
function cookStations(world, dt) {
  for (const id of ['chop', 'wok', 'grill']) {
    const station = world.stations[id];
    station.slots.forEach((slot, i) => {
      if (slot === null || slot.progress >= slot.total) return;
      slot.progress += dt;
      if (slot.progress >= slot.total) {
        slot.progress = slot.total;
        const front = counterFront(id);
        popup(world, front.x, COUNTERS[id].y + 30, 'Siap!', '#7dc383');
        sfx.done();
      }
      if ((id === 'wok' || id === 'grill') && world.rng() < dt * 6) {
        const c = COUNTERS[id];
        world.steam.push({ x: c.x + 24 + world.rng() * (c.w - 48), y: c.y + 60, life: 1, vy: 34 });
      }
    });
  }
  world.steam = world.steam.filter((s) => {
    s.life -= dt * 0.8;
    s.y -= s.vy * dt;
    return s.life > 0;
  });
  if (world.steam.length > 48) world.steam.splice(0, world.steam.length - 48);
}

/** Drain every ticket's patience; a ticket at zero walks out and breaks the combo. */
function ageOrders(world, dt) {
  for (const order of world.orders) order.patience -= dt;
  const lost = world.orders.filter((o) => o.patience <= 0);
  if (lost.length > 0) {
    world.orders = world.orders.filter((o) => o.patience > 0);
    world.missed += lost.length;
    world.coins = Math.max(0, world.coins - MISS_PENALTY * lost.length);
    world.combo = 0;
    flash(world, `Pesanan ${lost[0].name} hangus! -${MISS_PENALTY * lost.length}`);
    sfx.miss();
  }
}

/** A grade for the shift, by coins earned. */
function gradeFor(coins) {
  if (coins >= 220) return 'S — Koki Legenda';
  if (coins >= 160) return 'A — Koki Hebat';
  if (coins >= 100) return 'B — Koki Andal';
  if (coins >= 50) return 'C — Koki Magang';
  return 'D — Terus Berlatih';
}

/** One tick of the game: movement, keys, clicks, cooking, tickets, clock. */
export function stepWorld(world, input, dt) {
  if (world.screen === 'title') {
    if (keyPressed(input, 'Enter') || input.click !== null) {
      resetWorld(world);
    }
    endStep(input);
    return;
  }
  if (world.screen === 'over') {
    if (keyPressed(input, 'KeyR') || keyPressed(input, 'Enter') || input.click !== null) {
      resetWorld(world);
    }
    endStep(input);
    return;
  }

  world.elapsed += dt;
  world.timeLeft -= dt;
  const second = Math.ceil(world.timeLeft);
  if (second !== world.tickSecond) {
    world.tickSecond = second;
    if (second <= 10 && second > 0) sfx.tick();
  }
  if (!world.rush && world.timeLeft <= RUSH_AT_SECONDS_LEFT) {
    world.rush = true;
    world.rushBanner = 3;
    flash(world, 'RUSH HOUR — pesanan makin cepat!');
    sfx.rush();
  }
  if (world.rushBanner > 0) world.rushBanner -= dt;
  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    world.screen = 'over';
    world.over = { coins: world.coins, served: world.served, missed: world.missed, bestCombo: world.bestCombo, grade: gradeFor(world.coins) };
    sfx.serve();
    endStep(input);
    return;
  }

  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    spawnOrder(world);
    world.spawnIn = world.rush ? SPAWN_EVERY_RUSH : SPAWN_EVERY;
  }

  const dir = walkDirection(input);
  moveChef(world, dt, dir);

  if (input.click !== null) {
    const id = counterAt(input.click.x, input.click.y);
    if (id !== null) {
      const front = counterFront(id);
      const d = Math.hypot(world.chef.x - front.x, world.chef.y - front.y);
      if (d <= REACH) interact(world, id, input.click);
      else {
        world.chef.target = { x: front.x, y: Math.min(front.y + 40, WALK.y1) };
        world.chef.pending = id;
      }
    } else if (input.click.y >= WALK.y0) {
      world.chef.target = {
        x: Math.max(WALK.x0, Math.min(WALK.x1, input.click.x)),
        y: Math.max(WALK.y0, Math.min(WALK.y1, input.click.y)),
      };
      world.chef.pending = null;
    }
  }
  if (keyPressed(input, 'KeyE') || keyPressed(input, 'Space')) {
    const id = nearestCounter(world);
    if (id !== null) interact(world, id);
  }
  if (keyPressed(input, 'KeyQ')) {
    if (nearestCounter(world) === 'serve') servePlate(world);
    else {
      sfx.error();
      say(world, 'Berdiri di Jendela Saji untuk menyajikan (Q).');
    }
  }
  if (keyPressed(input, 'KeyT')) interact(world, 'trash');
  if (keyPressed(input, 'KeyM')) {
    world.muted = setMuted(!world.muted);
    say(world, world.muted ? 'Suara dimatikan (M).' : 'Suara dinyalakan (M).');
  }

  cookStations(world, dt);
  ageOrders(world, dt);

  for (const p of world.popups) {
    p.life -= dt;
    p.y -= 26 * dt;
  }
  world.popups = world.popups.filter((p) => p.life > 0);
  if (world.message.life > 0) world.message.life -= dt;
  if (world.flash.life > 0) world.flash.life -= dt;

  endStep(input);
}
