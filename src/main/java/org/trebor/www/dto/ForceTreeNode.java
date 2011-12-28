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
public class ForceTreeNode {

  private static final String UNDEFINED = "<UNDEFINED>";

  @SuppressWarnings("unused")
  private static final Logger logger = Logger.getLogger(ForceTreeNode.class);

  @iri(HAS_NODE_IMAGE)
  @XmlElement(name="imageName")
  private String mImageName;
  
  @iri(HAS_NAME)
  @XmlElement(name="name")
  private String mName;
  
  @iri(HAS_NODE_LINK)
  @XmlElement(name="link", required=false)
  private String mLink;
  
  @iri(HAS_NODE_SUMMARY)
  @XmlElement(name="summary", required=false)
  private String mSummary;
  
  @iri(HAS_NODE_CHILDREN)
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
    this(name, imageName, link, null);
  }
  
  public ForceTreeNode(String name, String imageName, String link, String summary)
  {
    mChildren = null;
    mName = name;
    mImageName = imageName;
    mLink = link;
    mSummary = summary;
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
    return mChildren == null ? Collections.<ForceTreeNode>emptyList() : mChildren;
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
    return "ForceTreeNode [mImageName=" + mImageName + ", mName=" + mName +
      ", mLink=" + mLink + ", mSummary=" + mSummary + ", mChildren=" +
      mChildren + "]";
  }
  
  public ForceTreeNode copy()
  {
    ForceTreeNode copy = new ForceTreeNode();
    copy.setImageName(getImageName());
    copy.setName(getName());
    copy.setLink(getLink());
    copy.setSummary(getSummary());
    
    for (ForceTreeNode child: getChildren())
      copy.add(child.copy());
    
    return copy;
  }
}
