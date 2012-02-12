package org.trebor.www.dto;

import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlAccessType;

import org.openrdf.model.BNode;
import org.openrdf.model.Literal;
import org.openrdf.model.Value;
import org.trebor.www.rdf.ResourceManager;
import org.trebor.www.rdf.ResourceManager.ResourceType;

@XmlRootElement
@XmlAccessorType(XmlAccessType.FIELD)
public class RdfValue
{
  public static final int LITERAL_SNIPIT_SIZE = 10;
  @XmlElement(name="fullname")
  private String mFullName;
  @XmlElement(name="shortname")
  private String mShortName;

  public RdfValue()
  {
  }
  
  public RdfValue(Value value, ResourceManager rm)
  {
    setValue(value, rm);
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
      break;
    case SHORT_URI:
      mFullName = rm.growResource(value);
      mShortName = value;
      break;
    case BLANK_NODE:
      mFullName = value;
      mShortName = mFullName;
      break;
    case LITERAL:
      mFullName = value;
      mShortName = mFullName.length() <= LITERAL_SNIPIT_SIZE
        ? mFullName
        : mFullName.replaceAll("\n", "").substring(0, LITERAL_SNIPIT_SIZE) + "...\"";
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
}
