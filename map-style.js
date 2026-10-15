import {preferLightMap} from './small-screen-core.js';
import {vectorStyles,vectorCamera} from './map-style-core.js';
const api=window.sotrack,$=s=>document.querySelector(s);
const host=document.createElement('div');host.id='vectorMap';host.hidden=true;$('#map').prepend(host);
const menu=document.createElement('dialog');menu.id='mapSettingsMenu';menu.setAttribute('aria-labelledby','mapSettingsTitle');
menu.innerHTML=`<header class="map-menu-heading"><div><small>TAMPILAN</small><h2 id="mapSettingsTitle">Pilih peta</h2></div><button type="button" class="map-menu-close" aria-label="Tutup pilihan peta">×</button></header><p class="map-menu-intro">Pilih tampilan yang nyaman buat perjalanan lu.</p><div class="map-style-cards" role="group" aria-label="Gaya peta"><button type="button" data-map-style="liberty" aria-pressed="false"><span class="style-sample sample-modern" aria-hidden="true"></span><b>Modern</b><small>Detail jalan · POV miring</small><i aria-hidden="true">✓</i></button><button type="button" data-map-style="bright" aria-pressed="false"><span class="style-sample sample-bright" aria-hidden="true"></span><b>Terang</b><small>Kontras jelas · POV miring</small><i aria-hidden="true">✓</i></button><button type="button" data-map-style="osm" aria-pressed="false"><span class="style-sample sample-classic" aria-hidden="true"></span><b>Klasik</b><small>Tampilan datar</small><i aria-hidden="true">✓</i></button></div><select id="mapStyleChoice" hidden aria-label="Gaya peta"><option value="liberty">Modern</option><option value="bright">Terang</option><option value="osm">Klasik</option></select><p id="mapStyleStatus" role="status">Peta modern tanpa API key/billing · data OSM</p><details class="map-menu-details"><summary>Data peta & bantuan</summary><div id="mapMenuHelp"></div></details>`;
document.body.append(menu);
const menuButton=document.createElement('button');menuButton.type='button';menuButton.className='map-menu-trigger';menuButton.textContent='▱ Peta';menuButton.setAttribute('aria-haspopup','dialog');menuButton.onclick=()=>menu.showModal();$('.maptop').append(menuButton);
menu.querySelector('.map-menu-close').onclick=()=>menu.close();menu.addEventListener('click',e=>{if(e.target===menu){const r=menu.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)menu.close();}});
for(const button of menu.querySelectorAll('[data-map-style]'))button.onclick=()=>{$('#mapStyleChoice').value=button.dataset.mapStyle;$('#mapStyleChoice').onchange();};
window.addEventListener('sotrack:ready',()=>{const freshness=$('.map-freshness');if(freshness)$('#mapMenuHelp').append(freshness);});
let vector=null,choice='liberty',loading=false,ready=false,lastCamera=null,generation=0;
function fallback(message){vector?.remove();vector=null;ready=false;api.vectorVisible=false;host.hidden=true;$('#mapStyleStatus').textContent=message;api.drawMap();}
function sync(camera){lastCamera=camera;if(!vector||!ready||!navigator.onLine||choice==='osm')return;vector.resize();vector.jumpTo(vectorCamera(camera));}
async function change(value){choice=vectorStyles[value]?value:'osm';$('#mapStyleChoice').value=choice;for(const button of menu.querySelectorAll('[data-map-style]'))button.setAttribute('aria-pressed',String(button.dataset.mapStyle===choice));generation++;const own=generation;ready=false;api.vectorVisible=false;host.hidden=true;api.drawMap();
  if(choice==='osm'){vector?.remove();vector=null;$('#mapStyleStatus').textContent='OSM klasik · data jalan mengikuti pembaruan OSM';return;}
  if(!navigator.onLine){fallback('Offline: memakai jalan yang sudah disimpan. Peta modern memerlukan internet.');return;}
  $('#mapStyleStatus').textContent='Memuat peta modern…';if(loading)return;loading=true;
  try{await import('./vendor/maplibre-gl.js');if(own!==generation)return;vector?.remove();host.hidden=false;vector=new globalThis.maplibregl.Map({container:host,style:vectorStyles[choice],interactive:false,attributionControl:false,center:[api.center.lon,api.center.lat],zoom:api.zoom-1,renderWorldCopies:false});
    const timeout=setTimeout(()=>{if(own===generation&&!ready)fallback('Peta modern belum tersedia; OSM klasik tetap digunakan. Coba pilih gaya lagi.');},15000);
    vector.on('load',()=>{clearTimeout(timeout);if(own!==generation)return;ready=true;api.vectorVisible=true;host.hidden=false;$('#mapStyleStatus').textContent='OpenFreeMap · data OSM · tanpa billing';api.drawMap();if(lastCamera)sync(lastCamera);});
    vector.on('error',()=>{if(own===generation)fallback('Peta modern belum dapat dimuat lengkap; memakai OSM klasik sebagai cadangan.');});
  }catch{fallback('Perangkat belum dapat membuka peta modern. OSM klasik tetap tersedia.');}finally{loading=false;if(own!==generation)change(choice);}
}
$('#mapStyleChoice').onchange=async()=>{const selected=$('#mapStyleChoice').value;await change(selected);try{await api.updateSettings({mapStyle:selected});}catch{api.toast('Pilihan gaya belum tersimpan.');}};
window.addEventListener('sotrack:camera',e=>sync(e.detail));window.addEventListener('sotrack:ready',()=>change(api.settings.mapStyle||(preferLightMap(innerWidth,innerHeight,navigator.deviceMemory,navigator.hardwareConcurrency)?'osm':'liberty')));
window.addEventListener('offline',()=>fallback('Offline: memakai area jalan yang sudah disimpan.'));window.addEventListener('online',()=>change(choice));
api.vectorAttribution='OpenFreeMap © OpenMapTiles · © OpenStreetMap contributors';

api.vectorProject=p=>{const q=vector.project([p.lon,p.lat]);return {x:q.x,y:q.y};};api.vectorUnproject=(x,y)=>{const p=vector.unproject([x,y]);return {lat:p.lat,lon:p.lng};};
