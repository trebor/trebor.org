package org.trebor.www;

import java.util.ArrayList;
import java.util.List;

import static org.trebor.util.rdf.Names.*;

public class RdfNames
{
  // name spaces
  
  public static final String TOO = "http://trebor.org/ns#";
  public static final String TOI = "http://trebor.org/instance/";
  public static final String TOC = "http://trebor.org/context/";

  public static final String PREFIX = 
    "PREFIX rdf:  <" + RDF + ">\n" +
    "PREFIX rdfs: <" + RDFS + ">\n" +
    "PREFIX xsd:  <" + XSD + ">\n" +
    "PREFIX too:  <" + TOO + ">\n" +
    "PREFIX toi:  <" + TOI + ">\n";

  // name collections
  
  public static final String[] NAMES = {RDF, RDFS, XSD, TOO, TOI};
  
  @SuppressWarnings("serial")
  public static final List<String> NAME_LIST = new ArrayList<String>()
  {
    {
      for (String name: NAMES)
        add(name);
    }
  };

  // contexts
  
  public static final String CONTENT_CONTEXT = TOC + "content";
  public static final String    META_CONTEXT = TOC + "meta";
  public static final String     LOG_CONTEXT = TOC + "log";
  
  // general classes
  
  public static final String THING_TYPE    = TOO + "thing";
  public static final String AGENT_TYPE    = TOO + "agent";
  public static final String PERSON_TYPE   = TOO + "person";
  public static final String DATETIME_TYPE = TOO + "dateTime";
  public static final String NAME_TYPE     = TOO + "name";

  public static final String HAS_DATETIME          = TOO + "hasDateTime";
  public static final String HAS_NAME              = TOO + "hasName";
  public static final String HAS_TITLE             = TOO + "hasTitle";
  public static final String HAS_IMAGE             = TOO + "hasImage";
  public static final String HAS_IMAGE_DESCRIPTION = TOO + "hasImageDescription";
  
  // www classes
  
  public static final String TREE_NODE         = TOO + "treeNode";
  public static final String HAS_NODE_LINK     = TOO + "hasNodeLink";
  public static final String HAS_NODE_ICON     = TOO + "hasNodeIcon";
  public static final String HAS_NODE_SUMMARY  = TOO + "hasNodeSummary";
  public static final String HAS_NODE_CHILDREN = TOO + "hasNodeChildren";
  public static final String HAS_NODE_PARENT   = TOO + "hasNodeParent";
  public static final String HAS_NODE_CHILD    = TOO + "hasNodeChild";
  
  // meta classes
  
  public static final String META_NODE         = TOO + "metaNode";
  public static final String HAS_NODE          = TOO + "hasNode";
  public static final String HAS_CREATED_DATE  = TOO + "hasCreatedDate";
  public static final String HAS_UPDATED_DATE  = TOO + "hasUpdatedDate";
  public static final String HAS_HIT_COUNT     = TOO + "hasHitCount";
}
