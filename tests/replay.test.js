import test from 'node:test';
import assert from 'node:assert/strict';
import {buildReplay,replayAt,hrZone} from '../replay-core.js';
const p=(time,lat,extra={})=>({time,lat,lon:0,...extra});
test('Replay retains recorded active time, current speed, HR and recorded max HR',()=>{
  const m=buildReplay({elapsed:10000,maxHR:180,maxSpeed:35,points:[p(1000,0,{activeMs:0,speedKmh:18,hr:120}),p(11000,.001,{activeMs:10000,speedKmh:22,hr:150})],hrSamples:[{time:1000,activeMs:0,hr:120},{time:6000,activeMs:5000,hr:140}]});
  const f=replayAt(m,5000);assert.equal(f.speed,20);assert.equal(f.hr,140);assert.equal(f.zone,3);assert.equal(m.topSpeed,35);assert.equal(m.exact,true);assert.equal(m.zones.reduce((a,b)=>a+b,0),5);
});
test('Old raw GPS speed is converted from meters per second, missing HR stays absent',()=>{
  const m=buildReplay({points:[p(1000,0,{speed:5}),p(11000,.0005,{speed:5})]});assert.equal(replayAt(m,5000).speed,18);assert.equal(replayAt(m,5000).hr,null);assert.equal(m.exact,false);
});
test('GPS fallback does not bridge a manual pause or a long signal gap',()=>{
  const m=buildReplay({points:[p(1000,0),p(11000,.0005),p(90000,1,{break:true}),p(100000,1.0005)]});assert.equal(m.duration,20000);assert.ok(m.frames.at(-1).km<.2);assert.equal(m.frames[2].speedKmh,null);assert.equal(replayAt(m,10000).lat,1);
});
test('Before the first GPS fix, replay never reveals future HR/speed',()=>{
  const m=buildReplay({elapsed:15000,points:[p(6000,0,{activeMs:5000,speedKmh:20,hr:150}),p(16000,.001,{activeMs:15000,speedKmh:20,hr:150})]});const f=replayAt(m,0);assert.equal(f.hr,null);assert.equal(f.speed,null);
});
test('Sensor gaps are excluded from zone durations and old samples expire',()=>{
  const m=buildReplay({elapsed:40000,maxHR:200,points:[p(1000,0,{activeMs:0}),p(41000,.001,{activeMs:40000})],hrSamples:[{time:1000,activeMs:0,hr:180},{time:41000,activeMs:40000,hr:180}]});assert.equal(m.zones.reduce((a,b)=>a+b,0),0);assert.equal(replayAt(m,20000).hr,null);
});
test('Zone boundaries match live computer and empty activities are safe',()=>{
  assert.equal(hrZone(null,200),null);assert.equal(hrZone(120,200),2);assert.equal(hrZone(180,200),5);assert.equal(replayAt(buildReplay({points:[]}),0),null);
});
