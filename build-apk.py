#!/usr/bin/env python3
"""Offline build after Android SDK build-tools 35 and platform 35 have been installed.
Usage: python3 build-apk.py --sdk /absolute/android-sdk --out /absolute/Sotrack.apk
The supplied web bundle is already prepared; no npm is needed to rebuild Java/APK.
"""
from pathlib import Path
import argparse,subprocess,zipfile,os
p=argparse.ArgumentParser();p.add_argument('--sdk',required=True);p.add_argument('--out',required=True);args=p.parse_args()
root=Path(__file__).resolve().parent;sdk=Path(args.sdk).resolve();build=root/'build';build.mkdir(exist_ok=True)
platform=sdk/'platforms/android-35/android.jar'
if not platform.exists():platform=sdk/'android-35/android.jar'
tools=sdk/'build-tools/35.0.0'
if not tools.exists():tools=sdk/'android-15'
assert platform.exists() and (tools/'aapt').exists(),'Install Android platform 35 and build-tools 35 first.'
for n in ['aapt','d8','zipalign','apksigner']:(tools/n).chmod(0o755)
def run(*command):subprocess.run([str(x) for x in command],check=True,cwd=root)
classes=build/'classes';dex=build/'dex';classes.mkdir(exist_ok=True);dex.mkdir(exist_ok=True)
files=list((root/'app/src/main/java').rglob('*.java'))
run('java','-m','jdk.compiler/com.sun.tools.javac.Main','--release','8','-classpath',platform,'-d',classes,*files)
run('java','-m','jdk.jartool/sun.tools.jar.Main','--create','--file',build/'classes.jar','-C',classes,'.')
run(tools/'d8','--min-api','19','--lib',platform,'--output',dex,build/'classes.jar')
run(tools/'aapt','package','-f','-M',root/'app/src/main/AndroidManifest.xml','-S',root/'app/src/main/res','-A',root/'app/src/main/assets','-I',platform,'-F',build/'unsigned.apk')
with zipfile.ZipFile(build/'unsigned.apk','a',zipfile.ZIP_DEFLATED) as archive:archive.write(dex/'classes.dex','classes.dex')
run(tools/'zipalign','-f','4',build/'unsigned.apk',build/'aligned.apk')
key=root/'signing/sotrack-beta.p12';key.parent.mkdir(exist_ok=True)
if not key.exists():run('keytool','-genkeypair','-keystore',key,'-storetype','PKCS12','-storepass','android','-keypass','android','-alias','sotrack-beta','-keyalg','RSA','-keysize','2048','-validity','10000','-dname','CN=Sotrack Beta, O=Agis, C=ID')
out=Path(args.out).resolve();out.parent.mkdir(exist_ok=True)
run(tools/'apksigner','sign','--ks',key,'--ks-key-alias','sotrack-beta','--ks-pass','pass:android','--key-pass','pass:android','--min-sdk-version','19','--out',out,build/'aligned.apk')
run(tools/'apksigner','verify','--verbose','--print-certs',out)
print('APK:',out)
