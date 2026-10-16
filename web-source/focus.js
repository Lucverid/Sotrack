import {applyRideView,preferredRideView} from './ride-view.js';
import {buildNavigation,nextManeuver,estimateArrival,navigationDistance} from './navigation-core.js';
import {routeProgress} from './focus-core.js';
const smallScreen=()=>matchMedia('(max-width:400px), (max-height:600px)').matches;
const api=window.sotrack,$=s=>document.querySelector(s);
const map=$('#map');
function controlText(e,text){if(window.SotrackSetControlText)window.SotrackSetControlText(e,text);else if(e.textContent!==String(text))e.textContent=text;}
// Give the ride map its own viewport layer, outside dashboard card clipping.
const home=document.createComment('ride map home');map.before(home);
const stage=document.createElement('div');stage.id='rideMapStage';stage.hidden=true;document.body.append(stage);
const backgrounds=[$('main'),$('.sidebar')].filter(Boolean);
let previousInert=[];
const layer=document.createElement('div');layer.className='focus-ui compact cyclo';layer.hidden=true;
layer.innerHTML=`<div class="focus-top"><div class="focus-heading"><button id="focusExit" class="outline" aria-label="Kembali ke dashboard">↙</button><button id="focusLayout" class="outline">Peta penuh</button><div class="focus-status-group"><small id="focusWallClock"></small><span id="focusState">MENUNGGU GPS</span></div></div><details class="focus-pov-menu"><summary aria-label="Pilih sudut pandang peta">POV<span id="focusPOVLabel">↑</span></summary><div class="focus-pov"><button data-pov="north">N · Utara</button><button data-pov="heading">↑ Ikuti arah</button><button data-pov="tilt">◩ Miring</button><div class="focus-rotation"><button id="focusRotateLeft" aria-label="Putar peta ke kiri 15 derajat">↶ 15°</button><span id="focusBearing">0°</span><button id="focusRotateRight" aria-label="Putar peta ke kanan 15 derajat">15° ↷</button><small>Putar dua jari · ◎ kembali mengikuti arah</small></div></div></details><div class="focus-trip-fields"><button id="focusOrigin" aria-label="Ubah titik awal"><span class="trip-origin-dot">●</span><span id="focusOriginName">Lokasi HP</span><span class="trip-edit">✎</span></button><button id="focusDestination" aria-label="Ubah tujuan"><span class="trip-destination-dot">●</span><span id="focusDestinationName">Pilih tujuan</span><span class="trip-edit">✎</span></button></div><div class="focus-guidance"><span id="focusTurn" class="focus-route-icon" aria-hidden="true">⌁</span><div><b id="focusRoute">Gowes bebas</b><p id="focusGuide">Menunggu posisi GPS…</p><small id="focusTripStats" hidden></small><small id="focusSignal"></small><button id="focusGpsCheck" class="textbtn" hidden>Cek GPS</button><button id="focusChooseRoute" class="textbtn" hidden>Pilih tujuan ↗</button><button id="focusBuildRoute" class="primary small" hidden>Hitung rute A → B</button></div></div></div><div class="focus-bottom"><div class="focus-destination-remaining"><small>SISA KE TUJUAN</small><b id="focusRemainingKm">—</b><span id="focusRemainingStatus">Pilih rute tujuan</span></div><div class="focus-sheet-handle" aria-hidden="true"></div><div class="focus-plan-summary"><div><b>Sepeda</b><small id="focusPlanDistance">Pilih rute untuk mulai</small></div><span id="focusRouteSaved">TERSIMPAN</span></div><div class="focus-quick"><span><b id="focusQuickSpeed">0.0</b><small id="focusQuickUnit">km/jam</small></span><button id="focusQuickPause" class="primary">Ⅱ Jeda</button><button id="focusShareRoute" class="outline" aria-label="Bagikan rute GPX">↗</button><button id="focusDockToggle" class="outline" aria-expanded="false" aria-label="Tampilkan data dan kontrol aktivitas">⋯</button></div><div class="focus-metrics"><div class="focus-speed"><b id="focusSpeed">0.0</b><small>km/jam</small></div><div><b id="focusDistance">0.00</b><small>km</small></div><div><b id="focusTime">00:00:00</b><small>waktu aktif</small></div><div class="focus-hr"><b id="focusHR">—</b><small>bpm</small></div><div class="focus-zone"><b id="focusZone">—</b><small id="focusZonePercent">zona HR</small></div></div><div class="focus-actions"><button id="focusPause" class="primary">Ⅱ Jeda</button><button id="focusLap" class="outline">＋ Lap</button><button id="focusFinish" class="outline">■ Selesai</button></div></div>`;
map.append(layer);
const povMenu=layer.querySelector('.focus-pov-menu');layer.querySelector('.focus-heading').append(povMenu);

const enter=document.createElement('button');enter.id='enterFocus';enter.className='outline gpsonly';enter.textContent='⛶ Peta penuh';$('#start').before(enter);
let focused=false,hadRide=false,navigationRoute=null,navigation={cues:[],total:0};
function marker(point){const old=api.navigationTarget;api.navigationTarget=point;if(old?.index!==point?.index||old?.route!==point?.route)api.drawMap();}
function mapPadding(){if(window.matchMedia('(orientation:landscape) and (max-height:600px)').matches)return {top:12,bottom:20,left:Math.max(220,innerWidth*.34)+16,right:60};const top=layer.querySelector('.focus-top')?.offsetHeight||150,bottom=layer.querySelector('.focus-bottom')?.offsetHeight||220;return {top:top+25,bottom:bottom+25,left:12,right:56};}

function overview(){api.mapPadding=mapPadding();api.fitPoints(api.activeRoute?.points,api.mapPadding);}
function setFocus(on){
  if(on===focused){hadRide=!!api.ride;render();return;}
  focused=on;hadRide=!!api.ride;if(on)api.startMapGPS?.();else api.stopMapGPS?.();
  if(on&&smallScreen()){layer.classList.remove('cyclo');layer.classList.add('compact');$('#focusDockToggle').setAttribute('aria-expanded','false');}
  if(on){
    previousInert=backgrounds.map(node=>node.inert);
    stage.append(map);stage.hidden=false;
    backgrounds.forEach(node=>node.inert=true);
    document.body.classList.add('ride-focus');layer.hidden=false;
    api.stopPick();$('#drawExit').click();api.stopDrag();if(api.ride){applyRideView(api);api.zoom=Math.max(api.zoom,16);}else if(api.activeRoute)requestAnimationFrame(overview);else api.followPosition();
    $('#focusExit').focus({preventScroll:true});
  }else{
    if(document.fullscreenElement===stage)document.exitFullscreen().catch(()=>{});marker(null);api.mapPitch=0;api.setMapOrientation('north');api.mapPadding=undefined;home.after(map);stage.hidden=true;layer.hidden=true;
    document.body.classList.remove('ride-focus');
    backgrounds.forEach((node,i)=>node.inert=previousInert[i]);
    enter.focus({preventScroll:true});
  }
  requestAnimationFrame(()=>api.drawMap());render();
}
enter.onclick=()=>{api.tab('ride');setFocus(true);};$('#focusExit').onclick=()=>setFocus(false);
const mapOpen=document.createElement('button');mapOpen.className='textbtn';mapOpen.textContent='⛶ Peta penuh';mapOpen.onclick=()=>{api.tab('ride');setFocus(true);};$('.maptop').append(mapOpen);
const compass=document.createElement('button');compass.id='mapCompass';controlText(compass,'N');compass.title='Ubah antara arah perjalanan dan utara di atas';compass.setAttribute('aria-label',compass.title);$('.mapcontrols').append(compass);
function pov(mode){applyRideView(api,mode);api.updateSettings({ridePOV:mode}).catch(()=>api.toast('Pilihan POV belum tersimpan.'));render();api.drawMap();}
for(const button of layer.querySelectorAll('[data-pov]'))button.onclick=()=>{pov(button.dataset.pov);povMenu.open=false;};
$('#focusRotateLeft').onclick=()=>{api.setMapBearing(api.mapBearing+15);render();};
$('#focusRotateRight').onclick=()=>{api.setMapBearing(api.mapBearing-15);render();};
compass.onclick=()=>{api.setMapOrientation(api.mapOrientation==='heading'?'north':'heading');render();};
const locate=$('#locate'),originalLocate=locate.onclick;locate.onclick=()=>{if(focused&&api.ride){const mode=preferredRideView(api.settings);applyRideView(api,mode==='north'?'heading':mode);}originalLocate();};
$('#focusOrigin').onclick=()=>{setFocus(false);api.tab('ride');$('#onlinePickStart').click();};
$('#focusDestination').onclick=()=>{setFocus(false);api.tab('ride');$('#destinationSearch').click();};
$('#focusShareRoute').onclick=()=>api.shareActiveRoute?.();
$('#focusLayout').onclick=()=>{const next=!layer.classList.contains('cyclo');layer.classList.toggle('cyclo',next);controlText($('#focusLayout'),next?'⛶':'▦');api.updateSettings({cycloLayout:next?'computer':'map'}).catch(()=>api.toast('Pilihan tampilan belum tersimpan.'));render();api.drawMap();};
window.addEventListener('sotrack:ready',()=>{layer.classList.toggle('cyclo',!smallScreen()&&api.settings.cycloLayout!=='map');});
$('#focusGpsCheck').onclick=()=>window.SotrackNative?.showGPSStatus();
$('#focusPause').onclick=()=>$(api.recording?'#pause':'#start').click();
$('#focusDockToggle').onclick=()=>{const compact=layer.classList.contains('compact');layer.classList.toggle('compact',!compact);$('#focusDockToggle').setAttribute('aria-expanded',String(compact));render();api.drawMap();$('#focusDockToggle').setAttribute('aria-label',compact?'Ringkas data dan kontrol':'Tampilkan data dan kontrol aktivitas');};
$('#focusQuickPause').onclick=()=>$('#focusPause').click();
$('#focusBuildRoute').onclick=()=>{setFocus(false);api.tab('ride');$('#onlineRoute').click();};
$('#focusChooseRoute').onclick=()=>{setFocus(false);api.tab('ride');$('#destinationSearch').click();};
$('#focusLap').onclick=()=>$('#lap').click();$('#focusFinish').onclick=()=>$('#finish').click();
window.addEventListener('sotrack:ride-start',()=>{setFocus(true);applyRideView(api);api.zoom=Math.max(api.zoom,16);});
window.addEventListener('sotrack:route',()=>{if(api.activeRoute){setFocus(true);if(!api.ride)requestAnimationFrame(overview);else{api.followPosition();api.zoom=Math.max(api.zoom,16);}}else render();});
window.addEventListener('sotrack:tab',e=>{if(focused&&e.detail!=='ride')setFocus(false);});
window.addEventListener('sotrack:live',()=>{if(focused&&hadRide&&!api.ride){setFocus(false);return;}render();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&focused)setFocus(false);});
function render(){
  if(!focused)return;if(api.canResumeMapFollow?.())applyRideView(api);locate.setAttribute('aria-pressed',String(!!api.mapFollowing));locate.title=api.mapFollowing?'Mengikuti posisi otomatis':'Kembali mengikuti · otomatis setelah 5 detik';$('#focusWallClock').textContent=new Date().toLocaleTimeString('id-ID',{timeZone:'Asia/Jakarta',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).replace('.',':')+' WIB';
  for(const [target,source]of [['focusSpeed','speed'],['focusDistance','distance'],['focusTime','timer']])$('#'+target).textContent=$('#'+source).textContent;
  const hr=api.liveSensors.hr;$('#focusHR').textContent=hr??'—';layer.classList.toggle('no-hr',hr==null);
  const r=api.ride,p=api.position,route=api.activeRoute;$('#focusLayout').hidden=!r;controlText($('#focusLayout'),layer.classList.contains('cyclo')?'⛶':'▦');$('#focusLayout').setAttribute('aria-label',layer.classList.contains('cyclo')?'Ringkas data dan perluas peta':'Tampilkan cyclocomputer');const maxHR=r?.maxHR||api.settings.maxHR;const zone=hr?Math.max(1,Math.min(5,Math.floor(hr/maxHR*10)-4)):null;$('#focusZone').textContent=zone?'Z'+zone:'—';$('#focusZonePercent').textContent=hr?Math.round(hr/maxHR*100)+'% acuan maks.':'sensor belum aktif';
  if(navigationRoute!==route){navigationRoute=route;navigation=buildNavigation(route);}
  layer.classList.toggle('preview',!r);
  $('#focusQuickSpeed').textContent=!r&&route?(navigation.total/1000).toFixed(1):$('#speed').textContent;
  $('#focusQuickUnit').textContent=!r&&route?'km rute':'km/jam';
  $('#focusOriginName').textContent=route?.origin?.name||'Titik awal jalur';
  $('#focusDestinationName').textContent=route?.destination?.name||route?.name||'Pilih tujuan';
  $('#focusPlanDistance').textContent=route?`${navigationDistance(navigation.total)} · ETA tersedia saat bergerak`:'Gowes bebas · pilih tujuan untuk navigasi';
  $('#focusRouteSaved').hidden=!route||!api.routes.some(saved=>saved.id===route.id);
  $('#focusShareRoute').hidden=!route;
  if(focused){api.mapPadding=mapPadding();map.style.setProperty('--ride-top',api.mapPadding.top+'px');map.style.setProperty('--ride-bottom',api.mapPadding.bottom+'px');}
  controlText($('#focusPause'),api.recording?'Ⅱ Jeda':r?'▶ Lanjutkan':'▶ Mulai');
  controlText($('#focusQuickPause'),api.recording?'Ⅱ Jeda':r?'▶ Lanjutkan':'▶ Mulai');
  $('#focusLap').disabled=!api.recording;$('#focusFinish').disabled=!r||$('#finish').disabled;
  const stale=!p||Date.now()-p.time>15000;$('#focusGpsCheck').hidden=!stale||!window.SotrackNative;layer.classList.toggle('no-route',!route);layer.classList.toggle('gps-warning',stale||p.accuracy>50);
  $('#focusState').textContent=!r?'PRATINJAU':!r.running?'JEDA':r.autoPaused?'AUTO-PAUSE':'● MEREKAM';
  const manual=api.mapOrientation==='manual';$('#focusBearing').textContent=Math.round(api.mapBearing)+'°';const headingMode=api.mapOrientation==='heading';controlText($('#focusPOVLabel'),manual?'↻':api.mapPitch>0&&api.vectorVisible?'◩':headingMode?'↑':'N');for(const button of layer.querySelectorAll('[data-pov]')){const selected=!manual&&button.dataset.pov===(api.mapPitch>0&&api.vectorVisible?'tilt':headingMode?'heading':'north');button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));}controlText(compass,headingMode?'↑':'N');compass.setAttribute('aria-pressed',String(headingMode));compass.title=headingMode?'Arah perjalanan di atas · ketuk untuk utara':'Utara di atas · ketuk untuk mengikuti perjalanan';
  $('#focusSignal').textContent=stale?(api.gpsDiagnostic||'GPS belum tersedia / sinyal terputus'):`GPS ±${Math.round(p.accuracy)} m · ${manual?'putar manual · tekan ◎ untuk mengikuti':headingMode?api.mapHeadingReady?'arah perjalanan di atas':'menunggu arah GPS':'utara di atas'}`;
  if(api.mapPitch>0&&!api.vectorVisible)$('#focusSignal').textContent+=' · tampilan datar: peta ringan/offline';
  $('#focusRoute').textContent=route?.name||'Gowes bebas';
  const progress=routeProgress(route?.points,p),valid=progress&&!stale&&p.accuracy<=50&&progress.gap<=100;
  const cue=valid?nextManeuver(navigation,progress):null;
  $('#focusChooseRoute').hidden=!!route;$('#focusBuildRoute').hidden=!!route;
  $('#focusTripStats').hidden=!progress;$('#focusRemainingKm').textContent=route?((progress?.remaining??navigation.total)/1000).toFixed(2)+' km':'—';$('#focusRemainingStatus').textContent=!route?'Pilih rute untuk navigasi':!progress?'Panjang rute · GPS belum tersedia':!valid?'Perkiraan · periksa GPS/jalur':'Sisa sepanjang rute';layer.classList.toggle('off-route',!!progress&&progress.gap>100);
  controlText($('#focusTurn'),cue?.icon||(!route?'⌁':valid?progress.remaining<30?'⚑':'↑':'◎'));
  $('#focusGuide').textContent=stale?'Menunggu posisi GPS…':p.accuracy>50?'Sinyal GPS lemah · posisi belum akurat':!progress?'Pilih tujuan untuk panduan belokan':progress.gap>100?`Di luar jalur ±${Math.round(progress.gap)} m`:progress.remaining<30?'Mendekati tujuan':cue?`${cue.estimated?'Perkiraan · ':''}${cue.text} · ${navigationDistance(cue.meters)}`:`Lanjut mengikuti rute · ${navigationDistance(progress.remaining)}`;
  if(progress){
    const speed=Number($('#speed').textContent),eta=valid&&r?.running&&!r.autoPaused?estimateArrival(progress.remaining,speed):null;
    const duration=eta?eta.minutes<60?`${eta.minutes} mnt`:`${Math.floor(eta.minutes/60)} j ${eta.minutes%60} mnt`:'';
    const arrival=eta?new Date(eta.arrival).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}):'';
    $('#focusTripStats').textContent=`Tujuan ${navigationDistance(progress.remaining)}`+(eta?` · ±${duration} · tiba ${arrival}`:valid?' · ETA menunggu kecepatan':' · ETA belum tersedia');
    $('#focusSignal').textContent+=cue?.estimated?' · belokan perkiraan jalur':route.maneuvers?.length?' · panduan BRouter':' · panduan visual';
  }
  marker(cue?{...cue,route:route.id}:null);
}
setInterval(render,1000);

function resizeViewport(){stage.style.setProperty('--ride-viewport-height',innerHeight+'px');if(focused){render();api.drawMap();}}
window.addEventListener('resize',resizeViewport);resizeViewport();
document.addEventListener('fullscreenchange',resizeViewport);

document.addEventListener('pointerdown',e=>{if(povMenu.open&&!povMenu.contains(e.target))povMenu.open=false;},true);
