package org.trebor.data.dto;

import static org.trebor.commons.RdfNames.HAS_NAME;
import static org.trebor.commons.RdfNames.HAS_TITLE;
import static org.trebor.commons.RdfNames.TREE_NODE;

import org.openrdf.annotations.Iri;

@Iri(TREE_NODE) 
public interface Node
{
  @Iri(HAS_NAME)
  public String getName();

  @Iri(HAS_TITLE)
  public String getTitle();
}