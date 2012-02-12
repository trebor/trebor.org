package org.trebor.www.store;

import static org.trebor.www.util.TreborConfiguration.*;

import java.io.File;
import java.io.IOException;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

import org.apache.log4j.Logger;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.config.RepositoryConfigException;
import org.openrdf.repository.http.HTTPRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;
import org.trebor.www.rdf.MockRepositoryFactory;
import org.trebor.www.rdf.RdfUtil;
import org.trebor.www.util.TreborConfiguration;
import org.trebor.www.util.Util;

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
  private void initialize() throws RepositoryConfigException, RepositoryException, IOException
  {
    setRepository(mConfiguration.getBoolean(RDF_REMOTE)
      ? connectToHttpStore()
      : initMemoryStore());
  }

  @PreDestroy
  public void cleanUp() throws RepositoryException
  {
    if (getConnection().isOpen())
      getConnection().close();
    // this has been disabled because of a 20 second timeout that slows test
    // getRepository().shutDown();
  }
  
  private void setRepository(Repository repository) throws RepositoryException
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

  private Repository initMemoryStore() throws RepositoryException, IOException 
  {
    log.debug("initializing memory store");
    
     // establish an in memory repository

    Repository repository = MockRepositoryFactory.getMockRepository();

    // initialize data store

    for (String inputFile : mConfiguration.getStringArray(RDF_DATAFILES))
    {
      File file = Util.findResourceFile(inputFile);
      if (file == null)
      {
         log.error("unable to locate: " + file);
         continue;
      }
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

  public RepositoryConnection getConnection()
  {
    return mConnection;
  }

  public Repository getRepository()
  {
    return mRepository;
  }
}
