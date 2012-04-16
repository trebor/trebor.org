package org.trebor.www.dto;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;

import org.apache.log4j.Logger;

@XmlRootElement()
@XmlAccessorType(XmlAccessType.FIELD)
public class MenuTreeNode 
{
  @SuppressWarnings("unused")
  private static Logger log = Logger.getLogger(MenuTreeNode.class);

  private static final String UNDEFINED = "<UNDEFINED>";

  @XmlElement(name="name")
  private String mName;
  
  @XmlElement(name="title")
  private String mTitle;

  @XmlElement(name="iconName")
  private String mIconName;
  
  @XmlElement(name="image", required=false)
  private String mImage;

  @XmlElement(name="imageDescription", required=false)
  private String mImageDescription;

  @XmlElement(name="summary", required=false)
  private String mSummary;
  
  @XmlElement(name="children", required=false)
  public List<MenuTreeNode> mChildren;

  @XmlElement(name="parentName", required=false)
  private String mParent;

  @XmlElement(name="hitCount")
  private int mHitCount;
  
  @XmlElement(name="created")
  private Date mCreated;
  
  @XmlElement(name="updated")
  private Date mUpdated;
  
  private List<MenuTreeNode> mChild;
  
  public MenuTreeNode()
  {
    this(UNDEFINED, UNDEFINED, UNDEFINED, UNDEFINED);
  }
  public MenuTreeNode(String name, String title, String iconName, String summary)
  {
    mName = name;
    mTitle = title;
    mIconName = iconName;
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
  
//  @instancePrivate
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

  public void setSummary(String summary)
  {
    mSummary = summary;
  }

  public String getSummary()
  {
    return mSummary;
  }

  public MenuTreeNode copy()
  {
    MenuTreeNode copy = new MenuTreeNode();
    copy.setName(getName());
    copy.setTitle(getTitle());
    copy.setIconName(getIconName());
    copy.setImage(getImage());
    copy.setImageDescription(getImageDescription());
    copy.setSummary(getSummary());
    copy.setParent(getParent());
    copy.setHitCount(getHitCount());
    copy.setCreated(getCreated());
    copy.setUpdated(getUpdated());
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
  public int getHitCount()
  {
    return mHitCount;
  }
  public void setHitCount(int hitCount)
  {
    mHitCount = hitCount;
  }
  public Date getCreated()
  {
    return mCreated;
  }
  public void setCreated(Date created)
  {
    mCreated = created;
  }
  public Date getUpdated()
  {
    return mUpdated;
  }
  public void setUpdated(Date updated)
  {
    mUpdated = updated;
  }
}
