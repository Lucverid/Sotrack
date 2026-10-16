package id.agis.sotrack;
import java.net.URL;
import java.io.*;
import java.util.regex.*;
import javax.net.ssl.HttpsURLConnection;
public final class GoogleRouteFetcher {
 public static final class Document {public final URL url;public final String text;Document(URL u,String t){url=u;text=t;}}
 private GoogleRouteFetcher(){}
 public static URL directionsLink(URL page,String html)throws IOException{
  Matcher m=Pattern.compile("<link\\b[^>]*?href\\s*=\\s*[\"']([^\"']+)[\"']",Pattern.CASE_INSENSITIVE).matcher(html);
  while(m.find()){String value=m.group(1).replace("&amp;","&").replace("&#38;","&");URL candidate=new URL(page,value);if(candidate.getPath().equals("/maps/preview/directions")){MapsLinkPolicy.validate(candidate.toString());return candidate;}}
  throw new IOException("Google belum mengirim data jalur lengkap. Gunakan link Directions lengkap. Konversi dihentikan agar rute tidak berubah.");
 }
 private static Document read(URL start,long deadline)throws IOException{
  URL url=MapsLinkPolicy.validate(start.toString());
  for(int hop=0;hop<6;hop++){
   int left=(int)(deadline-System.currentTimeMillis());if(left<=0)throw new IOException("Google belum merespons. Coba lagi nanti.");
   HttpsURLConnection c=SecureConnections.open(url);c.setInstanceFollowRedirects(false);c.setConnectTimeout(Math.min(10000,left));c.setReadTimeout(Math.min(15000,left));c.setRequestProperty("User-Agent","Mozilla/5.0");c.setRequestProperty("Accept-Language","id-ID,id;q=0.9,en;q=0.8");
   try{int code=c.getResponseCode();if(code>=300&&code<=399){String location=c.getHeaderField("Location");if(location==null)throw new IOException("Pengalihan Google tidak lengkap.");url=MapsLinkPolicy.validate(new URL(url,location).toString());continue;}
    if(code!=200)throw new IOException("Google merespons "+code+". Konversi dihentikan; coba lagi nanti.");
    ByteArrayOutputStream out=new ByteArrayOutputStream();try(InputStream in=c.getInputStream()){byte[] buffer=new byte[8192];int n;while((n=in.read(buffer))!=-1){if(out.size()+n>4000000)throw new IOException("Data jalur terlalu besar untuk konversi HP.");if(System.currentTimeMillis()>deadline)throw new IOException("Google belum selesai merespons. Coba lagi nanti.");out.write(buffer,0,n);}}
    String text=new String(out.toByteArray(),"UTF-8");if(text.contains("Our systems have detected unusual traffic")||text.contains("unusual traffic from your computer network"))throw new IOException("Google meminta verifikasi. Jalur belum dapat diambil; konversi dihentikan.");return new Document(url,text);
   }finally{c.disconnect();}
  }throw new IOException("Terlalu banyak pengalihan link Google.");
 }
 public static Document fetch(String link)throws IOException{long deadline=System.currentTimeMillis()+65000;Document page=read(MapsLinkPolicy.validate(link),deadline);return read(directionsLink(page.url,page.text),deadline);}
}
