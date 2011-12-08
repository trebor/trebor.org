package org.trebor.www.dto;

import java.util.List;

import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAccessType;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlElementWrapper;
import javax.xml.bind.annotation.XmlRootElement;

@XmlRootElement()
@XmlAccessorType(XmlAccessType.FIELD)
public class InteractionSummaryTable {
  
  @XmlElementWrapper(name="interactions")  
  @XmlElement(name="interaction")  
  private List<InteractionSummary> mInteractions;

  public void setInteractions(List<InteractionSummary> interactions) {
    mInteractions = interactions;
  }

  public List<InteractionSummary> getInteractions() {
    return mInteractions;
  }
}
