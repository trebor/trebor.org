package org.trebor.www.store;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.apache.log4j.Logger;
import org.openrdf.model.URI;
import org.openrdf.model.Value;
import org.openrdf.query.Binding;
import org.openrdf.query.BindingSet;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.QueryLanguage;
import org.openrdf.query.TupleQuery;
import org.openrdf.query.TupleQueryResult;
import org.openrdf.repository.RepositoryException;
import org.trebor.www.dto.ForceNetwork;
import org.trebor.www.dto.ForceNetwork.Node;
import org.trebor.www.dto.MenuTreeNode;
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

  public ForceNetwork getRdfGraph(String uri, int depth) throws RepositoryException, MalformedQueryException, QueryEvaluationException
  {
    ForceNetwork fn = new ForceNetwork();
    return getRdfGraph(uri, fn, depth, Collections.<String>emptyList());
  }

  public ForceNetwork getRdfGraph(String uri, ForceNetwork fn, int depth, List<String> allVisited) throws RepositoryException, MalformedQueryException, QueryEvaluationException
  {
    if (depth <= 0)
      return fn;
    
    String longUri = mRm.growResource(uri);
    TupleQueryResult results = describe(longUri);

    // don't visit nodes twice
    
    for (String visited: allVisited)
      if (longUri.equals(visited))
         return fn;

    // add this to the list of visited
    
    List<String> newVisited = new ArrayList<String>();
    newVisited.addAll(allVisited);
    newVisited.add(longUri);
    
    // extract the connections
    
    while (results.hasNext())
    {
      BindingSet result = results.next();

      // extract s p o
    
      Value subject = result.getBinding("subject").getValue();
      Value predicate = result.getBinding("predicate").getValue();
      Value object = result.getBinding("object").getValue();

      // create objects to add to force network
      
      Node subjectNode = fn.addNode(mRm.shrinkResource(subject), mRm.growResource(subject), mRm.establishType(subject).toString(), 1);
      Node objectNode = fn.addNode(mRm.shrinkResource(object), mRm.growResource(object), mRm.establishType(object).toString(), 1);
      fn.link(subjectNode, objectNode, 1, mRm.shrinkResource(predicate), mRm.growResource(predicate));

      // visit children
      
      Value next = subject.stringValue().equals(longUri) ? object : subject;
      if (next instanceof URI)
        getRdfGraph(next.stringValue(), fn, depth - 1, newVisited);
    }

    return fn;
  }

 public TupleQueryResult describe(String longUri) throws RepositoryException, MalformedQueryException, QueryEvaluationException
 {
   log.debug("quering for: " + longUri);
   
   // query for nodes
   
   String queryString = String.format(mDescribeQuery, "<" + longUri + ">");
   TupleQuery query = mRepository.getConnection().prepareTupleQuery(QueryLanguage.SPARQL, queryString);
   return query.evaluate();
 }
  
  
  public RdfValue getRdf(String uri) throws RepositoryException, MalformedQueryException, QueryEvaluationException
  {
    Value nodeValue = mRepository.getRepository().getValueFactory().createURI(uri);
    
    // create the node
    
    RdfValue node = new RdfValue(nodeValue, mRm);
    
    // query for nodes
    
    TupleQueryResult results = describe(node.getFullName());

    // extract the connections
    
    while (results.hasNext())
    {
      BindingSet result = results.next();

      // extract s p o
    
      Value subject = result.getBinding("subject").getValue();
      Value predicate = result.getBinding("predicate").getValue();
      Value object = result.getBinding("object").getValue();

      // add them to this node
      
      
      node.add(new RdfValue(subject, mRm), new RdfValue(predicate, mRm), new RdfValue(object, mRm));
    }
    
    return node;
  }
}
