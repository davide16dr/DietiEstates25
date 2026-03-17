package it.unina.dietiestates25.backend.dto.savedsearch;

import java.util.Map;

public class SavedSearchRequest {
    private String name;
    private Map<String, Object> filters;

    public SavedSearchRequest() {
        // Required by Jackson for request deserialization.
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Map<String, Object> getFilters() { return filters; }
    public void setFilters(Map<String, Object> filters) { this.filters = filters; }
}
