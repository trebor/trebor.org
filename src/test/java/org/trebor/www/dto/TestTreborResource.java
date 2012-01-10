package org.trebor.www.dto;

import static org.junit.Assert.assertEquals;

import org.apache.log4j.Logger;
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
//  @Ignore
  public void testService()
  {
    WebResource webResource = resource();
    String result = webResource.path("/tree/home").get(String.class);
    assertEquals(11191, result.length());
    ForceTreeNode ftn = webResource.path("/tree/home").get(ForceTreeNode.class);
    assertEquals("home", ftn.getName());
    assertEquals(4, ftn.getChildren().size());
  }
}
