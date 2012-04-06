package org.trebor.data;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.URL;

public class Util
{
  public static File findResourceFile(String resourcePath)
  {
    URL resourceUrl = Util.class.getResource(resourcePath);

    // if the resource exists in the jar, return that file

    if (resourceUrl != null)
    {
      File file = new File(resourceUrl.toString().split(":")[1]);
      if (file.exists())
        return file;
    }

    // if the resource exists in the file system, return that file

    File file = new File(resourcePath);
    if (file.exists())
      return file;

    // no file found, return null

    return null;
  }
  
  
  public static String readResourceAsString(String resourcePath)
    throws IOException
  {
    // find resource file
    
    File resourceFile = findResourceFile(resourcePath);
    
    // if not found no luck, return null
    
    if (resourceFile == null)
      return null;
    
    // make a buffer to put the stream in
    
    byte[] buffer = new byte[(int)resourceFile.length()];
    BufferedInputStream f = null;

    try
    {
      f = new BufferedInputStream(new FileInputStream(resourceFile));
      f.read(buffer);
    }
    finally
    {
      if (f != null)
        f.close();
    }

    return new String(buffer);
  }
}
