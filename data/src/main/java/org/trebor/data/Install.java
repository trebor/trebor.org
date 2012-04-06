package org.trebor.data;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.sql.Date;

import org.apache.log4j.Logger;
import org.openrdf.model.URI;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.http.HTTPRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;

public class Install
{
  private static Logger log = Logger.getLogger(Install.class);
  
  public static final String CONTENT_CONTEXT = "http://trebor.org/contexts/content";
  public static final String META_CONTEXT = "http://trebor.org/contexts/meta";
  public static final String LOG_CONTEXT = "http://trebor.org/contexts/log";

  private static final String TREBOR_CONENT_DIR = "/rdf/data";
  private static final String TURTLE_EXTENTION = ".ttl";

  private static final FilenameFilter turtleFilter = new FilenameFilter()
  {
    public boolean accept(File dir, String name)
    {
      return name.endsWith(TURTLE_EXTENTION);
    }
  };
  

  public static void main(String[] args) throws RepositoryException, RDFParseException, IOException
  {
    if (args.length < 2)
    {
      log.error("Expected <Host> <Repository-Name> arguments");
      System.exit(1);
    }

    // connect to repository
    
    RepositoryConnection connection = establishRepositoryConnection(args[0], args[1]);

    // clear out the context
    
    URI contentContext = connection.getValueFactory().createURI(CONTENT_CONTEXT);
    log.info("clearing context: " + contentContext);
    connection.clear(contentContext);
    
    // load new data into context

    File content = Util.findResourceFile(TREBOR_CONENT_DIR);
    for (File file:  content.listFiles(turtleFilter))
    {
      log.info("adding content: " + file.getName() + " " + new Date(file.lastModified()));
      connection.add(file, null, RDFFormat.TURTLE, contentContext);
    }
  }
  
  public static RepositoryConnection establishRepositoryConnection(String host, String name) throws RepositoryException
  {
    String url = String.format("http://%s/openrdf-sesame/repositories/%s", host, name);
    log.info("connecting to remote store: " + url);
    Repository repository = new HTTPRepository(url);
    repository.initialize();
    return repository.getConnection();
  }
}
