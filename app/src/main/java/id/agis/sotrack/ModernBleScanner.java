package id.agis.sotrack;
import android.bluetooth.*;import android.bluetooth.le.*;import android.os.ParcelUuid;import java.util.*;
final class ModernBleScanner implements BleScanner {
 private BluetoothLeScanner scanner;private ScanCallback callback;
 public void start(BluetoothAdapter adapter,boolean all,Listener listener){scanner=adapter.getBluetoothLeScanner();if(scanner==null)throw new IllegalStateException("Bluetooth belum siap");callback=new ScanCallback(){public void onScanResult(int type,ScanResult result){listener.found(result.getDevice(),result.getRssi(),result.getScanRecord()==null?null:result.getScanRecord().getDeviceName());}public void onScanFailed(int code){listener.failed(code);}};List<ScanFilter> filters=new ArrayList<>();if(!all)filters.add(new ScanFilter.Builder().setServiceUuid(new ParcelUuid(UUID.fromString("0000180d-0000-1000-8000-00805f9b34fb"))).build());scanner.startScan(filters,new ScanSettings.Builder().setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY).build(),callback);}
 public void stop(){if(scanner!=null&&callback!=null)try{scanner.stopScan(callback);}catch(Exception ignored){}callback=null;}
}
