package org.trebor.www.dto;

import java.util.ArrayList;
import java.util.List;

import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlAccessType;

import org.openrdf.model.BNode;
import org.openrdf.model.Literal;
import org.openrdf.model.Value;
import org.trebor.www.rdf.ResourceManager;
import org.trebor.www.rdf.ResourceManager.ResourceType;

import static org.trebor.www.dto.RdfValue.Types.*;

@XmlRootElement
@XmlAccessorType(XmlAccessType.FIELD)
public class RdfValue
{
  public static final int LITERAL_SNIPIT_SIZE = 10;
  @XmlElement(name="fullname")
  private String mFullName;
  @XmlElement(name="name")
  private String mShortName;
  @XmlElement(name="children")
  private List<RdfValue> mChildren;
  @XmlElement(name="type")
  private Types mType;
  @XmlElement(name="link")
  private Types mLink;

  enum Types
  {
    BLANK,
    LITERAL,
    URI;
  }
  
  public RdfValue()
  {
    mChildren = new ArrayList<RdfValue>();
  }
  
  public RdfValue(Value value, ResourceManager rm)
  {
    this();
    setValue(value, rm);
  }

  public void add(RdfValue subject, RdfValue predicate, RdfValue object)
  {
    if (subject.getFullName().equals(getFullName()))
      mChildren.add(object);
    
    else if (object.getFullName().equals(getFullName()))
      mChildren.add(subject);

    else 
      throw new Error(
        String.format("[%s %s %s] not connected to %s", subject.getShortName(), predicate.getShortName(), object.getShortName(), getShortName()));
  }
  
  public void setValue(Value value, ResourceManager rm)
  {
    if (value instanceof Literal)
      setValue("\"" + value.stringValue() + "\"", rm);
    else if (value instanceof BNode)
      setValue("_:" + value.stringValue(), rm);
    else
      setValue(value.stringValue(), rm);
  }

  private void setValue(String value, ResourceManager rm)
  {
    ResourceType type = rm.establishType(value);
    
    if (type == null)
      throw new Error("Unable to establish type for: \"" + value + "\"");
    
    switch (type)
    {
    case LONG_URI:
      mFullName = value;
      mShortName = rm.shrinkResource(value);
      mType = URI;
      break;
    case SHORT_URI:
      mFullName = rm.growResource(value);
      mShortName = value;
      mType = URI;
      break;
    case BLANK_NODE:
      mFullName = value;
      mShortName = mFullName;
      mType = BLANK;
      break;
    case LITERAL:
      mFullName = value;
      mShortName = mFullName.length() <= LITERAL_SNIPIT_SIZE
        ? mFullName
        : mFullName.replaceAll("\n", "").substring(0, LITERAL_SNIPIT_SIZE) + "...\"";
      mType = LITERAL;
      break;
    }
  }
  
  public String getFullName()
  {
    return mFullName;
  }

  public String getShortName()
  {
    return mShortName;
  }

  public Types getType()
  {
    return mType;
  }

  public void setType(Types type)
  {
    mType = type;
  }

  public Types getLink()
  {
    return mLink;
  }

  public void setLink(Types link)
  {
    mLink = link;
  }
}
