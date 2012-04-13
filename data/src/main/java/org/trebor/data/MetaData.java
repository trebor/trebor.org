package org.trebor.data;

import static org.trebor.www.RdfNames.*;

import java.util.Date;
import java.util.GregorianCalendar;

import javax.xml.datatype.DatatypeConfigurationException;
import javax.xml.datatype.DatatypeFactory;
import javax.xml.datatype.XMLGregorianCalendar;

import org.apache.log4j.Logger;
import org.openrdf.annotations.Iri;
//import org.openrdf.annotations.Sparql;

@Iri(META_NODE)
public class MetaData
{
  private static Logger log = Logger.getLogger(MetaData.class);

  @Iri(HAS_HIT_COUNT)
  private int mHitCount;
  @Iri(HAS_CREATED_DATE)
  private XMLGregorianCalendar mCreated;
  @Iri(HAS_UPDATED_DATE)
  private XMLGregorianCalendar mUpdated;
  @Iri(HAS_NODE)
  private Node mNode;
  
  public MetaData(Node node, Date created)
  {
    mCreated = convertDateTogXmlGregorianCalendar(created);
    mUpdated = convertDateTogXmlGregorianCalendar(created);
    mHitCount = 0;
    mNode = node;
  }
  
  public MetaData()
  {
    this(null, new Date());
  }
  
  public void registerHit()
  {
    setHitCount(getHitCount() + 1);
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
    return mCreated.toGregorianCalendar().getTime();
  }
  public Date getUpdated()
  {
    return mUpdated.toGregorianCalendar().getTime();
  }
  public void setUpdated(Date updated)
  {
    mUpdated = convertDateTogXmlGregorianCalendar(updated);
  }
  
  public Node getNode()
  {
    return mNode;
  }

  public void setNode(Node node)
  {
    mNode = node;
  }
  
  private static XMLGregorianCalendar convertDateTogXmlGregorianCalendar(Date date)
  {
    try
    {
      GregorianCalendar gc = new GregorianCalendar();
      gc.setTime(date);
      return DatatypeFactory.newInstance().newXMLGregorianCalendar(gc);
    }
    catch (DatatypeConfigurationException e)
    {
      log.error("date/calendar problem", e);
    }
    
    return null;
  }
}