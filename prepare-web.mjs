import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url)),require=createRequire(import.meta.url);
function dependency(name){try{return require(name);}catch{const result=createRequire(path.resolve(root,'../android-toolchain/package.json'))(name);return result.default||result;}}
const {build}=dependency('esbuild');
const src=path.join(root,'web-source'),out=path.join(root,'app/src/main/assets/www');
fs.mkdirSync(out,{recursive:true});
for(const name of fs.readdirSync(path.join(root,'native-assets')))fs.copyFileSync(path.join(root,'native-assets',name),path.join(out,name));
for(const name of fs.readdirSync(src)){if(name==='index.html'||name.endsWith('.js')||name==='manifest.webmanifest')continue;fs.cpSync(path.join(src,name),path.join(out,name),{recursive:true});}
let html=fs.readFileSync(path.join(src,'index.html'),'utf8').replace('<link rel="manifest" href="manifest.webmanifest">','').replace('<script src="pwa.js"></script>','').replace('<script type="module" src="app.js"></script>','<script src="app.bundle.js"></script>').replace('</head>','<script src="legacy-polyfills.js"></script><script src="native-compat.js"></script><script src="native-bridge.js"></script><script src="native-icons.js"></script><link rel="stylesheet" href="native.css"></head>');
html=html.replace('<title>Sotrack — Every ride, your way</title>','<title>Sotrack Android Beta</title>');
html=html.replace('<head>','<head><meta http-equiv="Content-Security-Policy" content="default-src \'self\' https: blob: data:; script-src \'self\' \'unsafe-inline\' \'unsafe-eval\'; style-src \'self\' \'unsafe-inline\'; worker-src \'self\' blob:; frame-src \'none\'; object-src \'none\'; base-uri \'self\'">');
fs.writeFileSync(path.join(out,'index.html'),html);
for(const name of fs.readdirSync(out).filter(n=>n.endsWith('.css'))){let css=fs.readFileSync(path.join(out,name),'utf8');css=css.replace(/inset:\s*([^;{}]+);/g,(all,value)=>{const a=value.trim().split(/\s+/);if(a.length>4)return all;const t=a[0],r=a[1]||t,b=a[2]||t,l=a[3]||r;return `top:${t};right:${r};bottom:${b};left:${l};${all}`;}).replace(/([a-z-]+):([^;{}]*\bdvh[^;{}]*);/g,(_,prop,value)=>`${prop}:${value.replaceAll('dvh','vh')};${prop}:${value};`);fs.writeFileSync(path.join(out,name),css);}
await build({entryPoints:[path.join(src,'app.js')],bundle:true,format:'iife',target:['chrome61'],outfile:path.join(out,'app.bundle.js'),minify:true,logLevel:'info'});
const {transformFileSync}=dependency('@babel/core');const presetEnv=dependency('@babel/preset-env');
const result=transformFileSync(path.join(out,'app.bundle.js'),{presets:[[presetEnv.default||presetEnv,{targets:{chrome:'30'},modules:false,bugfixes:true}]],comments:false,compact:true});
fs.writeFileSync(path.join(out,'app.bundle.js'),result.code);

// WebView 30 lacks CSS variables and needs prefixed flexbox. Keep native rules for newer engines.
await build({entryPoints:[path.join(root,'legacy-polyfills.js')],bundle:true,format:'iife',target:['es5'],outfile:path.join(out,'legacy-polyfills.js'),minify:true,logLevel:'info',nodePaths:[path.resolve(root,'../android-toolchain/node_modules')]});
const postcss=dependency('postcss'),custom=dependency('postcss-custom-properties'),prefixer=dependency('autoprefixer');
const theme=fs.readFileSync(path.join(src,'theme.css'),'utf8'),dark=theme.match(/html\[data-theme=dark\]\{([^}]+)\}/)[1];
for(const name of fs.readdirSync(out).filter(n=>n.endsWith('.css'))){const sheet=fs.readFileSync(path.join(out,name),'utf8');const result=await postcss([custom({preserve:true}),prefixer({overrideBrowserslist:['Chrome 30','Android 4.4']})]).process(sheet+'\n:root{'+dark+'}',{from:undefined});fs.writeFileSync(path.join(out,name),result.css);}
