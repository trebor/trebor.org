package org.trebor.www.dto;

import java.util.HashMap;
import java.util.Map;

import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.adapters.XmlJavaTypeAdapter;

import org.apache.log4j.Logger;
import org.trebor.www.resource.RdfValueMapAdapter;

@XmlRootElement()
@XmlAccessorType(XmlAccessType.FIELD)
public class RdfNode 
{
  @SuppressWarnings("unused")
  private static Logger log = Logger.getLogger(RdfNode.class);

  enum Type
  {
    URI,
    BLANK,
    LITERAL
  }
  
  @XmlElement(name="node")
  private RdfValue mNode;
  
  @XmlElement(name="children")
  @XmlJavaTypeAdapter(RdfValueMapAdapter.class)
  private Map<RdfValue, RdfValue> mChildren;
  
//  @XmlElement(name="outbound")
//  @XmlJavaTypeAdapter(RdfValueMapAdapter.class)
//  private Map<RdfValue, RdfValue> mOutbound;
//
//  @XmlElement(name="inbound")
//  @XmlJavaTypeAdapter(RdfValueMapAdapter.class)
//  private Map<RdfValue, RdfValue> mInbound;
  
  public RdfNode(RdfValue node)
  {
    this();
    setNode(node);
  }
  
  public RdfNode()
  {
    mChildren = new HashMap<RdfValue, RdfValue>();
//    mInbound = new HashMap<RdfValue, RdfValue>();
//    mOutbound = new HashMap<RdfValue, RdfValue>();
  }
 
  public void add(RdfValue subject, RdfValue predicate, RdfValue object)
  {
    if (subject.getFullName().equals(mNode.getFullName()))
//      getOutbound().put(predicate, object);
      mChildren.put(predicate, object);
    
    else if (object.getFullName().equals(mNode.getFullName()))
//      getInbound().put(predicate, subject);
      mChildren.put(predicate, object);

    else 
      throw new Error(
        String.format("[%s %s %s] not connected to %s", subject.getShortName(), predicate.getShortName(), object.getShortName(), mNode.getShortName()));
  }
  
  public RdfValue getNode()
  {
    return mNode;
  }

  public void setNode(RdfValue node)
  {
    mNode = node;
  }

  public Map<RdfValue, RdfValue> getOutbound()
  {
    return mChildren;
//    return mOutbound;
  }

  public Map<RdfValue, RdfValue> getInbound()
  {
    return mChildren;
//    return mInbound;
  }
}
