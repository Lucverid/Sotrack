import {replayAt} from './replay-core.js';
import {fitRouteView} from './focus-core.js';
import {project} from './core.js';
export function videoMime(Recorder){return ['video/mp4','video/webm;codecs=vp8','video/webm'].find(t=>Recorder?.isTypeSupported(t))||null;}
export function videoProgress(elapsed,seconds,duration){return Math.min(1,Math.max(0,elapsed/(seconds*1000)))*duration;}
const clock=ms=>{const s=Math.floor(ms/1000);return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0')).join(':');};
export function mountVideoExport(panel,model,ride){
 const section=document.createElement('div');section.className='replay-video-export';
 section.innerHTML='<h4>Video perjalanan</h4><p>Jalur bergerak, speed, HR, zona HR, top speed dan jam asli. Pilih durasi video ringkasan.</p><div class="replay-controls"><select aria-label="Durasi video"><option value="30">30 detik</option><option value="60">60 detik</option></select><button class="primary">↓ Buat video replay</button></div><p class="muted" role="status" aria-live="polite"></p><div class="video-result" hidden><video controls playsinline></video><a class="primary" download>Simpan video</a></div>';
 panel.append(section);const button=section.querySelector('button'),status=section.querySelector('[role=status]'),result=section.querySelector('.video-result');let busy=false,url=null,cancel=null;
 const mime=videoMime(globalThis.MediaRecorder);
 if(!mime||!HTMLCanvasElement.prototype.captureStream){button.disabled=true;status.textContent='Browser ini belum mendukung ekspor video. Gunakan perekam layar HP saat memutar replay.';}
 else if(!model.frames.length||model.duration<=0){button.disabled=true;status.textContent='Aktivitas ini belum punya cukup data untuk video.';}
 else status.textContent='Biarkan layar menyala selama proses. Format '+(mime.includes('mp4')?'MP4':'WebM')+' sesuai browser. Jika peta gagal dimuat, video memakai jalur dengan latar polos.';
 const cleanup=()=>{cancel?.();if(url)URL.revokeObjectURL(url);document.removeEventListener('visibilitychange',hidden);window.removeEventListener('sotrack:detail',cleanup);window.removeEventListener('sotrack:tab',tab);};
 const hidden=()=>{if(document.hidden)cancel?.();},tab=e=>{if(e.detail!=='history')cancel?.();};
 document.addEventListener('visibilitychange',hidden);window.addEventListener('sotrack:detail',cleanup,{once:true});window.addEventListener('sotrack:tab',tab);
 button.onclick=async()=>{
  if(busy)return;busy=true;button.disabled=true;result.hidden=true;
  let stream,recorder,raf=0,wake=null,cancelled=false,timer,dialog;
  const abort=()=>{cancelled=true;cancelAnimationFrame(raf);if(recorder?.state==='recording')recorder.stop();};cancel=abort;
  try{
   const seconds=Number(section.querySelector('select').value);const canvas=document.createElement('canvas');canvas.width=720;canvas.height=960;
   dialog=document.createElement('div');dialog.className='video-recording';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-label','Membuat video replay');
   const stop=document.createElement('button');stop.className='outline';stop.textContent='Batalkan';stop.onclick=abort;dialog.append(canvas,stop);section.append(dialog);stop.focus();
   const ctx=canvas.getContext('2d'),view=fitRouteView(model.frames,720,590,{top:50,bottom:50,left:45,right:45});
   const center=project(view.center,view.zoom),ox=center.x-360,oy=center.y-295,xy=p=>{const q=project(p,view.zoom);return{x:q.x-ox,y:q.y-oy+145};};
   const tiles=[];status.textContent='Menyiapkan peta…';
   if((window.SotrackAndroidOnline?window.SotrackAndroidOnline():navigator.onLine)){const n=2**view.zoom,jobs=[];for(let x=Math.floor(ox/256);x<=Math.floor((ox+720)/256);x++)for(let y=Math.floor(oy/256);y<=Math.floor((oy+590)/256);y++){
    if(y<0||y>=n)continue;const image=new Image();image.crossOrigin='anonymous';image.referrerPolicy='strict-origin-when-cross-origin';
    jobs.push(new Promise(resolve=>{const timeout=setTimeout(()=>{image.onload=image.onerror=null;resolve();},5000);image.onload=()=>{clearTimeout(timeout);tiles.push({image,x:x*256-ox,y:y*256-oy+145});resolve();};image.onerror=()=>{clearTimeout(timeout);resolve();};image.src=`https://tile.openstreetmap.org/${view.zoom}/${(x%n+n)%n}/${y}.png`;}));
   }await Promise.all(jobs);}
   if(cancelled)throw Error('cancelled');
   // Check CORS before recording. A failed tile must never break route-only export.
   for(let i=tiles.length-1;i>=0;i--){try{const probe=document.createElement('canvas');probe.width=probe.height=1;const p=probe.getContext('2d');p.drawImage(tiles[i].image,0,0,1,1);p.getImageData(0,0,1,1);}catch{tiles.splice(i,1);}}
   const route=model.frames.filter((p,i,a)=>i%Math.max(1,Math.ceil(a.length/3000))===0||i===a.length-1||p.break||a[i+1]?.break).map(p=>({...xy(p),t:p.t,break:p.break||p.gap}));
   const text=(s,x,y,size=20,color='#eaf2ff')=>{ctx.fillStyle=color;ctx.font=`600 ${size}px system-ui,sans-serif`;ctx.fillText(String(s),x,y);};
   const draw=t=>{const f=replayAt(model,t);ctx.fillStyle='#0b1423';ctx.fillRect(0,0,720,960);ctx.save();ctx.beginPath();ctx.rect(0,145,720,590);ctx.clip();ctx.fillStyle='#e3eaf0';ctx.fillRect(0,145,720,590);for(const tile of tiles)ctx.drawImage(tile.image,tile.x,tile.y,256,256);
    const line=(color,width,upto)=>{ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin=ctx.lineCap='round';let first=true;for(const p of route){if(upto!=null&&p.t>upto)break;if(first||p.break)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);first=false;}if(upto!=null&&f&&!f.gap){const q=xy(f);ctx.lineTo(q.x,q.y);}ctx.stroke();};line('#fff',12);line('#8195aa',7);line('#1688ef',7,t);const q=xy(f);ctx.beginPath();ctx.arc(q.x,q.y,12,0,Math.PI*2);ctx.fillStyle='#1688ef';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();ctx.restore();
    text('sotrack. / RIDE REPLAY',28,39,20,'#64b8ff');ctx.save();ctx.beginPath();ctx.rect(28,50,664,40);ctx.clip();text(ride.name||'Aktivitas sepeda',28,83,29);ctx.restore();text(new Date(f.wallTime).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'})+' WIB',28,122,18,'#9fb1c9');
    text(tiles.length?'© OpenStreetMap contributors':'Jalur rekaman · tanpa peta dasar',18,720,15,'#142c42');
    const val=(v,d=0)=>v==null?'—':Number(v).toFixed(d);text(val(f.speed,1),28,799,55);text('km/jam',28,827,17,'#9fb1c9');text(val(f.hr)+' bpm',280,788,30);text('HR · '+(f.zone?'Z'+f.zone:'—'),280,822,17,'#9fb1c9');text(f.km.toFixed(2)+' km',510,788,28);text('Jarak replay',510,822,17,'#9fb1c9');text('Top '+model.topSpeed.toFixed(1)+' km/jam',28,875,21);text(clock(t)+' / '+clock(model.duration),28,910,19,'#9fb1c9');text(model.exact?'DATA REKAMAN':'REKONSTRUKSI GPS · PERKIRAAN',28,943,14,'#9fb1c9');ctx.fillStyle='#1688ef';ctx.fillRect(0,955,720*(model.duration?t/model.duration:0),5);
   };
   draw(0);stream=canvas.captureStream(24);recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:3000000});
   const chunks=[];const done=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=()=>reject(Error('Perekaman video gagal.'));recorder.onstop=resolve;});
   try{wake=await navigator.wakeLock?.request('screen');}catch{}
   if(cancelled)throw Error('cancelled');recorder.start(1000);const started=performance.now();
   const tick=now=>{if(cancelled)return;try{const elapsed=now-started;draw(videoProgress(elapsed,seconds,model.duration));status.textContent='Membuat video… '+Math.min(100,Math.floor(elapsed/(seconds*10)))+'%';if(elapsed>=seconds*1000){recorder.stop();return;}raf=requestAnimationFrame(tick);}catch(e){abort();}};
   raf=requestAnimationFrame(tick);timer=setTimeout(abort,(seconds+15)*1000);await done;
   if(cancelled)throw Error('cancelled');const blob=new Blob(chunks,{type:recorder.mimeType||mime});if(!blob.size)throw Error('Video kosong. Coba perekam layar HP.');
   if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(blob);const a=result.querySelector('a');a.href=url;a.download='Sotrack-replay-'+new Date().toISOString().slice(0,10)+(blob.type.includes('mp4')?'.mp4':'.webm');result.querySelector('video').src=url;result.hidden=false;status.textContent='Video siap. Tekan Simpan video untuk mengunduh.';
  }catch(e){status.textContent=cancelled?'Pembuatan video dibatalkan. Biarkan app terbuka dan layar menyala, lalu coba lagi.':'Video gagal dibuat. Coba lagi atau gunakan perekam layar HP saat replay diputar.';}
  finally{clearTimeout(timer);cancelAnimationFrame(raf);if(recorder?.state==='recording')recorder.stop();stream?.getTracks().forEach(t=>t.stop());try{await wake?.release();}catch{}dialog?.remove();busy=false;button.disabled=false;cancel=null;}
 };
}
