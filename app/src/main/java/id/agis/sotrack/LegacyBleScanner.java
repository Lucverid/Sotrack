package id.agis.sotrack;
import android.bluetooth.*;import java.util.UUID;
final class LegacyBleScanner implements BleScanner {
 private BluetoothAdapter adapter;private BluetoothAdapter.LeScanCallback callback;
 public void start(BluetoothAdapter a,boolean all,Listener listener){adapter=a;callback=(device,rssi,record)->listener.found(device,rssi,null);boolean started=all?a.startLeScan(callback):a.startLeScan(new UUID[]{UUID.fromString("0000180d-0000-1000-8000-00805f9b34fb")},callback);if(!started)throw new IllegalStateException("Bluetooth belum siap");}
 public void stop(){if(adapter!=null&&callback!=null)try{adapter.stopLeScan(callback);}catch(Exception ignored){}callback=null;}
}
