package it.unina.dietiestates25.backend.dto.dashboard;

import java.util.List;
import java.util.Map;

public class AdminStatsResponse {
    private Map<String, Integer> gestori;
    private Map<String, Integer> agenti;
    private AgencyInfo agencyInfo;
    private List<RecentUser> recentManagers;
    private List<RecentUser> recentAgents;

    public static class AgencyInfo {
        private String name;
        private String city;
        private String address;
        private String status;

        public AgencyInfo(String name, String city, String address, String status) {
            this.name = name;
            this.city = city;
            this.address = address;
            this.status = status;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public static class RecentUser {
        private String id;
        private String name;
        private String email;
        private String status;

        public RecentUser(String id, String name, String email, String status) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.status = status;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    public AdminStatsResponse() {}

    public Map<String, Integer> getGestori() { return gestori; }
    public void setGestori(Map<String, Integer> gestori) { this.gestori = gestori; }

    public Map<String, Integer> getAgenti() { return agenti; }
    public void setAgenti(Map<String, Integer> agenti) { this.agenti = agenti; }

    public AgencyInfo getAgencyInfo() { return agencyInfo; }
    public void setAgencyInfo(AgencyInfo agencyInfo) { this.agencyInfo = agencyInfo; }

    public List<RecentUser> getRecentManagers() { return recentManagers; }
    public void setRecentManagers(List<RecentUser> recentManagers) { this.recentManagers = recentManagers; }

    public List<RecentUser> getRecentAgents() { return recentAgents; }
    public void setRecentAgents(List<RecentUser> recentAgents) { this.recentAgents = recentAgents; }
}
