package org.trebor.www.util;

import java.io.File;

import org.apache.commons.configuration.CompositeConfiguration;
import org.apache.commons.configuration.ConfigurationException;
import org.apache.commons.configuration.PropertiesConfiguration;

import com.sun.jersey.spi.resource.Singleton;

@Singleton
public class TreborConfiguration extends CompositeConfiguration
{
  private static final String EXTERNAL_PROPERTIES = "/opt/trebor.org/trebor.properties";
  public static final String RDF_REMOTE = "rdf.remote";
  public static final String RDF_REPOSITORY = "rdf.repository";
  public static final String RDF_HOST = "rdf.host";
  public static final String RDF_PORT = "rdf.port";

  public TreborConfiguration() throws ConfigurationException
  {
    setProperty(RDF_REMOTE, false);
    setProperty(RDF_HOST, "localhost");
    setProperty(RDF_PORT, 8080);
    setProperty(RDF_REPOSITORY, "trebor.org");
    
    // if external properties exist, add them in
    
    File externalProperties = new File(EXTERNAL_PROPERTIES);
    if (externalProperties.exists())
      addConfiguration(new PropertiesConfiguration(externalProperties));
  }
}
