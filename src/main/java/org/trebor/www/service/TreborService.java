package org.trebor.www.service;

import org.apache.log4j.Logger;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.repository.RepositoryException;
import org.openrdf.result.MultipleResultException;
import org.openrdf.result.NoResultException;
import org.trebor.www.dto.MenuTreeNode;
import org.trebor.www.store.TreborStore;

import com.sun.jersey.api.core.InjectParam;
import com.sun.jersey.spi.resource.Singleton;

@Singleton
public class TreborService
{
  @SuppressWarnings("unused")
  private static Logger log = Logger.getLogger(TreborService.class);

  @InjectParam
  private static TreborStore mStore;

  public MenuTreeNode getMenuNode(String name) throws MalformedQueryException, RepositoryException, NoResultException, MultipleResultException, QueryEvaluationException
  {
    return mStore.getTreeNode(name).copy();
  }
}
