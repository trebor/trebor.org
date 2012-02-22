package org.trebor.www.rdf;

import static org.junit.Assert.assertEquals;
import static org.trebor.www.rdf.ResourceManager.ResourceType.*;

import org.apache.log4j.Logger;
import org.junit.Before;
import org.junit.Test;
import org.openrdf.model.BNode;
import org.openrdf.model.Literal;
import org.openrdf.model.URI;
import org.openrdf.model.Value;
import org.openrdf.model.ValueFactory;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.sail.memory.MemoryStore;
import org.trebor.www.rdf.ResourceManager.ResourceType;

public class TestResourceManager
{
  public static final Logger log = Logger.getLogger(ResourceManager.class);

  class Resource
  {
    String mForm1;
    String mForm2;
    ResourceType mType;

    public Resource(String form1, String form2, ResourceType type)
    {
      mForm1 = form1;
      mForm2 = form2 == null
        ? form1
        : form2;
      mType = type;
    }
  }

  Resource[] mResources =
    {
    new Resource("too:foo", "http://trebor.org/ns#foo", SHORT_URI),
      new Resource("too:bar", "http://trebor.org/ns#bar", SHORT_URI),

      new Resource("_:node15pf8hastx4", null, BLANK_NODE),
      new Resource("_:node16ec8705qx101", null, BLANK_NODE),
      new Resource("_:x", null, BLANK_NODE),

      new Resource("http://trebor.org/ns#foo", "too:foo", LONG_URI),
      new Resource("http://trebor.org/ns#bar", "too:bar", LONG_URI),
      new Resource("file://foo/bar/baz.txt", null, LONG_URI),
      new Resource("http://www.google.com/foo", null, LONG_URI),

      new Resource("\"hello fred\"", null, LITERAL),
      new Resource("\"hello fred\"", null, LITERAL),
      new Resource("\"hello fred\"@en", null, LITERAL),
      new Resource("\"hello fred\"@en_gb", null, LITERAL),
      new Resource("\"hello \"there\" fred\"@en_gb", null, LITERAL),
      new Resource("\"555\"^^xsd:int",
        "\"555\"^^<http://www.w3.org/2001/XMLSchema#int>", LITERAL),
      new Resource(
        "\"1986-02-11T00:00:00-04:00\"^^xsd:dateTime",
        "\"1986-02-11T00:00:00-04:00\"^^<http://www.w3.org/2001/XMLSchema#dateTime>",
        LITERAL),
      new Resource(
        "\"1996-05-14T13:33:12-04:00\"^^xsd:dateTime",
        "\"1996-05-14T13:33:12-04:00\"^^<http://www.w3.org/2001/XMLSchema#dateTime>",
        LITERAL),
      new Resource("\"foo\nbar\"", null, LITERAL),
    };
  private Repository mRepository;
  private RepositoryConnection mConnection;

  @Before
  @SuppressWarnings("unused")
  public void initialize() throws RepositoryException
  {
    mRepository = new SailRepository(new MemoryStore());
    mRepository.initialize();
    mConnection = mRepository.getConnection();
    mConnection.setNamespace("too", "http://trebor.org/ns#");
    mConnection.setNamespace("xsd", "http://www.w3.org/2001/XMLSchema#");
  }

  @Test
  public void testUri() throws RepositoryException
  {
    ResourceManager resourceManager = new ResourceManager(mConnection);

    for (Resource resource : mResources)
    {
      log.debug("resource: " + resource.mForm1);
      assertEquals(resource.mType,
        ResourceType.establishType(resource.mForm1));
      switch (resource.mType)
      {
      case SHORT_URI:
        assertEquals(resource.mForm1,
          resourceManager.shrinkResource(resource.mForm2));
        assertEquals(resource.mForm2,
          resourceManager.growResource(resource.mForm1));
        break;
      case LONG_URI:
        assertEquals(resource.mForm1,
          resourceManager.growResource(resource.mForm2));
        assertEquals(resource.mForm2,
          resourceManager.shrinkResource(resource.mForm1));
        break;
      case LITERAL:
        assertEquals(resource.mForm2,
          resourceManager.growResource(resource.mForm1));
        assertEquals(resource.mForm1,
          resourceManager.shrinkResource(resource.mForm2));
        break;
      }
    }
  }
  
  @Test
  public void testValueFactory() throws RepositoryException
  {
    ValueFactory vf = mRepository.getValueFactory();
    Literal l1 = vf.createLiteral(55.55f);
    log.debug(l1.toString());
    log.debug(l1.stringValue());
    Literal l2 = vf.createLiteral("hello");
    log.debug(l2.toString());
    log.debug(l2.stringValue());
    BNode b1 = vf.createBNode();
    log.debug(b1.toString());
    log.debug(b1.stringValue());
    URI u1 = vf.createURI("too:test");
    log.debug(u1.toString());
    log.debug(u1.stringValue());
    ResourceManager rm = new ResourceManager(mConnection);

    Value[] values = {l1, l2, b1, u1};
    
    for (Value value: values)
    {
      log.debug(rm.shrinkResource(value));
      log.debug(rm.growResource(value));
    }
  }
}
