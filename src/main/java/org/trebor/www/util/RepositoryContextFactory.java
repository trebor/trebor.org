package org.trebor.www.util;

import static java.lang.String.format;

import org.openrdf.model.URI;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.http.HTTPRepository;

public class RepositoryContextFactory
{
  public static final String HOST_PORT_URL_FORMAT =
    "http://%s:%d/openrdf-sesame";

  public static RepositoryContext createRemoteContext(String host, int port,
    String repositoryName, URI... contexts) throws RepositoryException
  {
    Repository repository =
      new HTTPRepository(format(HOST_PORT_URL_FORMAT, host, port),
        repositoryName);
    repository.initialize();
    return new DefaultRepositoryContext(repository, contexts);
  }

  public static RepositoryContext createContext(Repository repository,
    URI... contexts)
  {
    return new DefaultRepositoryContext(repository, contexts);
  }
}
