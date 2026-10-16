import {project,unproject} from './core.js';
export function travelBearing(a,b){const r=Math.PI/180,dl=(b.lon-a.lon)*r;return (Math.atan2(Math.sin(dl)*Math.cos(b.lat*r),Math.cos(a.lat*r)*Math.sin(b.lat*r)-Math.sin(a.lat*r)*Math.cos(b.lat*r)*Math.cos(dl))/r+360)%360;}
export function smoothBearing(previous,next,gain=.3){if(!Number.isFinite(previous))return next;return (previous+(((next-previous+540)%360)-180)*gain+360)%360;}
export function mapCamera(center,zoom,width,height,bearing=0,anchorY=.5){
  const origin=project(center,zoom),angle=-bearing*Math.PI/180;
  return {origin,zoom,width,height,bearing,cos:Math.cos(angle),sin:Math.sin(angle),x:width/2,y:height*anchorY};
}
export function worldToScreen(point,camera){
  const p=project(point,camera.zoom),dx=p.x-camera.origin.x,dy=p.y-camera.origin.y;
  return {x:camera.x+dx*camera.cos-dy*camera.sin,y:camera.y+dx*camera.sin+dy*camera.cos};
}
export function screenDelta(dx,dy,camera){return {x:dx*camera.cos+dy*camera.sin,y:-dx*camera.sin+dy*camera.cos};}
export function screenToWorld(x,y,camera){const d=screenDelta(x-camera.x,y-camera.y,camera);return unproject({x:camera.origin.x+d.x,y:camera.origin.y+d.y},camera.zoom);}
export function tileBounds(camera){
  const corners=[[0,0],[camera.width,0],[0,camera.height],[camera.width,camera.height]].map(([x,y])=>screenDelta(x-camera.x,y-camera.y,camera));
  return {west:camera.origin.x+Math.min(...corners.map(p=>p.x)),east:camera.origin.x+Math.max(...corners.map(p=>p.x)),north:camera.origin.y+Math.min(...corners.map(p=>p.y)),south:camera.origin.y+Math.max(...corners.map(p=>p.y))};
}
