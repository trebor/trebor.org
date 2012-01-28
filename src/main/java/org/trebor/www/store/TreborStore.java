package org.trebor.www.store;

import static org.trebor.www.rdf.NameSpace.*;

import static org.trebor.www.util.TreborConfiguration.*;

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
import org.openrdf.repository.http.HTTPRepository;
import org.openrdf.repository.object.ObjectConnection;
import org.openrdf.repository.object.ObjectQuery;
import org.openrdf.repository.object.config.ObjectRepositoryFactory;
import org.openrdf.repository.query.NamedQuery;
import org.openrdf.result.MultipleResultException;
import org.openrdf.result.NoResultException;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;
import org.trebor.www.dto.MenuTreeNode;
import org.trebor.www.rdf.MockRepositoryFactory;
import org.trebor.www.rdf.RdfUtil;
import org.trebor.www.util.TreborConfiguration;

import com.sun.jersey.api.core.InjectParam;
import com.sun.jersey.spi.resource.Singleton;

@Singleton
public class TreborStore
{
  @SuppressWarnings("unused")
  private static Logger log = Logger.getLogger(TreborStore.class);

  @InjectParam
  private static TreborConfiguration mConfiguration;

  @InjectParam
  private MarkupRenderer mMarkupRenderer;

  private ObjectConnection mObjectConnection;

  private NamedQuery mNamedTreeNodequery;

  
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
    BASE_PATH + "data/nasa.ttl",
  };

  public MenuTreeNode getTreeNode(String nodeName)
    throws MalformedQueryException, RepositoryException, NoResultException,
    MultipleResultException, QueryEvaluationException
  {
    ObjectQuery query =
      getObjectConnection().prepareObjectQuery(mNamedTreeNodequery
        .getQueryString());
    query.setObject("name", nodeName.toLowerCase());
    MenuTreeNode node = (MenuTreeNode)query.evaluate().singleResult();
    return renderMarkup(node.copy());
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

  public void setObjectConnection(ObjectConnection objectConnection)
  {
    mObjectConnection = objectConnection;
  }

  public ObjectConnection getObjectConnection() 
  {
    if (mObjectConnection == null)
      try
      {
        initObjectConnection();
      }
      catch (Exception e)
      {
        log.error(e);
      }
    
    return mObjectConnection;
  }

  private void initObjectConnection() throws RepositoryException, RepositoryConfigException, IOException
  {
    // create object repository connection;
    
    Repository repository = mConfiguration.getBoolean(RDF_REMOTE) 
      ? connectToHttpStore()
      : initMemoryStore();
    ObjectRepositoryFactory orf = new ObjectRepositoryFactory();
    setObjectConnection(orf.createRepository(repository).getConnection());
    
    // initialize named queries

    ValueFactory vf = repository.getValueFactory();
    URI myQueryID = vf.createURI(TOI + "query/getNamedTreeNode");
    mNamedTreeNodequery =
      getObjectConnection().getRepository().createNamedQuery(
        myQueryID,
        PREFIX +
          "SELECT ?doc WHERE {?doc too:hasName ?name. ?doc a too:treeNode.}");
  }
  
  private Repository connectToHttpStore() throws RepositoryException
  {
    Repository repository = new HTTPRepository(
      String.format("http://%s:%d/openrdf-sesame", 
      mConfiguration.getString(RDF_HOST),
      mConfiguration.getInt(RDF_PORT)), mConfiguration.getString(RDF_REPOSITORY));
      
    repository.initialize();
    return repository;
  }
  
  @SuppressWarnings("unused")
  private Repository initMemoryStore() throws RepositoryException, RepositoryConfigException,
    IOException
  {
     // establish an in memory repository

    Repository repository = MockRepositoryFactory.getMockRepository();

    // initialize data store

    for (String input : INPUT_FILES)
    {
      File file =
        new File(
          TreborStore.class.getResource(input).toString().split(":")[1]);
      try
      {
        RdfUtil.importFile(repository, file, RDFFormat.TURTLE);
      }
      catch (RDFParseException e)
      {
        log.error("while parsing " + file, e);
      }
    }
    
    return repository;
  }
}
