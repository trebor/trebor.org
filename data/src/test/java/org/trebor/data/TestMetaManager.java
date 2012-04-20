package org.trebor.data;

import static org.junit.Assert.*;
import static org.trebor.commons.RdfNames.*;
import static org.trebor.data.Install.TREBOR_CONTENT_DIR;

import java.io.IOException;
import java.util.Date;

import org.apache.log4j.Logger;
import org.junit.Before;
import org.junit.Test;
import org.openrdf.model.Statement;
import org.openrdf.model.URI;
import org.openrdf.model.ValueFactory;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.QueryLanguage;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.RepositoryResult;
import org.openrdf.repository.config.RepositoryConfigException;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;
import org.trebor.commons.Util;
import org.trebor.data.dto.MetaData;
import org.trebor.data.dto.Node;
import org.trebor.util.rdf.MockRepositoryFactory;
import org.trebor.util.rdf.RdfUtil;

import static org.trebor.util.rdf.RdfUtil.*;

public class TestMetaManager
{
  private static Logger log = Logger.getLogger(TestMetaManager.class);
  
  private RepositoryConnection mConnection;
  private MetaManager mMeta;
  private ValueFactory mVf;

  @Before
  public void init() throws RepositoryException, RepositoryConfigException, RDFParseException, MalformedQueryException, QueryEvaluationException, IOException
  {
    Repository repository = MockRepositoryFactory.getMockRepository();
    mConnection = repository.getConnection();
    mVf = mConnection.getValueFactory();
    assertEquals(0, mConnection.size());
    URI contentContext = mConnection.getValueFactory().createURI(CONTENT_CONTEXT);
    RdfUtil.loadAll(mConnection, Util.findResourceFile(TREBOR_CONTENT_DIR), contentContext, RDFFormat.TURTLE);
    assertEquals(253, mConnection.size());
    mMeta = new MetaManager(mConnection, CONTENT_CONTEXT, META_CONTEXT);
  }

  @Test
  public void testEstablishNode()
  {
    Node node = mMeta.findNodeInstance("home");
    log.debug("title: " + node.getTitle());
  }
  
  @Test
  public void testCreateMetaData() throws RepositoryException, QueryEvaluationException, MalformedQueryException
  {
    MetaData md = mMeta.createMetaInstance("home", new Date());
    
    testContext(META_CONTEXT, 5, false);
    testContext(CONTENT_CONTEXT, 253, false);
    
    assertEquals(0, md.getHitCount());
    assertTrue(ask(mConnection, "ASK {?meta too:hasHitCount \"0\"^^xsd:int.}"));
    md.registerHit();
    assertEquals(1, md.getHitCount());
    assertTrue(ask(mConnection, "ASK {?meta too:hasHitCount \"0\"^^xsd:int.}"));
    
    testContext(META_CONTEXT, 5, true);
    testContext(CONTENT_CONTEXT, 253, false);
  }
  
  @Test
  public void testEstablishMetaData() throws RepositoryException, QueryEvaluationException, MalformedQueryException
  {
    Date created = new Date();
    MetaData md = mMeta.establishMetaInstance("home", created);
    assertNotNull(md);
    
    testContext(META_CONTEXT, 5, false);
    testContext(CONTENT_CONTEXT, 253, false);
    
    assertEquals(0, md.getHitCount());
    assertTrue(ask(mConnection, "ASK {?meta too:hasHitCount \"0\"^^xsd:int}"));
    assertEquals(created, getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasCreatedDate ?date}"));
    assertEquals(created, getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasUpdatedDate ?date}"));
    md.registerHit();
    assertEquals(1, md.getHitCount());
    assertTrue(ask(mConnection, "ASK {?meta too:hasHitCount \"1\"^^xsd:int.}"));
    assertEquals(created, getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasCreatedDate ?date}"));
    assertEquals(created, getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasUpdatedDate ?date}"));
    
    testContext(META_CONTEXT, 5, true);
    testContext(CONTENT_CONTEXT, 253, false);
  }

  @Test
  public void testAllManager() throws RepositoryException
  {
    Date created = new Date();
    mMeta.registerHit("home", created);
    assertEquals(1, getInt(mConnection, PREFIX + "SELECT ?int WHERE {?meta too:hasHitCount ?int}").intValue());
    assertEquals(created, getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasCreatedDate ?date}"));
    assertEquals(created, getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasUpdatedDate ?date}"));
    mMeta.registerHit("home", created);
    assertEquals(2, getInt(mConnection, PREFIX + "SELECT ?int WHERE {?meta too:hasHitCount ?int}").intValue());
    assertEquals(created, getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasCreatedDate ?date}"));
    assertEquals(created, getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasUpdatedDate ?date}"));
    Date updated = new Date();
    mMeta.setUpdatedTime("home", updated);
    assertEquals(2, getInt(mConnection, PREFIX + "SELECT ?int WHERE {?meta too:hasHitCount ?int}").intValue());
    assertEquals(created, getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasCreatedDate ?date}"));
    assertEquals(updated, getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasUpdatedDate ?date}"));
    
    // confirm counts;
    
    testContext(META_CONTEXT, 5, true);
    testContext(CONTENT_CONTEXT, 253, false);
  }
  
  
  public void testContext(String context, int count, boolean print) throws RepositoryException
  {
    RepositoryResult<Statement> statements = mConnection.getStatements(null, null, null, true, mVf.createURI(context));

    int actualCount = 0;
    while(statements.hasNext())
    {
      Statement statement = statements.next();
      if (print)
        log.debug(statement);
      ++actualCount;
    }
    
    assertEquals(count, actualCount);
  }
  
  public static boolean ask(RepositoryConnection connection, String query) throws QueryEvaluationException, RepositoryException, MalformedQueryException
  {
    return connection.prepareBooleanQuery(QueryLanguage.SPARQL, PREFIX + query).evaluate();
  }
}
