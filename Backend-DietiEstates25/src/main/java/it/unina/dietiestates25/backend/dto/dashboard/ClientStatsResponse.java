package it.unina.dietiestates25.backend.dto.dashboard;

public class ClientStatsResponse {
    private int pendingVisits;
    private int completedVisits;
    private int totalVisits;

    public ClientStatsResponse() {}

    public ClientStatsResponse(int pendingVisits, int completedVisits, int totalVisits) {
        this.pendingVisits = pendingVisits;
        this.completedVisits = completedVisits;
        this.totalVisits = totalVisits;
    }

    public int getPendingVisits() { return pendingVisits; }
    public void setPendingVisits(int pendingVisits) { this.pendingVisits = pendingVisits; }

    public int getCompletedVisits() { return completedVisits; }
    public void setCompletedVisits(int completedVisits) { this.completedVisits = completedVisits; }

    public int getTotalVisits() { return totalVisits; }
    public void setTotalVisits(int totalVisits) { this.totalVisits = totalVisits; }
}
