package org.trebor.www.dto;

import java.util.ArrayList;
import java.util.List;

import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;

import org.apache.log4j.Logger;

@XmlRootElement()
@XmlAccessorType(XmlAccessType.FIELD)
public class ForceNetwork {

  @SuppressWarnings("unused")
  private static final Logger logger = Logger.getLogger(ForceNetwork.class);

  private static class Range{
    double min = Double.MAX_VALUE;
    double max = Double.MIN_VALUE;
  }
  
  @XmlAccessorType(XmlAccessType.PROPERTY)
  public static class Link
  {
    private int mSourceId;
    private int mTargetId;
    private int mWeight;
    private String mName;

    Link()
    {
    }

    Link(Node source, Node target, int weight, String name, List<Node> nodes,
      Range range)
    {
      setSourceId(nodes.indexOf(source));
      setTargetId(nodes.indexOf(target));
      setWeight(weight);
      setName(name);
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
  }
  
  @XmlAccessorType(XmlAccessType.FIELD)
  public static class Node
  {
    @XmlElement(name="group")
    private int mGroup;
    @XmlElement(name="name")
    private String mName;

    Node()
    {
    }

    Node(String name, int group) {
      setName(name);
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
  }

  @XmlElement(name="links")  
  private final List<Link> mLinks;

  @XmlElement(name="nodes")  
  private final List<Node> mNodes;

  @XmlTransient
  private final Range mRange;
  
  public ForceNetwork()
  {
    mLinks = new ArrayList<Link>();
    mNodes = new ArrayList<Node>();
    mRange = new Range();
  }
  
  public Node addNode(String name, int group)
  {
    Node node = new Node(name, group);
    mNodes.add(node);
    return node;
  }
  
  public Link link(Node source, Node target, int weight)
  {
    return link(source, target, weight, source.getName() + "->" + target.getName());
  }

  public Link link(Node source, Node target, int weight, String name)
  {
    if (weight > mRange.max)
      mRange.max = weight;
    if (weight < mRange.min)
      mRange.min = weight;

    Link link = new Link(source, target, weight, name, mNodes, mRange);
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
