package org.trebor.www.service;

import org.apache.log4j.Logger;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.repository.RepositoryException;
import org.trebor.www.dto.MenuTreeNode;
import org.trebor.www.dto.RdfNode;
import org.trebor.www.store.TreborStore;
import org.trebor.www.util.MarkupRenderer;

import com.sun.jersey.api.core.InjectParam;
import com.sun.jersey.spi.resource.Singleton;

@Singleton
public class TreborService
{
  @SuppressWarnings("unused")
  private static Logger log = Logger.getLogger(TreborService.class);

  @InjectParam
  private MarkupRenderer mMarkupRenderer;

  @InjectParam
  private static TreborStore mStore;

  public MenuTreeNode getMenuNode(String name) throws RepositoryException, MalformedQueryException, QueryEvaluationException
  {
    MenuTreeNode node = mStore.getTreeNode(name);
    renderMarkup(node);
    return node;
  }

  public RdfNode getRdf(String uri) throws RepositoryException, MalformedQueryException, QueryEvaluationException
  {
    return mStore.getRdf(uri);
  }
  
  private MenuTreeNode renderMarkup(MenuTreeNode node)
  {
    node.setTitle(mMarkupRenderer.render(node.getTitle()));
    node.setSummary(mMarkupRenderer.render(node.getSummary()));
    node.setImageDescription(mMarkupRenderer.render(node.getImageDescription()));
    for (MenuTreeNode child: node.getChildren())
        renderMarkup(child);
    return node;
  }
}
