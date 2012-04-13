package org.trebor.data;

import static org.trebor.www.RdfNames.*;

import java.util.Date;

import org.apache.log4j.Logger;
import org.openrdf.model.URI;
import org.openrdf.model.ValueFactory;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.config.RepositoryConfigException;
import org.openrdf.repository.object.ObjectConnection;
import org.openrdf.repository.object.ObjectQuery;
import org.openrdf.repository.object.config.ObjectRepositoryFactory;
import org.openrdf.result.NoResultException;

public class MetaManager
{
  @SuppressWarnings("unused")
  private static Logger log = Logger.getLogger(MetaManager.class);

  public static final String NODE_QUERY =
    "SELECT ?node WHERE {?node too:hasName ?name. ?node a too:treeNode.}";

  public static final String META_DATA_QUERY =
    "SELECT ?meta WHERE {?node too:hasName ?name. ?node a too:treeNode. ?meta too:hasNode ?node. ?meta a too:metaNode.}";

  private ObjectConnection mObjectConnection;
  private ValueFactory mVf;

  public MetaManager(String host, String name) throws RepositoryException,
    RepositoryConfigException
  {
    this(Updater.establishRepositoryConnection(host, name));
  }

  public MetaManager(RepositoryConnection connection)
    throws RepositoryException, RepositoryConfigException
  {
    // create object repository

    ObjectRepositoryFactory orf = new ObjectRepositoryFactory();
    mObjectConnection =
      orf.createRepository(connection.getRepository()).getConnection();
    mVf = mObjectConnection.getRepository().getValueFactory();

    // specify contexts

    URI contentContext = mVf.createURI(CONTENT_CONTEXT);
    URI metaContext = mVf.createURI(META_CONTEXT);
    mObjectConnection.setReadContexts(metaContext, contentContext);
    mObjectConnection.setAddContexts(metaContext);
  }

  public void setUpdatedTime(String nodeName, Date updated)
  {
    establishMetaInstance(nodeName, updated).setUpdated(updated);
  }

  public void registerHit(String nodeName, Date created)
  {
    establishMetaInstance(nodeName, created).registerHit();
  }

  public Node findNodeInstance(String nodeName)
  {
    try
    {
      ObjectQuery query = mObjectConnection.prepareObjectQuery(PREFIX + NODE_QUERY);
      query.setObject("name", nodeName);
      return (Node)query.evaluate().singleResult();
    }
    catch (Exception e)
    {
      log.error(e);
    }

    return null;
  }

  public MetaData establishMetaInstance(String nodeName, Date created)
  {
    // find the meta data

    MetaData md = findMetaInstance(nodeName);

    // if it exits then just return that

    if (null != md)
      return md;

    // otherwise create the instance and try to find it again

    createMetaInstance(nodeName, created);
    return findMetaInstance(nodeName);
  }

  public MetaData findMetaInstance(String nodeName)
  {
    try
    {
      ObjectQuery query =
        mObjectConnection.prepareObjectQuery(PREFIX + META_DATA_QUERY);
      query.setObject("name", nodeName);
      return (MetaData)query.evaluate().singleResult();
    }
    catch (NoResultException e)
    {
      // no error if no result
    }
    catch (Exception e)
    {
      log.error(e);
    }

    return null;
  }

  MetaData createMetaInstance(String nodeName, Date created)
  {
    try
    {
      MetaData meta = new MetaData(findNodeInstance(nodeName), created);
      mObjectConnection.addObject(meta);
      return meta;
    }
    catch (RepositoryException e)
    {
      log.error(e);
    }

    return null;
  }
}