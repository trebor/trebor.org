package org.trebor.www.rdf;

import static org.trebor.www.rdf.RdfUtil.NameSpace;
import static org.trebor.www.rdf.RdfUtil.importFile;

import java.io.File;
import java.io.IOException;

import org.openrdf.model.Resource;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;
import org.openrdf.sail.memory.MemoryStore;

public class MockRepositoryFactory {

  public static void addNameSpace(Repository repository) {
    try {
      RepositoryConnection connection = repository.getConnection();
      for (NameSpace namespace: NameSpace.values())
        connection.setNamespace(namespace.getPrefix(), namespace.getValue());
      connection.commit();
    } catch (RepositoryException e) {
      e.printStackTrace();
    }
  }

  public static Repository getMockRepository() throws RepositoryException {
    Repository repository = new SailRepository(new MemoryStore());
    repository.initialize();
    addNameSpace(repository);
    return repository;
  }

  public static Repository getMockRepository(File initialState, RDFFormat format)
      throws RepositoryException, RDFParseException, IOException {
    Repository repository = getMockRepository();
    importFile(repository, initialState, format, repository.getValueFactory()
        .createURI(initialState.toURI().toString()));
    return repository;
  }
  
  public static Repository getMockRepository(File initialState,
      RDFFormat format, Resource... contexts) throws RepositoryException,
      RDFParseException, IOException {
    Repository repository = getMockRepository();
    importFile(repository, initialState, format, contexts);
    return repository;
  }

  public static Repository getMockRepository(File initialState)
      throws RepositoryException, RDFParseException, IOException {
    return getMockRepository(initialState, RDFFormat.TURTLE);
  }
}
