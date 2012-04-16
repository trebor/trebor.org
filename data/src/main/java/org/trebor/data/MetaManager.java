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

  public MetaManager(RepositoryConnection connection, String contentContextStr, String metaContextStr)
    throws RepositoryException, RepositoryConfigException
  {
    // create object repository

    ObjectRepositoryFactory orf = new ObjectRepositoryFactory();
    mObjectConnection =
      orf.createRepository(connection.getRepository()).getConnection();
    mVf = mObjectConnection.getRepository().getValueFactory();

    // specify contexts

    URI contentContext = mVf.createURI(contentContextStr);
    URI metaContext = mVf.createURI(metaContextStr);
    mObjectConnection.setReadContexts(metaContext, contentContext);
    mObjectConnection.setAddContexts(metaContext);
  }

  public MetaData setUpdatedTime(String nodeName, Date updated)
  {
    MetaData md = establishMetaInstance(nodeName, updated);
    if (null != md)
      md.setUpdated(updated);
    return md;
  }

  public MetaData registerHit(String nodeName, Date created)
  {
    MetaData md = establishMetaInstance(nodeName, created);
    if (null != md)
      md.registerHit();
    return md;
  }

  public Node findNodeInstance(String nodeName)
  {
    try
    {
      ObjectQuery query = mObjectConnection.prepareObjectQuery(PREFIX + NODE_QUERY);
      query.setObject("name", nodeName);
      return (Node)query.evaluate().singleResult();
    }
    catch (NoResultException e)
    {
      // no error, just node not found
    }
    catch (Exception e)
    {
      log.error(e);
      throw new Error(String.format("Error finding \"%s\" node.", nodeName));
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

    if (null != createMetaInstance(nodeName, created))
      return findMetaInstance(nodeName);
    
    return null;
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
      throw new Error(String.format("Error finding meta data for \"%s\" node.", nodeName));
    }

    return null;
  }

  MetaData createMetaInstance(String nodeName, Date created)
  {
    try
    {
      Node node = findNodeInstance(nodeName);
      
      // if there is a node, construct meta data
      
      if (null != node)
      {
        log.debug(String.format("creating meta data for \"%s\" node %s", nodeName, created));
        MetaData meta = new MetaData(node, created);
        mObjectConnection.addObject(meta);
        return meta;
      }
    }
    catch (RepositoryException e)
    {
      log.error(e);
      throw new Error(String.format("Error creating meta data for \"%s\" node.", nodeName));
    }
    
    return null;
  }
}