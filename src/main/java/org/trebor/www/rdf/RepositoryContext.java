package org.trebor.www.rdf;

import java.io.IOException;

import org.openrdf.query.Dataset;
import org.openrdf.query.GraphQuery;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.QueryLanguage;
import org.openrdf.query.TupleQuery;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryException;

public interface RepositoryContext {
  Repository getRepository();

  Dataset getDataSet();

  long getTripleCount();
  
  GraphQuery prepareGraphQuery(String query) throws RepositoryException,
      MalformedQueryException, QueryEvaluationException, IOException;

  GraphQuery prepareGraphQuery(QueryLanguage language, String query)
      throws RepositoryException, MalformedQueryException,
      QueryEvaluationException, IOException;

  TupleQuery prepareTupleQuery(String query) throws RepositoryException,
      MalformedQueryException, QueryEvaluationException, IOException;

  TupleQuery prepareTupleQuery(QueryLanguage language, String query)
      throws RepositoryException, MalformedQueryException,
      QueryEvaluationException, IOException;
}
