import {distance} from './core.js';
export function hrZone(hr,maxHR){if(!Number.isFinite(hr)||hr<=0||!Number.isFinite(maxHR)||maxHR<=0)return null;return Math.max(1,Math.min(5,Math.floor(hr/maxHR*10)-4));}
export function buildReplay(ride,fallbackMaxHR=200){
  const points=(ride.points||[]).slice(0,100000).filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&Number.isFinite(p.time)).sort((a,b)=>a.time-b.time);
  const frames=[];let active=0,covered=0,previous=null;
  const exact=points.length>0&&points.every((p,i)=>Number.isFinite(p.activeMs)&&p.activeMs>=0&&(!i||p.activeMs>=points[i-1].activeMs));
  for(const p of points){
    const dt=previous?(p.time-previous.time)/1000:0,continuous=previous&&!p.break&&dt>0&&dt<=30;
    if(exact)active=p.activeMs;else if(continuous)active+=dt*1000;
    const meters=continuous?distance(previous,p):0;covered+=meters;
    let speed=Number.isFinite(p.speedKmh)?p.speedKmh:Number.isFinite(p.speed)&&p.speed>=0?p.speed*3.6:continuous?meters/dt*3.6:null;
    if(speed!=null&&(speed<0||speed>90))speed=null;
    frames.push({...p,t:active,km:covered/1000,speedKmh:speed,hr:Number.isFinite(p.hr)&&p.hr>0?p.hr:null,gap:!!previous&&!continuous});previous=p;
  }
  const hrs=(ride.hrSamples||[]).slice(0,100000).flatMap(s=>{
    if(!Number.isFinite(s.hr)||s.hr<=0||!Number.isFinite(s.time))return [];
    if(Number.isFinite(s.activeMs)&&s.activeMs>=0)return [{t:s.activeMs,time:s.time,hr:s.hr}];
    let low=0,high=frames.length;while(low<high){const mid=(low+high)>>1;if(frames[mid].time<s.time)low=mid+1;else high=mid;}
    const a=frames[low-1],b=frames[low];
    if(a&&b&&!b.gap&&b.time>a.time&&b.time-a.time<=30000)return [{t:a.t+(b.t-a.t)*(s.time-a.time)/(b.time-a.time),time:s.time,hr:s.hr}];
    const near=b||a;return near&&Math.abs(near.time-s.time)<=10000?[{t:near.t,time:s.time,hr:s.hr}]:[];
  }).sort((a,b)=>a.t-b.t);
  const samples=hrs.length?hrs:frames.filter(f=>f.hr!=null).map(f=>({t:f.t,time:f.time,hr:f.hr}));
  const maxHR=Number.isFinite(ride.maxHR)&&ride.maxHR>0?ride.maxHR:fallbackMaxHR;
  const zones=[0,0,0,0,0];for(let i=0;i<samples.length-1;i++){const a=samples[i],b=samples[i+1],dt=(b.t-a.t)/1000,wall=(b.time-a.time)/1000;if(dt<=0||dt>10||wall<=0||wall>10)continue;zones[hrZone(a.hr,maxHR)-1]+=dt;}
  const topSpeed=frames.reduce((max,f)=>Math.max(max,f.speedKmh??0),Number.isFinite(ride.maxSpeed)?ride.maxSpeed:0);
  return {start:ride.start||frames[0]?.time||0,frames,samples,zones,maxHR,topSpeed,duration:Math.max(frames.at(-1)?.t||0,exact&&Number.isFinite(ride.elapsed)?ride.elapsed:0),exact};
}
export function replayAt(model,time){
  const frames=model.frames;if(!frames.length)return null;const t=Math.max(0,Math.min(model.duration,time));
  let low=0,high=frames.length;while(low<high){const m=(low+high)>>1;if(frames[m].t<=t)low=m+1;else high=m;}
  const index=Math.max(0,low-1),a=frames[index],b=frames[index+1];
  if(t<a.t)return {wallTime:model.start+t,time:t,index:0,lat:a.lat,lon:a.lon,speed:null,hr:null,zone:null,km:0,gap:true};
  const interpolate=b&&!b.gap&&b.t>a.t&&b.time-a.time<=30000;
  const ratio=interpolate?Math.max(0,Math.min(1,(t-a.t)/(b.t-a.t))):0;
  const stale=t-a.t>15000&&!interpolate;
  let hr=null;low=0;high=model.samples.length;while(low<high){const m=(low+high)>>1;if(model.samples[m].t<=t)low=m+1;else high=m;}
  const sample=model.samples[low-1];if(sample&&t-sample.t<=10000)hr=sample.hr;else if(!stale&&a.hr!=null)hr=a.hr;
  const speed=stale?null:a.speedKmh!=null&&b?.speedKmh!=null&&interpolate?a.speedKmh+(b.speedKmh-a.speedKmh)*ratio:a.speedKmh;
  return {wallTime:a.time+(b?b.time-a.time:0)*ratio,time:t,index,lat:a.lat+(b?b.lat-a.lat:0)*ratio,lon:a.lon+(b?b.lon-a.lon:0)*ratio,speed,hr,zone:hrZone(hr,model.maxHR),km:a.km+(b?b.km-a.km:0)*ratio,gap:!interpolate&&!!b&&b.gap};
}
