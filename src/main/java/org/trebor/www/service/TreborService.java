package org.trebor.www.service;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import org.openrdf.model.Statement;
import org.openrdf.query.GraphQuery;
import org.openrdf.query.GraphQueryResult;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.repository.RepositoryException;
import org.trebor.www.dto.ForceNetwork;
import org.trebor.www.dto.ForceTreeNode;
import org.trebor.www.dto.InteractionSummaryTable;
import org.trebor.www.dto.ForceNetwork.Node;
import org.trebor.www.util.RepositoryContext;
import org.trebor.www.util.RepositoryContextFactory;

public class TreborService {
  
  private final RepositoryContext mRepositoryContext;

  public TreborService() throws RepositoryException
  {
    mRepositoryContext = RepositoryContextFactory.createRemoteContext("localhost", 8080, "mim");
  }
  
  public InteractionSummaryTable getSummary()
  {
    InteractionSummaryTable table = new InteractionSummaryTable();
    return table;
  }

  public ForceTreeNode getTree()
  {
    ForceTreeNode root = new ForceTreeNode("root");

    ForceTreeNode a = new ForceTreeNode("A");
    root.add(a);
    root.add(new ForceTreeNode("B", 2000));
    root.add(new ForceTreeNode("C", 3000));
    
    a.add(new ForceTreeNode("1", 1000));
    a.add(new ForceTreeNode("2", 2000));
    a.add(new ForceTreeNode("3", 3000));

    return root;
  }
  
  public ForceNetwork browseUri(String uri) throws RepositoryException, MalformedQueryException, QueryEvaluationException, IOException
  {
    // query to describe uri
    
    GraphQuery query = mRepositoryContext.prepareGraphQuery("DESCRIBE " + uri);
    GraphQueryResult result = query.evaluate();
    
    // create force network
    
    Map<String, Node> nodes = new HashMap<String, Node>();
    final ForceNetwork fn = new ForceNetwork();
    int width = 1;
    while (result.hasNext())
    {
      Statement statement = result.next();
      Node subject = getNode(fn, statement.getSubject().stringValue(), nodes);
      String predicateUri = statement.getPredicate().stringValue();
      Node object = getNode(fn, statement.getObject().stringValue(), nodes);
      fn.link(subject, object, width++, predicateUri);
    }
    
    // color the target node differently

    for (Node node: nodes.values())
      if (uri.contains(node.getName()))
        node.setGroup(2);

    // return network
    
    return fn;
  }
  
  public static Node getNode(ForceNetwork fn, String uri, Map<String, Node> nodes)
  {
    Node node = nodes.get(uri);
    if (null == node)
      nodes.put(uri, node = fn.addNode(uri, 1));
    return node;
  }
  
  public ForceNetwork getForceView()
  {
    final ForceNetwork fs = new ForceNetwork();
    
    Node alpha = fs.addNode("alpha", 1);
    Node bravo = fs.addNode("bravo", 1);
    Node charlie = fs.addNode("charlie", 1);
    Node delta = fs.addNode("delta", 2);

    fs.link(alpha, bravo, 1);
    fs.link(bravo, charlie, 10);
    fs.link(charlie, delta, 100);
    fs.link(delta, alpha, 4);
    fs.link(bravo, delta, 5);

    return fs;
  }
}
