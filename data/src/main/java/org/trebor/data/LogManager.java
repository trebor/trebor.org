package org.trebor.data;

import javax.servlet.http.HttpServletRequest;

import org.apache.log4j.Logger;
import org.openrdf.model.URI;
import org.openrdf.model.ValueFactory;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.config.RepositoryConfigException;
import org.openrdf.repository.object.ObjectConnection;
import org.openrdf.repository.object.config.ObjectRepositoryFactory;
import org.trebor.data.dto.LogEvent;

import com.maxmind.geoip.LookupService;

public class LogManager
{
  @SuppressWarnings("unused")
  private static Logger log = Logger.getLogger(LogManager.class);

  private ObjectConnection mObjectConnection;

  private LookupService mLookupService;

  public LogManager(RepositoryConnection connection, String logContextStr, LookupService lookupService)
    throws RepositoryException, RepositoryConfigException
  {
    // create object repository

    ObjectRepositoryFactory orf = new ObjectRepositoryFactory();
    mObjectConnection =
      orf.createRepository(connection.getRepository()).getConnection();
    ValueFactory vf = mObjectConnection.getRepository().getValueFactory();

    // specify contexts

    URI logContext = vf.createURI(logContextStr);
    mObjectConnection.setReadContexts(logContext);
    mObjectConnection.setAddContexts(logContext);
    
    // record geo-ip lookup service
    
    mLookupService = lookupService;
  }

  public LogEvent log(HttpServletRequest hsr) throws RepositoryException
  {
    LogEvent event = new LogEvent(hsr, mLookupService);
    mObjectConnection.addObject(event);
    return event;
  }
}