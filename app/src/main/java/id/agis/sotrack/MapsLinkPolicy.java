package id.agis.sotrack;
import java.net.URL;
import java.io.IOException;
import java.util.Arrays;
public final class MapsLinkPolicy {
 private MapsLinkPolicy(){}
 public static URL validate(String value)throws IOException{
  if(value==null||value.length()>20000)throw new IOException("Link terlalu panjang.");
  URL u=new URL(value);String host=u.getHost().toLowerCase(java.util.Locale.ROOT);
  boolean shortLink=host.equals("maps.app.goo.gl")||host.equals("goo.gl")&&u.getPath().startsWith("/maps/");
  boolean google=Arrays.asList("google.com","www.google.com","maps.google.com","google.co.id","www.google.co.id","maps.google.co.id","google.co.uk","www.google.co.uk","google.com.au","www.google.com.au","google.co.jp","www.google.co.jp").contains(host)&&(u.getPath().equals("/maps")||u.getPath().startsWith("/maps/")||host.startsWith("maps.google."));
  if(!u.getProtocol().equals("https")||u.getUserInfo()!=null||(u.getPort()!=-1&&u.getPort()!=443)||(!shortLink&&!google))throw new IOException("Gunakan link Google Maps HTTPS yang didukung.");return u;
 }
 public static boolean shortLink(URL u){return u.getHost().equalsIgnoreCase("maps.app.goo.gl")||u.getHost().equalsIgnoreCase("goo.gl");}
}
