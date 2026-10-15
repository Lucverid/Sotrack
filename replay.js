import {buildReplay,replayAt} from './replay-core.js';
import {fitRouteView} from './focus-core.js';
import {project} from './core.js';
const api=window.sotrack,$=s=>document.querySelector(s);
const clock=ms=>{const s=Math.floor(ms/1000);return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0')).join(':');};
let model=null,activity=null,panel=null,playing=false,time=0,last=0,raf=0,observer=null,images=new Map(),mapView=null,lastPaint=0;
function pause(){playing=false;cancelAnimationFrame(raf);if(panel?.isConnected)$('#replayPlay').textContent='▶ Putar';}
function tick(now){if(!playing||!panel?.isConnected||!$('#history').classList.contains('active')){pause();return;}time=Math.min(model.duration,time+(now-last)*Number($('#replayRate').value));last=now;if(now-lastPaint>100||time>=model.duration){render();lastPaint=now;}if(time>=model.duration)pause();else raf=requestAnimationFrame(tick);}
function open(ride){
  pause();observer?.disconnect();activity=ride;model=buildReplay(ride,api.settings.maxHR);time=0;images.clear();mapView=null;
  panel=document.createElement('section');panel.id='replayPanel';panel.className='replay-panel';
  panel.innerHTML=`<div class="sectiontitle"><h3>Replay aktivitas</h3><span class="badge">DATA REKAMAN</span></div><p id="replayNote" class="muted"></p><div class="replay-map" id="replayMap"><div id="replayTiles"></div><canvas id="replayCanvas" aria-label="Jalur aktivitas dan posisi pada waktu replay"></canvas><span id="replayMapSource"></span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a></div><div class="replay-stats"><div><small>SPEED SAAT INI</small><b id="replaySpeed">—</b><span>km/jam</span></div><div><small>HEART RATE</small><b id="replayHR">—</b><span>bpm</span></div><div><small>TOP SPEED AKTIVITAS</small><b id="replayTop">—</b><span>km/jam</span></div><div><small>ZONA HR</small><b id="replayZone">—</b><span id="replayZoneBasis"></span></div></div><div class="replay-wall"><b id="replayWallTime">—</b><span>WIB · waktu asli rekaman</span></div><div class="replay-time"><b id="replayTime">00:00:00</b><span id="replayDuration"></span></div><input id="replaySeek" type="range" min="0" value="0" step="100" aria-label="Geser waktu replay aktivitas"><div class="replay-controls"><button id="replayPlay" class="primary">▶ Putar</button><button id="replayReset" class="outline">↺ Ulang</button><label>Kecepatan replay <select id="replayRate"><option value="1">1×</option><option value="10">10×</option><option value="30" selected>30×</option><option value="60">60×</option></select></label></div><canvas id="replayChart" height="150" aria-label="Grafik speed dan HR sepanjang aktivitas"></canvas><p class="muted">Biru: speed · oranye: HR · garis vertikal: waktu replay. Celah sensor tetap kosong.</p><div id="replayZones" class="replay-zones"></div>`;
  $('#rideDetail').append(panel);
  $('#replayNote').textContent=!model.frames.length?'Tidak ada titik GPS bertimestamp untuk replay aktivitas ini.':model.exact?'Timeline memakai waktu aktif dan kecepatan yang terekam.':'Aktivitas lama: timeline/speed direkonstruksi dari titik GPS; jeda panjang tidak disambungkan.';
  $('#replayPlay').disabled=!model.frames.length||model.duration<=0;$('#replaySeek').max=model.duration;$('#replaySeek').disabled=!model.frames.length;
  $('#replayTop').textContent=model.topSpeed.toFixed(1);$('#replayDuration').textContent=' / '+clock(model.duration);
  $('#replayZoneBasis').textContent='Acuan '+model.maxHR+' bpm';
  const total=model.zones.reduce((a,b)=>a+b,0);
  $('#replayZones').innerHTML=model.zones.map((seconds,i)=>`<div><span>Z${i+1}</span><i style="--zone:${i+1};width:${total?seconds/total*100:0}%"></i><b>${clock(seconds*1000)}</b></div>`).join('')+`<p class="muted">Waktu dengan sampel HR kontinu: ${clock(total*1000)}. HR yang tidak terekam tidak diisi.</p>`;
  $('#replayPlay').onclick=()=>{if(playing){pause();return;}if(time>=model.duration)time=0;playing=true;last=performance.now();$('#replayPlay').textContent='Ⅱ Jeda replay';raf=requestAnimationFrame(tick);};
  $('#replayReset').onclick=()=>{pause();time=0;render();};$('#replaySeek').oninput=()=>{pause();time=Number($('#replaySeek').value);render();};
  observer=new ResizeObserver(render);observer.observe($('#replayMap'));render();
}
function drawMap(frame){
  const box=$('#replayMap'),canvas=$('#replayCanvas'),w=box.clientWidth,h=box.clientHeight;if(!w||!h)return;
  const dpr=devicePixelRatio||1;canvas.width=w*dpr;canvas.height=h*dpr;const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  if(!mapView||mapView.width!==w||mapView.height!==h)mapView={...fitRouteView(model.frames,w,h,{top:30,bottom:35,left:25,right:25}),width:w,height:h};const view=mapView;if(!view.center)return;
  const center=project(view.center,view.zoom),ox=center.x-w/2,oy=center.y-h/2,xy=p=>{const q=project(p,view.zoom);return{x:q.x-ox,y:q.y-oy};};
  const tiles=$('#replayTiles');tiles.replaceChildren();let rasterOK=false;
  if(navigator.onLine){const n=2**view.zoom;for(let x=Math.floor(ox/256);x<=Math.floor((ox+w)/256);x++)for(let y=Math.floor(oy/256);y<=Math.floor((oy+h)/256);y++){
    if(y<0||y>=n)continue;const key=`${view.zoom}/${(x%n+n)%n}/${y}`;let image=images.get(key);if(!image){image=new Image();image.alt='';image.referrerPolicy='strict-origin-when-cross-origin';image.src=`https://tile.openstreetmap.org/${key}.png`;image.onload=()=>{if(panel?.isConnected)render();};images.set(key,image);}if(image.complete&&image.naturalWidth)rasterOK=true;image.style.left=x*256-ox+'px';image.style.top=y*256-oy+'px';tiles.append(image);
  }}
  function line(points,color,width){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;let first=true;const skip=Math.max(1,Math.ceil(points.length/2500));for(let i=0;i<points.length;i++){const p=points[i];if(i%skip&&i!==points.length-1&&!p.break&&!points[i+1]?.break)continue;const q=xy(p);if(first||p.break)ctx.moveTo(q.x,q.y);else ctx.lineTo(q.x,q.y);first=false;}ctx.stroke();}
  if(!rasterOK)for(const pack of api.packs)for(const f of pack.features||[]){if(f.geometry?.type==='LineString')line(f.geometry.coordinates.map(c=>({lat:c[1],lon:c[0]})),'#8498b0',1.5);}
  line(model.frames,'#fff',8);line(model.frames,'#349eff',5);
  if(frame){line(model.frames.slice(0,frame.index+1),'#ff8c48',4);const p=xy(frame);ctx.beginPath();ctx.arc(p.x,p.y,8,0,Math.PI*2);ctx.fillStyle='#167ade';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();}
  $('#replayMapSource').textContent=rasterOK?'Peta online OSM':api.packs.length?'Jalur + data offline tersimpan':'Jalur rekaman · peta dasar belum tersedia';
}
function chart(){const canvas=$('#replayChart'),w=canvas.clientWidth,h=150;if(!w)return;canvas.width=w*(devicePixelRatio||1);canvas.height=h*(devicePixelRatio||1);const c=canvas.getContext('2d');c.scale(devicePixelRatio||1,devicePixelRatio||1);const duration=model.duration||1;
  function plot(data,value,max,color,maxGap=30000){c.strokeStyle=color;c.lineWidth=2;c.beginPath();let first=true,previous=null;const step=Math.max(1,Math.ceil(data.length/1500));for(let i=0;i<data.length;i+=step){const p=data[i],v=value(p);if(v==null){first=true;continue;}const x=10+p.t/duration*(w-20),y=h-15-Math.min(max,v)/max*(h-30);if(first||p.gap||previous&&p.t-previous.t>maxGap)c.moveTo(x,y);else c.lineTo(x,y);first=false;previous=p;}c.stroke();}
  plot(model.frames,p=>p.speedKmh,Math.max(20,model.topSpeed),'#349eff');plot(model.samples,p=>p.hr,model.maxHR,'#ff8c48',10000);c.strokeStyle='#a0adbd';c.beginPath();const x=10+time/duration*(w-20);c.moveTo(x,0);c.lineTo(x,h);c.stroke();}
function render(){if(!panel?.isConnected)return;const frame=replayAt(model,time);$('#replaySeek').value=time;$('#replayTime').textContent=clock(time);$('#replayWallTime').textContent=frame?new Date(frame.wallTime).toLocaleString('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',second:'2-digit',day:'2-digit',month:'short',year:'numeric'}):'—';$('#replaySpeed').textContent=frame?.speed==null?'—':frame.speed.toFixed(1);$('#replayHR').textContent=frame?.hr??'—';$('#replayZone').textContent=frame?.zone?'Z'+frame.zone:'—';drawMap(frame);chart();}
window.addEventListener('sotrack:detail',e=>{pause();observer?.disconnect();const button=document.createElement('button');button.className='primary';button.textContent='▶ Replay aktivitas';button.onclick=()=>{if(panel?.isConnected)panel.scrollIntoView({behavior:'smooth',block:'start'});else open(e.detail);};$('#rideDetail .buttonrow').prepend(button);panel=null;});
window.addEventListener('sotrack:ride-saved',e=>queueMicrotask(()=>{api.tab('history');api.showDetail(e.detail);open(e.detail);}));
window.addEventListener('sotrack:tab',e=>{if(e.detail!=='history')pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
