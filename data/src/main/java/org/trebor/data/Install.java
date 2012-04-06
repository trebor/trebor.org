package org.trebor.data;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.sql.Date;
import java.util.List;

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

  public static final String TREBOR_CONENT_DIR = "/rdf/data";

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

    loadAll(connection, Util.findResourceFile(TREBOR_CONENT_DIR), contentContext, RDFFormat.TURTLE);
  }
  
  public static RepositoryConnection establishRepositoryConnection(String host, String name) throws RepositoryException
  {
    String url = String.format("http://%s/openrdf-sesame/repositories/%s", host, name);
    log.info("connecting to remote store: " + url);
    Repository repository = new HTTPRepository(url);
    repository.initialize();
    return repository.getConnection();
  }
  
  public static File[] loadAll(RepositoryConnection connection, File directory, URI context, final RDFFormat format) throws RDFParseException, RepositoryException, IOException
  {
    File[] files = directory.listFiles(new FilenameFilter()
    {
      List<String> extentions = format.getFileExtensions();
      
      public boolean accept(File dir, String name)
      {
        for (String extention: extentions)
          if (name.endsWith(extention))
            return true;
        return false;
      }
    });

    for (File file: files)
    {
      log.info("adding content: " + file.getName() + " " + new Date(file.lastModified()));
      connection.add(file, null, format, context);
    }
    
    return files;
  }
}
