package org.trebor.www.store;

import static org.trebor.www.rdf.NameSpace.*;

import java.io.File;
import java.io.IOException;

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
import org.trebor.www.dto.ForceTreeNode;
import org.trebor.www.rdf.MockRepositoryFactory;
import org.trebor.www.rdf.RdfUtil;

public class TreborStore
{
  @SuppressWarnings("unused")
  private static Logger log = Logger.getLogger(TreborStore.class);

  private final ObjectConnection mObjectConnection;

  private final NamedQuery mNamedTreeNodequery;

  private final MarkupRenderer mMarkupRenderer;
  
  public static final String BASE_PATH = "/rdf/";

  public static final String[] INPUT_FILES =
  {
    BASE_PATH + "ontology/www.ttl",
    BASE_PATH + "ontology/trebor.ttl",
    BASE_PATH + "data/home.ttl",
    BASE_PATH + "data/influences.ttl",
    BASE_PATH + "data/luminaries.ttl",
    BASE_PATH + "data/literature.ttl",
    BASE_PATH + "data/peers.ttl",
    BASE_PATH + "data/graphics.ttl",
    BASE_PATH + "data/software.ttl",
    BASE_PATH + "data/work.ttl",
  };

  public TreborStore() throws RepositoryException, RepositoryConfigException,
    RDFParseException, IOException
  {
    log.debug("init store");

    // construct wiki media model for conversiton of wiki markup to html
    
    mMarkupRenderer = new MarkupRenderer();
    
     // establish an in memory repository

    Repository repository = MockRepositoryFactory.getMockRepository();
    ObjectRepositoryFactory orf = new ObjectRepositoryFactory();
    mObjectConnection = orf.createRepository(repository).getConnection();

    // initialize data store

    for (String input : INPUT_FILES)
    {
      File file =
        new File(
          TreborStore.class.getResource(input).toString().split(":")[1]);
      RdfUtil.importFile(repository, file, RDFFormat.TURTLE);
    }

    // initialize named queries

    ValueFactory vf = repository.getValueFactory();
    URI myQueryID = vf.createURI(TOI + "query/getNamedTreeNode");
    mNamedTreeNodequery =
      mObjectConnection.getRepository().createNamedQuery(
        myQueryID,
        PREFIX +
          "SELECT ?doc WHERE {?doc too:hasName ?name. ?doc a too:treeNode.}");
  }

  public ForceTreeNode getTreeNode(String nodeName)
    throws MalformedQueryException, RepositoryException, NoResultException,
    MultipleResultException, QueryEvaluationException
  {
    ObjectQuery query =
      mObjectConnection.prepareObjectQuery(mNamedTreeNodequery
        .getQueryString());
    query.setObject("name", nodeName.toLowerCase());
    ForceTreeNode node = (ForceTreeNode)query.evaluate().singleResult();
    return renderMarkup(node.copy());
  }

  private ForceTreeNode renderMarkup(ForceTreeNode node)
  {
    node.setTitle(mMarkupRenderer.render(node.getTitle()));
    node.setSummary(mMarkupRenderer.render(node.getSummary()));
    for (ForceTreeNode child: node.getChildren())
        renderMarkup(child);
    return node;
  }
}
