package org.trebor.www.dto;

import java.util.ArrayList;
import java.util.List;

import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import org.apache.log4j.Logger;

@XmlRootElement()
@XmlAccessorType(XmlAccessType.FIELD)
public class ForceTreeNode {

  private static final String UNDEFINED = "<UNDEFINED>";

  @SuppressWarnings("unused")
  private static final Logger logger = Logger.getLogger(ForceTreeNode.class);

  @XmlElement(name="imageName")
  private String mImageName;
  @XmlElement(name="name")
  private String mName;
  @XmlElement(name="link", required=false)
  private String mLink;
  @XmlElement(name="children", required=false)
  public List<ForceTreeNode> mChildren;

  public ForceTreeNode()
  {
    this(UNDEFINED, UNDEFINED);
  }

  public ForceTreeNode(String name)
  {
    this(name, UNDEFINED);
  }
  
  public ForceTreeNode(String name, String imageName)
  {
    this(name, imageName, null);
  }
  
  public ForceTreeNode(String name, String imageName, String link)
  {
    mChildren = null;
    mName = name;
    mImageName = imageName;
    mLink = link;
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
  
  public List<ForceTreeNode> getChildren()
  {
    return mChildren;
  }

  public void setName(String name)
  {
    mName = name;
  }

  public void setImageName(String imageName)
  {
    mImageName = imageName;
  }

  public String getImageName()
  {
    return mImageName;
  }

  public void setLink(String link)
  {
    mLink = link;
  }

  public String getLink()
  {
    return mLink;
  }
}
