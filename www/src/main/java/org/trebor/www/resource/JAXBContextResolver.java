package org.trebor.www.resource;

import javax.ws.rs.ext.ContextResolver;
import javax.ws.rs.ext.Provider;
import javax.xml.bind.JAXBContext;

import org.trebor.www.dto.ForceNetwork;
import org.trebor.www.dto.MenuTreeNode;
import org.trebor.www.dto.RdfValue;

import com.sun.jersey.api.json.JSONConfiguration;
import com.sun.jersey.api.json.JSONJAXBContext;

@Provider
public class JAXBContextResolver implements ContextResolver<JAXBContext> {
    private JAXBContext context;
    private Class<?>[] types = { ForceNetwork.class, MenuTreeNode.class, RdfValue.class};

  public JAXBContextResolver() throws Exception
  {
    JSONConfiguration config =
      JSONConfiguration.mapped().arrays("children").nonStrings("size", "source", "target").build();
    context = new JSONJAXBContext(config, types);
  } 

  public JAXBContext getContext(Class<?> objectType)
  {
    for (Class<?> type : types)
      if (type == objectType)
        return context;

    return null;
  }
}