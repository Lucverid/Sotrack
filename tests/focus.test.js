import test from 'node:test';
import assert from 'node:assert/strict';
import {routeProgress,fitRouteView} from '../focus-core.js';
import {project} from '../core.js';
const route=[{lat:0,lon:0},{lat:0,lon:.01},{lat:.01,lon:.01}];
test('Progress uses position along a sparse segment, rather than its nearest vertex',()=>{
  const result=routeProgress(route,{lat:0,lon:.005});
  assert.ok(result.gap<.01);assert.ok(Math.abs(result.remaining-result.total*.75)<1);
});
test('An off-route fix keeps its real perpendicular distance and clamps to route endpoints',()=>{
  const result=routeProgress(route,{lat:-.002,lon:.004});assert.ok(result.gap>220&&result.gap<225);
  const end=routeProgress(route,{lat:.02,lon:.01});assert.equal(end.remaining,0);assert.ok(end.gap>1000);
});
test('Duplicate route points do not produce NaN or hide remaining distance',()=>{
  const result=routeProgress([route[0],route[0],route[1]],{lat:0,lon:.005});assert.ok(Number.isFinite(result.remaining));assert.ok(result.remaining>500);
});
test('No route or GPS fix produces no navigation estimate',()=>{
  assert.equal(routeProgress(null,null),null);assert.equal(routeProgress(undefined,{lat:0,lon:0}),null);assert.equal(routeProgress([],{lat:0,lon:0}),null);
});
test('Full route overview keeps endpoints clear of the mobile trip card and bottom sheet',()=>{
  const points=[{lat:-7.327,lon:108.22},{lat:-7.17,lon:108.08},{lat:-7.24,lon:108.12}];
  const width=385,height=845,padding={top:175,bottom:180,left:20,right:75};
  const view=fitRouteView(points,width,height,padding),center=project(view.center,view.zoom);
  for(const point of points){const q=project(point,view.zoom),x=q.x-center.x+width/2,y=q.y-center.y+height/2;
    assert.ok(x>=padding.left&&x<=width-padding.right);assert.ok(y>=padding.top&&y<=height-padding.bottom);
  }
  assert.equal(fitRouteView([],width,height),null);
});
