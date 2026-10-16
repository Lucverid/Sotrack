import id.agis.sotrack.HeartRatePacket;
public class HeartRatePacketTest {
 public static void main(String[] args){
  check(72,HeartRatePacket.parse(new byte[]{0,72}));check(300,HeartRatePacket.parse(new byte[]{1,44,1}));
  check(-1,HeartRatePacket.parse(new byte[]{4,90}));check(91,HeartRatePacket.parse(new byte[]{6,91}));
  check(-1,HeartRatePacket.parse(new byte[]{1,22}));check(-1,HeartRatePacket.parse(null));check(-1,HeartRatePacket.parse(new byte[]{}));
  System.out.println("7 native HR packet checks passed");
 }
 static void check(int expected,int actual){if(expected!=actual)throw new AssertionError(expected+" != "+actual);}
}
