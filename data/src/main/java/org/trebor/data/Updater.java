package org.trebor.data;

import static org.trebor.www.RdfNames.*;

import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.apache.log4j.Logger;
import org.openrdf.model.Statement;
import org.openrdf.model.URI;
import org.openrdf.query.BindingSet;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.QueryLanguage;
import org.openrdf.query.TupleQueryResult;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.RepositoryResult;
import org.openrdf.repository.config.RepositoryConfigException;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;
import org.trebor.util.rdf.MockRepositoryFactory;
import org.trebor.util.rdf.RdfUtil;
import org.trebor.www.RdfNames;

public class Updater
{
  private static Logger log = Logger.getLogger(Updater.class);
  
  // predicates which do NOT indicate that node content has changes
  
  @SuppressWarnings("serial")
  public static final Set<String> IGNORED_PREDICATES = new HashSet<String>()
  {
    {
      add(HAS_NODE_CHILD);
    }
  };

  private RepositoryConnection mConnection;
  private URI mContentContext;
  private MetaManager mMetaManager;

  public Updater(RepositoryConnection connection, String contentContext, String metaContext) throws RepositoryException, RepositoryConfigException
  {
    mConnection = connection;
    mContentContext = mConnection.getValueFactory().createURI(contentContext);
    mMetaManager = new MetaManager(mConnection, contentContext, metaContext);
  }
  
  public void update(File directory, RDFFormat format) throws RepositoryException, RDFParseException, MalformedQueryException, QueryEvaluationException, IOException
  {
    RepositoryConnection accumulator = MockRepositoryFactory.getMockRepository().getConnection();
    File[] files = RdfUtil.findFiles(directory, format);

    Map<String, Date> updates = new HashMap<String, Date>();
    
    for (File file: files)
      updates.putAll(update(accumulator, file, RDFFormat.TURTLE));

    // clear all the old content, and add all the new content
    
    mConnection.clear(mContentContext);
    mConnection.add(accumulator.getStatements(null, null, null, true), mContentContext);
    
    // perform all the meta data updates
    
    for (String name: updates.keySet())
      mMetaManager.setUpdatedTime(name, updates.get(name));
  }
  
  public Map<String, Date> update(RepositoryConnection accumulator, File file, RDFFormat format) throws RepositoryException, RDFParseException, IOException, MalformedQueryException, QueryEvaluationException
  {
    Map<String, Date> updates = new HashMap<String, Date>();
    
    // establish last modified date of file
    
    Date lastModified = new Date(file.lastModified());
    log.debug("    file: " + file);
    log.debug("modified: " + lastModified);
    
    // create a mock repository to work in
    
    RepositoryConnection tmp = MockRepositoryFactory.getMockRepository().getConnection();
    tmp.add(file, null, format, mContentContext);
    
    // extract all the tree nodes
    
    String nodeQuery = RdfNames.PREFIX + "SELECT ?node ?name WHERE {?node a too:treeNode. ?node too:hasName ?name}";
    TupleQueryResult nodes = tmp.prepareTupleQuery(QueryLanguage.SPARQL, nodeQuery).evaluate();
    while (nodes.hasNext())
    {
      BindingSet result = nodes.next();
      URI node = ((URI)result.getValue("node"));
      String name = result.getValue("name").stringValue();
      log.debug("node: " + node);
      log.debug("name: " + name);
      
      // if the node has changed, set the update time
      
      if (hasNodeChanged(node, tmp, mConnection))
        updates.put(name, lastModified);
    }
    
    // accumulate the new content
    
    accumulator.add(tmp.getStatements(null, null, null, true));

    // return the updates for these statements
    
    return updates;
  }

  private boolean hasNodeChanged(URI node, RepositoryConnection newRepo,
    RepositoryConnection oldRepo) throws RepositoryException
  {

    RepositoryResult<Statement> newStatements =
      newRepo.getStatements(node, null, null, true);
    while (newStatements.hasNext())
    {
      Statement newStatement = newStatements.next();

      // if this is an ignored predicate, continue without checking

      if (IGNORED_PREDICATES.contains(newStatement.getPredicate()
        .stringValue()))
        continue;

      // test if this exact statement is present in the old repository

      RepositoryResult<Statement> oldStatemets =
        oldRepo.getStatements(newStatement.getSubject(),
          newStatement.getPredicate(), newStatement.getObject(), true,
          mContentContext);
      
      // if there is no such a statement present in the old repository, then the
      // data has changed
      
      if (!oldStatemets.hasNext())
        return true;
    }
    
    // the data has not changed
    
    return false;
  }
}
