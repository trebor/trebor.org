package org.trebor.www.rdf;

import static java.lang.String.format;
import static org.trebor.www.rdf.RdfUtil.ResourceType.*;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.StringWriter;
import java.io.Writer;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.log4j.Logger;
import org.openrdf.model.Literal;
import org.openrdf.model.Namespace;
import org.openrdf.model.Resource;
import org.openrdf.model.Statement;
import org.openrdf.model.URI;
import org.openrdf.model.Value;
import org.openrdf.query.BindingSet;
import org.openrdf.query.GraphQuery;
import org.openrdf.query.GraphQueryResult;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.QueryLanguage;
import org.openrdf.query.TupleQuery;
import org.openrdf.query.TupleQueryResult;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.RepositoryResult;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandlerException;
import org.openrdf.rio.RDFParseException;
import org.openrdf.rio.RDFWriter;
import org.openrdf.rio.Rio;
import org.openrdf.rio.UnsupportedRDFormatException;

public class RdfUtil
{
  private static final Logger logger = Logger.getLogger(RdfUtil.class);

  public static final String COUNT_QUERY =
    "SELECT (count(?s) as ?count) WHERE {?s ?p ?o}";
  public static final String EXPORT_QUERY =
    "CONSTRUCT {?s ?p ?o} WHERE {?s ?p ?o}";

  public static final String URI_IDENTIFIER_RE = "[a-zA-Z_0-9\\.\\-]*";
  public static final String PROTOCOL_IDENTIFIER_RE = "\\w*";
  public static final String SHORT_URI_RE = format("%s(?<!_):%s",
    URI_IDENTIFIER_RE, URI_IDENTIFIER_RE);
  public static final String LONG_URI_RE = format("%s://.*",
    PROTOCOL_IDENTIFIER_RE);
  public static final String LITERAL_RE = format(
    "\"(\\p{ASCII}*)\"((@|\\^\\^)(%s|%s|<%s>))?", URI_IDENTIFIER_RE,
    SHORT_URI_RE, LONG_URI_RE);
  public static final String BLANK_NODE_RE =
    format("_:%s", URI_IDENTIFIER_RE);

  public static final String GRAPH_QUERY_PATH = "queries/graph";

  public static final String TUPLE_QUERY_PATH = "queries/tuple";

  public static String constructQueryString(String queryPath,
    String queryName, Object... queryArguments) throws IOException
  {

    return format(
      readResourceAsString(queryPath + File.separator + queryName),
      queryArguments);
  }

  // inject graph query results into a destination repository

  // public static int queryAndInject(DigesterConfiguration configuration,
  // GraphQuery query)
  // throws QueryEvaluationException, RDFHandlerException,
  // RepositoryException {
  // RDFInserter inserter = new
  // RDFInserter(configuration.getDestination().getConnection());
  // inserter.enforceContext(configuration.getSourceContextes());
  // query.evaluate(inserter);
  // return 0;
  // }

  public static GraphQuery prepareGraphQuery(RepositoryContext context,
    String graphQueryName, Object... queryArguments)
    throws RepositoryException, MalformedQueryException,
    QueryEvaluationException, IOException
  {

    String queryString =
      constructQueryString(GRAPH_QUERY_PATH, graphQueryName, queryArguments);

    return context.prepareGraphQuery(queryString);
  }

  public static TupleQuery prepareTupleQuery(RepositoryContext context,
    String graphQueryName, Object... queryArguments)
    throws RepositoryException, MalformedQueryException,
    QueryEvaluationException, IOException
  {

    String queryString =
      constructQueryString(TUPLE_QUERY_PATH, graphQueryName, queryArguments);

    return context.prepareTupleQuery(queryString);
  }

  public static String readResourceAsString(String resourcePath)
    throws IOException
  {
    ClassLoader classLoader = Thread.currentThread().getContextClassLoader();
    String fullResourcePath =
      classLoader.getResource(resourcePath).toExternalForm().split(":")[1];

    byte[] buffer = new byte[(int)new File(fullResourcePath).length()];
    BufferedInputStream f = null;

    try
    {
      f = new BufferedInputStream(new FileInputStream(fullResourcePath));
      f.read(buffer);
    }
    finally
    {
      if (f != null)
        f.close();
    }

    logger.debug(String.format("loaded: %s - %d bytes", fullResourcePath,
      buffer.length));

    return new String(buffer);
  }

  public static enum ResourceType
  {
    SHORT_URI("^" + SHORT_URI_RE + "$"), LONG_URI("^" + LONG_URI_RE + "$"),
    BLANK_NODE("^" + BLANK_NODE_RE + "$"), LITERAL(LITERAL_RE);

    private final Pattern mPattern;

    ResourceType(String regex)
    {
      mPattern = Pattern.compile(regex);
    }

    public boolean isMatch(String uri)
    {
      return mPattern.matcher(uri).matches();
    }

    static ResourceType establishType(String uri)
    {
      for (ResourceType type : values())
        if (type.isMatch(uri))
          return type;

      return null;
    }

    public Matcher parse(String resource)
    {
      Matcher matcher = mPattern.matcher(resource);
      matcher.matches();
      return matcher;
    }
  }

  public enum NameSpace
  {
    RDF("http://www.w3.org/1999/02/22-rdf-syntax-ns#"), RDFS(
      "http://www.w3.org/2000/01/rdf-schema#"), XSD(
      "http://www.w3.org/2001/XMLSchema#"), TOO("http://trebor.org/ns#"),
    TOI("http://treobr.org/instance/");

    private final String mValue;

    NameSpace(String value)
    {
      mValue = value;
    };

    public String getPrefix()
    {
      return name().toLowerCase();
    }

    public String getValue()
    {
      return mValue;
    }

    public String toString()
    {
      return mValue;
    }
  }

  public static Map<Repository, Map<String, String>> NAMES_SPACE_MAP_CHACHE =
    new HashMap<Repository, Map<String, String>>();

  public static Map<String, String> getNameSpace(Repository repository)
  {

    Map<String, String> nameSpaceMap = NAMES_SPACE_MAP_CHACHE.get(repository);

    try
    {
      if (null == nameSpaceMap)
      {
        nameSpaceMap = new HashMap<String, String>();
        RepositoryResult<Namespace> nameSpaces;
        nameSpaces = repository.getConnection().getNamespaces();

        while (nameSpaces.hasNext())
        {
          Namespace nameSpace = nameSpaces.next();
          nameSpaceMap.put(nameSpace.getName(), nameSpace.getPrefix());
        }
      }
    }
    catch (RepositoryException e)
    {
      e.printStackTrace();
    }

    return nameSpaceMap;
  }

  public static void appendNamesSpaceToQuery(StringBuffer queryString)
  {
    for (NameSpace nameSpace : NameSpace.values())
      queryString.append(format("PREFIX %s: <%s>\n", nameSpace.getPrefix(),
        nameSpace.getValue()));
  }

  public static String prepareStatementForQuery(Repository repository,
    Statement statement)
  {
    return prepareStatementForQuery(repository, statement.getSubject(),
      statement.getPredicate(), statement.getObject());
  }

  public static String prepareStatementForQuery(Repository repository,
    Resource subject, URI predicate, Value object)
  {
    return format("%s %s %s.", prepareValueForQuery(repository, subject),
      prepareValueForQuery(repository, predicate),
      prepareValueForQuery(repository, object));
  }

  public static String prepareValueForQuery(Repository repsitory, Value object)
  {
    String str = object.toString();
    if (str.startsWith("_:"))
      return "?" + str.split(":")[1];
    if (str.startsWith("\""))
      return str;
    return shortUri(repsitory, str);
  }

  public static String shortUri(Repository repository, Value resource)
  {
    return shortUri(repository, resource.toString());
  }

  public static String shortUri(Repository repository, String longUri)
  {
    Map<String, String> nameSpaceMap = getNameSpace(repository);
    if (LONG_URI.isMatch(longUri))
    {
      URI uri = repository.getValueFactory().createURI(longUri);
      String prefix = nameSpaceMap.get(uri.getNamespace());
      return null != prefix
        ? prefix + ":" + uri.getLocalName()
        : longUri;
    }
    return longUri;
  }

  public static TupleQueryResult performTupleQuery(Repository repository,
    String tupleQuery)
  {
    return performTupleQuery(repository, tupleQuery, QueryLanguage.SPARQL);
  }

  public static TupleQueryResult performTupleQuery(Repository repository,
    String tupleQuery, QueryLanguage language)
  {
    TupleQuery query;
    try
    {
      query =
        repository.getConnection().prepareTupleQuery(language, tupleQuery);
      return query.evaluate();
    }
    catch (Exception e)
    {
      throw new Error(e);
    }
  }

  public static GraphQueryResult performGraphQuery(Repository repository,
    String tupleQuery)
  {
    return performGraphQuery(repository, tupleQuery, QueryLanguage.SPARQL);
  }

  public static GraphQueryResult performGraphQuery(Repository repository,
    String tupleQuery, QueryLanguage language)
  {
    GraphQuery query;
    try
    {
      query =
        repository.getConnection().prepareGraphQuery(language, tupleQuery);
      return query.evaluate();
    }
    catch (Exception e)
    {
      throw new Error(e);
    }
  }

  public static int showResult(GraphQueryResult result, Repository repository)
    throws QueryEvaluationException
  {

    int count = 0;
    logger.debug("--- graph query result ---");
    while (result.hasNext())
    {
      Statement row = result.next();
      logger.debug(format("%s %s %s", shortUri(repository, row.getSubject()),
        shortUri(repository, row.getPredicate()),
        shortUri(repository, row.getObject())));
      ++count;
    }
    logger.debug("------- end graph --------");
    return count;
  }

  public static int showResult(TupleQueryResult result, Repository repository)
    throws QueryEvaluationException
  {
    int count = 0;
    logger.debug("--- tuple query result ---");
    while (result.hasNext())
    {
      StringBuffer buffer = new StringBuffer();
      BindingSet row = result.next();
      for (String col : result.getBindingNames())
        buffer.append(shortUri(repository, row.getBinding(col).getValue()) +
          "  ");
      logger.debug(buffer);
      ++count;
    }
    logger.debug("------- end tuple --------");
    return count;
  }

  public static void importFile(Repository repository, File file,
    RDFFormat format, Resource... contexts) throws RDFParseException,
    RepositoryException, IOException
  {
    repository.getConnection().add(file, null, format, contexts);
  }

  public static void importFile(Repository repository, File file,
    RDFFormat format) throws RDFParseException, RepositoryException,
    IOException
  {
    repository.getConnection().add(file, null, format);
  }

  public static void exportRepository(Repository repository, File file,
    RDFFormat format) throws RepositoryException, MalformedQueryException,
    QueryEvaluationException, RDFHandlerException,
    UnsupportedRDFormatException, IOException
  {
    exportResults(
      repository,
      repository.getConnection().prepareGraphQuery(QueryLanguage.SPARQL,
        EXPORT_QUERY), new FileWriter(file), format);
  }

  public static String exportRepository(Repository repository,
    RDFFormat format) throws RepositoryException, RDFHandlerException,
    QueryEvaluationException, MalformedQueryException
  {
    StringWriter writer = new StringWriter();
    exportResults(
      repository,
      repository.getConnection().prepareGraphQuery(QueryLanguage.SPARQL,
        EXPORT_QUERY), writer, format);

    return writer.getBuffer().toString();
  }
  
  public static void exportResults(Repository repository, GraphQuery query,
    Writer outputWriter, RDFFormat format) throws RepositoryException,
    RDFHandlerException, QueryEvaluationException
  {
    RDFWriter writer = Rio.createWriter(format, outputWriter);
    RepositoryResult<Namespace> prefixes =
      repository.getConnection().getNamespaces();

    while (prefixes.hasNext())
    {
      Namespace prefix = prefixes.next();
      writer.handleNamespace(prefix.getPrefix(), prefix.getName());
    }

    query.evaluate(writer);
  }

  public static long getTripleCount(Repository repository)
    throws QueryEvaluationException
  {
    long count = Long.MIN_VALUE;
    TupleQueryResult countResult =
      performTupleQuery(repository, COUNT_QUERY, QueryLanguage.SPARQL);
    BindingSet result = countResult.next();
    count = ((Literal)result.getValue("count")).longValue();
    return count;
  }
}