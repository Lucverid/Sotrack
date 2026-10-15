import test from 'node:test';
import assert from 'node:assert/strict';
import {parseManeuvers,buildNavigation,nextManeuver,estimateArrival,navigationDistance} from '../navigation-core.js';
import {routeProgress} from '../focus-core.js';
const points=[{lat:0,lon:0},{lat:.001,lon:0},{lat:.001,lon:.001},{lat:.002,lon:.001}];
test('BRouter hints preserve commands and roundabout exit, reject malformed or unsupported hints',()=>{
  assert.deepEqual(parseManeuvers({voicehints:[[1,5,0,100,90],[2,13,3,20,0],[-1,2],[4,2],[1,99],null,[1,'5']]},4),[{index:1,command:5,exit:0},{index:2,command:13,exit:3}]);
  const n=buildNavigation({points,maneuvers:[{index:1,command:5},{index:2,command:13,exit:3}]});
  assert.equal(n.cues[0].text,'Belok kanan');assert.equal(n.cues[0].estimated,false);assert.equal(n.cues[1].text,'Bundaran · keluar 3');
});
test('Geometry fallback distinguishes left and right and labels the cues as estimates',()=>{
  const n=buildNavigation({points});assert.equal(n.cues.length,2);assert.equal(n.cues[0].text,'Belok kanan');assert.equal(n.cues[1].text,'Belok kiri');assert.ok(n.cues.every(c=>c.estimated));
});
test('The next maneuver measures along the route, advances after passing and hides off-route cues',()=>{
  const n=buildNavigation({points});const p=routeProgress(points,{lat:.0005,lon:0});const cue=nextManeuver(n,p);
  assert.equal(cue.index,1);assert.ok(cue.meters>50&&cue.meters<60);
  assert.equal(nextManeuver(n,{along:n.cues[0].along+15,gap:0}).index,2);
  assert.equal(nextManeuver(n,{along:0,gap:150}),null);
});
test('Current-speed ETA returns remaining minutes and clock time and avoids division at a stop',()=>{
  const eta=estimateArrival(10000,20,0);assert.equal(eta.minutes,30);assert.equal(eta.arrival,1800000);
  assert.equal(estimateArrival(10000,10,0).minutes,60);
  for(const speed of [0,1,NaN,100])assert.equal(estimateArrival(1000,speed),null);
  assert.equal(estimateArrival(-10,20),null);assert.equal(estimateArrival(0,20,0).arrival,0);
});
test('Distance display uses meters near turns and km for longer distances',()=>{
  assert.equal(navigationDistance(148),'150 m');assert.equal(navigationDistance(2500),'2.5 km');
});
test('Separated GPX segments do not invent travel distance or turns across gaps',()=>{
  const separated=[{lat:0,lon:0},{lat:.001,lon:0},{lat:1,lon:1,break:true},{lat:1.001,lon:1}];
  const n=buildNavigation({points:separated});assert.equal(n.cues.length,0);assert.ok(n.total<225);
  assert.ok(routeProgress(separated,separated[0]).total<225);
});
