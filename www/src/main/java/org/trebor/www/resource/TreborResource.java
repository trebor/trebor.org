package org.trebor.www.resource;

import java.io.IOException;

import javax.annotation.PostConstruct;
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

import com.maxmind.geoip.Location;
import com.maxmind.geoip.LookupService;
import com.maxmind.geoip.regionName;
import com.sun.jersey.api.core.InjectParam;

@Path("/")
public class TreborResource
{
  @SuppressWarnings("unused")
  private Logger log = Logger.getLogger(getClass());

  @InjectParam
  private static TreborService mTreborService;

  private static LookupService mGeoLookup;

  @PostConstruct
  public void initialize() throws IOException
  {
    mGeoLookup = new LookupService("/usr/share/GeoIP/GeoLiteCity.dat",
      LookupService.GEOIP_MEMORY_CACHE );
  }
  
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
  
  @GET
  @Produces("text/csv")
  @Path("quake")
  public Response quake(@Context HttpServletRequest hsr,  @QueryParam("name") @DefaultValue("eqs7day-M2.5.txt")String name, @QueryParam("test") @DefaultValue("false")final boolean test) throws IOException  
  {
    log.debug(String.format("%s requested %s%s", remoteAddress(hsr), test ? "test " : "", name));
    return Response.ok(mTreborService.getQuakeData(name, test)).build();
  }
  
  @GET
//  @Produces(MediaType.TEXT_PLAIN)
  @Path("hit/{nodeName}")
  public Response hit(@Context HttpServletRequest hsr,  @PathParam("nodeName") String nodeName)
  {
    boolean registerHit = mTreborService.registerHit(nodeName);
    return Response.status(registerHit ? Status.OK : Status.BAD_REQUEST).build();
  }
  
  private static String remoteAddress(HttpServletRequest hsr)
  {
    Location location = mGeoLookup.getLocation(hsr.getRemoteHost());
    String detail =
      location == null
        ? ""
        : String.format(" %s, %s", location.city,
          regionName.regionNameByCode(location.countryCode, location.region));

    return String.format("[%s]%s", hsr.getRemoteAddr(), detail);
  }
}
