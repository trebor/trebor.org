package org.trebor.www.dto;

import java.io.File;
import java.io.IOException;

import org.apache.log4j.Logger;
import org.junit.Test;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryException;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;
import org.trebor.www.rdf.MockRepositoryFactory;
import org.trebor.www.rdf.RdfUtil;

import static org.junit.Assert.*;

public class TestObjectRepository
{
  @SuppressWarnings("unused")
  private static final Logger log = Logger.getLogger(TestObjectRepository.class);

  @Test
  public void testLoadingFile() throws RepositoryException, RDFParseException, IOException
  {
    File data = new File("src/main/resources/rdf/ontology/trebor.ttl");
    assertTrue(data.exists());
    
    // create a document

    Repository repository = MockRepositoryFactory.getMockRepository();
    assertEquals(0, repository.getConnection().size());
    RdfUtil.importFile(repository, data, RDFFormat.TURTLE);
    assertEquals(22, repository.getConnection().size());
  }
}
