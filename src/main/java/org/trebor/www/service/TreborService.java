package org.trebor.www.service;

import org.apache.log4j.Logger;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.repository.RepositoryException;
import org.openrdf.result.MultipleResultException;
import org.openrdf.result.NoResultException;
import org.trebor.www.dto.ForceTreeNode;
import org.trebor.www.store.TreborStore;

public class TreborService
{
  @SuppressWarnings("unused")
  private static Logger log = Logger.getLogger(TreborService.class);

  private static TreborStore mStore;
  
  static 
  {
    try
    {
      mStore = new TreborStore();
    }
    catch (Exception e)
    {
      log.error("store init error", e);
    }
  }
  
  public ForceTreeNode getTreeNode(String name) throws MalformedQueryException, RepositoryException, NoResultException, MultipleResultException, QueryEvaluationException
  {
    // return a copy of the node, which permites jaxb to serilze to json
    
    return mStore.getTreeNode(name).copy();
  }
}
