package org.trebor.www.util;

import java.io.IOException;

import org.apache.log4j.Logger;
import org.openrdf.model.URI;
import org.openrdf.query.Dataset;
import org.openrdf.query.GraphQuery;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.Query;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.QueryLanguage;
import org.openrdf.query.TupleQuery;
import org.openrdf.query.impl.DatasetImpl;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryException;

class DefaultRepositoryContext implements RepositoryContext {
  private final Logger logger = Logger.getLogger(getClass());
  
  private final Repository mRepository;
  private final Dataset mDataset;
  
  public DefaultRepositoryContext(Repository repository, URI... contexts)
  {
    mRepository = repository;
    
    DatasetImpl dataset = null;
    
    if (contexts.length > 0)
    {
      dataset = new DatasetImpl();
      for (URI uri: contexts)
      {
        //logger.debug("dataset config: " + uri);
        dataset.addNamedGraph(uri);
        dataset.addDefaultGraph(uri);
      }
    }
    
    mDataset = dataset;
  }
  
  public Repository getRepository() {
    return mRepository;
  }

  public Dataset getDataSet() {
    return mDataset;
  }

  public GraphQuery prepareGraphQuery(String queryString) throws RepositoryException,
      MalformedQueryException, QueryEvaluationException, IOException {
    return prepareGraphQuery(QueryLanguage.SPARQL, queryString);
  }

  public GraphQuery prepareGraphQuery(QueryLanguage language, String queryString)
      throws RepositoryException, MalformedQueryException,
      QueryEvaluationException, IOException {
    
    GraphQuery query = getRepository().getConnection().prepareGraphQuery(
        language, queryString);
    setDataset(query);
    
    return query;
  }

  public TupleQuery prepareTupleQuery(String queryString) throws RepositoryException,
      MalformedQueryException, QueryEvaluationException, IOException {
    return prepareTupleQuery(QueryLanguage.SPARQL, queryString);
  }

  public TupleQuery prepareTupleQuery(QueryLanguage language, String queryString)
      throws RepositoryException, MalformedQueryException,
      QueryEvaluationException, IOException {

    TupleQuery query = getRepository().getConnection().prepareTupleQuery(
        language, queryString);
    setDataset(query);

    return query;
  }

  private void setDataset(Query query) {
    Dataset dataset = query.getDataset();
    logger.debug("dataset: " + dataset);
    
    if (null != mDataset)
      query.setDataset(mDataset);
  }

  public long getTripleCount() {
    long count = Long.MIN_VALUE;

    try {
      count = RdfUtil.getTripleCount(mRepository);
    } catch (QueryEvaluationException e) {
      e.printStackTrace();
    }

    return count;
  }
}
