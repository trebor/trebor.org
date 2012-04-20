package org.trebor.data;

import static org.trebor.commons.RdfNames.*;
import static org.junit.Assert.*;

import java.io.File;
import java.io.IOException;
import java.util.Date;
import java.util.Map;

import org.apache.log4j.Logger;
import org.junit.Before;
import org.junit.Test;
import org.openrdf.model.Resource;
import org.openrdf.model.Statement;
import org.openrdf.model.URI;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.RepositoryResult;
import org.openrdf.repository.config.RepositoryConfigException;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFParseException;
import org.trebor.commons.Util;
import org.trebor.util.rdf.MockRepositoryFactory;
import org.trebor.util.rdf.RdfUtil;

public class TestUpater
{
  @SuppressWarnings("unused")
  private static Logger log = Logger.getLogger(TestUpater.class);

  public static final String FRAME1_DIR = "/frame1";
  public static final String FRAME2_DIR = "/frame2";
  public static final String FRAME3_DIR = "/frame3";
  
  private Updater mUpdater;
  private RepositoryConnection mConnection;
  private URI mContentContext;
  private URI mMetaContext;
  
  @Before
  public void initialize() throws RepositoryException, RepositoryConfigException
  {
    mConnection = MockRepositoryFactory.getMockRepository().getConnection();
    mUpdater = new Updater(mConnection, CONTENT_CONTEXT, META_CONTEXT);
    mContentContext = mConnection.getValueFactory().createURI(CONTENT_CONTEXT);
    mMetaContext = mConnection.getValueFactory().createURI(META_CONTEXT);
  }

  @Test
  public void testFiles()
  {
    assertNotNull(Util.findResourceFile(FRAME1_DIR));
    File[] files = RdfUtil.findFiles(Util.findResourceFile(FRAME1_DIR), RDFFormat.TURTLE);
    assertEquals(1, files.length);
    files = RdfUtil.findFiles(Util.findResourceFile(FRAME2_DIR), RDFFormat.TURTLE);
    assertEquals(1, files.length);
    files = RdfUtil.findFiles(Util.findResourceFile(FRAME3_DIR), RDFFormat.TURTLE);
    assertEquals(2, files.length);
  }
  
  @Test
  public void testUpdateSingle() throws RepositoryException, RDFParseException, MalformedQueryException, QueryEvaluationException, IOException
  {
    RepositoryConnection accumulator = MockRepositoryFactory.getMockRepository().getConnection();
    File[] files = RdfUtil.findFiles(Util.findResourceFile(FRAME1_DIR), RDFFormat.TURTLE);
    assertEquals(0, mConnection.size());
    assertEquals(0, accumulator.size());
    
    Map<String, Date> updates;
    updates = mUpdater.update(accumulator, files[0], RDFFormat.TURTLE);
    assertEquals(6, accumulator.size());
    assertEquals(new Date(files[0].lastModified()), updates.get("home"));
    assertEquals(1, updates.size());
    assertNull(updates.get("software"));
    
    files = RdfUtil.findFiles(Util.findResourceFile(FRAME2_DIR), RDFFormat.TURTLE);
    accumulator.clear();
    updates = mUpdater.update(accumulator, files[0], RDFFormat.TURTLE);
    assertEquals(6, accumulator.size());
    assertEquals(new Date(files[0].lastModified()), updates.get("home"));
    assertEquals(1, updates.size());
    assertNull(updates.get("software"));

    files = RdfUtil.findFiles(Util.findResourceFile(FRAME3_DIR), RDFFormat.TURTLE);
    accumulator.clear();
    updates = mUpdater.update(accumulator, files[0], RDFFormat.TURTLE);
    assertEquals(6, accumulator.size());
    assertEquals(new Date(files[0].lastModified()), updates.get("home"));
    assertEquals(1, updates.size());
    updates = mUpdater.update(accumulator, files[1], RDFFormat.TURTLE);
    assertEquals(77, accumulator.size());
    assertEquals(new Date(files[1].lastModified()), updates.get("software"));
    assertEquals(11, updates.size());

    assertEquals(0, mConnection.size());
  }
  
  @Test
  public void testUpdate() throws RepositoryException, RDFParseException, MalformedQueryException, QueryEvaluationException, IOException
  {
    Date now = new Date();
    
    Date frame1Time = new Date(now.getTime() - now.getTime() % 1000);
    dateFiles(Util.findResourceFile(FRAME1_DIR), frame1Time);
    Date frame2Time = new Date(frame1Time.getTime() + 1000);
    dateFiles(Util.findResourceFile(FRAME2_DIR), frame2Time);
    Date frame3Time = new Date(frame2Time.getTime() + 1000);
    dateFiles(Util.findResourceFile(FRAME3_DIR), frame3Time);
    
    assertEquals(0, mConnection.size());
    mUpdater.update(Util.findResourceFile(FRAME1_DIR), RDFFormat.TURTLE);
    assertEquals(11, mConnection.size());
    assertEquals(6, mConnection.size(mContentContext));
    assertEquals(5, mConnection.size(mMetaContext));
    assertEquals(0, mConnection.size((Resource)null));

    assertEquals(frame1Time, RdfUtil.getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasNode ?node. ?node too:hasName \"home\". ?meta too:hasCreatedDate ?date}"));
    assertEquals(frame1Time, RdfUtil.getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasNode ?node. ?node too:hasName \"home\". ?meta too:hasUpdatedDate ?date}"));

    log.debug("============= -- ===========");
    RepositoryResult<Statement> metaState = mConnection.getStatements(null, null, null, true, mMetaContext);
    while (metaState.hasNext())
      log.debug(metaState.next());

    mUpdater.update(Util.findResourceFile(FRAME2_DIR), RDFFormat.TURTLE);
    assertEquals(11, mConnection.size());
    assertEquals(6, mConnection.size(mContentContext));
    assertEquals(5, mConnection.size(mMetaContext));
    assertEquals(0, mConnection.size((Resource)null));
    
    assertEquals(frame1Time, RdfUtil.getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasNode ?node. ?node too:hasName \"home\". ?meta too:hasCreatedDate ?date}"));
    assertEquals(frame2Time, RdfUtil.getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasNode ?node. ?node too:hasName \"home\". ?meta too:hasUpdatedDate ?date}"));
    
    log.debug("============= -- ===========");
    metaState = mConnection.getStatements(null, null, null, true, mMetaContext);
    while (metaState.hasNext())
      log.debug(metaState.next());
    
    mUpdater.update(Util.findResourceFile(FRAME3_DIR), RDFFormat.TURTLE);
    assertEquals(137, mConnection.size());
    assertEquals(77, mConnection.size(mContentContext));
    assertEquals(60, mConnection.size(mMetaContext));
    assertEquals(0, mConnection.size((Resource)null));
    
    assertEquals(frame1Time, RdfUtil.getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasNode ?node. ?node too:hasName \"home\". ?meta too:hasCreatedDate ?date}"));
    assertEquals(frame2Time, RdfUtil.getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasNode ?node. ?node too:hasName \"home\". ?meta too:hasUpdatedDate ?date}"));
    
    assertEquals(frame3Time, RdfUtil.getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasNode ?node. ?node too:hasName \"software\". ?meta too:hasCreatedDate ?date}"));
    assertEquals(frame3Time, RdfUtil.getDate(mConnection, PREFIX + "SELECT ?date WHERE {?meta too:hasNode ?node. ?node too:hasName \"software\". ?meta too:hasUpdatedDate ?date}"));
    
    log.debug("============= -- ===========");
    metaState = mConnection.getStatements(null, null, null, true, mMetaContext);
    while (metaState.hasNext())
      log.debug(metaState.next());
  }

  private void dateFiles(File dir, Date time)
  {
    for (File file: dir.listFiles())
      file.setLastModified(time.getTime());
  }
}
