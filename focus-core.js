import {distance,project,unproject} from './core.js';
export function fitRouteView(points,width,height,padding={}){
  if(!points?.length||width<=0||height<=0)return null;
  const {top=20,bottom=20,left=20,right=20}=padding;
  const usableWidth=Math.max(60,width-left-right),usableHeight=Math.max(60,height-top-bottom);
  for(let zoom=18;zoom>=3;zoom--){
    let west=Infinity,east=-Infinity,north=Infinity,south=-Infinity;
    for(const point of points){const p=project(point,zoom);west=Math.min(west,p.x);east=Math.max(east,p.x);north=Math.min(north,p.y);south=Math.max(south,p.y);}
    if((east-west<=usableWidth*.9&&south-north<=usableHeight*.9)||zoom===3){
      const desiredX=left+usableWidth/2,desiredY=top+usableHeight/2;
      return {zoom,center:unproject({x:(west+east)/2+width/2-desiredX,y:(north+south)/2+height/2-desiredY},zoom)};
    }
  }
}
// Project onto segments, rather than snapping to a possibly distant route vertex.
export function routeProgress(points,position){
  if(!position||!points||points.length<2)return null;
  let total=0,best=null;
  const scale=Math.cos(position.lat*Math.PI/180),m=111195;
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i];if(b.break)continue;const length=distance(a,b);
    const ax=(a.lon-position.lon)*scale*m,ay=(a.lat-position.lat)*m;
    const dx=(b.lon-a.lon)*scale*m,dy=(b.lat-a.lat)*m;
    const t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/(dx*dx+dy*dy||1)));
    const gap=Math.hypot(ax+t*dx,ay+t*dy);
    if(!best||gap<best.gap)best={gap,along:total+t*length,index:i,t};
    total+=length;
  }
  return {...best,total,remaining:Math.max(0,total-best.along)};
}
