package id.agis.sotrack;

import android.Manifest;
import android.app.Activity;
import android.app.AlertDialog;
import android.bluetooth.*;

import android.content.*;
import android.content.pm.PackageManager;
import android.location.*;
import android.net.Uri;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.NetworkInfo;
import javax.net.ssl.HttpsURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.concurrent.ConcurrentHashMap;
import android.os.*;
import android.provider.Settings;
import android.util.Base64;
import android.view.*;
import android.webkit.*;
import android.widget.*;
import org.json.*;
import java.io.*;
import java.util.*;

public class MainActivity extends Activity {
 private static final String ORIGIN="https://appassets.androidplatform.net";
 private static final UUID HR_SERVICE=UUID.fromString("0000180d-0000-1000-8000-00805f9b34fb");
 private static final UUID HR_MEASUREMENT=UUID.fromString("00002a37-0000-1000-8000-00805f9b34fb");
 private static final UUID CCCD=UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");
 private final ConcurrentHashMap<String,HttpsURLConnection> roadRequests=new ConcurrentHashMap<>();
 private volatile String sharedMaps="";private volatile boolean mapsReady=false;
 private WebView web; private final Handler handler=new Handler(Looper.getMainLooper());
 private long gpsStartedAt=0,gpsLastFixAt=0;
 private LocationManager locations; private boolean gpsWanted=false, gpsRegistered=false; private Runnable pendingPermission;
 private BluetoothAdapter bluetooth; private BleScanner scanSession; private long scanEpoch=0; private String importTarget=null;
 private BluetoothGatt hrGatt; private String hrName="Sensor HR"; private long connectionEpoch=0;
 private AlertDialog scanDialog; private ArrayAdapter<String> devicesUI; private final ArrayList<BluetoothDevice> devices=new ArrayList<>();
 private ValueCallback<Uri[]> fileCallback; private byte[] saveBytes; private boolean destroyed=false;

 @Override public void onCreate(Bundle state){super.onCreate(state);captureSharedMaps(getIntent());
  getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
  if(Build.VERSION.SDK_INT>=21){getWindow().setStatusBarColor(0xff101a2d);getWindow().setNavigationBarColor(0xff101a2d);}
  locations=(LocationManager)getSystemService(LOCATION_SERVICE);
  BluetoothManager bm=(BluetoothManager)getSystemService(BLUETOOTH_SERVICE);bluetooth=bm==null?null:bm.getAdapter();
  web=new WebView(this);setContentView(web);
  WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setDatabaseEnabled(true);
  settings.setAllowFileAccess(false);settings.setAllowContentAccess(true);if(Build.VERSION.SDK_INT>=21)settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  settings.setMediaPlaybackRequiresUserGesture(false);settings.setSupportMultipleWindows(false);
  settings.setUserAgentString(settings.getUserAgentString()+" SotrackAndroid/0.1");
  web.addJavascriptInterface(new NativeBridge(),"SotrackNative");
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,String address){
    Uri uri=Uri.parse(address);if(!"appassets.androidplatform.net".equals(uri.getHost()))return null;
    try{String path=uri.getPath();if(path==null||!path.startsWith("/assets/")||path.contains(".."))return emptyResponse();
     String asset=path.substring(8);String mime=asset.endsWith(".js")?"application/javascript":asset.endsWith(".css")?"text/css":asset.endsWith(".html")?"text/html":asset.endsWith(".svg")?"image/svg+xml":asset.endsWith(".png")?"image/png":asset.endsWith(".webmanifest")?"application/manifest+json":"application/octet-stream";
     return new WebResourceResponse(mime,"UTF-8",getAssets().open(asset));
    }catch(IOException error){return emptyResponse();}
   }
   @Override public void onPageFinished(WebView v,String url){publishNetwork();}
   @Override public boolean shouldOverrideUrlLoading(WebView v,String url){return external(Uri.parse(url));}
  });
  web.setWebChromeClient(Build.VERSION.SDK_INT>=21?new ModernChrome():new BasicChrome());
  registerReceiver(connectionReceiver,new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION));
  web.loadUrl(ORIGIN+"/assets/www/index.html");
 }
 private class BasicChrome extends WebChromeClient {
  @Override public void onGeolocationPermissionsShowPrompt(String origin,GeolocationPermissions.Callback callback){callback.invoke(origin,false,false);}
  @Override public void onShowCustomView(View v,CustomViewCallback c){c.onCustomViewHidden();}
 }
 private class ModernChrome extends BasicChrome {
  @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params){
   if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=callback;
   try{startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*"),100);}
   catch(Exception e){fileCallback.onReceiveValue(null);fileCallback=null;message("Pemilih file tidak tersedia.");}return true;
  }
 }
 private void captureSharedMaps(Intent intent){if(intent!=null&&Intent.ACTION_SEND.equals(intent.getAction())&&"text/plain".equals(intent.getType())){String value=intent.getStringExtra(Intent.EXTRA_TEXT);if(value!=null)sharedMaps=value.substring(0,Math.min(value.length(),24000));}}
 @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);captureSharedMaps(intent);if(mapsReady&&!sharedMaps.isEmpty()){String text=sharedMaps;sharedMaps="";event("sotrack:android-maps-shared",object("text",text));}}
 private void resolveMaps(String id,String address){new Thread(()->{
  JSONObject reply=object("id",id);
  try{if(!online())throw new IOException("Link pendek perlu internet.");URL url=MapsLinkPolicy.validate(address);long deadline=SystemClock.elapsedRealtime()+35000;
   for(int i=0;i<6;i++){
    if(!MapsLinkPolicy.shortLink(url)){reply.put("url",url.toString());break;}
    if(SystemClock.elapsedRealtime()>deadline)throw new IOException("Link belum merespons.");
    HttpsURLConnection connection=SecureConnections.open(url);connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(7000);connection.setReadTimeout(7000);connection.setRequestProperty("User-Agent","Mozilla/5.0 Sotrack/0.1");
    try{int status=connection.getResponseCode();String redirect=connection.getHeaderField("Location");if(status<300||status>399||redirect==null)throw new IOException("Link tidak mengarah ke petunjuk arah. Buka di browser dan salin alamat lengkapnya.");url=MapsLinkPolicy.validate(new URL(url,redirect).toString());}finally{connection.disconnect();}
   }
   if(!reply.has("url")){if(!MapsLinkPolicy.shortLink(url))reply.put("url",url.toString());else throw new IOException("Terlalu banyak pengalihan link.");}
  }catch(Exception e){try{reply.put("error",e instanceof javax.net.ssl.SSLException?"Sistem Android menolak sambungan aman link. Buka link di browser lalu salin alamat lengkap Directions.":e instanceof IOException?e.getMessage():"Link belum dapat dibaca.");}catch(JSONException ignored){}}
  event("sotrack:android-maps-link",reply);
 },"Sotrack-maps-link").start();}
 private WebResourceResponse emptyResponse(){return new WebResourceResponse("text/plain","UTF-8",new ByteArrayInputStream(new byte[0]));}
 private boolean external(Uri uri){
  if("appassets.androidplatform.net".equals(uri.getHost())&&"https".equals(uri.getScheme()))return false;
  if("https".equals(uri.getScheme())||"http".equals(uri.getScheme()))try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception e){message("Tidak ada aplikasi pembuka tautan.");}
  return true;
 }
 private void js(String source){handler.post(()->{if(!destroyed)web.evaluateJavascript(source,null);});}
 private void event(String name,JSONObject data){js("window.dispatchEvent(new CustomEvent("+JSONObject.quote(name)+",{detail:"+data.toString()+"}));");}
 private JSONObject object(String key,Object value){JSONObject o=new JSONObject();try{o.put(key,value);}catch(JSONException ignored){}return o;}
 private void message(String message){handler.post(()->{if(!destroyed)Toast.makeText(this,message,Toast.LENGTH_LONG).show();});}
 private void gpsError(String text){event("sotrack:android-gps-error",object("message",text));}
 private void hrStatus(String text,boolean connected){JSONObject o=object("message",text);try{o.put("connected",connected);o.put("name",hrName);}catch(JSONException ignored){}event("sotrack:android-hr-status",o);}
 private boolean allowed(String p){return Build.VERSION.SDK_INT<23||checkSelfPermission(p)==PackageManager.PERMISSION_GRANTED;}
 private void ensure(String[] permissions,Runnable operation){
  ArrayList<String> missing=new ArrayList<>();for(String p:permissions)if(!allowed(p))missing.add(p);
  if(missing.isEmpty()){operation.run();return;}
  if(pendingPermission!=null){message("Selesaikan permintaan izin yang terbuka, lalu coba lagi.");return;}
  pendingPermission=operation;requestPermissions(missing.toArray(new String[0]),42);
 }
 @Override public void onRequestPermissionsResult(int code,String[] perms,int[] results){super.onRequestPermissionsResult(code,perms,results);if(code!=42)return;
  Runnable next=pendingPermission;pendingPermission=null;boolean ok=results.length>0;for(int result:results)ok&=result==PackageManager.PERMISSION_GRANTED;
  if(ok&&next!=null)next.run();else{gpsWanted=false;gpsError("Izin ditolak. Aktifkan izin Lokasi/Bluetooth di pengaturan aplikasi.");hrStatus("Izin ditolak. Aktifkan izin Lokasi/Bluetooth lalu coba lagi.",false);}
 }
 private final LocationListener gpsListener=new LocationListener(){
  @Override public void onLocationChanged(Location l){
   if(!gpsWanted)return;gpsLastFixAt=SystemClock.elapsedRealtime();handler.removeCallbacks(gpsWaiting);
   try{JSONObject coords=new JSONObject();coords.put("latitude",l.getLatitude());coords.put("longitude",l.getLongitude());coords.put("accuracy",l.hasAccuracy()?l.getAccuracy():1000);
    coords.put("altitude",l.hasAltitude()?l.getAltitude():JSONObject.NULL);
    coords.put("altitudeAccuracy",Build.VERSION.SDK_INT>=26&&l.hasVerticalAccuracy()?l.getVerticalAccuracyMeters():JSONObject.NULL);
    coords.put("speed",l.hasSpeed()?l.getSpeed():JSONObject.NULL);coords.put("heading",l.hasBearing()?l.getBearing():JSONObject.NULL);
    JSONObject data=new JSONObject();data.put("coords",coords);data.put("timestamp",l.getTime());event("sotrack:android-gps",data);
   }catch(JSONException ignored){}
  }
  @Override public void onProviderDisabled(String p){if(gpsWanted)event("sotrack:android-gps-status",object("message","Penyedia "+p+" nonaktif. Menunggu penyedia lokasi lainnya."));}
  @Override public void onProviderEnabled(String p){if(gpsWanted){gpsRegistered=false;startGps();}}
  @Override public void onStatusChanged(String p,int status,Bundle b){}
 };
 private final Runnable gpsWaiting=new Runnable(){public void run(){if(gpsWanted){event("sotrack:android-gps-status",object("message","Menunggu sinyal GPS. Coba di luar ruangan; GPS lama dapat perlu beberapa menit."));}}};
 private void startGps(){
  gpsWanted=true;ensure(new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION},()->{
   if(!gpsWanted||gpsRegistered)return;
   boolean requested=false;Location recent=null;
   for(String p:new String[]{LocationManager.GPS_PROVIDER,LocationManager.NETWORK_PROVIDER}){
    try{if(!locations.isProviderEnabled(p))continue;
     locations.requestLocationUpdates(p,1000,0,gpsListener,Looper.getMainLooper());requested=true;
     Location cached=locations.getLastKnownLocation(p);
     if(cached!=null&&SystemClock.elapsedRealtimeNanos()-cached.getElapsedRealtimeNanos()>=0&&SystemClock.elapsedRealtimeNanos()-cached.getElapsedRealtimeNanos()<15000000000L&&(recent==null||cached.getAccuracy()<recent.getAccuracy()))recent=cached;
    }catch(SecurityException e){gpsError("Izin Lokasi diperlukan. Periksa izin aplikasi.");}catch(IllegalArgumentException ignored){}
   }
   gpsRegistered=requested;if(requested)gpsStartedAt=SystemClock.elapsedRealtime();
   if(requested){event("sotrack:android-gps-status",object("message","Mencari posisi GPS…"));handler.removeCallbacks(gpsWaiting);handler.postDelayed(gpsWaiting,25000);if(recent!=null)gpsListener.onLocationChanged(recent);}
   else{gpsError("Penyedia lokasi belum tersedia. Aktifkan mode Akurasi tinggi pada pengaturan Lokasi HP.");new AlertDialog.Builder(this).setMessage("Aktifkan Lokasi / Akurasi tinggi, lalu ketuk tombol posisi lagi.").setPositiveButton("Pengaturan",(d,w)->startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))).setNegativeButton("Tutup",null).show();}
  });
 }
 private void stopGps(){gpsWanted=false;gpsRegistered=false;handler.removeCallbacks(gpsWaiting);try{locations.removeUpdates(gpsListener);}catch(SecurityException ignored){}}
 private boolean online(){
  ConnectivityManager c=(ConnectivityManager)getSystemService(CONNECTIVITY_SERVICE);if(c==null)return false;
  if(Build.VERSION.SDK_INT>=23){NetworkCapabilities n=c.getNetworkCapabilities(c.getActiveNetwork());return n!=null&&n.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)&&n.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);}
  NetworkInfo n=c.getActiveNetworkInfo();return n!=null&&n.isConnected();
 }
 private void publishNetwork(){event("sotrack:android-network",object("online",online()));}
 private final BroadcastReceiver connectionReceiver=new BroadcastReceiver(){public void onReceive(Context c,Intent i){publishNetwork();handler.removeCallbacks(networkRefresh);handler.postDelayed(networkRefresh,1500);}};
 private final Runnable networkRefresh=new Runnable(){public void run(){if(!destroyed){publishNetwork();handler.postDelayed(this,10000);}}};
 private void weather(String id,String address){new Thread(()->{
  HttpsURLConnection connection=null;JSONObject reply=object("id",id);
  try{URL url=new URL(address);if(!"https".equals(url.getProtocol())||!"api.open-meteo.com".equals(url.getHost())||!"/v1/forecast".equals(url.getPath())||url.getPort()!=-1||url.getUserInfo()!=null)throw new IOException("Alamat cuaca tidak diizinkan.");
   if(!online())throw new IOException("HP sedang offline. Hubungkan internet untuk memperbarui cuaca.");
   connection=SecureConnections.open(url);connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(12000);connection.setReadTimeout(15000);
   int status=connection.getResponseCode();if(status!=200)throw new IOException("Layanan cuaca merespons "+status+". Coba lagi nanti.");
   ByteArrayOutputStream bytes=new ByteArrayOutputStream();try(InputStream in=connection.getInputStream()){byte[] buffer=new byte[4096];int n;while((n=in.read(buffer))!=-1){if(bytes.size()+n>1048576)throw new IOException("Respons cuaca terlalu besar.");bytes.write(buffer,0,n);}}
   reply.put("data",new JSONObject(new String(bytes.toByteArray(),"UTF-8")));
  }catch(Exception e){try{reply.put("error",e instanceof javax.net.ssl.SSLException?"Sambungan aman cuaca ditolak sistem Android lama. Sertifikat tetap diperiksa; coba perbarui sistem jika tersedia.":e instanceof IOException?"Cuaca belum terhubung. Periksa internet lalu coba lagi.":"Data cuaca belum dapat dibaca.");}catch(JSONException ignored){}}
  finally{if(connection!=null)connection.disconnect();}event("sotrack:android-weather",reply);
 },"Sotrack-weather").start();}
 private void stopScan(){scanEpoch++;if(scanSession!=null)scanSession.stop();scanSession=null;}
 private void scanHR(boolean all){
  String[] perms=Build.VERSION.SDK_INT>=31?new String[]{Manifest.permission.BLUETOOTH_SCAN,Manifest.permission.BLUETOOTH_CONNECT,Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION}:new String[]{Manifest.permission.ACCESS_FINE_LOCATION,Manifest.permission.ACCESS_COARSE_LOCATION};
  ensure(perms,()->scanAllowed(all));
 }
 private void scanAllowed(boolean all){
  if(bluetooth==null||!getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE)){hrStatus("HP ini tidak menyediakan Bluetooth BLE.",false);return;}
  if(!bluetooth.isEnabled()){new AlertDialog.Builder(this).setMessage("Nyalakan Bluetooth untuk mencari sensor HR.").setPositiveButton("Nyalakan",(d,w)->startActivity(new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE))).setNegativeButton("Batal",null).show();return;}
  if(Build.VERSION.SDK_INT<=30&&!locations.isProviderEnabled(LocationManager.GPS_PROVIDER)&&!locations.isProviderEnabled(LocationManager.NETWORK_PROVIDER)){hrStatus("Aktifkan Lokasi/GPS HP untuk pemindaian BLE pada Android lama.",false);startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS));return;}
  stopScan();if(scanDialog!=null)scanDialog.dismiss();devices.clear();devicesUI=new ArrayAdapter<>(this,android.R.layout.simple_list_item_1);
  TextView note=new TextView(this);note.setPadding(32,24,32,16);note.setText("Mencari 15 detik. Aktifkan siaran HR pada band. Jika kosong, centang Cari semua perangkat BLE di Sotrack lalu coba lagi.");
  ListView list=new ListView(this);list.setAdapter(devicesUI);LinearLayout layout=new LinearLayout(this);layout.setOrientation(LinearLayout.VERTICAL);layout.addView(note);layout.addView(list,new LinearLayout.LayoutParams(-1,Math.round(300*getResources().getDisplayMetrics().density)));
  scanDialog=new AlertDialog.Builder(this).setTitle("Sensor HR · Bluetooth Android").setView(layout).setNegativeButton("Tutup",(d,w)->stopScan()).create();scanDialog.setOnDismissListener(d->stopScan());scanDialog.show();
  list.setOnItemClickListener((parent,view,index,id)->{BluetoothDevice device=devices.get(index);stopScan();scanDialog.dismiss();connectHR(device);});
  final long epoch=++scanEpoch;
  scanSession=Build.VERSION.SDK_INT>=21?new ModernBleScanner():new LegacyBleScanner();
  try{scanSession.start(bluetooth,all,new BleScanner.Listener(){
   public void found(BluetoothDevice device,int rssi,String advertisedName){handler.post(()->{if(epoch!=scanEpoch||devices.contains(device))return;devices.add(device);String name=device.getName();if(name==null)name=advertisedName;devicesUI.add((name==null?"Perangkat BLE tanpa nama":name)+"\n"+device.getAddress()+" · "+rssi+" dBm");});}
   public void failed(int code){handler.post(()->{if(epoch!=scanEpoch)return;note.setText("Scan gagal ("+code+"). Matikan/nyalakan Bluetooth lalu coba lagi.");stopScan();});}
  });handler.postDelayed(()->{if(epoch==scanEpoch){stopScan();note.setText(devices.isEmpty()?"Belum ada sensor. Aktifkan broadcast HR, lalu coba Cari semua perangkat BLE.":"Scan selesai. Ketuk perangkat untuk menghubungkan HR.");}},15000);}
  catch(Exception e){stopScan();note.setText("Scan gagal: "+e.getMessage());}
 }
 private void closeHR(){connectionEpoch++;BluetoothGatt g=hrGatt;hrGatt=null;if(g!=null){try{g.disconnect();}catch(Exception ignored){}g.close();}}
 private void connectHR(BluetoothDevice device){
  closeHR();hrName=device.getName()==null?"Sensor HR":device.getName();hrStatus("Menyambungkan · "+hrName,false);
  try{hrGatt=Build.VERSION.SDK_INT>=23?device.connectGatt(this,false,gattCallback,BluetoothDevice.TRANSPORT_LE):device.connectGatt(this,false,gattCallback);long epoch=connectionEpoch;
   handler.postDelayed(()->{if(epoch==connectionEpoch&&hrGatt!=null){hrStatus("Koneksi HR melewati batas waktu. Aktifkan broadcast lalu coba lagi.",false);closeHR();}},20000);
  }catch(Exception e){hrStatus("Koneksi HR gagal: "+e.getMessage(),false);closeHR();}
 }
 private final BluetoothGattCallback gattCallback=new BluetoothGattCallback(){
  @Override public void onConnectionStateChange(BluetoothGatt g,int status,int state){handler.post(()->{
   if(g!=hrGatt)return;if(status!=BluetoothGatt.GATT_SUCCESS||state==BluetoothProfile.STATE_DISCONNECTED){hrStatus("HR terputus ("+status+") · hubungkan kembali",false);closeHR();}
   else if(state==BluetoothProfile.STATE_CONNECTED){if(!g.discoverServices()){hrStatus("Layanan sensor gagal dibaca.",false);closeHR();}}
  });}
  @Override public void onServicesDiscovered(BluetoothGatt g,int status){handler.post(()->{
   if(g!=hrGatt)return;BluetoothGattService service=g.getService(HR_SERVICE);BluetoothGattCharacteristic ch=service==null?null:service.getCharacteristic(HR_MEASUREMENT);
   if(status!=0||ch==null){hrStatus("Perangkat tidak menyediakan layanan HR BLE standar (180D/2A37).",false);closeHR();return;}
   BluetoothGattDescriptor descriptor=ch.getDescriptor(CCCD);
   if(descriptor==null||!g.setCharacteristicNotification(ch,true)){hrStatus("Notifikasi HR tidak tersedia.",false);closeHR();return;}
   descriptor.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);if(!g.writeDescriptor(descriptor)){hrStatus("Langganan HR gagal dimulai.",false);closeHR();}
  });}
  @Override public void onDescriptorWrite(BluetoothGatt g,BluetoothGattDescriptor descriptor,int status){handler.post(()->{if(g!=hrGatt)return;if(status==0){connectionEpoch++;hrStatus("Terhubung · "+hrName,true);}else{hrStatus("Notifikasi HR ditolak ("+status+").",false);closeHR();}});}
  @Override public void onCharacteristicChanged(BluetoothGatt g,BluetoothGattCharacteristic ch){final byte[] bytes=ch.getValue();if(g!=hrGatt||!HR_MEASUREMENT.equals(ch.getUuid())||bytes==null)return;
   int bpm=HeartRatePacket.parse(bytes);JSONObject data=object("hr",bpm>0?bpm:JSONObject.NULL);event("sotrack:android-hr",data);
  }
 };
 private void offlineRoads(String id,String endpoint,String query){new Thread(()->{
  JSONObject reply=object("id",id);HttpsURLConnection c=null;
  try{URL url=new URL(endpoint);if(!url.getProtocol().equals("https")||!(url.getHost().equals("overpass-api.de")||url.getHost().equals("overpass.private.coffee"))||!url.getPath().equals("/api/interpreter")||url.getUserInfo()!=null||url.getPort()!=-1||url.getQuery()!=null||query.length()>18000)throw new IOException("Alamat atau area peta tidak didukung.");if(!online())throw new IOException("Hubungkan internet untuk menyiapkan peta.");
   c=SecureConnections.open(url);roadRequests.put(id,c);c.setRequestMethod("POST");c.setDoOutput(true);c.setConnectTimeout(10000);c.setReadTimeout(35000);c.setRequestProperty("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");c.setRequestProperty("Accept","application/json");c.setRequestProperty("User-Agent","SotrackAndroid/0.1.10 (personal cycling app)");
   byte[] body=("data="+URLEncoder.encode(query,"UTF-8")).getBytes("UTF-8");c.setFixedLengthStreamingMode(body.length);try(OutputStream out=c.getOutputStream()){out.write(body);}
   int code=c.getResponseCode();reply.put("status",code);if(code!=200)throw new IOException("Server peta merespons "+code+". Coba lagi nanti.");ByteArrayOutputStream bytes=new ByteArrayOutputStream();try(InputStream in=c.getInputStream()){byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){if(bytes.size()+n>6000000)throw new IOException("Bagian peta terlalu besar. Coba area lebih kecil.");bytes.write(b,0,n);}}reply.put("data",new JSONObject(new String(bytes.toByteArray(),"UTF-8")));
  }catch(Exception e){try{reply.put("error",e instanceof javax.net.ssl.SSLException?"Android menolak sambungan aman server peta. Bagian ini belum tersimpan.":e instanceof java.net.UnknownHostException?"Server peta belum dapat dihubungi. Periksa internet HP.":e instanceof IOException?e.getMessage():"Data peta belum dapat dibaca.");}catch(JSONException ignored){}}
  finally{roadRequests.remove(id);if(c!=null)c.disconnect();}event("sotrack:android-offline-roads",reply);
 },"Sotrack-offline-roads").start();}
 private void originalGoogleRoute(String id,String address){new Thread(()->{JSONObject reply=object("id",id);try{if(!online())throw new IOException("Hubungkan internet untuk mengonversi jalur Google Maps.");GoogleRouteFetcher.Document result=GoogleRouteFetcher.fetch(address);reply.put("raw",result.text);reply.put("url",address);}catch(Exception e){try{reply.put("error",e instanceof javax.net.ssl.SSLException?"Android menolak sambungan aman Google. Jalur belum dapat dikonversi.":e instanceof java.net.UnknownHostException?"Google Maps belum dapat dihubungi. Periksa koneksi internet HP.":e instanceof java.net.SocketTimeoutException?"Google Maps belum merespons. Coba lagi nanti.":e instanceof IOException?e.getMessage():"Data jalur asli belum bisa dibaca.");}catch(JSONException ignored){}}event("sotrack:android-google-route",reply);},"Sotrack-google-route").start();}
 public final class NativeBridge {
  @JavascriptInterface public void fetchOfflineRoads(String id,String endpoint,String query){offlineRoads(id,endpoint,query);}
  @JavascriptInterface public void cancelOfflineRoads(String id){HttpsURLConnection c=roadRequests.remove(id);if(c!=null)c.disconnect();}
  @JavascriptInterface public void convertGoogleRoute(String id,String url){originalGoogleRoute(id,url);}
  @JavascriptInterface public void resolveMapsLink(String id,String url){resolveMaps(id,url);}
  @JavascriptInterface public synchronized String takeSharedMaps(){mapsReady=true;String text=sharedMaps;sharedMaps="";return text;}
  @JavascriptInterface public void showGPSStatus(){handler.post(()->{
   String detail="Izin lokasi: "+(allowed(Manifest.permission.ACCESS_FINE_LOCATION)?"diizinkan":"belum diizinkan")+"\n";
   for(String p:new String[]{LocationManager.GPS_PROVIDER,LocationManager.NETWORK_PROVIDER})try{detail+=p+": "+(locations.isProviderEnabled(p)?"aktif":"nonaktif")+"\n";}catch(Exception e){detail+=p+": tidak tersedia\n";}
   detail+="Pencarian aplikasi: "+(gpsRegistered?"aktif ("+((SystemClock.elapsedRealtime()-gpsStartedAt)/1000)+" detik)":"belum aktif")+"\n";
   detail+=gpsLastFixAt==0?"Belum ada posisi dari Android.":"Posisi terakhir diterima "+((SystemClock.elapsedRealtime()-gpsLastFixAt)/1000)+" detik lalu.";
   new AlertDialog.Builder(MainActivity.this).setTitle("Diagnostik GPS").setMessage(detail+"\n\nJika pencarian aktif tetapi posisi belum diterima, coba di ruang terbuka. Pilih mode Akurasi tinggi pada HP.").setPositiveButton("Tutup",null).setNeutralButton("Pengaturan lokasi",(d,w)->startActivity(new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS))).show();
  });}
  @JavascriptInterface public int androidVersion(){return Build.VERSION.SDK_INT;}
  @JavascriptInterface public void pickLegacyFile(String target){handler.post(()->{if(importTarget!=null){message("Selesaikan pemilihan file sebelumnya.");return;}if(!target.matches("[a-zA-Z][a-zA-Z0-9_-]{0,79}"))return;importTarget=target;try{startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*"),102);}catch(Exception e){importTarget=null;message("Pemilih file tidak tersedia.");}});}
  @JavascriptInterface public boolean isOnline(){return online();}
  @JavascriptInterface public void requestWeather(String id,String url){weather(id,url);}
  @JavascriptInterface public void startGPS(){handler.post(()->startGps());}
  @JavascriptInterface public void stopGPS(){handler.post(()->stopGps());}
  @JavascriptInterface public void scanHR(boolean all){handler.post(()->MainActivity.this.scanHR(all));}
  @JavascriptInterface public void disconnectHR(){handler.post(()->{closeHR();hrStatus("Belum terhubung",false);});}
  @JavascriptInterface public void saveFile(String name,String mime,String encoded){
   if(encoded.length()>45*1024*1024){message("File terlalu besar untuk ekspor Android beta.");return;}
   handler.post(()->{if(saveBytes!=null){message("Selesaikan penyimpanan file sebelumnya.");return;}try{saveBytes=Base64.decode(encoded,Base64.DEFAULT);String safe=name.replaceAll("[^a-zA-Z0-9._ -]","_");Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType(mime==null||mime.isEmpty()?"application/octet-stream":mime);i.putExtra(Intent.EXTRA_TITLE,safe);startActivityForResult(i,101);}catch(Exception e){saveBytes=null;message("File gagal disiapkan: "+e.getMessage());}});
  }
 }
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);
  if(request==100){if(fileCallback!=null){fileCallback.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);fileCallback=null;}}
  if(request==102){final String target=importTarget;importTarget=null;if(target!=null&&result==RESULT_OK&&data!=null&&data.getData()!=null){final Uri uri=data.getData();new Thread(()->{JSONObject reply=object("target",target);try{ByteArrayOutputStream bytes=new ByteArrayOutputStream();try(InputStream in=getContentResolver().openInputStream(uri)){if(in==null)throw new IOException("File tidak dapat dibuka");byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1){if(bytes.size()+n>20000000)throw new IOException("Batas impor Android 4.4 adalah 20 MB.");bytes.write(b,0,n);}}String name="import.json";try(android.database.Cursor cursor=getContentResolver().query(uri,new String[]{android.provider.OpenableColumns.DISPLAY_NAME},null,null,null)){if(cursor!=null&&cursor.moveToFirst())name=cursor.getString(0);}reply.put("name",name);reply.put("base64",Base64.encodeToString(bytes.toByteArray(),Base64.NO_WRAP));}catch(Exception e){try{reply.put("error",e.getMessage());}catch(Exception ignored){}}event("sotrack:legacy-file",reply);},"Sotrack-import").start();}}
  if(request==101){byte[] bytes=saveBytes;saveBytes=null;if(result==RESULT_OK&&data!=null&&data.getData()!=null&&bytes!=null){try(OutputStream out=getContentResolver().openOutputStream(data.getData())){if(out==null)throw new IOException("Penyimpanan tidak tersedia");out.write(bytes);message("File disimpan.");}catch(Exception e){message("Simpan gagal: "+e.getMessage());}}}
 }
 @Override public void onBackPressed(){web.evaluateJavascript("Boolean(window.sotrack&&window.sotrack.recording)",value->{if("true".equals(value))new AlertDialog.Builder(this).setMessage("Rekaman sedang berjalan. Tetap buka aplikasi dengan layar menyala untuk GPS yang andal.").setPositiveButton("Tetap di app",null).setNegativeButton("Ke layar utama",(d,w)->moveTaskToBack(true)).show();else if(web.canGoBack())web.goBack();else super.onBackPressed();});}
 @Override protected void onResume(){super.onResume();if(web!=null)publishNetwork();}
 @Override protected void onDestroy(){destroyed=true;for(HttpsURLConnection c:roadRequests.values())c.disconnect();roadRequests.clear();try{unregisterReceiver(connectionReceiver);}catch(Exception ignored){}stopGps();stopScan();closeHR();handler.removeCallbacksAndMessages(null);if(fileCallback!=null)fileCallback.onReceiveValue(null);web.removeJavascriptInterface("SotrackNative");web.destroy();super.onDestroy();}
}
