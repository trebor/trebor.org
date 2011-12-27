package org.trebor.www.resource;

import java.io.IOException;

import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
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
  private TreborService mTreborService;

  public TreborResource()
  {
  }

  @GET
  @Produces(
  {
    "application/json", "application/xml"
  })
  @Path("summary")
  public Response summary()
  {
    return Response.ok(mTreborService.getSummary()).build();
  }

  @GET
  @Path("mim")
  @Produces("application/json")
  public Response mim(
    @DefaultValue("http://sunshine.com/dysmorph/ShortAbductedThumbs") @QueryParam("uri") String uri)
    throws RepositoryException, MalformedQueryException,
    QueryEvaluationException, IOException
  {
    log.debug("mim: " + uri);
    return Response.ok(mTreborService.browseUri("<" + uri + ">")).build();
  }

  @GET
  @Path("thumbs")
  @Produces("application/json")
  public Response thumbs() throws RepositoryException,
    MalformedQueryException, QueryEvaluationException, IOException
  {
    log.debug("thumbs");
    return Response.ok(
      mTreborService
        .browseUri("<http://sunshine.com/dysmorph/ShortAbductedThumbs>"))
      .build();
  }

  @GET
  @Produces("application/json")
  @Path("tree/{path}")
  public Response treeMenu(@PathParam("path") String path)
  {
    log.debug("tree/" + path);
    return Response.ok(mTreborService.getTree(path)).build();
  }

  public void setTreborService(TreborService treborService)
  {
    mTreborService = treborService;
  }
}
