package id.agis.sotrack;
public final class HeartRatePacket {
 private HeartRatePacket(){}
 public static int parse(byte[] data){
  if(data==null||data.length<2)return -1;int flags=data[0]&255;
  if((flags&4)!=0&&(flags&2)==0)return -1;
  if((flags&1)!=0)return data.length<3?-1:(data[1]&255)|((data[2]&255)<<8);
  return data[1]&255;
 }
}
