package org.trebor.data;

import java.io.IOException;

import org.junit.Test;
import org.openrdf.model.BNode;
import org.openrdf.model.Statement;
import org.openrdf.model.URI;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.RepositoryResult;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;
import org.trebor.data.Install;
import org.trebor.rdf.MockRepositoryFactory;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.trebor.data.Install.*;

public class TestDataLoad
{
  @Test
  public void testDataLoad() throws RepositoryException, RDFParseException, IOException
  {
    RepositoryConnection connection = MockRepositoryFactory.getMockRepository().getConnection();
    URI contentContext = connection.getValueFactory().createURI(CONTENT_CONTEXT);
    Install.loadAll(connection, Util.findResourceFile(TREBOR_CONENT_DIR), contentContext, RDFFormat.TURTLE);
    
    RepositoryResult<Statement> statements = connection.getStatements(null, null, null, true);
    int count = 0;
    while (statements.hasNext())
    {
      Statement statement = statements.next();
      
      // no blank nodes allowed in the content data
      
      assertFalse(statement.getSubject() instanceof BNode);
      assertFalse(statement.getObject() instanceof BNode);
      ++count;
    }

    // there should be some triples in there
    
    assertTrue(count >= 253);
  }
}