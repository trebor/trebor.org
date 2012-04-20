package org.trebor.data.dto;

import static org.trebor.commons.RdfNames.*;
import static org.trebor.util.rdf.RdfUtil.dateToXmlGregorianCalendar;
import java.util.Date;

import javax.xml.datatype.XMLGregorianCalendar;

import org.apache.log4j.Logger;
import org.openrdf.annotations.Iri;

@Iri(META_NODE)
public class MetaData
{
  @SuppressWarnings("unused")
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
    mCreated = dateToXmlGregorianCalendar(created);
    mUpdated = dateToXmlGregorianCalendar(created);
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
    mUpdated = dateToXmlGregorianCalendar(updated);
  }
  
  public Node getNode()
  {
    return mNode;
  }

  public void setNode(Node node)
  {
    mNode = node;
  }
}  
