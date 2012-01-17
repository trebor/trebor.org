package org.trebor.www.store;

import java.io.IOException;
import java.util.List;

import info.bliki.wiki.model.Configuration;
import info.bliki.wiki.model.IWikiModel;
import info.bliki.wiki.model.WikiModel;
import info.bliki.wiki.template.ITemplateFunction;

public class MarkupRenderer extends WikiModel
{
  public static final String STATIC_BASE = "/static/";
  public static final String IMAGE_BASE = STATIC_BASE + "assets/images/";
  public static final String PAGE_BASE = STATIC_BASE + "fdlmenu.html?page=";
  public static final String MAP_BASE = STATIC_BASE + "sitemap.html?page=";

  private static final ITemplateFunction RESUME_TEMPLATE = new ITemplateFunction()
  {
    public String getFunctionDoc()
    {
      return "title, dates, description";
    }

    public String parseFunction(List<String> parts, IWikiModel model,
      char[] src, int beginIndex, int endIndex) throws IOException
    {
      return 
        "{|\n" +
        "|-\n" +
        "! align=\"left\"  | <p>" + parts.get(0) + "</p>\n" +
        "! align=\"right\" | "    + parts.get(1) + "\n" +
        "|}\n" +
        "<small>" + parts.get(2).replace("\n", "") + "</small>";
    }
  };
  
  private static Configuration mConfiguration = new Configuration()
  {
    {
      addInterwikiLink("wikipedia", "http://wikipedia.org/wiki/${title}");
      addInterwikiLink("youtube", "http://www.youtube.com/watch?v=${title}");
      addInterwikiLink("sitemap", MAP_BASE + "${title}");
      addInterwikiLink("static", STATIC_BASE + "${title}");
      addTemplateFunction("resume", RESUME_TEMPLATE);
    }
  };


  
  public MarkupRenderer()
  {
    super(mConfiguration, IMAGE_BASE + "${image}", PAGE_BASE + "${title}");
  }
}
