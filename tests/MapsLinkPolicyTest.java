import id.agis.sotrack.MapsLinkPolicy;
public class MapsLinkPolicyTest {
 public static void main(String[] args)throws Exception{
  MapsLinkPolicy.validate("https://maps.app.goo.gl/AbCd");MapsLinkPolicy.validate("https://www.google.com/maps/dir/a/b");MapsLinkPolicy.validate("https://goo.gl/maps/ABC");
  String[] rejected={"http://maps.app.goo.gl/x","https://www.google.com.evil.test/maps/a","https://localhost/maps/dir/a/b","https://127.0.0.1/maps/dir/a/b","https://user@www.google.com/maps/dir/a/b","https://www.google.com:8443/maps/dir/a/b","https://goo.gl/unrelated","https://www.google.com/url?q=https://localhost/"};
  for(String u:rejected){try{MapsLinkPolicy.validate(u);throw new AssertionError(u);}catch(java.io.IOException expected){}}
  if(!MapsLinkPolicy.shortLink(MapsLinkPolicy.validate("https://maps.app.goo.gl/ABC")))throw new AssertionError();
  System.out.println("Maps link allowlist and redirect validation checks passed");
 }
}
