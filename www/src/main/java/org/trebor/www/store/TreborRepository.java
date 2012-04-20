package org.trebor.www.store;

import static org.trebor.commons.RdfNames.CONTENT_CONTEXT;
import static org.trebor.commons.RdfNames.META_CONTEXT;
import static org.trebor.www.util.TreborConfiguration.*;

import java.io.IOException;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.apache.log4j.Logger;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.config.RepositoryConfigException;
import org.openrdf.repository.http.HTTPRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;
import org.trebor.data.Updater;
import org.trebor.util.rdf.MockRepositoryFactory;
import org.trebor.www.util.TreborConfiguration;
import org.trebor.commons.Util;

import com.sun.jersey.api.core.InjectParam;
import com.sun.jersey.spi.resource.Singleton;

@Singleton
public class TreborRepository
{
  @SuppressWarnings("unused")
  private static Logger log = Logger.getLogger(TreborRepository.class);

  @InjectParam
  private static TreborConfiguration mConfiguration;

  private Repository mRepository;

  private RepositoryConnection mConnection;
  
  @PostConstruct
  @SuppressWarnings("unused")
  private void initialize() throws RepositoryConfigException, RepositoryException, IOException, RDFParseException, MalformedQueryException, QueryEvaluationException
  {
    setRepository(mConfiguration.getBoolean(RDF_REMOTE)
      ? connectToHttpStore()
      : createMemoryStore());
  }

  @PreDestroy
  public void cleanUp() throws RepositoryException
  {
    if (getConnection().isOpen())
      getConnection().close();
    // this has been disabled because of a 20 second timeout that slows test
    // getRepository().shutDown();
  }
  
  private void setRepository(Repository repository) throws RepositoryException, RepositoryConfigException
  {
    mRepository = repository;
    mConnection = getRepository().getConnection();
  }

  private Repository connectToHttpStore() throws RepositoryException
  {
    String sesameUrl = String.format("http://%s:%d/openrdf-sesame/repositories/%s", 
          mConfiguration.getString(RDF_HOST),
          mConfiguration.getInt(RDF_PORT),
          mConfiguration.getString(RDF_REPOSITORY));
      
    log.debug("initializing remote store: " + sesameUrl);
    Repository repository = new HTTPRepository(sesameUrl);
    repository.initialize();
    return repository;
  }

  public static Repository createMemoryStore() throws RepositoryException, IOException, RepositoryConfigException, RDFParseException, MalformedQueryException, QueryEvaluationException 
  {
    log.debug("initializing memory store");
    
     // establish an in memory repository

    Repository repository = MockRepositoryFactory.getMockRepository();
    Updater updater = new Updater(repository.getConnection(), CONTENT_CONTEXT, META_CONTEXT);
    updater.update(Util.findResourceFile("/rdf/content"), RDFFormat.TURTLE);
    return repository;
  }

  public RepositoryConnection getConnection()
  {
    return mConnection;
  }

  public Repository getRepository()
  {
    return mRepository;
  }

  public static void setConfiguration(TreborConfiguration configuration)
  {
    mConfiguration = configuration;
  }
}
