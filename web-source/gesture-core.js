export function wrapBearing(value){return ((value%360)+360)%360;}
export function touchPair(a,b){return {angle:Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI,span:Math.hypot(b.x-a.x,b.y-a.y)};}
export function turnDelta(before,after){return ((after-before+540)%360)-180;}
export function gestureView(startBearing,rotation,startZoom,startSpan,span){return {bearing:wrapBearing(startBearing-rotation),zoom:Math.max(3,Math.min(18,startZoom+Math.round(Math.log2(Math.max(1,span)/Math.max(1,startSpan)))))};}
