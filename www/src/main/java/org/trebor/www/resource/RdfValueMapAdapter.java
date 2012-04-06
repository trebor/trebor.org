package org.trebor.www.resource;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.adapters.XmlAdapter;

import org.trebor.www.resource.RdfValueMapAdapter.ValueMapType;

import org.trebor.www.dto.RdfValue;

public final class RdfValueMapAdapter extends XmlAdapter<ValueMapType, Map<RdfValue, RdfValue>>
{
  static final class ValueMapEntry
  {
    public ValueMapEntry(RdfValue predicate, RdfValue value)
    {
      mPredicate = predicate;
      mValue = value;
    }

    public ValueMapEntry()
    {
    }
    
    @XmlElement(name="predicate")
    public RdfValue mPredicate;
    
    @XmlElement(name="value")
    public RdfValue mValue;
  }
  
  static final class ValueMapType
  {
    public List<ValueMapEntry> mEntries = new ArrayList<ValueMapEntry>();
  }

  public ValueMapType marshal(Map<RdfValue, RdfValue> v) throws Exception
  {
    ValueMapType valueMap = new ValueMapType();
    for (RdfValue predicate: v.keySet())
      valueMap.mEntries.add(new ValueMapEntry(predicate, v.get(predicate)));
    
    return valueMap;
  }

  public Map<RdfValue, RdfValue> unmarshal(ValueMapType v) throws Exception
  {
    Map<RdfValue, RdfValue> map = new HashMap<RdfValue, RdfValue>();
    for (ValueMapEntry entry: v.mEntries)
      map.put(entry.mPredicate, entry.mValue);
    
    return map;
  }
}