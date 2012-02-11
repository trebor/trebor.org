package org.trebor.www.resource;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
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
    String address = hsr.getRemoteAddr() + (hsr.getRemoteAddr().equals(hsr.getRemoteHost()) ? "" : " (" + hsr.getRemoteHost() + ")");
    log.debug(String.format("%s requested: %s", address, page));
    return Response.ok(mTreborService.getMenuNode(page)).build();
  }
}
