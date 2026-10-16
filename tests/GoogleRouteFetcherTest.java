import java.net.URL;
import id.agis.sotrack.GoogleRouteFetcher;
public class GoogleRouteFetcherTest {
 public static void main(String[] args)throws Exception{
  URL page=new URL("https://www.google.com/maps/dir/A/B");
  URL u=GoogleRouteFetcher.directionsLink(page,"<html><link href=\"/maps/preview/directions?pb=ABC&amp;hl=id\" rel=\"preload\"></html>");
  if(!u.toString().equals("https://www.google.com/maps/preview/directions?pb=ABC&hl=id"))throw new AssertionError();
  for(String html:new String[]{"<html>changed format</html>","<link href=\"https://evil.test/maps/preview/directions?x=1\">","<link href=\"http://www.google.com/maps/preview/directions?x=1\">"})try{GoogleRouteFetcher.directionsLink(page,html);throw new AssertionError();}catch(java.io.IOException expected){}
  System.out.println("Google route document extraction checks passed");
 }
}
