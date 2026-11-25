// Kuali Rush: the staged scenes behind ?shot=cover|rush|serve|title. Each one builds a real
// game state through the world's own pieces — real tickets, real cooking slots, a real plate —
// and lets the normal render paint it, so a screenshot is a frame the game itself can reach.

import { counterFront, createWorld, resetWorld, spawnOrder } from './world.js';

/** Put one item into a station slot, partway (or fully) cooked. */
function cookIn(world, station, slotIndex, kind, out, progress, total) {
  world.stations[station].slots[slotIndex] = { kind, out, progress, total };
}

/** Give the chef a spot on the floor and something in hand. */
function placeChef(world, x, y, carry) {
  world.chef.x = x;
  world.chef.y = y;
  world.chef.target = null;
  world.chef.pending = null;
  world.carry = [...carry];
}

/** Set the clock and the scoreboard as if the shift had run this far. */
function setScore(world, timeLeft, coins, served, missed, combo) {
  world.timeLeft = timeLeft;
  world.elapsed = 180 - timeLeft;
  world.coins = coins;
  world.served = served;
  world.missed = missed;
  world.combo = combo;
  world.bestCombo = Math.max(world.bestCombo, combo);
}

/**
 * Stage the named scene on a fresh world and return it: 'cover' is a busy mid-shift kitchen, 'rush'
 * is rush hour with four tickets, 'serve' is a finished plate at the window, anything else is the
 * title screen over a quiet kitchen.
 */
export function stageShot(name, seed = 7) {
  const world = createWorld(seed);
  if (name === 'title') {
    world.screen = 'title';
    world.elapsed = 1.2;
    return world;
  }
  resetWorld(world);
  world.orders = [];
  world.nextOrderId = 1;
  if (name === 'rush') {
    world.rush = true;
    setScore(world, 58, 132, 9, 1, 3);
    spawnOrder(world, 'mieAyam');
    spawnOrder(world, 'sateAyam');
    spawnOrder(world, 'nasiGoreng');
    spawnOrder(world, 'gadoGado');
    world.orders[0].patience = 22;
    world.orders[1].patience = 31;
    world.orders[2].patience = 14;
    world.orders[3].patience = 40;
    cookIn(world, 'wok', 0, 'noodle', 'noodle-cooked', 2.6, 4);
    cookIn(world, 'wok', 1, 'rice', 'rice-cooked', 1.2, 4);
    cookIn(world, 'grill', 0, 'chicken', 'chicken-grilled', 3.8, 5);
    cookIn(world, 'chop', 0, 'veg', 'veg-chopped', 3, 3);
    world.plate = ['noodle-cooked'];
    placeChef(world, 730, 640, ['chicken']);
    world.steam = [
      { x: 520, y: 300, life: 0.9, vy: 34 },
      { x: 560, y: 320, life: 0.6, vy: 34 },
      { x: 700, y: 300, life: 0.8, vy: 34 },
    ];
    world.flash = { text: 'RUSH HOUR — pesanan makin cepat!', life: 2.2 };
    return world;
  }
  if (name === 'serve') {
    setScore(world, 96, 112, 7, 0, 2);
    spawnOrder(world, 'mieAyam');
    spawnOrder(world, 'nasiGoreng');
    world.orders[0].patience = 38;
    world.orders[1].patience = 51;
    world.plate = ['noodle-cooked', 'chicken-chopped', 'sauce'];
    cookIn(world, 'wok', 0, 'egg', 'egg-fried', 3, 3);
    cookIn(world, 'chop', 0, 'veg', 'veg-chopped', 1.4, 3);
    const serve = counterFront('serve');
    placeChef(world, serve.x, 640, []);
    world.popups = [{ x: serve.x, y: 560, text: '+18  Mie Ayam', color: '#f5b942', life: 1.1 }];
    return world;
  }
  setScore(world, 151, 84, 5, 0, 2);
  spawnOrder(world, 'nasiGoreng');
  spawnOrder(world, 'mieAyam');
  spawnOrder(world, 'sateAyam');
  world.orders[0].patience = 44;
  world.orders[1].patience = 28;
  world.orders[2].patience = 52;
  cookIn(world, 'wok', 0, 'rice', 'rice-cooked', 2.4, 4);
  cookIn(world, 'wok', 1, 'egg', 'egg-fried', 1.1, 3);
  cookIn(world, 'chop', 0, 'veg', 'veg-chopped', 3, 3);
  world.plate = ['rice-cooked', 'egg-fried'];
  placeChef(world, 560, 640, ['egg']);
  world.steam = [
    { x: 520, y: 300, life: 0.9, vy: 34 },
    { x: 600, y: 320, life: 0.5, vy: 34 },
  ];
  return world;
}
