package org.trebor.www.resource;

import java.io.IOException;

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
import javax.ws.rs.core.Response.Status;

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
    mTreborService.log(hsr);
    return Response.ok(mTreborService.getMenuNode(page)).build();
  }
  
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("rdf")
  public Response rdf(@Context HttpServletRequest hsr, @QueryParam("q")final String uri) 
      throws RepositoryException, MalformedQueryException, QueryEvaluationException 
  {
    mTreborService.log(hsr);
    return Response.ok(mTreborService.getRdf(uri)).build();
  }
  
  @GET
  @Produces(MediaType.APPLICATION_JSON)
  @Path("graph")
  public Response graph(@Context HttpServletRequest hsr, @QueryParam("q")final String uri, @DefaultValue("1") @QueryParam("depth")final int depth)  
      throws RepositoryException, MalformedQueryException, QueryEvaluationException 
  {
    mTreborService.log(hsr);
    return Response.ok(mTreborService.getRdfGraph(uri, depth)).build();
  }
  
  @GET
  @Produces("text/csv")
  @Path("quake")
  public Response quake(@Context HttpServletRequest hsr,  @QueryParam("name") @DefaultValue("eqs7day-M2.5.txt")String name, @QueryParam("test") @DefaultValue("false")final boolean test) throws IOException, RepositoryException  
  {
    mTreborService.log(hsr);
    return Response.ok(mTreborService.getQuakeData(name, test)).build();
  }
  
  @GET
  @Produces(MediaType.TEXT_PLAIN)
  @Path("hit/{nodeName}")
  public Response hit(@Context HttpServletRequest hsr,  @PathParam("nodeName") String nodeName) throws RepositoryException
  {
    mTreborService.log(hsr);
    Integer count = mTreborService.registerHit(nodeName);
    return (count != -1 ? Response.ok(count.toString()) : Response.status(Status.BAD_REQUEST)).build();
  }
}
