package id.agis.sotrack;
import javax.net.ssl.*;import java.net.*;import java.io.*;import java.util.*;import android.os.Build;
/** Enables TLS 1.2 on old Android without changing certificate or hostname checks. */
final class SecureConnections {
 static HttpsURLConnection open(URL url)throws IOException {HttpsURLConnection c=(HttpsURLConnection)url.openConnection();if(Build.VERSION.SDK_INT<21)c.setSSLSocketFactory(new Tls12((SSLSocketFactory)SSLSocketFactory.getDefault()));return c;}
 private static final class Tls12 extends SSLSocketFactory {
  private final SSLSocketFactory delegate;Tls12(SSLSocketFactory d){delegate=d;}
  private Socket enable(Socket socket){if(socket instanceof SSLSocket){SSLSocket s=(SSLSocket)socket;List<String> protocols=new ArrayList<>();for(String p:s.getSupportedProtocols())if(p.equals("TLSv1.2")||p.equals("TLSv1.3"))protocols.add(p);if(!protocols.isEmpty())s.setEnabledProtocols(protocols.toArray(new String[0]));}return socket;}
  public String[] getDefaultCipherSuites(){return delegate.getDefaultCipherSuites();}public String[] getSupportedCipherSuites(){return delegate.getSupportedCipherSuites();}
  public Socket createSocket(Socket s,String h,int p,boolean close)throws IOException{return enable(delegate.createSocket(s,h,p,close));}
  public Socket createSocket(String h,int p)throws IOException{return enable(delegate.createSocket(h,p));}
  public Socket createSocket(String h,int p,InetAddress l,int lp)throws IOException{return enable(delegate.createSocket(h,p,l,lp));}
  public Socket createSocket(InetAddress h,int p)throws IOException{return enable(delegate.createSocket(h,p));}
  public Socket createSocket(InetAddress h,int p,InetAddress l,int lp)throws IOException{return enable(delegate.createSocket(h,p,l,lp));}
 }
}
