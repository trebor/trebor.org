package org.trebor.www.resource;

import static org.junit.Assert.assertEquals;


import org.apache.log4j.Logger;
import org.junit.Ignore;
import org.junit.Test;
import org.trebor.www.dto.MenuTreeNode;
import org.trebor.www.dto.RdfValue;

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
  public void testMenuTree()
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
      log.debug("query start. ");
      long start = System.currentTimeMillis();
      MenuTreeNode ftn1 = webResource.path("/menu/" + data[0]).get(MenuTreeNode.class);
      assertEquals("node: " + data[0], data[0], ftn1.getName());
      assertEquals("node: " + data[0], data[1], ftn1.getParent());
      assertEquals("node: " + data[0], data[2], ftn1.getChildren().size() + "");
      log.debug("full query took: " + (System.currentTimeMillis() - start));
    }
  }
  
  @Test
  public void testRdf()
  {
    Object[][] dataSet =
    {
      {"tufte", 0, 0},
      {"luminaries", 1, 10},
      {"literature", 1, 9},
      {"influences", 1, 8},
      {"home", 0, 9},
    };
    
    WebResource webResource = resource();
    
    for (Object[] data: dataSet)
    {
      log.debug("query start. ");
      long start = System.currentTimeMillis();
      RdfValue node = webResource.path("/rdf").queryParam("q", "toi:" + data[0]).get(RdfValue.class);
//      assertEquals(data[0] + " inbound count", data[1], node.getInbound().size());
//      assertEquals(data[0] + " outbound count", data[2], node.getOutbound().size());
//      log.debug("result: " + node.getNode().getShortName());
//      log.debug("  in: ");
//      for (RdfValue predicate: node.getInbound().keySet())
//        log.debug("    " + predicate.getShortName() + " - " + node.getInbound().get(predicate).getShortName());
//      log.debug("  out: ");
//      for (RdfValue predicate: node.getOutbound().keySet())
//        log.debug("    " + predicate.getShortName() + " - " + node.getOutbound().get(predicate).getShortName());
        
      assertEquals("toi:" + data[0], node.getShortName());
      log.debug("full query took: " + (System.currentTimeMillis() - start));
    }
  }
}
