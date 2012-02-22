package org.trebor.www.resource;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.repository.RepositoryException;
import org.trebor.www.service.TreborService;

import com.sun.jersey.api.core.InjectParam;

@Path("/")
public class TreborResource
{
  @SuppressWarnings("unused")
  private Logger log = Logger.getLogger(getClass());

  @InjectParam
  private static TreborService mTreborService;

  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("menu/{page}")
  public Response treeMenu(@Context HttpServletRequest hsr, @PathParam("page") String page) throws RepositoryException, MalformedQueryException, QueryEvaluationException 
  {
    log.debug(String.format("%s requested: %s", remoteAddress(hsr), page));
    return Response.ok(mTreborService.getMenuNode(page)).build();
  }
  
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("rdf")
  public Response rdf(@Context HttpServletRequest hsr, @QueryParam("q")final String uri) 
      throws RepositoryException, MalformedQueryException, QueryEvaluationException 
  {
    log.debug(String.format("%s requested: %s", remoteAddress(hsr), uri));
    return Response.ok(mTreborService.getRdf(uri)).build();
  }
  
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("graph")
  public Response graph(@Context HttpServletRequest hsr, @QueryParam("q")final String uri, @DefaultValue("1") @QueryParam("depth")final int depth)  
      throws RepositoryException, MalformedQueryException, QueryEvaluationException 
  {
    log.debug(String.format("%s requested: %s at depth %d", remoteAddress(hsr), uri, depth));
    return Response.ok(mTreborService.getRdfGraph(uri, depth)).build();
  }
  
  private static String remoteAddress(HttpServletRequest hsr)
  {
    return hsr.getRemoteAddr() + (hsr.getRemoteAddr().equals(hsr.getRemoteHost()) 
       ? ""
       : " (" + hsr.getRemoteHost() + ")");
  }
}
