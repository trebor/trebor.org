package org.trebor.www.resource;

import java.net.URI;
import java.net.URISyntaxException;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.apache.log4j.Logger;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.repository.RepositoryException;
import org.openrdf.result.MultipleResultException;
import org.openrdf.result.NoResultException;
import org.trebor.www.service.TreborService;

import com.sun.jersey.api.core.InjectParam;

@Path("/")
public class TreborResource
{
  @SuppressWarnings("unused")
  private Logger log = Logger.getLogger(getClass());

  @InjectParam
  private TreborService mTreborService;

  @GET
  @Produces("application/json")
  @Path("tree/{path}")
  public Response treeMenu(@PathParam("path") String path) throws NoResultException, MultipleResultException, MalformedQueryException, RepositoryException, QueryEvaluationException
  {
    log.debug("tree/" + path);
    return Response.ok(mTreborService.getTreeNode(path)).build();
  }

  @GET
  @Produces(MediaType.TEXT_HTML)
  @Path("")
  public Response rootRedirect() throws URISyntaxException
  {
    URI foo = new URI("/static/treemenu.html?page=home");
   return Response.seeOther(foo).build();
  }
  
  
  public void setTreborService(TreborService treborService)
  {
    mTreborService = treborService;
  }
}
