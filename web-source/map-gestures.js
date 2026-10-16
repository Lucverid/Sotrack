import {touchPair,turnDelta,gestureView} from './gesture-core.js';
const api=window.sotrack,map=document.querySelector('#map'),points=new Map();let gesture=null,blocked=false;
function startPair(){const [a,b]=[...points.values()],pair=touchPair(a,b);gesture={lastAngle:pair.angle,rotation:0,bearing:api.mapBearing,zoom:api.zoom,span:pair.span,turned:false};blocked=true;api.stopDrag();}
map.addEventListener('pointerdown',event=>{
 if(event.pointerType!=='touch'||event.target.closest('button,a,.focus-ui'))return;
 if(points.size>=2){event.preventDefault();event.stopImmediatePropagation();return;}
 points.set(event.pointerId,{x:event.clientX,y:event.clientY});
 if(points.size===2){startPair();map.setPointerCapture(event.pointerId);event.preventDefault();event.stopImmediatePropagation();}
},{capture:true,passive:false});
map.addEventListener('pointermove',event=>{
 if(!points.has(event.pointerId))return;
 points.set(event.pointerId,{x:event.clientX,y:event.clientY});
 if(!blocked)return;
 event.preventDefault();event.stopImmediatePropagation();api.stopDrag();
 if(points.size!==2||!gesture)return;
 const [a,b]=[...points.values()],pair=touchPair(a,b);
 gesture.rotation+=turnDelta(gesture.lastAngle,pair.angle);gesture.lastAngle=pair.angle;
 if(Math.abs(gesture.rotation)>=5)gesture.turned=true;
 const view=gestureView(gesture.bearing,gesture.rotation,gesture.zoom,gesture.span,pair.span);
 if(gesture.turned)api.setMapBearing(view.bearing);
 if(view.zoom!==api.zoom)api.zoom=view.zoom;
},{capture:true,passive:false});
function end(event){if(!points.has(event.pointerId))return;points.delete(event.pointerId);if(blocked){event.stopImmediatePropagation();api.stopDrag();}if(!points.size){blocked=false;gesture=null;}}
map.addEventListener('pointerup',end,true);map.addEventListener('pointercancel',end,true);map.addEventListener('lostpointercapture',end,true);
function reset(){points.clear();gesture=null;blocked=false;api.stopDrag();}
window.addEventListener('blur',reset);window.addEventListener('sotrack:tab',reset);document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
