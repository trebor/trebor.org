package org.trebor.www.util;

import java.io.File;
import java.util.Iterator;

import org.apache.commons.configuration.CompositeConfiguration;
import org.apache.commons.configuration.ConfigurationException;
import org.apache.commons.configuration.PropertiesConfiguration;
import org.apache.log4j.Logger;
import org.trebor.commons.Util;

import com.sun.jersey.spi.resource.Singleton;

@Singleton
public class TreborConfiguration extends CompositeConfiguration
{
  @SuppressWarnings("unused")
  private static final Logger log = Logger.getLogger(TreborConfiguration.class);

 // known configuration names
  
  public static final String RDF_REMOTE = "rdf.remote";
  public static final String RDF_REPOSITORY = "rdf.repository";
  public static final String RDF_HOST = "rdf.host";
  public static final String RDF_PORT = "rdf.port";
  public static final String RDF_DATAFILES = "rdf.datafiles";
  
  private static final String EXTERNAL_PROPERTIES = "/opt/trebor.org/trebor.properties";
  private static final String INTERNAL_PROPERTIES = "/trebor.properties";
  
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

    log.info("configuration:");
    @SuppressWarnings("unchecked")
    Iterator<String> keys = getKeys();
    while (keys.hasNext())
    {
        String key = keys.next();
        log.info(String.format("  %s: %s", key, getProperty(key)));
    }
  }
  
  private void appendProperties(String propertiesFileName) throws ConfigurationException
  {
    log.info("searching for properties file: " + propertiesFileName);
    File propertiesFile = Util.findResourceFile(propertiesFileName);
    
    if (propertiesFile != null && propertiesFile.exists())
    {
      log.info("  found: " + propertiesFile);
      addConfiguration(new PropertiesConfiguration(propertiesFile));
    }
    else
      log.info("  not found: " + propertiesFileName);
  }
}
