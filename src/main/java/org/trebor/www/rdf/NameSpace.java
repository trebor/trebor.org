package org.trebor.www.rdf;

import java.util.ArrayList;
import java.util.List;

public class NameSpace
{
  // name spaces
  
  public static final String RDF = "http://www.w3.org/1999/02/22-rdf-syntax-ns#";
  public static final String RDFS = "http://www.w3.org/2000/01/rdf-schema#";
  public static final String XSD = "http://www.w3.org/2001/XMLSchema#";
  public static final String TOO = "http://trebor.org/ns#";
  public static final String TOI = "http://treobr.org/instance/";

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

  public static enum Prefix
  {
    RDF(NameSpace.RDF), 
    RDFS(NameSpace.RDFS),
    XSD(NameSpace.XSD),
    TOO(NameSpace.TOO),
    TOI(NameSpace.TOI);

    private final String mUri;

    Prefix(String uri)
    {
      mUri = uri;
    }

    public String getUri()
    {
      return mUri;
    }
  };

  // general classes
  
  public static final String THING_TYPE = TOO + "thing";
  public static final String AGENT_TYPE = TOO + "agent";
  public static final String PERSON_TYPE = TOO + "person";
  public static final String DATETIME_TYPE = TOO + "dateTime";
  public static final String NAME_TYPE = TOO + "name";

  public static final String HAS_DATETIME = TOO + "hasDateTime";
  public static final String HAS_NAME = TOO + "hasName";
  public static final String HAS_TITLE = TOO + "hasTitle";
  public static final String HAS_IMAGE = TOO + "hasImage";
  public static final String HAS_IMAGE_DESCRIPTION = TOO + "hasImageDescription";
  
  // www classes
  
  public static final String TREE_NODE = TOO + "treeNode";
  public static final String HAS_NODE_LINK = TOO + "hasNodeLink";
  public static final String HAS_NODE_ICON = TOO + "hasNodeIcon";
  public static final String HAS_NODE_SUMMARY = TOO + "hasNodeSummary";
  public static final String HAS_NODE_CHILDREN = TOO + "hasNodeChildren";
}
