package it.unina.dietiestates25.backend.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import it.unina.dietiestates25.backend.dto.ChangePasswordRequest;
import it.unina.dietiestates25.backend.entities.Agency;
import it.unina.dietiestates25.backend.entities.Listing;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.ListingStatus;
import it.unina.dietiestates25.backend.entities.enums.UserRole;
import it.unina.dietiestates25.backend.repositories.AgencyRepository;
import it.unina.dietiestates25.backend.repositories.ListingRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.services.EmailService;
import it.unina.dietiestates25.backend.services.UserService;
import it.unina.dietiestates25.backend.utils.PasswordGenerator;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    private static final String MSG_USER_NOT_FOUND = "Utente non trovato";
    private static final String LOG_ERROR_PREFIX = "❌ [UserController] Errore: ";
    private static final String KEY_FIRST_NAME = "firstName";
    private static final String KEY_LAST_NAME = "lastName";
    private static final String KEY_PHONE_E164 = "phoneE164";
    private static final String KEY_ACTIVE = "active";
    private static final String KEY_AGENT_NAME = "agentName";
    private static final String DEFAULT_AGENT_NAME = "N/A";

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ListingRepository listingRepository;

    @Autowired
    private AgencyRepository agencyRepository;

    @Autowired
    private EmailService emailService;

    @PutMapping("/{userId}/password")
    public ResponseEntity<?> changePassword(
            @PathVariable UUID userId,
            @RequestBody ChangePasswordRequest request) {
        try {
            log.info("📨 [UserController] Ricevuta richiesta cambio password");
            log.info("📋 [UserController] userId dal path: {}", userId);
            log.info("📋 [UserController] oldPassword presente: {}", request.getOldPassword() != null);
            log.info("📋 [UserController] newPassword presente: {}", request.getNewPassword() != null);
            
            userService.changePassword(userId, request);
            
            return ResponseEntity.ok().body("{\"message\": \"Password cambiata con successo\"}");
        } catch (RuntimeException e) {
            log.warn(LOG_ERROR_PREFIX + e.getMessage());
            return ResponseEntity.badRequest().body("{\"error\": \"" + e.getMessage() + "\"}");
        }
    }

    /**
     * Recupera tutti gli utenti di un'agenzia filtrati per ruolo
     */
    @GetMapping("/by-role/{role}")
    public ResponseEntity<List<User>> getUsersByRole(
            @PathVariable String role,
            Authentication authentication) {
        try {
            // Recupera l'utente loggato dall'authentication
            String email = authentication.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException(MSG_USER_NOT_FOUND));
            
            log.info("🔍 Recupero utenti con ruolo {} per utente: {}", role, email);
            log.info("📋 AgencyId utente corrente: {}", currentUser.getAgencyId());
            
            // Verifica che l'utente abbia un'agenzia associata
            if (currentUser.getAgencyId() == null) {
                log.error("❌ Errore: l'utente {} non ha un'agenzia associata!", email);
                return ResponseEntity.status(403)
                    .body(null); // Forbidden - l'utente deve avere un'agenzia
            }
            
            // Converte la stringa in enum UserRole
            UserRole userRole = UserRole.valueOf(role);
            
            // Filtra gli utenti per agenzia e ruolo
            List<User> users = userRepository.findByAgencyIdAndRole(currentUser.getAgencyId(), userRole);
            
            log.info("✅ Recuperati {} utenti con ruolo {} per agenzia {}", users.size(), role, currentUser.getAgencyId());
            
            return ResponseEntity.ok(users);
        } catch (IllegalArgumentException e) {
            log.error("❌ Errore: ruolo non valido - {}", role);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("❌ Errore nel recupero degli utenti: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Recupera un utente per ID
     */
    @GetMapping("/{userId}")
    public ResponseEntity<User> getUserById(@PathVariable UUID userId) {
        try {
            User user = userService.getUserById(userId);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Crea un nuovo utente (agente o gestore)
     */
    @PostMapping
    public ResponseEntity<User> createUser(
            @RequestBody Map<String, Object> userData,
            Authentication authentication) {
        try {
            log.info("➕ [UserController] Creazione nuovo utente");
            log.info("📋 [UserController] Dati ricevuti: {}", userData);
            
            // Recupera l'utente loggato (gestore o admin)
            String email = authentication.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException(MSG_USER_NOT_FOUND));
            
            // Verifica che l'utente abbia un'agenzia
            if (currentUser.getAgencyId() == null) {
                log.error("❌ L'utente non ha un'agenzia associata");
                return ResponseEntity.status(403).build();
            }
            
            // Recupera l'agenzia
            Agency agency = agencyRepository.findById(currentUser.getAgencyId())
                    .orElseThrow(() -> new RuntimeException("Agenzia non trovata"));
            
            // Estrai i dati dal body
            String fullName = (String) userData.get("name");
            String[] nameParts = fullName.split(" ", 2);
            String firstName = nameParts[0];
            String lastName = nameParts.length > 1 ? nameParts[1] : "";
            
            String userEmail = (String) userData.get("email");
            String phone = (String) userData.get("phone");
            
            // Determina il ruolo (default AGENT, ma può essere AGENCY_MANAGER)
            String roleStr = (String) userData.getOrDefault("role", "AGENT");
            UserRole role = UserRole.valueOf(roleStr);
            
            // Genera una password casuale sicura
            String temporaryPassword = PasswordGenerator.generateTemporaryPassword();
            log.info("🔐 [UserController] Password temporanea generata");
            
            boolean active = "attivo".equals(userData.get("status"));
            
            // Verifica che l'email non esista già
            if (userRepository.findByEmail(userEmail).isPresent()) {
                log.error("❌ Email già esistente: {}", userEmail);
                return ResponseEntity.status(409).build(); // Conflict
            }
            
            // Crea il nuovo utente
            User newUser = new User();
            newUser.setEmail(userEmail);
            newUser.setFirstName(firstName);
            newUser.setLastName(lastName);
            newUser.setPhoneE164(phone);
            newUser.setRole(role);
            newUser.setAgencyId(currentUser.getAgencyId());
            newUser.setActive(active);
            
            // Salva l'utente usando il servizio (che gestisce l'hash della password)
            User savedUser = userService.createUserWithPassword(newUser, temporaryPassword);
            
            log.info("✅ [UserController] Utente creato con successo: {} con ruolo {}", savedUser.getId(), role);
            
            // Invia l'email di benvenuto con le credenziali
            String createdByName = currentUser.getFirstName() + " " + currentUser.getLastName();
            
            if (role == UserRole.AGENT) {
                emailService.sendAgentCreationConfirmation(
                    userEmail, 
                    agency.getName(), 
                    firstName, 
                    lastName, 
                    temporaryPassword,
                    createdByName
                );
            } else if (role == UserRole.AGENCY_MANAGER) {
                emailService.sendManagerCreationConfirmation(
                    userEmail, 
                    agency.getName(), 
                    firstName, 
                    lastName, 
                    temporaryPassword,
                    createdByName
                );
            }
            
            log.info("📧 [UserController] Email di benvenuto inviata");
            
            return ResponseEntity.status(201).body(savedUser); // 201 Created
            
        } catch (Exception e) {
            log.error("❌ [UserController] Errore nella creazione dell'utente: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Aggiorna un utente esistente
     */
    @PutMapping("/{userId}")
    public ResponseEntity<User> updateUser(
            @PathVariable UUID userId,
            @RequestBody Map<String, Object> updateData,
            Authentication authentication) {
        try {
            log.info("🔄 [UserController] Aggiornamento utente: {}", userId);
            log.info("📋 [UserController] Dati da aggiornare: {}", updateData);
            
            User user = userService.getUserById(userId);
            
            // Aggiorna i campi forniti
            if (updateData.containsKey(KEY_FIRST_NAME)) {
                user.setFirstName((String) updateData.get(KEY_FIRST_NAME));
            }
            if (updateData.containsKey(KEY_LAST_NAME)) {
                user.setLastName((String) updateData.get(KEY_LAST_NAME));
            }
            if (updateData.containsKey(KEY_PHONE_E164)) {
                user.setPhoneE164((String) updateData.get(KEY_PHONE_E164));
            }
            if (updateData.containsKey(KEY_ACTIVE)) {
                user.setActive((Boolean) updateData.get(KEY_ACTIVE));
            }
            
            User updatedUser = userRepository.save(user);
            log.info("✅ [UserController] Utente aggiornato con successo");
            
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            log.warn(LOG_ERROR_PREFIX + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Attiva/Disattiva un utente (toggle status)
     */
    @PatchMapping("/{userId}/toggle-status")
    public ResponseEntity<User> toggleUserStatus(
            @PathVariable UUID userId,
            Authentication authentication) {
        try {
            log.info("🔄 [UserController] Toggle status per utente: {}", userId);
            
            User user = userService.getUserById(userId);
            user.setActive(!user.isActive());
            
            User updatedUser = userRepository.save(user);
            log.info("✅ [UserController] Status utente aggiornato: {}", updatedUser.isActive());
            
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            log.warn(LOG_ERROR_PREFIX + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Recupera le statistiche per la dashboard del manager
     */
    @GetMapping("/manager/stats")
    public ResponseEntity<Map<String, Object>> getManagerStats(Authentication authentication) {
        try {
            // Recupera l'utente loggato
            String email = authentication.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException(MSG_USER_NOT_FOUND));
            
            if (currentUser.getAgencyId() == null) {
                return ResponseEntity.status(403).build();
            }
            
            UUID agencyId = currentUser.getAgencyId();
            
            // Statistiche agenti
            List<User> allAgents = userRepository.findByAgencyIdAndRole(agencyId, UserRole.AGENT);
            long activeAgents = allAgents.stream().filter(User::isActive).count();
            long totalAgents = allAgents.size();
            
            // Statistiche immobili dell'agenzia (tramite gli agenti)
            List<UUID> agentIds = allAgents.stream().map(User::getId).toList();
            List<Listing> allListings = listingRepository.findByAgentIdIn(agentIds);
            
            long totalProperties = allListings.size();
            long availableProperties = allListings.stream()
                    .filter(l -> l.getStatus() == ListingStatus.ACTIVE)
                    .count();
            long soldProperties = allListings.stream()
                    .filter(l -> l.getStatus() == ListingStatus.SOLD)
                    .count();
            long rentedProperties = allListings.stream()
                    .filter(l -> l.getStatus() == ListingStatus.RENTED)
                    .count();
            
            // Ultimi 3 immobili
            List<Map<String, Object>> recentProperties = allListings.stream()
                    .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                    .limit(3)
                    .map(listing -> {
                        Map<String, Object> prop = new HashMap<>();
                        prop.put("id", listing.getId());
                        prop.put("title", listing.getTitle());
                        prop.put("status", listing.getStatus().toString());
                        prop.put("price", listing.getPriceAmount());
                        prop.put("currency", listing.getCurrency());
                        prop.put("type", listing.getType().toString());
                        
                        if (listing.getAgent() != null) {
                            prop.put(KEY_AGENT_NAME, listing.getAgent().getFirstName() + " " + listing.getAgent().getLastName());
                        } else {
                            prop.put(KEY_AGENT_NAME, DEFAULT_AGENT_NAME);
                        }
                        
                        return prop;
                    })
                    .toList();
            
            // Costruisci la risposta
            Map<String, Object> stats = new HashMap<>();
            
            Map<String, Long> agentStats = new HashMap<>();
            agentStats.put("attivi", activeAgents);
            agentStats.put("totali", totalAgents);
            stats.put("agenti", agentStats);
            
            Map<String, Long> propertyStats = new HashMap<>();
            propertyStats.put("totali", totalProperties);
            propertyStats.put("disponibili", availableProperties);
            propertyStats.put("venduti", soldProperties);
            propertyStats.put("affittati", rentedProperties);
            stats.put("immobili", propertyStats);
            
            stats.put("immobiliRecenti", recentProperties);
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            log.error("❌ Errore nel recupero statistiche manager: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Recupera tutti gli agenti con le loro statistiche di immobili
     */
    @GetMapping("/agents-with-stats")
    public ResponseEntity<List<Map<String, Object>>> getAgentsWithStats(Authentication authentication) {
        try {
            // Recupera l'utente loggato
            String email = authentication.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException(MSG_USER_NOT_FOUND));
            
            if (currentUser.getAgencyId() == null) {
                return ResponseEntity.status(403).build();
            }
            
            UUID agencyId = currentUser.getAgencyId();
            
            // Recupera tutti gli agenti dell'agenzia
            List<User> agents = userRepository.findByAgencyIdAndRole(agencyId, UserRole.AGENT);
            
            // Mappa ogni agente con le sue statistiche
            List<Map<String, Object>> agentsWithStats = agents.stream()
                    .map(agent -> {
                        // Recupera gli immobili dell'agente usando il metodo corretto
                        List<Listing> agentListings = listingRepository.findAllByAgent_Id(agent.getId());
                        
                        int totalProperties = agentListings.size();
                        int activeProperties = (int) agentListings.stream()
                                .filter(l -> l.getStatus() == ListingStatus.ACTIVE)
                                .count();
                        int soldProperties = (int) agentListings.stream()
                                .filter(l -> l.getStatus() == ListingStatus.SOLD)
                                .count();
                        int rentedProperties = (int) agentListings.stream()
                                .filter(l -> l.getStatus() == ListingStatus.RENTED)
                                .count();
                        
                        // Costruisci l'oggetto con i dati dell'agente e le statistiche
                        Map<String, Object> agentData = new HashMap<>();
                        agentData.put("id", agent.getId().toString());
                        agentData.put("email", agent.getEmail());
                        agentData.put(KEY_FIRST_NAME, agent.getFirstName());
                        agentData.put(KEY_LAST_NAME, agent.getLastName());
                        agentData.put(KEY_PHONE_E164, agent.getPhoneE164());
                        agentData.put(KEY_ACTIVE, agent.isActive());
                        agentData.put("agencyId", agent.getAgencyId().toString());
                        agentData.put("totalProperties", totalProperties);
                        agentData.put("activeProperties", activeProperties);
                        agentData.put("soldProperties", soldProperties);
                        agentData.put("rentedProperties", rentedProperties);
                        
                        return agentData;
                    })
                    .toList();
            
            log.info("✅ Recuperati {} agenti con statistiche", agentsWithStats.size());
            
            return ResponseEntity.ok(agentsWithStats);
            
        } catch (Exception e) {
            log.error("❌ Errore nel recupero agenti con statistiche: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
