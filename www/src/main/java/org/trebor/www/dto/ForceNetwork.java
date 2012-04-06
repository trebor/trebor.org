package org.trebor.www.dto;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;

import org.apache.log4j.Logger;

@XmlRootElement()
@XmlAccessorType(XmlAccessType.FIELD)
public class ForceNetwork 
{
  @SuppressWarnings("unused")
  private static final Logger logger = Logger.getLogger(ForceNetwork.class);

  @XmlAccessorType(XmlAccessType.PROPERTY)
  public static class Link
  {
    private int mSourceId;
    private int mTargetId;
    private int mWeight;
    private String mName;
    private String mFullName;

    Link()
    {
    }

    Link(Node source, Node target, int weight, String name, String fullName, List<Node> nodes)
    {
      setSourceId(nodes.indexOf(source));
      setTargetId(nodes.indexOf(target));
      setWeight(weight);
      setName(name);
      setFullName(fullName);
    }

    @XmlElement(name = "source")
    public int getSourceId()
    {
      return mSourceId;
    }

    @XmlElement(name = "target")
    public int getTargetId()
    {
      return mTargetId;
    }

    @XmlElement(name = "value")
    public int getWeight()
    {
      double weight = mWeight;
      return (int)weight;
    }

    @XmlElement(name = "name")
    public String getName()
    {
      return mName;
    }

    @XmlElement(name = "fullname")
    public String getFullName()
    {
      return mFullName;
    }


    public void setSourceId(int sourceId)
    {
      mSourceId = sourceId;
    }

    public void setTargetId(int targetId)
    {
      mTargetId = targetId;
    }

    public void setWeight(int weight)
    {
      mWeight = weight;
    }

    public void setName(String name)
    {
      mName = name;
    }

    public void setFullName(String fullName)
    {
      mFullName = fullName;
    }
  }
  
  @XmlAccessorType(XmlAccessType.FIELD)
  public static class Node
  {
    @XmlElement(name="group")
    private int mGroup;
    @XmlElement(name="name")
    private String mName;
    @XmlElement(name="fullname")
    private String mFullName;
    @XmlElement(name="type")
    private String mType;

    Node()
    {
    }

    Node(String name, String fullName, String type, int group) {
      setName(name);
      setFullName(fullName);
      setType(type);
      setGroup(group);
    }

    public int getGroup() {
      return mGroup;
    }

    public String getName() {
      return mName;
    }

    public void setGroup(int nodeId) {
      mGroup = nodeId;
    }

    public void setName(String name) {
      mName = name;
    }

    public String getFullName()
    {
      return mFullName;
    }

    public void setFullName(String fullName)
    {
      mFullName = fullName;
    }

    public String getType()
    {
      return mType;
    }

    public void setType(String type)
    {
      mType = type;
    }
  }

  @XmlElement(name="links")  
  private final List<Link> mLinks;

  @XmlElement(name="nodes")  
  private final List<Node> mNodes;

  @XmlTransient
  private final Map<String, Node> mNodeMap;
  
  public ForceNetwork()
  {
    mLinks = new ArrayList<Link>();
    mNodes = new ArrayList<Node>();
    mNodeMap = new HashMap<String, Node>();
  }
  
  public Node addNode(String name, String fullName, String type, int group)
  {
    Node node = mNodeMap.get(fullName);
      
    if (node == null)
    {
      node = new Node(name, fullName, type, group);
      mNodeMap.put(fullName, node);
      mNodes.add(node);
    }
    
    return node;
  }
  
  public Link link(Node source, Node target, int weight)
  {
    return link(source, target, weight, source.getName() + "->" + target.getName(), source.getFullName() + "->" + target.getFullName());
  }

  public Link link(Node source, Node target, int weight, String name, String fullName)
  {

    Link link = new Link(source, target, weight, name, fullName, mNodes);
    mLinks.add(link);
    return link;
  }

  public List<Link> getLinks() {
    return mLinks;
  }

  public List<Node> getNodes() {
    return mNodes;
  }
}
