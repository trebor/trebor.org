package org.trebor.www.util;

import java.io.File;
import java.net.URL;
import java.util.Iterator;

import org.apache.commons.configuration.CompositeConfiguration;
import org.apache.commons.configuration.ConfigurationException;
import org.apache.commons.configuration.PropertiesConfiguration;
import org.apache.log4j.Logger;

import com.sun.jersey.spi.resource.Singleton;

@Singleton
public class TreborConfiguration extends CompositeConfiguration
{
  @SuppressWarnings("unused")
  private static final Logger log = Logger.getLogger(TreborConfiguration.class);

  private static final String EXTERNAL_PROPERTIES = "/opt/trebor.org/trebor.properties";
  private static final String INTERNAL_PROPERTIES = "/trebor.properties";
  public static final String RDF_REMOTE = "rdf.remote";
  public static final String RDF_REPOSITORY = "rdf.repository";
  public static final String RDF_HOST = "rdf.host";
  public static final String RDF_PORT = "rdf.port";

  public TreborConfiguration() throws ConfigurationException
  {
    // default properties
    
    setProperty(RDF_REMOTE, false);
    setProperty(RDF_HOST, "localhost");
    setProperty(RDF_PORT, 8080);
    setProperty(RDF_REPOSITORY, "trebor.org");

    // if external properties exist, add them in
    
    appendProperties(INTERNAL_PROPERTIES);
    appendProperties(EXTERNAL_PROPERTIES);
    
    // report used properties

    log.info("final configuration start");
    @SuppressWarnings("unchecked")
    Iterator<String> keys = getKeys();
    while (keys.hasNext())
    {
        String key = keys.next();
        log.info(String.format("  %s: %s", key, getProperty(key)));
    }
    log.info("final configuration end");
  }
  
  private void appendProperties(String propertiesFileName) throws ConfigurationException
  {
    URL resource = TreborConfiguration.class.getResource(propertiesFileName);
    String canonicalName = resource == null
      ? propertiesFileName
      : resource.toString().split(":")[1];
    
    File propertiesFile = new File(canonicalName);
    
    log.info("searching for properties file: " + propertiesFile);
    if (propertiesFile.exists())
    {
      log.info("  loading: " + propertiesFile);
      addConfiguration(new PropertiesConfiguration(propertiesFile));
    }
    else
      log.info("  not found: " + propertiesFile);
  }
}
