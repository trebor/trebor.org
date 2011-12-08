package org.trebor.www.dto;

import static org.junit.Assert.assertEquals;

import javax.ws.rs.core.MediaType;

import org.apache.log4j.Logger;
import org.junit.Ignore;
import org.junit.Test;

import com.sun.jersey.api.client.WebResource;
import com.sun.jersey.test.framework.JerseyTest;

public class TestTreborResource extends JerseyTest
{
  @SuppressWarnings("unused")
  private static final Logger log = Logger.getLogger(TestTreborResource.class);

  public TestTreborResource()
  {
    super("org.trebor.www.resource");
  }
  
  @Test
  @Ignore
  public void testService()
  {
    WebResource webResource = resource();
//    webResource.accept(MediaType.APPLICATION_JSON);
//    webResource.accept(MediaType.APPLICATION_JSON_TYPE);
    
    String target = "{\"name\":\"root\",\"children\":[{\"name\":\"A\",\"children\":[{\"name\":\"1\",\"size\":1000}]}]}";
    String result = webResource.path("tree.json").get(String.class);
    log.debug(String.format("result\n%s\n", result));
    assertEquals(target, result);
  }
}
