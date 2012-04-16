package org.trebor.data;

import static org.trebor.www.RdfNames.CONTENT_CONTEXT;
import static org.trebor.www.RdfNames.META_CONTEXT;

import org.apache.log4j.Logger;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.config.RepositoryConfigException;
import org.openrdf.rio.RDFFormat;
import org.trebor.util.rdf.RdfUtil;

public class Install
{
  private static Logger log = Logger.getLogger(Install.class);
  
  public static final String TREBOR_CONTENT_DIR = "/rdf/data";

  public static void main(String[] args)
  {
    if (args.length < 2)
    {
      log.error("Expected <Host> <Repository-Name> arguments");
      System.exit(1);
    }
    
    String host = args[0];
    String repoName = args[1];
    
    try
    {
      Updater updater =
        new Updater(RdfUtil.establishRepositoryConnection(host, repoName),
          CONTENT_CONTEXT, META_CONTEXT);
      
      updater.update(Util.findResourceFile(TREBOR_CONTENT_DIR), RDFFormat.TURTLE);
    }
    catch (RepositoryException e)
    {
      log.error(String.format("Unable to connect to host %s, reposiotry %s", host, repoName), e);
    }
    catch (RepositoryConfigException e)
    {
      log.error(String.format("Unable to configure host %s, reposiotry %s", host, repoName), e);
    }
    catch (Exception e)
    {
      log.error(String.format("Unable to update host %s, reposiotry %s", host, repoName), e);
    }
  }
}
