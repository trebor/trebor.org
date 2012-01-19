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
  public void testService()
  {
    String[][] dataSet =
    {
      {"tufte", "luminaries", "0"},
      {"luminaries", "influences", "4"},
      {"literature", "influences", "3"},
      {"influences", "home", "2"},
      {"home", null, "4"},
    };
    
    WebResource webResource = resource();
    for (String[] data: dataSet)
    {      
      MenuTreeNode ftn1 = webResource.path("/menu/" + data[0]).get(MenuTreeNode.class);
      assertEquals("node: " + data[0], data[0], ftn1.getName());
      assertEquals("node: " + data[0], data[1], ftn1.getParent());
      assertEquals("node: " + data[0], data[2], ftn1.getChildren().size() + "");
    }
  }
}
