/**
 * Pure Foundry scene geometry transform. Changing scene width and height while
 * retaining grid.size makes rooms and corridors occupy more usable grid cells;
 * tokens retain their 1x1 (Medium) size in grid units.
 */
export function expandSceneGeometry(input, factor = 2) {
  if (!Number.isFinite(factor) || factor <= 1) throw new RangeError('The scale must exceed 1.');
  if (!input || !Number.isFinite(input.width) || !Number.isFinite(input.height)) {
    throw new TypeError('Expected a Foundry Scene with numeric dimensions.');
  }
  const scene = JSON.parse(JSON.stringify(input));
  const scale = n => Number.isFinite(n) ? Math.round(n * factor * 1000) / 1000 : n;
  const scaleXY = object => {
    if (!object || typeof object !== 'object') return;
    object.x = scale(object.x);
    object.y = scale(object.y);
  };
  const scalePairs = values => Array.isArray(values) ? values.map(scale) : values;
  scene.width = scale(scene.width);
  scene.height = scale(scene.height);
  if (scene.initial) scaleXY(scene.initial);
  if (scene.background) {
    if (Number.isFinite(scene.background.offsetX)) scene.background.offsetX = scale(scene.background.offsetX);
    if (Number.isFinite(scene.background.offsetY)) scene.background.offsetY = scale(scene.background.offsetY);
  }
  for (const wall of scene.walls ?? []) wall.c = scalePairs(wall.c);
  for (const light of scene.lights ?? []) {
    scaleXY(light);
    if (light.config) {
      if (Number.isFinite(light.config.dim)) light.config.dim = scale(light.config.dim);
      if (Number.isFinite(light.config.bright)) light.config.bright = scale(light.config.bright);
    }
  }
  for (const sound of scene.sounds ?? []) {
    scaleXY(sound);
    if (Number.isFinite(sound.radius)) sound.radius = scale(sound.radius);
  }
  for (const token of scene.tokens ?? []) scaleXY(token); // DO NOT change width / height in grid units
  for (const tile of scene.tiles ?? []) {
    scaleXY(tile);
    if (Number.isFinite(tile.width)) tile.width = scale(tile.width);
    if (Number.isFinite(tile.height)) tile.height = scale(tile.height);
  }
  for (const note of scene.notes ?? []) scaleXY(note);
  for (const drawing of scene.drawings ?? []) {
    scaleXY(drawing);
    if (drawing.shape) {
      if (Number.isFinite(drawing.shape.width)) drawing.shape.width = scale(drawing.shape.width);
      if (Number.isFinite(drawing.shape.height)) drawing.shape.height = scale(drawing.shape.height);
      if (Array.isArray(drawing.shape.points)) drawing.shape.points = scalePairs(drawing.shape.points);
    }
  }
  for (const template of scene.templates ?? []) {
    scaleXY(template);
    if (Number.isFinite(template.distance)) template.distance = scale(template.distance);
    if (Number.isFinite(template.width)) template.width = scale(template.width);
  }
  return scene;
}
