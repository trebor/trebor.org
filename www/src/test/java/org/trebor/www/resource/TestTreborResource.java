package org.trebor.www.resource;

import static org.junit.Assert.assertEquals;

import org.apache.log4j.Logger;
import org.junit.Test;
import org.trebor.www.dto.MenuTreeNode;
import org.trebor.www.dto.RdfValue;

import com.sun.jersey.api.client.UniformInterfaceException;
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
      assertEquals("toi:" + data[0], node.getShortName());
      log.debug("full query took: " + (System.currentTimeMillis() - start));
    }
  }
  
  @Test
  public void testEarthQuakeData()
  {
    String quakeData1 = resource().path("/quake").queryParam("name", "data1.txt").queryParam("test", "true").get(String.class);
    assertEquals(185, quakeData1.length());
    String quakeData2 = resource().path("/quake").queryParam("name", "data2.txt").queryParam("test", "true").get(String.class);
    assertEquals(312, quakeData2.length());
  }
  
  @Test(expected=UniformInterfaceException.class)
  public void testHitCounterWrongNode()
  {
    resource().path("/hit/notanode").get(String.class);
  }
  
  @Test()
  public void testHitCounter()
  {
    MenuTreeNode home1 = resource().path("/menu/home").get(MenuTreeNode.class);
    assertEquals(0, home1.getHitCount());
    resource().path("/hit/home").get(String.class);
    resource().path("/hit/home").get(String.class);
    MenuTreeNode home2 = resource().path("/menu/home").get(MenuTreeNode.class);
    assertEquals(2, home2.getHitCount());
  }
}
