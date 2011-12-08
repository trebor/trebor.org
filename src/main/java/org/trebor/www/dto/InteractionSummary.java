package org.trebor.www.dto;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlAccessorType;
import javax.xml.bind.annotation.XmlAccessType;

@XmlRootElement()
@XmlAccessorType(XmlAccessType.FIELD)
public class InteractionSummary {

  public InteractionSummary(String name, long principalId,
      long interactoinSeconds) {
    super();
    mName = name;
    mPrincipalId = principalId;
    mInteractionSeconds = interactoinSeconds;
  }

  public InteractionSummary()
  {
  }
  
  @XmlElement(name="name")
  private String mName;
  @XmlElement(name="principalId")
  private long mPrincipalId;
  @XmlElement(name="interactionSeconds")
  private long mInteractionSeconds;
  
  public void setName(String name) {
    mName = name;
  }

  public String getName() {
    return mName;
  }

  public void setPrincipalId(long principalId) {
    mPrincipalId = principalId;
  }

  public long getPrincipalId() {
    return mPrincipalId;
  }

  public void setInteractoinSeconds(long interactoinSeconds) {
    mInteractionSeconds = interactoinSeconds;
  }
  
  public long getInteractoinSeconds() {
    return mInteractionSeconds;
  }
  
  public boolean equals(Object obj) {
    if (this == obj)
      return true;
    if (obj == null)
      return false;
    if (getClass() != obj.getClass())
      return false;
    InteractionSummary other = (InteractionSummary)obj;
    if (mInteractionSeconds != other.mInteractionSeconds)
      return false;
    if (mName == null) {
      if (other.mName != null)
        return false;
    } else if (!mName.equals(other.mName))
      return false;
    if (mPrincipalId != other.mPrincipalId)
      return false;
    return true;
  }

  public String toString() {
    return "InteractionSummary [mName=" + mName + ", mPrincipalId="
        + mPrincipalId + ", mInteractoinSeconds=" + mInteractionSeconds + "]";
  }
}
