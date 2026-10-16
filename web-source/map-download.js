import {mergeOverpass,splitBounds} from './pro-core.js';
import {serviceURL} from './explore-core.js';
const primary='https://overpass-api.de/api/interpreter',backup='https://overpass.private.coffee/api/interpreter';
let preferred=null;
const aborted=()=>new DOMException('Dibatalkan','AbortError');
export function waitRoads(ms,signal){return new Promise((resolve,reject)=>{if(signal?.aborted)return reject(aborted());const stop=()=>{clearTimeout(timer);reject(aborted());},timer=setTimeout(()=>{signal?.removeEventListener('abort',stop);resolve();},ms);signal?.addEventListener('abort',stop,{once:true});});}
export async function requestRoads(bounds,{endpoint=primary,signal,onProgress=()=>{},onPart=async()=>{},skipBounds=()=>false,fetcher=globalThis.fetch,maxParts=4,pause=1500}={}){
 serviceURL(endpoint);const km=Math.max(bounds[2]-bounds[0],(bounds[3]-bounds[1])*Math.cos((bounds[0]+bounds[2])/2*Math.PI/180))*111.195;
 const queue=splitBounds(bounds,Math.max(1,Math.min(maxParts,Math.ceil(km/2.05)))).map(bounds=>({bounds,depth:0})),results=[];let done=0,attempts=0;
 while(queue.length){if(signal?.aborted)throw aborted();const cell=queue.shift();if(skipBounds(cell.bounds)){done++;continue;}let data,last;
 const servers=endpoint===primary?[preferred||primary,(preferred||primary)===primary?backup:primary]:[endpoint];
 for(const server of servers){if(signal?.aborted)throw aborted();if(attempts++)await waitRoads(pause,signal);onProgress({done,total:done+queue.length+1,stage:server!==endpoint?'Server utama sibuk · mencoba server cadangan':'Mengambil jalan'});
  const ctrl=new AbortController(),relay=()=>ctrl.abort();signal?.addEventListener('abort',relay,{once:true});const timer=setTimeout(relay,40000);
  try{const query=`[out:json][timeout:20][maxsize:16777216];way["highway"](${cell.bounds.join(',')});out body geom;`;
   if(globalThis.window?.SotrackOfflineRoads&&[primary,backup].includes(server))data=await window.SotrackOfflineRoads(server,query,ctrl.signal);
   else{const response=await fetcher(server,{method:'POST',body:new URLSearchParams({data:query}),signal:ctrl.signal});if(!response.ok){const error=Error('Server peta merespons '+response.status);error.status=response.status;throw error;}data=await response.json();}
   if(data.remark||!Array.isArray(data.elements)){const error=Error('Data jalan belum lengkap');error.status=504;throw error;}
   if(endpoint===primary)preferred=server;last=null;break;
  }catch(error){if(signal?.aborted)throw aborted();last=error;data=null;if(error.status&&![408,429,500,502,503,504].includes(error.status))throw error;}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',relay);}
 }
 if(last){if(cell.depth<1&&(!last.status||[408,500,502,503,504].includes(last.status))){queue.unshift(...splitBounds(cell.bounds,2).map(bounds=>({bounds,depth:cell.depth+1})));onProgress({done,total:done+queue.length,stage:'Server sibuk · memperkecil area'});continue;}throw Error('Server peta masih sibuk atau belum terhubung. Bagian yang selesai tetap tersimpan. Tekan Lanjutkan nanti.');}
 if(signal?.aborted)throw aborted();
 await onPart(mergeOverpass([data]),cell.bounds);results.push(data);done++;onProgress({done,total:done+queue.length,stage:'Bagian tersimpan'});
 }
 return mergeOverpass(results);
}
