package org.trebor.www.resource;

import javax.servlet.http.HttpServletRequest;
import javax.xml.datatype.XMLGregorianCalendar;

import org.trebor.util.rdf.RdfUtil;

import com.maxmind.geoip.Location;
import com.maxmind.geoip.LookupService;

public class LogInstance
{
  // from request
  
  private String mRequestUrl;
  private String mRequestQuery;
  private String mRemoteIp;
  private String mRemoteHost;
  private XMLGregorianCalendar mTime;
  private String mLanguage;    
  
  // from geographic location
  
  private float mLatiutde;
  private float mLongitude;
  private int mMetoCode;
  private int mAreaCode;
  private String mCity;
  private String mCountryCode;
  private String mCountry;
  private String mRegion;
  
  public LogInstance(HttpServletRequest hsr, LookupService geoLookup)
  {
    // establish basics

    mRequestUrl = hsr.getRequestURL().toString();
    mRequestQuery = hsr.getQueryString();
    mRemoteIp = hsr.getRemoteAddr();
    mRemoteHost = hsr.getRemoteHost();
    mLanguage = hsr.getLocale().getDisplayLanguage();
    mTime = RdfUtil.millisecondsToXmlGregorianCalendar(hsr.getSession()
      .getLastAccessedTime());
    Location location = geoLookup.getLocation(mRemoteHost);
    if (null != location)
    {
      mLatiutde = location.latitude;
      mLongitude = location.longitude;
      mMetoCode = location.metro_code;
      mCity = location.city;
      mCountryCode = location.countryCode;
      mCountry = location.countryName;
      mRegion = location.region;
      mAreaCode = location.area_code;
    }
    else
    {
      mLatiutde = Float.NaN;
      mLongitude = Float.NaN;
      mMetoCode = 0;
      mCity = "?";
      mCountryCode = "?";
      mCountry = "?";
      mRegion = "?";
      mAreaCode = 0;
    }
  }

  public String toString()
  {
    return "Log [mRequestUrl=" + mRequestUrl + ", mRequestQuery=" +
      mRequestQuery + ", mRemoteIp=" + mRemoteIp + ", mRemoteHost=" +
      mRemoteHost + ", mTime=" + mTime + ", mLanguage=" + mLanguage +
      ", mLatiutde=" + mLatiutde + ", mLongitude=" + mLongitude +
      ", mMetoCode=" + mMetoCode + ", mAreaCode=" + mAreaCode + ", mCity=" +
      mCity + ", mCountryCode=" + mCountryCode + ", mCountry=" + mCountry +
      ", mRegion=" + mRegion + "]";
  }
}