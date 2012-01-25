package org.trebor.www.dto;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import org.openrdf.repository.object.annotations.iri;

import org.apache.log4j.Logger;

import static org.trebor.www.rdf.NameSpace.*;

@iri(TREE_NODE)
@XmlRootElement()
@XmlAccessorType(XmlAccessType.FIELD)
public class MenuTreeNode {

  private static final String UNDEFINED = "<UNDEFINED>";

  @SuppressWarnings("unused")
  private static final Logger logger = Logger.getLogger(MenuTreeNode.class);

  @iri(HAS_NAME)
  @XmlElement(name="name")
  private String mName;
  
  @iri(HAS_TITLE)
  @XmlElement(name="title")
  private String mTitle;

  @iri(HAS_NODE_ICON)
  @XmlElement(name="iconName")
  private String mIconName;
  
  @iri(HAS_IMAGE)
  @XmlElement(name="image", required=false)
  private String mImage;

  @iri(HAS_IMAGE_DESCRIPTION)
  @XmlElement(name="imageDescription", required=false)
  private String mImageDescription;
  
  @iri(HAS_NODE_LINK)
  @XmlElement(name="link", required=false)
  private String mLink;
  
  @iri(HAS_NODE_SUMMARY)
  @XmlElement(name="summary", required=false)
  private String mSummary;
  
  @iri(HAS_NODE_CHILDREN)
  @XmlElement(name="children", required=false)
  public List<MenuTreeNode> mChildren;

  @iri(HAS_NODE_PARENT)
  @XmlElement(name="parentName", required=false)
  private String mParent;

  
  public MenuTreeNode()
  {
    this(UNDEFINED, UNDEFINED);
  }

  public MenuTreeNode(String name)
  {
    this(name, UNDEFINED);
  }
  
  public MenuTreeNode(String name, String imageName)
  {
    this(name, imageName, null);
  }
  
  public MenuTreeNode(String name, String imageName, String link)
  {
    this(name, imageName, link, null);
  }
  
  public MenuTreeNode(String name, String iconName, String link, String summary)
  {
    mChildren = null;
    mName = name;
    mIconName = iconName;
    mLink = link;
    mSummary = summary;
  }
  
  public MenuTreeNode add(MenuTreeNode node)
  {
    if (mChildren == null)
      mChildren = new ArrayList<MenuTreeNode>();
    
    mChildren.add(node);
    return node;
  }

  public String getName()
  {
    return mName;
  }
  
  public List<MenuTreeNode> getChildren()
  {
    return mChildren == null ? Collections.<MenuTreeNode>emptyList() : mChildren;
  }

  public void setName(String name)
  {
    mName = name;
  }

  public void setIconName(String iconName)
  {
    mIconName = iconName;
  }

  public String getIconName()
  {
    return mIconName;
  }

  public void setLink(String link)
  {
    mLink = link;
  }

  public String getLink()
  {
    return mLink;
  }

  public void setSummary(String summary)
  {
    mSummary = summary;
  }

  public String getSummary()
  {
    return mSummary;
  }

  public String toString()
  {
    return "ForceTreeNode [mImageName=" + mIconName + ", mName=" + mName +
      ", mLink=" + mLink + ", mSummary=" + mSummary + ", mChildren=" +
      mChildren + "]";
  }
  
  public MenuTreeNode copy()
  {
    MenuTreeNode copy = new MenuTreeNode();
    copy.setName(getName());
    copy.setTitle(getTitle());
    copy.setIconName(getIconName());
    copy.setImage(getImage());
    copy.setImageDescription(getImageDescription());
    copy.setLink(getLink());
    copy.setSummary(getSummary());
    copy.setParent(getParent());
    
    for (MenuTreeNode child: getChildren())
      copy.add(child.copy());
    
    return copy;
  }

  public void setTitle(String title)
  {
    mTitle = title;
  }

  public String getTitle()
  {
    return mTitle;
  }

  public void setImage(String image)
  {
    mImage = image;
  }

  public String getImage()
  {
    return mImage;
  }

  public void setImageDescription(String imageDescription)
  {
    mImageDescription = imageDescription;
  }

  public String getImageDescription()
  {
    return mImageDescription;
  }

  public void setParent(String parent)
  {
    mParent = parent;
  }

  public String getParent()
  {
    return mParent;
  }
}