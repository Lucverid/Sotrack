const test=require('node:test'),assert=require('node:assert/strict');
const bounds=[-7,108,-6.995,108.005],endpoint='https://overpass-api.de/api/interpreter';
const data={elements:[{type:'way',id:1,nodes:[11,12],geometry:[{lat:-7,lon:108},{lat:-6.999,lon:108.001}]}]};
const ok=()=>({ok:true,json:async()=>data});
test('504 tries a backup, saves geometry once, and expands nodes needed for offline routing',async()=>{
 const {requestRoads}=await import('../web-source/map-download.js?fallback');const servers=[],saved=[];
 await requestRoads(bounds,{endpoint,pause:0,fetcher:async url=>{servers.push(url);return servers.length===1?{ok:false,status:504}:ok();},onPart:async d=>saved.push(d)});
 assert.equal(servers.length,2);assert.notEqual(servers[0],servers[1]);assert.equal(saved.length,1);assert.ok(saved[0].elements.some(e=>e.type==='node'&&e.id===11));
});
test('Both servers returning 504 splits once, retains completed cells after a later failure',async()=>{
 const {requestRoads}=await import('../web-source/map-download.js?split');let calls=0;const saved=[];
 await assert.rejects(requestRoads(bounds,{endpoint,pause:0,fetcher:async()=>{calls++;return calls===3?ok():{ok:false,status:504};},onPart:async(d,b)=>saved.push(b)}),/tetap tersimpan/);
 assert.equal(calls,5);assert.equal(saved.length,1);assert.ok(saved[0][2]-saved[0][0]<(bounds[2]-bounds[0]));
});
test('Cancellation during fallback neither retries nor saves a late response',async()=>{
 const {requestRoads}=await import('../web-source/map-download.js?cancel');const ctrl=new AbortController();let calls=0,saved=0;
 await assert.rejects(requestRoads(bounds,{endpoint,pause:0,signal:ctrl.signal,fetcher:async()=>{calls++;ctrl.abort();throw Error('cancelled');},onPart:async()=>saved++}),{name:'AbortError'});
 assert.equal(calls,1);assert.equal(saved,0);
});
test('Previously saved cells are skipped without network use; malformed data is never marked saved',async()=>{
 const {requestRoads}=await import('../web-source/map-download.js?resume');let calls=0,saved=0;
 await requestRoads(bounds,{endpoint,skipBounds:()=>true,fetcher:async()=>{calls++;return ok();}});assert.equal(calls,0);
 await assert.rejects(requestRoads(bounds,{endpoint,pause:0,fetcher:async()=>({ok:true,json:async()=>({remark:'runtime timeout',elements:[]})}),onPart:async()=>saved++}));assert.equal(saved,0);
});
