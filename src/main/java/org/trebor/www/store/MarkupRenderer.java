package org.trebor.www.store;

import info.bliki.wiki.model.Configuration;
import info.bliki.wiki.model.WikiModel;

public class MarkupRenderer extends WikiModel
{
  public static final String BASE = "/trebor/";
  public static final String IMAGE_BASE = BASE + "static/assets/images/";
  public static final String PAGE_BASE = BASE + "static/treemenu.html?page=";
  private static Configuration mConfiguration = new Configuration()
  {
    {
      addInterwikiLink("wikipedia", "http://wikipedia.org/wiki/${title}");
      addInterwikiLink("youtube", "http://www.youtube.com/watch?v=${title}");
    }
  };

  public MarkupRenderer()
  {
    super(mConfiguration, IMAGE_BASE + "${image}", PAGE_BASE + "${title}");
  }
}
