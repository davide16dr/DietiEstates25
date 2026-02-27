package it.unina.dietiestates25.backend.services;

import it.unina.dietiestates25.backend.dto.savedsearch.SavedSearchRequest;
import it.unina.dietiestates25.backend.dto.savedsearch.SavedSearchResponse;
import it.unina.dietiestates25.backend.entities.SavedSearch;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.repositories.SavedSearchRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SavedSearchService {

    @Autowired
    private SavedSearchRepository savedSearchRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Recupera tutte le ricerche salvate attive di un utente
     */
    public List<SavedSearchResponse> getAllSavedSearches(UUID userId) {
        System.out.println("🔍 [SavedSearchService] Recupero ricerche salvate per userId: " + userId);
        
        List<SavedSearch> searches = savedSearchRepository.findAllByClient_IdAndActiveTrue(userId);
        
        System.out.println("✅ [SavedSearchService] Trovate " + searches.size() + " ricerche salvate");
        
        return searches.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Crea una nuova ricerca salvata
     */
    @Transactional
    public SavedSearchResponse createSavedSearch(UUID userId, SavedSearchRequest request) {
        System.out.println("🔍 [SavedSearchService] Creazione nuova ricerca salvata per userId: " + userId);
        
        // Validazione
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new RuntimeException("Il nome della ricerca è obbligatorio");
        }
        
        if (request.getFilters() == null || request.getFilters().isEmpty()) {
            throw new RuntimeException("I filtri sono obbligatori");
        }
        
        // Recupera l'utente
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utente non trovato"));
        
        // Crea la nuova ricerca salvata
        SavedSearch savedSearch = new SavedSearch();
        savedSearch.setClient(user);
        savedSearch.setName(request.getName());
        savedSearch.setFilters(request.getFilters());
        savedSearch.setActive(true);
        
        SavedSearch saved = savedSearchRepository.save(savedSearch);
        
        System.out.println("✅ [SavedSearchService] Ricerca salvata creata con ID: " + saved.getId());
        
        return convertToResponse(saved);
    }

    /**
     * Aggiorna una ricerca salvata esistente
     */
    @Transactional
    public SavedSearchResponse updateSavedSearch(UUID userId, UUID searchId, SavedSearchRequest request) {
        System.out.println("🔍 [SavedSearchService] Aggiornamento ricerca salvata ID: " + searchId);
        
        SavedSearch savedSearch = savedSearchRepository.findById(searchId)
                .orElseThrow(() -> new RuntimeException("Ricerca salvata non trovata"));
        
        // Verifica che la ricerca appartenga all'utente
        if (!savedSearch.getClient().getId().equals(userId)) {
            throw new RuntimeException("Non sei autorizzato a modificare questa ricerca");
        }
        
        // Aggiorna i campi
        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            savedSearch.setName(request.getName());
        }
        
        if (request.getFilters() != null && !request.getFilters().isEmpty()) {
            savedSearch.setFilters(request.getFilters());
        }
        
        SavedSearch updated = savedSearchRepository.save(savedSearch);
        
        System.out.println("✅ [SavedSearchService] Ricerca salvata aggiornata con successo");
        
        return convertToResponse(updated);
    }

    /**
     * Elimina (soft delete) una ricerca salvata
     */
    @Transactional
    public void deleteSavedSearch(UUID userId, UUID searchId) {
        System.out.println("🔍 [SavedSearchService] Eliminazione ricerca salvata ID: " + searchId);
        
        SavedSearch savedSearch = savedSearchRepository.findById(searchId)
                .orElseThrow(() -> new RuntimeException("Ricerca salvata non trovata"));
        
        // Verifica che la ricerca appartenga all'utente
        if (!savedSearch.getClient().getId().equals(userId)) {
            throw new RuntimeException("Non sei autorizzato a eliminare questa ricerca");
        }
        
        // Soft delete
        savedSearch.setActive(false);
        savedSearchRepository.save(savedSearch);
        
        System.out.println("✅ [SavedSearchService] Ricerca salvata eliminata con successo");
    }

    /**
     * Recupera una singola ricerca salvata
     */
    public SavedSearchResponse getSavedSearchById(UUID userId, UUID searchId) {
        System.out.println("🔍 [SavedSearchService] Recupero ricerca salvata ID: " + searchId);
        
        SavedSearch savedSearch = savedSearchRepository.findById(searchId)
                .orElseThrow(() -> new RuntimeException("Ricerca salvata non trovata"));
        
        // Verifica che la ricerca appartenga all'utente
        if (!savedSearch.getClient().getId().equals(userId)) {
            throw new RuntimeException("Non sei autorizzato a visualizzare questa ricerca");
        }
        
        return convertToResponse(savedSearch);
    }

    /**
     * Converte un'entità SavedSearch in un DTO SavedSearchResponse
     */
    private SavedSearchResponse convertToResponse(SavedSearch savedSearch) {
        SavedSearchResponse response = new SavedSearchResponse();
        response.setId(savedSearch.getId());
        response.setName(savedSearch.getName());
        response.setFilters(savedSearch.getFilters());
        response.setActive(savedSearch.isActive());
        response.setCreatedAt(savedSearch.getCreatedAt());
        response.setUpdatedAt(savedSearch.getUpdatedAt());
        return response;
    }
}
