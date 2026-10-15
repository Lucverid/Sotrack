export function preferLightMap(width,height,memory,cores){return Math.min(width,height)<=400||memory>0&&memory<=2||cores>0&&cores<=2;}
export function visibleMapAnchor(width,height,padding={}){const left=padding.left||0,right=padding.right||0,top=padding.top||0,bottom=padding.bottom||0;return {x:left+Math.max(0,width-left-right)/2,y:top+Math.max(0,height-top-bottom)*.62};}
