package org.trebor.data;

import java.util.logging.ConsoleHandler;
import java.util.logging.Handler;
import java.util.logging.Logger;

public class LoggerTrap
{
  public LoggerTrap()
  {
    Handler handler = 
      new ConsoleHandler()
    {
      {
        setOutputStream(System.out);
      }
    };

    Logger.getLogger("").addHandler(handler);
  }
}
