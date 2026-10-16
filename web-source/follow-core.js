export function shouldResumeFollow({following,focused,recording,interacting,lastInteraction,now,fixTime,accuracy}){
 return !following&&focused&&recording&&!interacting&&now-lastInteraction>=5000&&Number.isFinite(fixTime)&&now-fixTime>=0&&now-fixTime<15000&&Number.isFinite(accuracy)&&accuracy<=50;
}
export function meaningfulMapDrag(dx,dy){return Math.abs(dx)+Math.abs(dy)>5;}
