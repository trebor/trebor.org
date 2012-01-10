package org.trebor.www.dto;

import static org.junit.Assert.assertEquals;
import static org.trebor.www.rdf.NameSpace.PREFIX;

import org.apache.log4j.Logger;
import org.junit.Test;
import org.openrdf.model.URI;
import org.openrdf.model.ValueFactory;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.config.RepositoryConfigException;
import org.openrdf.repository.object.ObjectConnection;
import org.openrdf.repository.object.ObjectQuery;
import org.openrdf.repository.object.ObjectRepository;
import org.openrdf.repository.object.config.ObjectRepositoryFactory;
import org.openrdf.repository.query.NamedQuery;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandlerException;
import org.trebor.www.rdf.MockRepositoryFactory;
import org.trebor.www.rdf.RdfUtil;

public class TestForceTreeNode
{
  @SuppressWarnings("unused")
  private final Logger log = Logger.getLogger(getClass());

  @Test
  public void testForceTreeNode() throws RepositoryException, RDFHandlerException, QueryEvaluationException, MalformedQueryException, RepositoryConfigException
  {
    Repository repository = MockRepositoryFactory.getMockRepository();
    log.debug("size: " + repository.getConnection().size());
    assertEquals(0, repository.getConnection().size());
    ObjectRepositoryFactory orf = new ObjectRepositoryFactory();
    ObjectRepository or = orf.createRepository(repository);
    log.debug("size: " + repository.getConnection().size());
    assertEquals(0, repository.getConnection().size());

    // add a Document to the repository

    ObjectConnection objectConnection = or.getConnection();

    objectConnection.addObject(testTree());
    log.debug("====================\n" +
      RdfUtil.exportRepository(repository, RDFFormat.TURTLE));
    
    log.debug("size: " + repository.getConnection().size());
    assertEquals(51, repository.getConnection().size());
    
    // retrieve a Document by title using a named query
    
    ValueFactory vf = repository.getValueFactory();
    URI myQueryID = vf.createURI("http://meta.leighnet.ca/rdf/2011/my-query");
    NamedQuery named = or.createNamedQuery(myQueryID,
      PREFIX  +
      "SELECT ?doc WHERE {?doc too:hasName ?name. ?doc a too:treeNode.}");

    ObjectQuery query = objectConnection.prepareObjectQuery(named.getQueryString());
    query.setObject("name", "trebor.org");
    ForceTreeNode node = (ForceTreeNode)query.evaluate().singleResult();
    log.debug("node: " + node.getName());
    assertEquals(2, node.getChildren().size());
  }

  public ForceTreeNode testTree()
  {
    ForceTreeNode root = new ForceTreeNode("trebor.org", "tat");
    root
      .setSummary("welcome to <a href=\"http://www.trebor.org\" target=\"_blank\">trebor.org</a>, the personal site for robert harris, aka trebor.");
    
    ForceTreeNode work = new ForceTreeNode("work", "work");
    work.add(new ForceTreeNode("NASA", "nasa",
      "http://human-factors.arc.nasa.gov/cognition/personnel/robh.html",
      "you know, the space people!"));
    work.add(new ForceTreeNode("Xuggle", "xuggle", "http://xuggle.com"));
  
    ForceTreeNode projects = new ForceTreeNode("projects", "work");
    projects.add(new ForceTreeNode("Swarm", "swarm"));
    projects.add(new ForceTreeNode("trebor.org 2", "tat"));
  
    ForceTreeNode subProjects = new ForceTreeNode("sub-projects", "work");
    subProjects.add(new ForceTreeNode("Swarm", "swarm"));
    subProjects.add(new ForceTreeNode("trebor.org 3", "tat"));
    projects.add(subProjects);
    root.add(work);
    root.add(projects);
    return root;
  }
}
