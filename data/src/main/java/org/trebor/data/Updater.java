package org.trebor.data;

import static org.trebor.www.RdfNames.*;

import java.io.File;
import java.io.FilenameFilter;
import java.io.IOException;
import java.util.Date;
import java.util.List;

import org.apache.log4j.Logger;
import org.openrdf.model.URI;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.QueryLanguage;
import org.openrdf.query.TupleQueryResult;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.http.HTTPRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;
import org.trebor.util.rdf.MockRepositoryFactory;
import org.trebor.www.RdfNames;

public class Updater
{
  private static Logger log = Logger.getLogger(Updater.class);
  
  public static final String TREBOR_CONENT_DIR = "/rdf/data";

  private RepositoryConnection mConnection;

  public static void main(String[] args) throws RepositoryException, RDFParseException, IOException, MalformedQueryException, QueryEvaluationException
  {
    if (args.length < 2)
    {
      log.error("Expected <Host> <Repository-Name> arguments");
      System.exit(1);
    }
    
    new Updater(args[0], args[1]);
  }

  public Updater(String host, String name) throws RepositoryException, RDFParseException, MalformedQueryException, QueryEvaluationException, IOException
  {
    // connect to repository
    
    mConnection = establishRepositoryConnection(host, name);

    // clear out the context
    
    URI contentContext = mConnection.getValueFactory().createURI(CONTENT_CONTEXT);
    log.info("clearing context: " + contentContext);
    mConnection.clear(contentContext);
    
    // load new data into context

    loadAll(mConnection, Util.findResourceFile(TREBOR_CONENT_DIR), contentContext, RDFFormat.TURTLE);
  }
  
  public static RepositoryConnection establishRepositoryConnection(String host, String name) throws RepositoryException
  {
    String url = String.format("http://%s/openrdf-sesame/repositories/%s", host, name);
    log.info("connecting to remote store: " + url);
    Repository repository = new HTTPRepository(url);
    repository.initialize();
    return repository.getConnection();
  }

  public static File[] findFiles(File directory, final RDFFormat format)
  {
    return directory.listFiles(new FilenameFilter()
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
  }
  
  
  public static File[] loadAll(RepositoryConnection connection, File directory, URI context, final RDFFormat format) throws RDFParseException, RepositoryException, IOException, MalformedQueryException, QueryEvaluationException
  {
    File[] files = findFiles(directory, format);
    for (File file: files)
    {
//      log.info("adding content: " + file.getName() + " " + new Date(file.lastModified()));
      connection.add(file, null, format, context);
    }
    return files;
  }
  
  public static void load(RepositoryConnection connection, File file, URI context, RDFFormat format) throws RepositoryException, RDFParseException, IOException, MalformedQueryException, QueryEvaluationException
  {
    // establish last modified date of file
    
    Date lastModified = new Date(file.lastModified());
    log.debug("modifiied: " + lastModified);
    
    // create a mock repo to work in
    
    RepositoryConnection tmp = MockRepositoryFactory.getMockRepository().getConnection();
    tmp.add(file, null, format, context);
    
    // extract all the tree nodes
    
    String arg1 = RdfNames.PREFIX + "SELECT * WHERE {?node a too:treeNode;}";
    TupleQueryResult nodes = tmp.prepareTupleQuery(QueryLanguage.SPARQL, arg1).evaluate();
    while (nodes.hasNext())
    {
      log.debug(nodes.next().getValue("node"));
    }
  }
}
