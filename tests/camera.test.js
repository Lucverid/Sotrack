import test from 'node:test';
import assert from 'node:assert/strict';
import {mapCamera,worldToScreen,screenToWorld,screenDelta,tileBounds,smoothBearing,travelBearing} from '../camera-core.js';
import {project} from '../core.js';
const center={lat:0,lon:0};
test('Heading up places eastbound travel above the rider and leaves more map ahead',()=>{
  const c=mapCamera(center,16,385,845,90,.66),here=worldToScreen(center,c),ahead=worldToScreen({lat:0,lon:.001},c);
  assert.ok(here.y>845/2);assert.ok(Math.abs(ahead.x-here.x)<.001);assert.ok(ahead.y<here.y);
});
test('Rotated map picking round trips at all compass directions and screen edges',()=>{
  for(const bearing of [0,45,90,179,270,359]){const c=mapCamera(center,16,385,845,bearing,.66);
    for(const [x,y]of [[0,0],[385,845],[120,300],[385,0]]){const p=screenToWorld(x,y,c),q=worldToScreen(p,c);assert.ok(Math.abs(q.x-x)<1e-6);assert.ok(Math.abs(q.y-y)<1e-6);}
  }
});
test('Tile bounds cover every inverse projected viewport corner during rotation',()=>{
  for(const bearing of [0,30,90,160,270]){const c=mapCamera(center,16,385,845,bearing,.66),b=tileBounds(c);
    for(const [x,y]of [[0,0],[385,845],[0,845],[385,0]]){const p=project(screenToWorld(x,y,c),16);assert.ok(p.x>=b.west-1e-6&&p.x<=b.east+1e-6);assert.ok(p.y>=b.north-1e-6&&p.y<=b.south+1e-6);}
  }
});
test('Bearing smoothing crosses north by the short direction and panning respects rotation',()=>{
  assert.ok(smoothBearing(359,1)>.0);assert.ok(smoothBearing(359,1)>359||smoothBearing(359,1)<1);
  const c=mapCamera(center,16,385,845,90),d=screenDelta(100,0,c);assert.ok(Math.abs(d.x)<.001);assert.ok(Math.abs(d.y-100)<.001);
  assert.equal(smoothBearing(null,90),90);assert.ok(Math.abs(travelBearing(center,{lat:0,lon:.01})-90)<.001);
});
