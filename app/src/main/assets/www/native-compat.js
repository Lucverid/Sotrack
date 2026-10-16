(function(){
 'use strict';
 function eventFallback(name,init){init=init||{};var e=document.createEvent('Event');e.initEvent(name,!!init.bubbles,!!init.cancelable);return e;}
 try{new Event('test');}catch(e){window.Event=eventFallback;}
 try{new CustomEvent('test');}catch(e){window.CustomEvent=function(name,init){init=init||{};var e=document.createEvent('CustomEvent');e.initCustomEvent(name,!!init.bubbles,!!init.cancelable,init.detail);return e;};}
 try{new MouseEvent('test');}catch(e){window.MouseEvent=function(name,init){init=init||{};var e=document.createEvent('MouseEvents');e.initMouseEvent(name,!!init.bubbles,!!init.cancelable,window,0,0,0,init.clientX||0,init.clientY||0,false,false,false,false,0,null);return e;};}
 if(!Element.prototype.matches)Element.prototype.matches=Element.prototype.webkitMatchesSelector;
 if(!Element.prototype.closest)Element.prototype.closest=function(selector){var e=this;while(e){if(e.matches(selector))return e;e=e.parentElement;}return null;};
 // Object URLs and small local databases remain available on KitKat.
 if(!window.indexedDB)window.indexedDB=window.webkitIndexedDB;
 window.SotrackLegacy=!!(window.SotrackNative&&SotrackNative.androidVersion&&SotrackNative.androidVersion()<21);
 if(window.SotrackLegacy)document.documentElement.classList.add('kitkat-layout');
 if(!window.CSS||!CSS.supports||!CSS.supports('display','grid'))document.documentElement.classList.add('legacy-layout');
 if(!window.globalThis)window.globalThis=window;
 if(!window.queueMicrotask)window.queueMicrotask=function(fn){Promise.resolve().then(fn);};
 if(!Array.prototype.at)Object.defineProperty(Array.prototype,'at',{value:function(n){n=Math.trunc(n)||0;if(n<0)n+=this.length;return this[n];}});
 if(!Array.prototype.flatMap)Object.defineProperty(Array.prototype,'flatMap',{value:function(fn,that){return [].concat.apply([],this.map(fn,that));}});
 if(!Array.prototype.flat)Object.defineProperty(Array.prototype,'flat',{value:function(depth){depth=depth===undefined?1:depth;return depth<=0?this.slice():[].concat.apply([],this.map(function(v){return Array.isArray(v)?v.flat(depth-1):v;}));}});
 if(!Object.values)Object.values=function(o){return Object.keys(o).map(function(k){return o[k];});};
 if(!Object.entries)Object.entries=function(o){return Object.keys(o).map(function(k){return [k,o[k]];});};
 if(!String.prototype.padStart)String.prototype.padStart=function(n,p){var s=String(this);p=String(p===undefined?' ':p);if(!p)return s;var needed=Math.max(0,n-s.length),prefix='';while(prefix.length<needed)prefix+=p;return prefix.slice(0,needed)+s;};
 if(!Object.fromEntries)Object.fromEntries=function(entries){var result={};Array.from(entries).forEach(function(pair){result[pair[0]]=pair[1];});return result;};
 if(!String.prototype.replaceAll)String.prototype.replaceAll=function(search,replace){return typeof search==='string'?this.split(search).join(replace):this.replace(search,replace);};
 if(!Promise.prototype.finally)Promise.prototype.finally=function(fn){var P=this.constructor;return this.then(function(v){return P.resolve(fn()).then(function(){return v;});},function(e){return P.resolve(fn()).then(function(){throw e;});});};
 if(!Promise.allSettled)Promise.allSettled=function(values){return Promise.all(Array.from(values).map(function(p){return Promise.resolve(p).then(function(v){return {status:'fulfilled',value:v};},function(e){return {status:'rejected',reason:e};});}));};
 if(!window.structuredClone)window.structuredClone=function clone(v,seen){if(v===null||typeof v!=='object')return v;seen=seen||new WeakMap();if(seen.has(v))return seen.get(v);if(v instanceof Date)return new Date(v);if(v instanceof ArrayBuffer)return v.slice(0);var r=Array.isArray(v)?[]:{};seen.set(v,r);Object.keys(v).forEach(function(k){r[k]=clone(v[k],seen);});return r;};
 if(window.crypto&&!crypto.randomUUID)crypto.randomUUID=function(){var a=new Uint8Array(16);crypto.getRandomValues(a);a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;return Array.from(a).map(function(x,i){return ([4,6,8,10].indexOf(i)>=0?'-':'')+('0'+x.toString(16)).slice(-2);}).join('');};
 ['append','prepend','before','after','replaceChildren'].forEach(function(name){if(Element.prototype[name])return;Element.prototype[name]=function(){var nodes=Array.from(arguments).map(function(n){return n instanceof Node?n:document.createTextNode(String(n));});var self=this;if(name==='replaceChildren'){while(this.firstChild)this.removeChild(this.firstChild);nodes.forEach(function(n){self.appendChild(n);});}else if(name==='append')nodes.forEach(function(n){self.appendChild(n);});else if(name==='prepend')nodes.reverse().forEach(function(n){self.insertBefore(n,self.firstChild);});else if(name==='before')nodes.forEach(function(n){self.parentNode.insertBefore(n,self);});else nodes.reverse().forEach(function(n){self.parentNode.insertBefore(n,self.nextSibling);});};});
 if(!window.ResizeObserver)window.ResizeObserver=function(callback){this.targets=[];this.sizes=[];var self=this;this.timer=setInterval(function(){var changed=[];self.targets.forEach(function(e,i){var size=e.clientWidth+','+e.clientHeight;if(self.sizes[i]!==size){self.sizes[i]=size;changed.push({target:e,contentRect:e.getBoundingClientRect()});}});if(changed.length)callback(changed);},350);this.observe=function(e){if(self.targets.indexOf(e)<0)self.targets.push(e);};this.disconnect=function(){clearInterval(self.timer);self.targets=[];};this.unobserve=function(e){var i=self.targets.indexOf(e);if(i>=0){self.targets.splice(i,1);self.sizes.splice(i,1);}};};
 document.addEventListener('DOMContentLoaded',function(){Array.from(document.querySelectorAll('dialog')).forEach(function(d){if(!d.showModal)d.showModal=function(){d.setAttribute('open','');};if(!d.close)d.close=function(){d.removeAttribute('open');d.dispatchEvent(new Event('close'));};});});
 var oldCreate=document.createElement.bind(document);document.createElement=function(tag){var e=oldCreate(tag);if(String(tag).toLowerCase()==='dialog'){if(!e.showModal)e.showModal=function(){e.setAttribute('open','');};if(!e.close)e.close=function(){e.removeAttribute('open');e.dispatchEvent(new Event('close'));};}return e;};

 if(!Blob.prototype.text)Blob.prototype.text=function(){var blob=this;return new Promise(function(ok,fail){var r=new FileReader();r.onload=function(){ok(r.result);};r.onerror=fail;r.readAsText(blob);});};
 if(!Blob.prototype.arrayBuffer)Blob.prototype.arrayBuffer=function(){var blob=this;return new Promise(function(ok,fail){var r=new FileReader();r.onload=function(){ok(r.result);};r.onerror=fail;r.readAsArrayBuffer(blob);});};
 if(!window.AbortController){
  window.AbortController=function(){var listeners=[],signal={aborted:false,addEventListener:function(type,fn){if(type==='abort')listeners.push(fn);},removeEventListener:function(type,fn){listeners=listeners.filter(function(f){return f!==fn;});}};this.signal=signal;this.abort=function(){if(signal.aborted)return;signal.aborted=true;listeners.slice().forEach(function(fn){fn();});};};
  var originalFetch=window.fetch.bind(window);window.fetch=function(url,options){options=options||{};var signal=options.signal,opts={};Object.keys(options).forEach(function(k){if(k!=='signal')opts[k]=options[k];});if(!signal)return originalFetch(url,opts);return new Promise(function(resolve,reject){var finished=false;function abort(){if(finished)return;finished=true;signal.removeEventListener('abort',abort);var e=new Error('Dibatalkan');e.name='AbortError';reject(e);}if(signal.aborted){abort();return;}signal.addEventListener('abort',abort);originalFetch(url,opts).then(function(r){if(!finished){finished=true;signal.removeEventListener('abort',abort);resolve(r);}},function(e){if(!finished){finished=true;signal.removeEventListener('abort',abort);reject(e);}});});};
 }

 if(!window.PointerEvent){
  Element.prototype.setPointerCapture=Element.prototype.setPointerCapture||function(){};
  Element.prototype.releasePointerCapture=Element.prototype.releasePointerCapture||function(){};
  [['touchstart','pointerdown'],['touchmove','pointermove'],['touchend','pointerup'],['touchcancel','pointercancel']].forEach(function(pair){document.addEventListener(pair[0],function(original){Array.from(original.changedTouches).forEach(function(touch){var event=new MouseEvent(pair[1],{bubbles:true,cancelable:true,clientX:touch.clientX,clientY:touch.clientY});Object.defineProperty(event,'pointerId',{value:touch.identifier+1});Object.defineProperty(event,'pointerType',{value:'touch'});var target=touch.target||original.target;var accepted=target.dispatchEvent(event);if(!accepted&&original.cancelable)original.preventDefault();if(pair[0]==='touchmove'&&target.closest&&target.closest('#map')&&!target.closest('button,a,.focus-ui')&&original.cancelable)original.preventDefault();});},{passive:false});});
 }
})();
