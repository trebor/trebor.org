package org.trebor.data;

import static org.trebor.www.RdfNames.TREE_NODE;
import static org.trebor.www.RdfNames.HAS_NAME;
import static org.trebor.www.RdfNames.HAS_TITLE;

import org.openrdf.annotations.Iri;

@Iri(TREE_NODE) 
public interface Node
{
  @Iri(HAS_NAME)
  public String getName();

  @Iri(HAS_TITLE)
  public String getTitle();
}