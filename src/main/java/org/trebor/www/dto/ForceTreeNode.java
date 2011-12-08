package org.trebor.www.dto;

import java.util.ArrayList;
import java.util.List;

import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlElementRef;
import javax.xml.bind.annotation.XmlElementWrapper;
import javax.xml.bind.annotation.XmlList;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import javax.xml.bind.annotation.XmlValue;

import org.apache.log4j.Logger;

@XmlRootElement()
@XmlAccessorType(XmlAccessType.FIELD)
public class ForceTreeNode {

  @SuppressWarnings("unused")
  private static final Logger logger = Logger.getLogger(ForceTreeNode.class);

  
  @XmlElement(name="name")
  private String mName;
  @XmlElement(name="size", required=false)  
  private Integer mSize;

  
//  @XmlElementWrapper(name="children", required=false)
//  @XmlAttribute(name="children", required=false)
//  @XmlAttribute
  @XmlTransient
  public List<ForceTreeNode> mChildren;

//  public static class Children
//  {
//    @XmlElement(name="children")
//    private final List<ForceTreeNode> mChildren;
//
//    public Children()
//    {
//      mChildren = new ArrayList<ForceTreeNode>();
//    }
//    
//    public List<ForceTreeNode> getChildren()
//    {
//      return mChildren;
//    }
//  }
  
  public ForceTreeNode()
  {
    this("<UNDEFINED>", null);
  }

  public ForceTreeNode(String name)
  {
    this(name, null);
  }
  
  public ForceTreeNode(String name, Integer size)
  {
    mChildren = null;
    mName = name;
    mSize = size;
  }
  
  public ForceTreeNode add(ForceTreeNode node)
  {
    if (mChildren == null)
      mChildren = new ArrayList<ForceTreeNode>();
    mChildren.add(node);
    return node;
  }

  public String getName()
  {
    return mName;
  }
  
  public Integer getSize()
  {
    return mSize;
  }
  
  @XmlElement(name="children", required=false)
  public List<ForceTreeNode> getChildren()
  {
    return mChildren;
  }

  public void setName(String name)
  {
    mName = name;
  }

  public void setSize(int size)
  {
    mSize = size;
  }
}
