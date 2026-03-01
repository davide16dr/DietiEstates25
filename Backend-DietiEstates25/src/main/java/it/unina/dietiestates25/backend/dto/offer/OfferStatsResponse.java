package it.unina.dietiestates25.backend.dto.offer;

public class OfferStatsResponse {
    private long total;
    private long pending;
    private long accepted;
    private long rejected;
    private long counteroffers;

    public OfferStatsResponse() {}

    public OfferStatsResponse(long total, long pending, long accepted, long rejected, long counteroffers) {
        this.total = total;
        this.pending = pending;
        this.accepted = accepted;
        this.rejected = rejected;
        this.counteroffers = counteroffers;
    }

    public long getTotal() { return total; }
    public void setTotal(long total) { this.total = total; }

    public long getPending() { return pending; }
    public void setPending(long pending) { this.pending = pending; }

    public long getAccepted() { return accepted; }
    public void setAccepted(long accepted) { this.accepted = accepted; }

    public long getRejected() { return rejected; }
    public void setRejected(long rejected) { this.rejected = rejected; }

    public long getCounteroffers() { return counteroffers; }
    public void setCounteroffers(long counteroffers) { this.counteroffers = counteroffers; }
}
