import {requestRoads,waitRoads} from './map-download.js';
import {simplify,boundsFor} from './explore-core.js';
import {packCovers,corridorPlan,corridorBounds,chunkCovered} from './offline-map-core.js';
const api=window.sotrack,$=s=>document.querySelector(s),toggle=$('#autoOfflineMap'),status=$('#autoOfflineMapStatus'),retry=$('#retryAutoOfflineMap');
let ready=false,running=false,controller=null,timer=null,epoch=0,pending=false,retryAfter=0,enabled=true,requestedRoute=null,manual=null;
function online(){return window.SotrackAndroidOnline?window.SotrackAndroidOnline():navigator.onLine;}
function message(text,canRetry=false){status.textContent=text;retry.hidden=!canRetry;api.offlineMapStatus=text;}
function schedule(delay=1500){pending=true;clearTimeout(timer);timer=setTimeout(run,delay);}
function changed(){epoch++;controller?.abort();retryAfter=0;schedule();}
function boxCovered(b){return api.packs.some(p=>!p.corridor&&p.bounds&&p.bounds[0]<=b[0]+1e-9&&p.bounds[1]<=b[1]+1e-9&&p.bounds[2]>=b[2]-1e-9&&p.bounds[3]>=b[3]-1e-9);}
function controls(busy){for(const id of ['downloadMap','downloadCorridor'])if($('#'+id))$('#'+id).disabled=busy;if($('#cancelMap'))$('#cancelMap').hidden=!busy;}
async function run(){
 if(running||!ready||(!enabled&&!manual))return;
 if(!online()){message('Offline · peta tersimpan dipakai otomatis. Area baru perlu internet.',!!manual);return;}
 if(Date.now()<retryAfter)return;
 pending=false;running=true;controls(true);controller=new AbortController();const signal=controller.signal,own=epoch,job=manual;
 try{
 const route=job?.type==='area'?null:requestedRoute||api.activeRoute;let plan;
 if(route?.points?.length>1){const points=[];let segment=[];const flush=()=>{if(segment.length){const reduced=simplify(segment,35);if(points.length)reduced[0]={...reduced[0],break:true};points.push(...reduced);segment=[];}};for(const p of route.points){if(p.break&&segment.length)flush();segment.push(p);}flush();plan=corridorPlan(points,{maxMeters:1500,limit:200});const missing=plan.chunks.filter(line=>!chunkCovered(line,api.packs));if(!missing.length){message('Peta sepanjang rute siap offline.');manual=null;return;}plan.limited=plan.limited||missing.length>12;plan.chunks=missing.slice(0,12);
 }else{const p=job?.point||api.position||api.center;if(!p)throw Error('Lokasi belum tersedia. Buka peta dan pilih area dahulu.');const bounds=boundsFor(p,job?.km||2);if(boxCovered(bounds)){message('Peta area ini sudah tersimpan.');manual=null;return;}plan={chunks:null,point:p,bounds,limited:false};}
 const chunks=plan.chunks||[null];let done=0;
 for(const line of chunks){
  if(signal.aborted||own!==epoch)throw new DOMException('Dibatalkan','AbortError');
  const bounds=line?corridorBounds(line,500):plan.bounds;
  await requestRoads(bounds,{endpoint:api.services.overpass,signal,skipBounds:boxCovered,onProgress:p=>message(`Bagian rute/area ${done+1}/${chunks.length} · ${p.stage} (${p.done}/${p.total}). Tetap online.`),onPart:async(data,cell)=>{
   if(signal.aborted||own!==epoch)throw new DOMException('Dibatalkan','AbortError');
   if(api.packs.length>=100)throw Error('Penyimpanan area penuh. Hapus area lama yang tidak dipakai.');
   const name=job?.name|| (route?'Rute · '+route.name.slice(0,50):'Sekitar peta');
   const pack=api.normalizePack({data,bounds:cell,name:name+' · '+cell[0].toFixed(3)+', '+cell[1].toFixed(3)},'Peta offline');pack.autoOffline=!job;await api.addPack(pack);
  }});
  done++;if(done<chunks.length)await waitRoads(1500,signal);
 }
 if(!plan.limited)manual=null;
 message(plan.limited?'Sebagian rute tersimpan. Tekan Lanjutkan untuk bagian berikutnya.':route?'Peta sepanjang rute siap offline.':'Peta sekitar peta yang dipilih siap offline.',plan.limited);
 }catch(error){if(error.name==='AbortError'&&signal.aborted)message('Persiapan dijeda. Bagian yang selesai tetap tersimpan.',true);else{retryAfter=Date.now()+300000;message('Peta belum selesai. '+error.message,true);}}
 finally{running=false;controller=null;controls(false);if(pending&&(enabled||manual)&&online())schedule(2000);}
}
toggle.onchange=async()=>{enabled=toggle.checked;epoch++;controller?.abort();manual=null;try{await api.updateSettings({autoOfflineMap:enabled});}catch{message('Pilihan belum tersimpan.');}if(enabled){retryAfter=0;schedule(0);}else message('Otomatis nonaktif. Tombol simpan manual tetap bisa dipakai.');};
retry.onclick=()=>{retryAfter=0;if(!enabled&&!manual)manual={type:'route'};schedule(0);};
if($('#downloadMap'))$('#downloadMap').onclick=()=>{manual={type:'area',point:{...api.center},km:Number($('#mapArea').value),name:$('#mapAreaName').value.trim()};changed();};
if($('#downloadCorridor'))$('#downloadCorridor').onclick=()=>{if(!api.activeRoute?.points?.length){api.toast('Pilih rute aktif dahulu dari daftar rute.');return;}requestedRoute=null;manual={type:'route'};changed();};
if($('#cancelMap'))$('#cancelMap').onclick=()=>{pending=false;clearTimeout(timer);epoch++;controller?.abort();};
window.addEventListener('sotrack:ready',()=>{ready=true;enabled=api.settings.autoOfflineMap!==false;toggle.checked=enabled;if(enabled)schedule(2000);else message('Otomatis nonaktif. Pilih salah satu tombol simpan di bawah.');});
window.addEventListener('sotrack:route',()=>{requestedRoute=null;manual=null;changed();});
window.addEventListener('online',()=>{retryAfter=0;schedule(1500);});
window.addEventListener('offline',()=>{epoch++;controller?.abort();message('Offline · peta tersimpan dipakai otomatis. Area baru perlu internet.');});
let lastPositionAt=0;window.addEventListener('sotrack:position',()=>{if(api.activeRoute||Date.now()-lastPositionAt<60000||!api.position||api.position.accuracy>100)return;lastPositionAt=Date.now();if(!api.packs.some(p=>packCovers(api.position,p)))schedule(2000);});
api.prepareOfflineMap=route=>{requestedRoute=route||null;changed();};
