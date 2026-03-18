package it.unina.dietiestates25.backend.controllers;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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
public class SavedSearchController {

    private static final Logger log = LoggerFactory.getLogger(SavedSearchController.class);

    private static final String KEY_ERROR = "error";
    private static final String KEY_MESSAGE = "message";
    private static final String MSG_USER_NOT_FOUND = "Utente non trovato";
    private static final String MSG_INTERNAL_ERROR = "Errore interno del server";
    private static final String MSG_SAVED_SEARCH_DELETED = "Ricerca eliminata con successo";
    private static final String LOG_ERROR_PREFIX = "❌ [SavedSearchController] Errore: ";
    private static final String LOG_INTERNAL_ERROR_PREFIX = "❌ [SavedSearchController] Errore interno: ";

    @Autowired
    private SavedSearchService savedSearchService;

    @Autowired
    private UserRepository userRepository;

    



    @GetMapping
    public ResponseEntity<List<SavedSearchResponse>> getAllSavedSearches(Authentication authentication) {
        log.info("📥 [SavedSearchController] GET /api/saved-searches");
        
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException(MSG_USER_NOT_FOUND));
            UUID userId = user.getId();
            
            List<SavedSearchResponse> searches = savedSearchService.getAllSavedSearches(userId);
            
            log.info("✅ [SavedSearchController] Restituite {} ricerche salvate", searches.size());
            return ResponseEntity.ok(searches);
            
        } catch (Exception e) {
            log.error(LOG_ERROR_PREFIX + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    



    @GetMapping("/{id}")
    public ResponseEntity<?> getSavedSearchById(
            @PathVariable UUID id,
            Authentication authentication) {
        
        log.info("📥 [SavedSearchController] GET /api/saved-searches/{}", id);
        
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException(MSG_USER_NOT_FOUND));
            UUID userId = user.getId();
            
            SavedSearchResponse search = savedSearchService.getSavedSearchById(userId, id);
            
            log.info("✅ [SavedSearchController] Ricerca salvata trovata");
            return ResponseEntity.ok(search);
            
        } catch (RuntimeException e) {
                log.warn(LOG_ERROR_PREFIX + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of(KEY_ERROR, e.getMessage()));
                    
        } catch (Exception e) {
                log.error(LOG_INTERNAL_ERROR_PREFIX + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(KEY_ERROR, MSG_INTERNAL_ERROR));
        }
    }

    



    @PostMapping
    public ResponseEntity<?> createSavedSearch(
            @RequestBody SavedSearchRequest request,
            Authentication authentication) {
        
        log.info("📥 [SavedSearchController] POST /api/saved-searches");
        log.info("📝 Nome: {}", request.getName());
        log.info("📝 Filtri: {}", request.getFilters());
        
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException(MSG_USER_NOT_FOUND));
            UUID userId = user.getId();
            
            SavedSearchResponse created = savedSearchService.createSavedSearch(userId, request);
            
            log.info("✅ [SavedSearchController] Ricerca salvata creata con ID: {}", created.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
            
        } catch (RuntimeException e) {
                log.warn(LOG_ERROR_PREFIX + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(KEY_ERROR, e.getMessage()));
                    
        } catch (Exception e) {
                log.error(LOG_INTERNAL_ERROR_PREFIX + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(KEY_ERROR, MSG_INTERNAL_ERROR));
        }
    }

    



    @PutMapping("/{id}")
    public ResponseEntity<?> updateSavedSearch(
            @PathVariable UUID id,
            @RequestBody SavedSearchRequest request,
            Authentication authentication) {
        
        log.info("📥 [SavedSearchController] PUT /api/saved-searches/{}", id);
        
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException(MSG_USER_NOT_FOUND));
            UUID userId = user.getId();
            
            SavedSearchResponse updated = savedSearchService.updateSavedSearch(userId, id, request);
            
            log.info("✅ [SavedSearchController] Ricerca salvata aggiornata");
            return ResponseEntity.ok(updated);
            
        } catch (RuntimeException e) {
                log.warn(LOG_ERROR_PREFIX + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(KEY_ERROR, e.getMessage()));
                    
        } catch (Exception e) {
                log.error(LOG_INTERNAL_ERROR_PREFIX + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(KEY_ERROR, MSG_INTERNAL_ERROR));
        }
    }

    



    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSavedSearch(
            @PathVariable UUID id,
            Authentication authentication) {
        
        log.info("📥 [SavedSearchController] DELETE /api/saved-searches/{}", id);
        
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException(MSG_USER_NOT_FOUND));
            UUID userId = user.getId();
            
            savedSearchService.deleteSavedSearch(userId, id);
            
            log.info("✅ [SavedSearchController] Ricerca salvata eliminata");
            return ResponseEntity.ok(Map.of(KEY_MESSAGE, MSG_SAVED_SEARCH_DELETED));
            
        } catch (RuntimeException e) {
                log.warn(LOG_ERROR_PREFIX + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(KEY_ERROR, e.getMessage()));
                    
        } catch (Exception e) {
                log.error(LOG_INTERNAL_ERROR_PREFIX + e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(KEY_ERROR, MSG_INTERNAL_ERROR));
        }
    }
}
