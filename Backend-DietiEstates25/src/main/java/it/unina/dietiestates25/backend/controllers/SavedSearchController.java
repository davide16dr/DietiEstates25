package it.unina.dietiestates25.backend.controllers;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.savedsearch.SavedSearchRequest;
import it.unina.dietiestates25.backend.dto.savedsearch.SavedSearchResponse;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.services.SavedSearchService;

@RestController
@RequestMapping("/api/saved-searches")
@CrossOrigin(origins = "http://localhost:4200", allowCredentials = "true")
public class SavedSearchController {

    @Autowired
    private SavedSearchService savedSearchService;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/saved-searches
     * Recupera tutte le ricerche salvate dell'utente autenticato
     */
    @GetMapping
    public ResponseEntity<List<SavedSearchResponse>> getAllSavedSearches(Authentication authentication) {
        System.out.println("📥 [SavedSearchController] GET /api/saved-searches");
        
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utente non trovato"));
            UUID userId = user.getId();
            
            List<SavedSearchResponse> searches = savedSearchService.getAllSavedSearches(userId);
            
            System.out.println("✅ [SavedSearchController] Restituite " + searches.size() + " ricerche salvate");
            return ResponseEntity.ok(searches);
            
        } catch (Exception e) {
            System.out.println("❌ [SavedSearchController] Errore: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /api/saved-searches/{id}
     * Recupera una singola ricerca salvata
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getSavedSearchById(
            @PathVariable UUID id,
            Authentication authentication) {
        
        System.out.println("📥 [SavedSearchController] GET /api/saved-searches/" + id);
        
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utente non trovato"));
            UUID userId = user.getId();
            
            SavedSearchResponse search = savedSearchService.getSavedSearchById(userId, id);
            
            System.out.println("✅ [SavedSearchController] Ricerca salvata trovata");
            return ResponseEntity.ok(search);
            
        } catch (RuntimeException e) {
            System.out.println("❌ [SavedSearchController] Errore: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
                    
        } catch (Exception e) {
            System.out.println("❌ [SavedSearchController] Errore interno: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Errore interno del server"));
        }
    }

    /**
     * POST /api/saved-searches
     * Crea una nuova ricerca salvata
     */
    @PostMapping
    public ResponseEntity<?> createSavedSearch(
            @RequestBody SavedSearchRequest request,
            Authentication authentication) {
        
        System.out.println("📥 [SavedSearchController] POST /api/saved-searches");
        System.out.println("📝 Nome: " + request.getName());
        System.out.println("📝 Filtri: " + request.getFilters());
        
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utente non trovato"));
            UUID userId = user.getId();
            
            SavedSearchResponse created = savedSearchService.createSavedSearch(userId, request);
            
            System.out.println("✅ [SavedSearchController] Ricerca salvata creata con ID: " + created.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
            
        } catch (RuntimeException e) {
            System.out.println("❌ [SavedSearchController] Errore: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
                    
        } catch (Exception e) {
            System.out.println("❌ [SavedSearchController] Errore interno: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Errore interno del server"));
        }
    }

    /**
     * PUT /api/saved-searches/{id}
     * Aggiorna una ricerca salvata esistente
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateSavedSearch(
            @PathVariable UUID id,
            @RequestBody SavedSearchRequest request,
            Authentication authentication) {
        
        System.out.println("📥 [SavedSearchController] PUT /api/saved-searches/" + id);
        
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utente non trovato"));
            UUID userId = user.getId();
            
            SavedSearchResponse updated = savedSearchService.updateSavedSearch(userId, id, request);
            
            System.out.println("✅ [SavedSearchController] Ricerca salvata aggiornata");
            return ResponseEntity.ok(updated);
            
        } catch (RuntimeException e) {
            System.out.println("❌ [SavedSearchController] Errore: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
                    
        } catch (Exception e) {
            System.out.println("❌ [SavedSearchController] Errore interno: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Errore interno del server"));
        }
    }

    /**
     * DELETE /api/saved-searches/{id}
     * Elimina una ricerca salvata (soft delete)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSavedSearch(
            @PathVariable UUID id,
            Authentication authentication) {
        
        System.out.println("📥 [SavedSearchController] DELETE /api/saved-searches/" + id);
        
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utente non trovato"));
            UUID userId = user.getId();
            
            savedSearchService.deleteSavedSearch(userId, id);
            
            System.out.println("✅ [SavedSearchController] Ricerca salvata eliminata");
            return ResponseEntity.ok(Map.of("message", "Ricerca eliminata con successo"));
            
        } catch (RuntimeException e) {
            System.out.println("❌ [SavedSearchController] Errore: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
                    
        } catch (Exception e) {
            System.out.println("❌ [SavedSearchController] Errore interno: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Errore interno del server"));
        }
    }
}
