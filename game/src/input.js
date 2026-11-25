// Kuali Rush: keyboard and mouse, read by the world each step. The game takes both: WASD or
// arrows to walk, E or Space to use a counter, Q to serve, T to throw away, and a mouse click to
// walk somewhere or to use the counter under the cursor.

/** The keys the game listens to, so a key held down keeps working. */
const KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE', 'Space', 'KeyQ', 'KeyT', 'KeyM', 'KeyR', 'Enter'];

/** A fresh input state: which keys are down, where the mouse is, what was just pressed. */
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    pressed: new Set(),
    mouse: { x: 0, y: 0, down: false },
    click: null,
    canvas,
  };
  window.addEventListener('keydown', (event) => {
    if (!KEYS.includes(event.code)) return;
    if (event.code === 'Space' || event.code.startsWith('Arrow')) event.preventDefault();
    if (!event.repeat) input.pressed.add(event.code);
    input.keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
  });
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    input.mouse.down = true;
    input.click = { x: input.mouse.x, y: input.mouse.y };
  });
  window.addEventListener('mouseup', () => {
    input.mouse.down = false;
  });
  return input;
}

/** Whether a key is held down right now. */
export function keyDown(input, code) {
  return input.keys.has(code);
}

/** Whether a key was pressed since the last step (edge, not hold). */
export function keyPressed(input, code) {
  return input.pressed.has(code);
}

/** The walk direction from WASD/arrows, normalized, or null when no key is held. */
export function walkDirection(input) {
  let x = 0;
  let y = 0;
  if (keyDown(input, 'KeyA') || keyDown(input, 'ArrowLeft')) x -= 1;
  if (keyDown(input, 'KeyD') || keyDown(input, 'ArrowRight')) x += 1;
  if (keyDown(input, 'KeyW') || keyDown(input, 'ArrowUp')) y -= 1;
  if (keyDown(input, 'KeyS') || keyDown(input, 'ArrowDown')) y += 1;
  if (x === 0 && y === 0) return null;
  const len = Math.hypot(x, y);
  return { x: x / len, y: y / len };
}

/** Clear the edge presses and the click after a step has read them. */
export function endStep(input) {
  input.pressed.clear();
  input.click = null;
}
