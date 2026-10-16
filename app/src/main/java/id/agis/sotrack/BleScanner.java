package id.agis.sotrack;
import android.bluetooth.*;
interface BleScanner {
 interface Listener {void found(BluetoothDevice device,int rssi,String name);void failed(int code);}
 void start(BluetoothAdapter adapter,boolean all,Listener listener);void stop();
}
