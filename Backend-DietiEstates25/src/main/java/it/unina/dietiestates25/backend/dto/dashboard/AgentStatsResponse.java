package it.unina.dietiestates25.backend.dto.dashboard;

public class AgentStatsResponse {
    private int totalProperties;
    private int pendingVisits;
    private int todayVisits;
    private int completedVisits;
    private int pendingOffers;

    public AgentStatsResponse() {}

    public AgentStatsResponse(int totalProperties, int pendingVisits, int todayVisits, int completedVisits, int pendingOffers) {
        this.totalProperties = totalProperties;
        this.pendingVisits = pendingVisits;
        this.todayVisits = todayVisits;
        this.completedVisits = completedVisits;
        this.pendingOffers = pendingOffers;
    }

    public int getTotalProperties() { return totalProperties; }
    public void setTotalProperties(int totalProperties) { this.totalProperties = totalProperties; }

    public int getPendingVisits() { return pendingVisits; }
    public void setPendingVisits(int pendingVisits) { this.pendingVisits = pendingVisits; }

    public int getTodayVisits() { return todayVisits; }
    public void setTodayVisits(int todayVisits) { this.todayVisits = todayVisits; }

    public int getCompletedVisits() { return completedVisits; }
    public void setCompletedVisits(int completedVisits) { this.completedVisits = completedVisits; }

    public int getPendingOffers() { return pendingOffers; }
    public void setPendingOffers(int pendingOffers) { this.pendingOffers = pendingOffers; }
}
