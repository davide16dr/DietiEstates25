package it.unina.dietiestates25.backend.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import it.unina.dietiestates25.backend.dto.savedsearch.SavedSearchRequest;
import it.unina.dietiestates25.backend.entities.SavedSearch;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.repositories.SavedSearchRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;

@ExtendWith(MockitoExtension.class)
class SavedSearchServiceUnitTest {

    @Mock
    SavedSearchRepository savedSearchRepository;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    SavedSearchService savedSearchService;

    @Test
    void updateSavedSearch_whenSearchMissing_throws() {
        UUID userId = UUID.randomUUID();
        UUID searchId = UUID.randomUUID();
        when(savedSearchRepository.findById(searchId)).thenReturn(Optional.empty());

        SavedSearchRequest req = new SavedSearchRequest();
        req.setName("Nuovo nome");
        req.setFilters(Map.of("city", "Napoli"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> savedSearchService.updateSavedSearch(userId, searchId, req));
        assertEquals("Ricerca salvata non trovata", ex.getMessage());
    }

    @Test
    void updateSavedSearch_whenUserNotOwner_throws() {
        UUID ownerId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        UUID searchId = UUID.randomUUID();

        User owner = new User();
        owner.setId(ownerId);

        SavedSearch savedSearch = new SavedSearch();
        savedSearch.setId(searchId);
        savedSearch.setClient(owner);
        savedSearch.setName("Vecchio nome");
        savedSearch.setFilters(Map.of("city", "Roma"));

        when(savedSearchRepository.findById(searchId)).thenReturn(Optional.of(savedSearch));

        SavedSearchRequest req = new SavedSearchRequest();
        req.setName("Nuovo nome");
        req.setFilters(Map.of("city", "Napoli"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> savedSearchService.updateSavedSearch(otherUserId, searchId, req));
        assertEquals("Non sei autorizzato a modificare questa ricerca", ex.getMessage());
    }

    static Stream<Arguments> updateSavedSearchUpdateCases() {
        return Stream.of(
                
                Arguments.of(
                        "   ",
                        Map.of(),
                        "Nome originale",
                        Map.of("city", "Roma")
                ),
                
                Arguments.of(
                        "Nuovo nome",
                        Map.of("city", "Napoli", "minPrice", 100000),
                        "Nuovo nome",
                        Map.of("city", "Napoli", "minPrice", 100000)
                ),
                
                Arguments.of(
                        "Solo nome",
                        Map.of(),
                        "Solo nome",
                        Map.of("city", "Roma")
                ),
                
                Arguments.of(
                        "   ",
                        Map.of("city", "Milano"),
                        "Nome originale",
                        Map.of("city", "Milano")
                )
        );
    }

    @ParameterizedTest
    @MethodSource("updateSavedSearchUpdateCases")
    void updateSavedSearch_updatesFieldsConditionally(
            String requestName,
            Map<String, Object> requestFilters,
            String expectedName,
            Map<String, Object> expectedFilters
    ) {
        UUID userId = UUID.randomUUID();
        UUID searchId = UUID.randomUUID();

        User u = new User();
        u.setId(userId);

        SavedSearch savedSearch = new SavedSearch();
        savedSearch.setId(searchId);
        savedSearch.setClient(u);
        savedSearch.setName("Nome originale");
        savedSearch.setFilters(Map.of("city", "Roma"));

        when(savedSearchRepository.findById(searchId)).thenReturn(Optional.of(savedSearch));
        when(savedSearchRepository.save(any(SavedSearch.class))).thenAnswer(inv -> inv.getArgument(0));

        SavedSearchRequest req = new SavedSearchRequest();
        req.setName(requestName);
        req.setFilters(requestFilters);

        savedSearchService.updateSavedSearch(userId, searchId, req);

        ArgumentCaptor<SavedSearch> captor = ArgumentCaptor.forClass(SavedSearch.class);
        verify(savedSearchRepository).save(captor.capture());

        SavedSearch toSave = captor.getValue();
        assertEquals(expectedName, toSave.getName());
        assertEquals(expectedFilters, toSave.getFilters());
    }
}
