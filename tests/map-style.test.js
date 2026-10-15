import test from 'node:test';
import assert from 'node:assert/strict';
import {vectorCamera,vectorStyles} from '../map-style-core.js';
test('Modern map bridge matches native scale, heading and rider screen anchor',()=>{
  const v=vectorCamera({center:{lat:0,lon:1},zoom:16,bearing:90,y:660,height:1000});
  assert.equal(v.zoom,15);assert.equal(v.bearing,90);assert.equal(v.pitch,0);assert.equal(v.padding.top,320);assert.deepEqual(v.center,[1,0]);
});
test('Overview uses centered zero padding and only official OpenFreeMap styles',()=>{
  const v=vectorCamera({center:{lat:0,lon:0},zoom:3,bearing:0,y:250,height:500});assert.equal(v.padding.top,0);
  assert.ok(Object.values(vectorStyles).every(u=>u.startsWith('https://tiles.openfreemap.org/styles/')));
});
test('Tilt camera is explicit, bounded and preserves the route anchor',()=>{
  const c={center:{lat:1,lon:2},zoom:17,bearing:130,y:500,height:800,pitch:40};
  assert.equal(vectorCamera(c).pitch,40);assert.equal(vectorCamera(c).padding.top,200);assert.equal(vectorCamera({...c,pitch:100}).pitch,50);assert.equal(vectorCamera({...c,pitch:-10}).pitch,0);
});
