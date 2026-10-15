import {distance} from './core.js';
import {simplify} from './explore-core.js';
const commands={1:['↑','Lanjut lurus'],2:['↰','Belok kiri'],3:['↖','Sedikit ke kiri'],4:['↰','Belok tajam kiri'],5:['↱','Belok kanan'],6:['↗','Sedikit ke kanan'],7:['↱','Belok tajam kanan'],8:['↖','Ambil jalur kiri'],9:['↗','Ambil jalur kanan'],10:['↶','Putar balik'],11:['↷','Putar balik'],13:['⟳','Bundaran'],14:['⟲','Bundaran'],15:['↶','Putar balik'],17:['↖','Keluar ke kiri'],18:['↗','Keluar ke kanan']};
// BRouter FormatJson: [track index, command, roundabout exit, distance to next, angle].
export function parseManeuvers(properties,pointCount){
  if(!Array.isArray(properties?.voicehints))return [];
  return properties.voicehints.slice(0,10000).flatMap(h=>Array.isArray(h)&&Number.isInteger(h[0])&&h[0]>=0&&h[0]<pointCount&&Number.isInteger(h[1])&&commands[h[1]]?[{index:h[0],command:h[1],exit:Number.isInteger(h[2])&&h[2]>0&&h[2]<30?h[2]:0}]:[]).sort((a,b)=>a.index-b.index);
}
function bearing(a,b){const r=Math.PI/180,dl=(b.lon-a.lon)*r;return Math.atan2(Math.sin(dl)*Math.cos(b.lat*r),Math.cos(a.lat*r)*Math.sin(b.lat*r)-Math.sin(a.lat*r)*Math.cos(b.lat*r)*Math.cos(dl))/r;}
export function buildNavigation(route){
  const points=route?.points;if(!points||points.length<2)return {cues:[],total:0};
  const cumulative=[0];for(let i=1;i<points.length;i++)cumulative[i]=cumulative[i-1]+(points[i].break?0:distance(points[i-1],points[i]));
  const hints=Array.isArray(route.maneuvers)?parseManeuvers({voicehints:route.maneuvers.filter(h=>h&&typeof h==='object').map(h=>[h.index,h.command,h.exit])},points.length):[];
  let cues=hints.filter(h=>h.index>0).map(h=>{const [icon,text]=commands[h.command];return {...h,icon,text:[13,14].includes(h.command)&&h.exit?`${text} · keluar ${h.exit}`:text,along:cumulative[h.index],point:points[h.index],estimated:false};});
  if(!cues.length){
    // Geometry can estimate a bend, but cannot identify junctions or road permissions.
    const segments=[];let segment=[];for(const p of points){if(p.break&&segment.length){segments.push(segment);segment=[];}segment.push(p);}if(segment.length)segments.push(segment);
    for(const segment of segments){const simple=simplify(segment,8),indices=[];let cursor=points.indexOf(segment[0]);
    for(const p of simple){while(cursor<points.length&&(points[cursor].lat!==p.lat||points[cursor].lon!==p.lon))cursor++;if(cursor<points.length)indices.push(cursor++);}
    for(let j=1;j<indices.length-1;j++){
      const i=indices[j],a=points[indices[j-1]],b=points[i],c=points[indices[j+1]];
      if(b.break||c.break||distance(a,b)<12||distance(b,c)<12)continue;
      const angle=((bearing(b,c)-bearing(a,b)+540)%360)-180;
      if(Math.abs(angle)<35)continue;
      const [icon,text]=commands[Math.abs(angle)>150?10:angle>0?5:2];
      cues.push({index:i,icon,text,along:cumulative[i],point:b,estimated:true});
    }}
  }
  return {cues,total:cumulative.at(-1)};
}
export function nextManeuver(navigation,progress){
  if(!progress||progress.gap>100)return null;
  const cue=navigation.cues.find(c=>c.along>=progress.along-8);
  return cue?{...cue,meters:Math.max(0,cue.along-progress.along)}:null;
}
export function estimateArrival(remaining,speedKmh,now=Date.now()){
  if(!Number.isFinite(remaining)||remaining<0||!Number.isFinite(speedKmh)||speedKmh<2||speedKmh>90)return null;
  const ms=remaining/(speedKmh*1000)*3600000;
  return {ms,minutes:Math.ceil(ms/60000),arrival:now+ms};
}
export function navigationDistance(meters){return meters>=1000?(meters/1000).toFixed(1)+' km':Math.max(0,Math.round(meters/10)*10)+' m';}
