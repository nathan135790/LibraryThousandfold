import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { expandSceneGeometry } from '../scripts/scene-scale.mjs';

test('doubles usable map area without enlarging 1-square player tokens', () => {
  const original = {
    width: 3072, height: 2048,
    grid: { size: 128, distance: 5, units: 'ft' },
    background: {src:'modules/library-thousandfold/assets/maps/grand-library-first-floor.webp',offsetX:0,offsetY:0},
    walls: [{c: [100, 250, 200, 250], door: 1}],
    lights: [{x: 200, y: 300, config: {bright: 12, dim: 24}}],
    tokens: [{x: 100, y: 150, width: 1, height: 1, actorId: 'abc'}],
    tiles: [{x: 100, y: 150, width: 100, height: 200}],
    drawings: [{x: 50, y: 60, shape: {width: 100,height: 50,points:[1,3,5,7]}}]
  };
  const large = expandSceneGeometry(original);
  assert.deepEqual([large.width, large.height], [6144, 4096]);
  assert.equal(large.grid.size, 128);
  assert.deepEqual(large.walls[0].c, [200, 500, 400, 500]);
  assert.equal(large.walls[0].door, 1);
  assert.deepEqual([large.lights[0].x,large.lights[0].y,large.lights[0].config.dim], [400,600,48]);
  assert.deepEqual([large.tokens[0].x, large.tokens[0].y, large.tokens[0].width, large.tokens[0].height], [200,300,1,1]);
  assert.deepEqual(large.drawings[0].shape.points, [2,6,10,14]);
  assert.deepEqual([original.width, original.walls[0].c[0], original.tokens[0].x], [3072,100,100]);
  assert.equal(large.background.src, original.background.src);
});

test('rejects unsupported geometry scales', () => {
 assert.throws(()=>expandSceneGeometry({width:100,height:100},1), /scale/i);
 assert.throws(()=>expandSceneGeometry({},2), /numeric/);
});
