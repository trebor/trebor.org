package org.trebor.data.dto;

import static org.trebor.commons.RdfNames.*;

import javax.servlet.http.HttpServletRequest;
import javax.xml.datatype.XMLGregorianCalendar;

import org.openrdf.annotations.Iri;
import org.trebor.util.rdf.RdfUtil;

import com.maxmind.geoip.Location;
import com.maxmind.geoip.LookupService;

@Iri(LOG_EVENT)
public class LogEvent
{
  // from request
  
  @Iri(HAS_URL)
  private String mRequestUrl;
  @Iri(HAS_URL_QUERY)
  private String mRequestQuery;
  @Iri(HAS_REMOTE_IP)
  private String mRemoteIp;
  @Iri(HAS_REMOTE_HOST)
  private String mRemoteHost;
  @Iri(HAS_EVENT_TIME)
  private XMLGregorianCalendar mTime;
  @Iri(HAS_LANGUAGE)
  private String mLanguage;    
  @Iri(HAS_REFERRER)
  private String mReferrer;
  
  // from geographic lookup
  
  @Iri(HAS_LATITUDE)
  private float mLatiutde;
  @Iri(HAS_LONGITUDE)
  private float mLongitude;
  @Iri(HAS_METRO_CODE)
  private int mMetoCode;
  @Iri(HAS_AREA_CODE)
  private int mAreaCode;
  @Iri(HAS_CITY)
  private String mCity;
  @Iri(HAS_COUNTRY_CODE)
  private String mCountryCode;
  @Iri(HAS_COUNTRY)
  private String mCountry;
  @Iri(HAS_REGION)
  private String mRegion;
  
  public LogEvent(HttpServletRequest hsr, LookupService geoLookup)
  {
    // establish basics

    mRequestUrl = hsr.getRequestURL().toString();
    mRequestQuery = hsr.getQueryString();
    mRemoteIp = hsr.getRemoteAddr();
    mRemoteHost = hsr.getRemoteHost();
    mLanguage = hsr.getLocale().getDisplayLanguage();
    mReferrer = hsr.getHeader("referer");     
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

  public LogEvent()
  {
  }
  
  public String getRequestUrl()
  {
    return mRequestUrl;
  }

  public void setRequestUrl(String requestUrl)
  {
    mRequestUrl = requestUrl;
  }

  public String getRequestQuery()
  {
    return mRequestQuery;
  }

  public void setRequestQuery(String requestQuery)
  {
    mRequestQuery = requestQuery;
  }

  public String getRemoteIp()
  {
    return mRemoteIp;
  }

  public void setRemoteIp(String remoteIp)
  {
    mRemoteIp = remoteIp;
  }

  public String getRemoteHost()
  {
    return mRemoteHost;
  }

  public void setRemoteHost(String remoteHost)
  {
    mRemoteHost = remoteHost;
  }

  public XMLGregorianCalendar getTime()
  {
    return mTime;
  }

  public void setTime(XMLGregorianCalendar time)
  {
    mTime = time;
  }

  public String getLanguage()
  {
    return mLanguage;
  }

  public void setLanguage(String language)
  {
    mLanguage = language;
  }

  public String getReferrer()
  {
    return mReferrer;
  }

  public void setReferrer(String referrer)
  {
    mReferrer = referrer;
  }

  public float getLatiutde()
  {
    return mLatiutde;
  }

  public void setLatiutde(float latiutde)
  {
    mLatiutde = latiutde;
  }

  public float getLongitude()
  {
    return mLongitude;
  }

  public void setLongitude(float longitude)
  {
    mLongitude = longitude;
  }

  public int getMetoCode()
  {
    return mMetoCode;
  }

  public void setMetoCode(int metoCode)
  {
    mMetoCode = metoCode;
  }

  public int getAreaCode()
  {
    return mAreaCode;
  }

  public void setAreaCode(int areaCode)
  {
    mAreaCode = areaCode;
  }

  public String getCity()
  {
    return mCity;
  }

  public void setCity(String city)
  {
    mCity = city;
  }

  public String getCountryCode()
  {
    return mCountryCode;
  }

  public void setCountryCode(String countryCode)
  {
    mCountryCode = countryCode;
  }

  public String getCountry()
  {
    return mCountry;
  }

  public void setCountry(String country)
  {
    mCountry = country;
  }

  public String getRegion()
  {
    return mRegion;
  }

  public void setRegion(String region)
  {
    mRegion = region;
  }

  public String toString()
  {
    return "LogEvent [mRequestUrl=" + mRequestUrl + ", mRequestQuery=" +
      mRequestQuery + ", mRemoteIp=" + mRemoteIp + ", mRemoteHost=" +
      mRemoteHost + ", mTime=" + mTime + ", mLanguage=" + mLanguage +
      ", mReferrer=" + mReferrer + ", mLatiutde=" + mLatiutde +
      ", mLongitude=" + mLongitude + ", mMetoCode=" + mMetoCode +
      ", mAreaCode=" + mAreaCode + ", mCity=" + mCity + ", mCountryCode=" +
      mCountryCode + ", mCountry=" + mCountry + ", mRegion=" + mRegion + "]";
  }
}