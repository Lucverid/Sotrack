const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
function dependency(name){try{return require(name);}catch{return require('../../android-toolchain/node_modules/'+name);}}
const {JSDOM}=dependency('jsdom'),acorn=dependency('acorn'),assets=path.join(__dirname,'../app/src/main/assets/www');
function run(w,name){w.eval(fs.readFileSync(path.join(assets,name),'utf8'));}
test('Shipped scripts parse as ES5 for the KitKat JavaScript engine',()=>{for(const name of ['legacy-polyfills.js','native-compat.js','native-bridge.js','native-icons.js','app.bundle.js'])acorn.parse(fs.readFileSync(path.join(assets,name),'utf8'),{ecmaVersion:5});});
test('KitKat boot restores Promise, collections, URL, fetch, DOM traversal and event APIs',async()=>{
 const dom=new JSDOM('<!doctype html><html><body><div id="outer"><button id="tap">Go</button></div></body></html>',{runScripts:'outside-only',url:'https://appassets.androidplatform.net/assets/www/index.html'}),w=dom.window;
 try{w.SotrackNative={androidVersion:()=>19};w.CSS=undefined;w.eval('Promise=undefined;Map=undefined;Set=undefined;WeakMap=undefined;Symbol=undefined;URL=undefined;URLSearchParams=undefined;fetch=undefined;Array.from=undefined;Object.assign=undefined;Element.prototype.closest=undefined;Event=undefined;CustomEvent=undefined;MouseEvent=undefined;');run(w,'legacy-polyfills.js');run(w,'native-compat.js');
 assert.equal(w.SotrackLegacy,true);assert.ok(w.document.documentElement.classList.contains('legacy-layout'));assert.equal(w.document.getElementById('tap').closest('#outer').id,'outer');
 assert.equal(await w.Promise.resolve(42),42);assert.equal(w.eval('new Map([["x",3]]).get("x")'),3);assert.equal(new w.URL('../a',w.location.href).pathname,'/assets/a');assert.equal(new w.URLSearchParams({data:'a b'}).get('data'),'a b');assert.equal(typeof w.fetch,'function');let detail=0;w.addEventListener('test',e=>detail=e.detail);w.dispatchEvent(new w.CustomEvent('test',{detail:7}));assert.equal(detail,7);
 }finally{w.close();}
});
test('KitKat native file import delivers a named Blob to the existing GPX change handler',async()=>{
 const dom=new JSDOM('<main><input id="gpxFile" type="file"></main>',{runScripts:'outside-only',url:'https://appassets.androidplatform.net/'}),w=dom.window;let picked=null,received=null;
 try{w.SotrackNative={androidVersion:()=>19,isOnline:()=>false,pickLegacyFile:id=>picked=id};run(w,'legacy-polyfills.js');run(w,'native-compat.js');run(w,'native-bridge.js');const input=w.document.getElementById('gpxFile');input.onchange=e=>received=e.target.files[0];input.click();assert.equal(picked,'gpxFile');w.dispatchEvent(new w.CustomEvent('sotrack:legacy-file',{detail:{target:'gpxFile',name:'route.gpx',base64:w.btoa('<gpx/>')}}));assert.equal(received.name,'route.gpx');assert.equal(await received.text(),'<gpx/>');
 }finally{w.close();}
});
