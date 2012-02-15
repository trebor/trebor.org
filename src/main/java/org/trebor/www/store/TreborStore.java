package org.trebor.www.store;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.apache.log4j.Logger;
import org.openrdf.model.Value;
import org.openrdf.query.Binding;
import org.openrdf.query.BindingSet;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.QueryLanguage;
import org.openrdf.query.TupleQuery;
import org.openrdf.query.TupleQueryResult;
import org.openrdf.repository.RepositoryException;
import org.trebor.www.dto.MenuTreeNode;
import org.trebor.www.dto.RdfNode;
import org.trebor.www.dto.RdfValue;
import org.trebor.www.rdf.ResourceManager;
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
  private String     mDescribeQuery;

  private ResourceManager mRm;
  
  @PostConstruct
  @SuppressWarnings("unused")
  void initialize() throws IOException, RepositoryException 
  {
    mNodesQuery = Util.readResourceAsString("/rdf/queries/nodes.sparql");
    mDescribeQuery = Util.readResourceAsString("/rdf/queries/describe.sparql");
    mRm = new ResourceManager(mRepository.getConnection());
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

  public RdfValue getRdf(String uri) throws RepositoryException, MalformedQueryException, QueryEvaluationException
  {
    Value nodeValue = mRepository.getRepository().getValueFactory().createURI(uri);
    
    // create the node
    
    RdfValue node = new RdfValue(nodeValue, mRm);
    
    log.debug("quering for: " + node.getFullName());
    
    // query for nodes
    
    String queryString = String.format(mDescribeQuery, "<" + node.getFullName() + ">");
    TupleQuery query = mRepository.getConnection().prepareTupleQuery(QueryLanguage.SPARQL, queryString);
    TupleQueryResult results = query.evaluate();

    // extract the connections
    
    while (results.hasNext())
    {
      BindingSet result = results.next();

      // extract s p o
    
      Value subject = result.getBinding("subject").getValue();
      Value predicate = result.getBinding("predicate").getValue();
      Value object = result.getBinding("object").getValue();

      log.debug("subject: " + subject.stringValue());
      log.debug("predicate: " + predicate.stringValue());
      log.debug("object: " + object.stringValue());
      
      // add them to this node
      
      
      node.add(new RdfValue(subject, mRm), new RdfValue(predicate, mRm), new RdfValue(object, mRm));
    }
    
    return node;
  }
}
