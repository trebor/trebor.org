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
    root.add(new ForceTreeNode("B"));
    root.add(new ForceTreeNode("C"));
    
    a.add(new ForceTreeNode("1"));
    a.add(new ForceTreeNode("2"));
  }
}
