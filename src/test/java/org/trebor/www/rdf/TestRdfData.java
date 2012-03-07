package org.trebor.www.rdf;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

import java.io.File;
import java.io.IOException;

import org.apache.commons.configuration.ConfigurationException;
import org.junit.Test;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryException;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandlerException;
import org.trebor.www.store.TreborRepository;
import org.trebor.www.util.TreborConfiguration;

public class TestRdfData
{
  @Test
  public void testExportData() throws RepositoryException, IOException, ConfigurationException, RDFHandlerException, QueryEvaluationException, MalformedQueryException
  {
    TreborConfiguration config = new TreborConfiguration();
    assertTrue(config != null);
    TreborRepository.setConfiguration(config);
    Repository repo = TreborRepository.createMemoryStore();
    assertEquals(279, repo.getConnection().size());
    RdfUtil.exportRepository(repo, new File("target/trebor-rdf.xml"), RDFFormat.RDFXML);
  }
}
