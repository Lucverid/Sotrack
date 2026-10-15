/* Bootstrap offline support independently of the ride modules. */
(function () {
 'use strict';
 var bar=document.getElementById('pwaBar'),status=document.getElementById('pwaStatus'),retry=document.getElementById('pwaRetry'),install=document.getElementById('install'),promptEvent=null,registration=null,busy=false,watchdog,hideTimer;
 function say(text){clearTimeout(hideTimer);bar.hidden=false;status.textContent=text;var footer=document.getElementById('footerStatus');if(footer)footer.textContent=text;}
 function emit(){if(registration)window.dispatchEvent(new CustomEvent('sotrack:worker',{detail:registration}));}
 function installed(){return window.matchMedia('(display-mode: standalone)').matches||navigator.standalone;}
 function verify(){
  if(!registration||!registration.active)return;
  if(!navigator.serviceWorker.controller){say('Offline tersimpan · buka ulang sekali saat online');retry.hidden=false;retry.textContent='Periksa lagi';return;}
  var worker=registration.active;var channel=new MessageChannel();var timer=setTimeout(function(){say('Status offline belum terverifikasi · tekan Periksa lagi');retry.hidden=false;busy=false;},8000);
  channel.port1.onmessage=function(event){clearTimeout(timer);busy=false;var data=event.data||{};if(data.ready){say('Siap offline · app tersimpan di HP');retry.hidden=true;hideTimer=setTimeout(function(){bar.hidden=true;},3000);}else{say('Offline belum lengkap · '+(data.missing||'coba siapkan ulang'));retry.hidden=false;}channel.port1.close();};
  worker.postMessage({type:'CHECK_OFFLINE'},[channel.port2]);
 }
 function watch(worker){if(!worker)return;worker.addEventListener('statechange',function(){if(worker.state==='activated'){clearTimeout(watchdog);verify();emit();}else if(worker.state==='redundant'){clearTimeout(watchdog);busy=false;say('Persiapan offline gagal · periksa koneksi/ruang penyimpanan, lalu coba lagi');retry.hidden=false;}});}
 function prepare(){
  if(busy)return;
  if(!('serviceWorker' in navigator)||!window.isSecureContext){say('Browser belum mendukung mode offline di alamat ini');retry.hidden=true;return;}
  busy=true;retry.hidden=true;say('Menyiapkan app offline… biarkan halaman terbuka');
  clearTimeout(watchdog);watchdog=setTimeout(function(){busy=false;say('Persiapan offline belum selesai · nyalakan data lalu coba lagi');retry.hidden=false;},60000);
  navigator.serviceWorker.register('./sw.js').then(function(reg){registration=reg;emit();watch(reg.installing);reg.addEventListener('updatefound',function(){say('Menyimpan pembaruan offline…');watch(reg.installing);});
   if(reg.active){clearTimeout(watchdog);verify();}
   return reg.update();
  }).catch(function(error){clearTimeout(watchdog);busy=false;say('Offline gagal disiapkan: '+error.message);retry.hidden=false;});
 }
 retry.onclick=function(){busy=false;prepare();};
 navigator.serviceWorker&&navigator.serviceWorker.addEventListener('controllerchange',function(){clearTimeout(watchdog);verify();});
 window.addEventListener('sotrack:ready',emit);
 window.addEventListener('beforeinstallprompt',function(event){event.preventDefault();promptEvent=event;install.hidden=installed();});
 install.hidden=installed();install.onclick=function(){if(promptEvent){var event=promptEvent;promptEvent=null;event.prompt();event.userChoice.then(function(){install.hidden=installed();});}else{window.alert('Jika opsi instal belum tersedia, buka menu ⋮ Chrome → Instal aplikasi / Tambahkan ke layar utama. Tunggu status Siap offline sebelum mematikan data.');}};
 window.addEventListener('appinstalled',function(){install.hidden=true;promptEvent=null;});
 prepare();
}());
