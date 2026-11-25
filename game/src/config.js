// Kuali Rush: the numbers that tune the kitchen. One file, one job: every size, time, colour,
// recipe and station rule the rest of the game reads. Nothing here draws or moves anything.

/** The canvas the game draws on, in logical pixels. */
export const VIEW = { width: 1280, height: 800 };

/** A whole shift, in seconds, and when the rush hour starts (seconds left). */
export const SHIFT_SECONDS = 180;
export const RUSH_AT_SECONDS_LEFT = 60;

/** How long the chef takes to walk across the floor, in pixels per second. */
export const CHEF_SPEED = 330;
/** How close the chef must stand to a counter to use it, in pixels. */
export const REACH = 96;
/** How many things the chef can carry at once. */
export const CARRY_MAX = 3;
/** How many items fit on one plate. */
export const PLATE_MAX = 4;

/** The warm kitchen palette, one colour per surface. */
export const COLORS = {
  wall: '#7a4a2b',
  wallTrim: '#5d3620',
  floor: '#c98f5f',
  floorTile: '#bb7f52',
  floorTileDark: '#a96f47',
  counterTop: '#8a5a33',
  counterFront: '#6e4525',
  counterEdge: '#4e2f18',
  steel: '#b9c2cc',
  steelDark: '#8b96a3',
  board: '#e8d5a8',
  boardDark: '#cbb37e',
  hud: '#2b1a12',
  hudText: '#ffe9c4',
  ticket: '#fff6dd',
  ticketEdge: '#d9b96a',
  cream: '#fff3d6',
  ink: '#33241a',
  red: '#d64541',
  green: '#4caf50',
  gold: '#f5b942',
  steam: 'rgba(255,255,255,0.55)',
};

/** One raw ingredient, as it sits in its bin on the counter. */
export const INGREDIENTS = {
  rice: { name: 'Nasi', color: '#f7f3e8', dark: '#d8cfb4' },
  noodle: { name: 'Mie', color: '#f2c14e', dark: '#c99a2e' },
  chicken: { name: 'Ayam', color: '#f2a594', dark: '#c97a68' },
  egg: { name: 'Telur', color: '#fdf6d8', dark: '#e3d39a' },
  veg: { name: 'Sayur', color: '#7dc383', dark: '#4f9a55' },
  sauce: { name: 'Saus', color: '#b5651d', dark: '#7e4210' },
};

/** What a station does to a raw ingredient: the item it becomes and how long it takes. */
export const PROCESS = {
  wok: {
    rice: { out: 'rice-cooked', time: 4, label: 'Nasi Goreng' },
    noodle: { out: 'noodle-cooked', time: 4, label: 'Mie Rebus' },
    egg: { out: 'egg-fried', time: 3, label: 'Telur Ceplok' },
  },
  chop: {
    veg: { out: 'veg-chopped', time: 3, label: 'Sayur Potong' },
    chicken: { out: 'chicken-chopped', time: 3, label: 'Ayam Cincang' },
  },
  grill: {
    chicken: { out: 'chicken-grilled', time: 5, label: 'Sate Ayam' },
  },
};

/** A finished item, as it reads on a plate: short name and draw colour. */
export const DISH_ITEMS = {
  'rice-cooked': { name: 'Nasi', color: '#f7f3e8', dark: '#d8cfb4' },
  'noodle-cooked': { name: 'Mie', color: '#f2c14e', dark: '#c99a2e' },
  'egg-fried': { name: 'Telur', color: '#fdf6d8', dark: '#e0a53c' },
  'veg-chopped': { name: 'Sayur', color: '#7dc383', dark: '#4f9a55' },
  'chicken-chopped': { name: 'Ayam', color: '#e8b48a', dark: '#b57e52' },
  'chicken-grilled': { name: 'Sate', color: '#a8642f', dark: '#6e3d1c' },
  sauce: { name: 'Saus', color: '#b5651d', dark: '#7e4210' },
};

/** The four dishes the order board asks for: what goes on the plate and what it pays. */
export const RECIPES = {
  nasiGoreng: {
    name: 'Nasi Goreng',
    needs: ['rice-cooked', 'egg-fried', 'veg-chopped'],
    reward: 14,
    color: '#f2c14e',
  },
  mieAyam: {
    name: 'Mie Ayam',
    needs: ['noodle-cooked', 'chicken-chopped', 'sauce'],
    reward: 16,
    color: '#e8a13c',
  },
  sateAyam: {
    name: 'Sate Ayam',
    needs: ['chicken-grilled', 'sauce'],
    reward: 15,
    color: '#a8642f',
  },
  gadoGado: {
    name: 'Gado-Gado',
    needs: ['veg-chopped', 'egg-fried', 'sauce'],
    reward: 12,
    color: '#7dc383',
  },
};
export const RECIPE_KEYS = ['nasiGoreng', 'mieAyam', 'sateAyam', 'gadoGado'];

/** The counters, in canvas space, one row along the kitchen wall. `front` is the point the chef
 * stands at to reach them: the bottom-centre of each counter, just above the walk lane. */
export const COUNTERS = {
  bins: { x: 16, y: 208, w: 248, h: 304, front: 512, label: 'BAHAN' },
  chop: { x: 280, y: 208, w: 168, h: 304, front: 512, label: 'TALENAN', slots: 1 },
  wok: { x: 464, y: 208, w: 168, h: 304, front: 512, label: 'WAJAN', slots: 2 },
  grill: { x: 648, y: 208, w: 168, h: 304, front: 512, label: 'PANGGANGAN', slots: 2 },
  plate: { x: 832, y: 208, w: 168, h: 304, front: 512, label: 'PIRING SAJI', slots: 1 },
  serve: { x: 1016, y: 208, w: 248, h: 304, front: 512, label: 'JENDELA SAJI' },
  trash: { x: 16, y: 560, w: 120, h: 84, front: 644, label: 'SAMPAH' },
};

/** The six ingredient bins inside the BAHAN counter: kind, column, row. */
export const BIN_LAYOUT = [
  { kind: 'rice', col: 0, row: 0 },
  { kind: 'noodle', col: 1, row: 0 },
  { kind: 'chicken', col: 0, row: 1 },
  { kind: 'egg', col: 1, row: 1 },
  { kind: 'veg', col: 0, row: 2 },
  { kind: 'sauce', col: 1, row: 2 },
];

/** Order pacing: seconds between new tickets, calm and rush. */
export const SPAWN_EVERY = 14;
export const SPAWN_EVERY_RUSH = 9;
/** How long a ticket waits before it walks out, calm and rush. */
export const PATIENCE = 60;
export const PATIENCE_RUSH = 45;
/** A ticket pays its reward plus a tip of up to this much when served fast. */
export const TIP_MAX = 6;
/** Combo grows by this per serve in a row, capped here. */
export const COMBO_STEP = 0.1;
export const COMBO_MAX = 1.5;
/** A missed ticket costs this many coins, never below zero. */
export const MISS_PENALTY = 5;

/** The chef's home spot on the floor. */
export const CHEF_HOME = { x: 640, y: 680 };

/** The floor the chef walks on: the open lane below the counters. */
export const WALK = { x0: 16, y0: 540, x1: 1264, y1: 784 };

/** The order board: where tickets sit, how many fit. */
export const BOARD = { x: 16, y: 72, w: 1248, h: 104, maxTickets: 4 };
