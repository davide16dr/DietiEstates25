package it.unina.dietiestates25.backend.dto;

public class NotificationPreferencesDTO {
    private boolean emailEnabled;
    private boolean inappEnabled;
    private boolean notifyNewMatching;
    private boolean notifyPriceChange;
    private boolean notifyListingUpdates;
    private boolean notifyVisitUpdates;
    private boolean notifyOfferUpdates;

    public NotificationPreferencesDTO() {}

    // Getters and Setters
    public boolean isEmailEnabled() { return emailEnabled; }
    public void setEmailEnabled(boolean emailEnabled) { this.emailEnabled = emailEnabled; }

    public boolean isInappEnabled() { return inappEnabled; }
    public void setInappEnabled(boolean inappEnabled) { this.inappEnabled = inappEnabled; }

    public boolean isNotifyNewMatching() { return notifyNewMatching; }
    public void setNotifyNewMatching(boolean notifyNewMatching) { this.notifyNewMatching = notifyNewMatching; }

    public boolean isNotifyPriceChange() { return notifyPriceChange; }
    public void setNotifyPriceChange(boolean notifyPriceChange) { this.notifyPriceChange = notifyPriceChange; }

    public boolean isNotifyListingUpdates() { return notifyListingUpdates; }
    public void setNotifyListingUpdates(boolean notifyListingUpdates) { this.notifyListingUpdates = notifyListingUpdates; }

    public boolean isNotifyVisitUpdates() { return notifyVisitUpdates; }
    public void setNotifyVisitUpdates(boolean notifyVisitUpdates) { this.notifyVisitUpdates = notifyVisitUpdates; }

    public boolean isNotifyOfferUpdates() { return notifyOfferUpdates; }
    public void setNotifyOfferUpdates(boolean notifyOfferUpdates) { this.notifyOfferUpdates = notifyOfferUpdates; }
}
