package org.trebor.www.service;

import static org.trebor.www.rdf.NameSpace.*;

import java.io.File;
import java.io.IOException;
import java.util.Map;

import org.apache.log4j.Logger;
import org.openrdf.model.URI;
import org.openrdf.model.ValueFactory;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.config.RepositoryConfigException;
import org.openrdf.repository.object.ObjectConnection;
import org.openrdf.repository.object.ObjectQuery;
import org.openrdf.repository.object.config.ObjectRepositoryFactory;
import org.openrdf.repository.query.NamedQuery;
import org.openrdf.result.MultipleResultException;
import org.openrdf.result.NoResultException;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;
import org.trebor.www.dto.ForceNetwork;
import org.trebor.www.dto.ForceTreeNode;
import org.trebor.www.dto.ForceNetwork.Node;
import org.trebor.www.rdf.MockRepositoryFactory;
import org.trebor.www.rdf.RdfUtil;

public class TreborService
{
  @SuppressWarnings("unused")
  private static Logger log = Logger.getLogger(TreborService.class);

//  private final RepositoryContext mRepositoryContext;
  private static ObjectConnection mObjectConnection;

  private static NamedQuery mNamedTreeNodequery;

  public static final String BASE_PATH = "/";
  
  public static final String[] INPUT_FILES = 
  {
    BASE_PATH + "rdf/ontology/www.ttl",
    BASE_PATH + "rdf/ontology/trebor.ttl",
    BASE_PATH + "rdf/data/home.ttl",
    BASE_PATH + "rdf/data/influences.ttl",
    BASE_PATH + "rdf/data/graphics.ttl",
    BASE_PATH + "rdf/data/software.ttl",
  };
  
  static 
  {
    try
    {
    log.debug("init repository");
    
//    mRepositoryContext =
//          RepositoryContextFactory.createRemoteContext("localhost", 8080, "mim");

    // establish an in memory repository
    
    Repository repository = MockRepositoryFactory.getMockRepository();
    ObjectRepositoryFactory orf = new ObjectRepositoryFactory();
    mObjectConnection = orf.createRepository(repository).getConnection();
    
    // initialize data store

    for (String input: INPUT_FILES)
    {
      File file = new File(TreborService.class.getResource(input).toString().split(":")[1]);
      RdfUtil.importFile(repository, file, RDFFormat.TURTLE);
    }

    // initialize named queries
    
    ValueFactory vf = repository.getValueFactory();
    URI myQueryID = vf.createURI(TOI + "query/getNamedTreeNode");
    mNamedTreeNodequery = mObjectConnection.getRepository().createNamedQuery(myQueryID,
      PREFIX  +
      "SELECT ?doc WHERE {?doc too:hasName ?name. ?doc a too:treeNode.}");
    }
    catch (Exception e)
    {
      log.error("TreborService static init failure.", e);
    }
  }

  public TreborService() throws RepositoryException, RepositoryConfigException, RDFParseException, IOException
  {
    
  }
  
//  public InteractionSummaryTable getSummary()
//  {
//    InteractionSummaryTable table = new InteractionSummaryTable();
//    return table;
//  }

  public ForceTreeNode getTree(String path) throws MalformedQueryException, RepositoryException, NoResultException, MultipleResultException, QueryEvaluationException
  {
    ObjectQuery query = mObjectConnection.prepareObjectQuery(mNamedTreeNodequery.getQueryString());
    query.setObject("name", path);
    ForceTreeNode node = (ForceTreeNode)query.evaluate().singleResult();
    log.debug(node);
      return node.copy();
  }

//  public ForceNetwork browseUri(String uri) throws RepositoryException,
//    MalformedQueryException, QueryEvaluationException, IOException
//  {
//    // query to describe uri
//
//    GraphQuery query =
//      mRepositoryContext.prepareGraphQuery("DESCRIBE " + uri);
//    GraphQueryResult result = query.evaluate();
//
//    // create force network
//
//    Map<String, Node> nodes = new HashMap<String, Node>();
//    final ForceNetwork fn = new ForceNetwork();
//    int width = 1;
//    while (result.hasNext())
//    {
//      Statement statement = result.next();
//      Node subject = getNode(fn, statement.getSubject().stringValue(), nodes);
//      String predicateUri = statement.getPredicate().stringValue();
//      Node object = getNode(fn, statement.getObject().stringValue(), nodes);
//      fn.link(subject, object, width++, predicateUri);
//    }
//
//    // color the target node differently
//
//    for (Node node : nodes.values())
//      if (uri.contains(node.getName()))
//        node.setGroup(2);
//
//    // return network
//
//    return fn;
//  }

  public static Node getNode(ForceNetwork fn, String uri,
    Map<String, Node> nodes)
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
