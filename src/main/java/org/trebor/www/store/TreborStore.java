package org.trebor.www.store;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.apache.log4j.Logger;
import org.openrdf.query.Binding;
import org.openrdf.query.BindingSet;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.QueryLanguage;
import org.openrdf.query.TupleQuery;
import org.openrdf.query.TupleQueryResult;
import org.openrdf.repository.RepositoryException;
import org.trebor.www.dto.MenuTreeNode;
import org.trebor.www.util.Util;

import com.sun.jersey.api.core.InjectParam;
import com.sun.jersey.spi.resource.Singleton;

@Singleton
public class TreborStore
{
  @SuppressWarnings("unused")
  private static Logger log = Logger.getLogger(TreborStore.class);

  @InjectParam
  private TreborRepository mRepository;

  // the queries used here
  
  private String     mNodesQuery;
  
  @PostConstruct
  @SuppressWarnings("unused")
  private void initialize() throws IOException 
  {
    mNodesQuery = Util.readResourceAsString("/rdf/queries/nodes.sparql");
  }

  public MenuTreeNode getTreeNode(String nodeName) throws RepositoryException, MalformedQueryException, QueryEvaluationException
  {
    // down case the node name
    
    nodeName = nodeName.toLowerCase();
    
    // query for nodes
    
    String queryString = String.format(mNodesQuery, nodeName);
    TupleQuery query = mRepository.getConnection().prepareTupleQuery(QueryLanguage.SPARQL, queryString);
    TupleQueryResult results = query.evaluate();
    
    // extract nodes
    
    Map<String, MenuTreeNode> nodes = new HashMap<String, MenuTreeNode>();
    
    while (results.hasNext())
    {
      BindingSet result = results.next();

      // create node

      MenuTreeNode node = new MenuTreeNode();

      // required fields
    
      node.setName(result.getBinding("name").getValue().stringValue());
      node.setTitle(result.getBinding("title").getValue().stringValue());
      node.setSummary(result.getBinding("summary").getValue().stringValue());
      node.setIconName(result.getBinding("icon").getValue().stringValue());
    
      // optional image field

      Binding image = result.getBinding("image");
      node.setImage(image == null ? null : image.getValue().stringValue());

      // optional image description
      
      Binding imageDescription = result.getBinding("imageDescription");
      node.setImageDescription(imageDescription == null ? null : imageDescription.getValue().stringValue());

      // optional parent name
      
      Binding parent = result.getBinding("parent");
      node.setParent(parent == null ? null : parent.getValue().stringValue());
      
      // put node in map
      
      nodes.put(node.getName(), node);
    }
    
    // structure nodes as a tree
    
    for(MenuTreeNode child: nodes.values())
    {
      MenuTreeNode parent = nodes.get(child.getParent());
      if (parent != null)
        parent.add(child);
    }   
    
    return nodes.get(nodeName);
  }
}
