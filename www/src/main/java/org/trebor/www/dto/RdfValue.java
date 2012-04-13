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
import org.trebor.util.rdf.ResourceManager;
import org.trebor.util.rdf.ResourceManager.ResourceType;

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
  @XmlElement(name="predicate")
  private RdfValue mPredicate;
  @XmlElement(name="issubject")
  private boolean mIsSubject;

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
    boolean isSubject = subject.getFullName().equals(getFullName());
    RdfValue child = isSubject ? object : subject;
    child.setPredicate(predicate);
    child.setIsSubject(isSubject);
    mChildren.add(child);
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

  public void setPredicate(RdfValue predicate)
  {
    mPredicate = predicate;
  }

  public RdfValue getPredicate()
  {
    return mPredicate;
  }

  public boolean isSubject()
  {
    return mIsSubject;
  }

  public void setIsSubject(boolean isSubject)
  {
    mIsSubject = isSubject;
  }
}
