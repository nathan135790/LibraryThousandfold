import test from 'node:test';import assert from 'node:assert/strict';
import {POWERS,tier,outcome,recovered} from '../scripts/temporal-rules.mjs';
test('unlimited charges',()=>assert.equal(Object.keys(POWERS).length,5));
test('tiers',()=>assert.deepEqual([0,3,6,9,90].map(tier),[0,1,2,3,3]));
test('crossing six ages',()=>assert.equal(outcome(5,'stolen-seconds').ageSix,true));
test('crossing nine causes backlash',()=>{const a=outcome(8,'stolen-seconds');assert.equal(a.ageNine,true);assert.equal(a.critical,true)});
test('after nine years cost each activation',()=>assert.equal(outcome(10,'stolen-seconds').ageLater,true));
test('recovery never resets years',()=>assert.equal(recovered(12),9));
