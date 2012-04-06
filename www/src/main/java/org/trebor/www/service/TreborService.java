package org.trebor.www.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URL;
import java.net.URLConnection;

import org.apache.commons.compress.utils.IOUtils;
import org.apache.log4j.Logger;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.repository.RepositoryException;
import org.trebor.www.dto.ForceNetwork;
import org.trebor.www.dto.MenuTreeNode;
import org.trebor.www.dto.RdfValue;
import org.trebor.www.store.TreborStore;
import org.trebor.www.util.MarkupRenderer;
import org.trebor.www.util.Util;

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

  public RdfValue getRdf(String uri) throws RepositoryException, MalformedQueryException, QueryEvaluationException
  {
    return mStore.getRdf(uri);
  }
  
  public ForceNetwork getRdfGraph(String uri, int depth) throws RepositoryException, MalformedQueryException, QueryEvaluationException
  {
    return mStore.getRdfGraph(uri, depth);
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

  public String getQuakeData(String name, boolean test) throws IOException
  {
    // if test, read local file
    
    if (test)
      return Util.readResourceAsString("/earthquake/" + name);
    
    // load live data from usgs
    
    URL url = new URL("http://earthquake.usgs.gov/earthquakes/catalogs/" + name);
    URLConnection conn = url.openConnection();
    OutputStream output = new ByteArrayOutputStream();
    IOUtils.copy(conn.getInputStream(), output);
    return output.toString();
  }
}
