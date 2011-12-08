package org.trebor.www.dto;

import org.junit.Test;

public class TestForceTreeNode
{
  @Test
  public void testForceTreeNode()
  {
    ForceTreeNode root = new ForceTreeNode("root");

    ForceTreeNode a = null;
    root.add(a = new ForceTreeNode("A"));
    root.add(new ForceTreeNode("B", 2000));
    root.add(new ForceTreeNode("C", 3000));
    
    a.add(new ForceTreeNode("1", 1000));
    a.add(new ForceTreeNode("2", 2000));
    
    
  }
}
