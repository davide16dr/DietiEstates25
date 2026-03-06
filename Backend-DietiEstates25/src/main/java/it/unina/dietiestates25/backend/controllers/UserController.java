package it.unina.dietiestates25.backend.controllers;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
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
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

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
            System.out.println("📨 [UserController] Ricevuta richiesta cambio password");
            System.out.println("📋 [UserController] userId dal path: " + userId);
            System.out.println("📋 [UserController] oldPassword presente: " + (request.getOldPassword() != null));
            System.out.println("📋 [UserController] newPassword presente: " + (request.getNewPassword() != null));
            
            userService.changePassword(userId, request);
            
            return ResponseEntity.ok().body("{\"message\": \"Password cambiata con successo\"}");
        } catch (RuntimeException e) {
            System.out.println("❌ [UserController] Errore: " + e.getMessage());
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
                    .orElseThrow(() -> new RuntimeException("Utente non trovato"));
            
            System.out.println("🔍 Recupero utenti con ruolo " + role + " per utente: " + email);
            System.out.println("📋 AgencyId utente corrente: " + currentUser.getAgencyId());
            
            // Verifica che l'utente abbia un'agenzia associata
            if (currentUser.getAgencyId() == null) {
                System.err.println("❌ Errore: l'utente " + email + " non ha un'agenzia associata!");
                return ResponseEntity.status(403)
                    .body(null); // Forbidden - l'utente deve avere un'agenzia
            }
            
            // Converte la stringa in enum UserRole
            UserRole userRole = UserRole.valueOf(role);
            
            // Filtra gli utenti per agenzia e ruolo
            List<User> users = userRepository.findByAgencyIdAndRole(currentUser.getAgencyId(), userRole);
            
            System.out.println("✅ Recuperati " + users.size() + " utenti con ruolo " + role + " per agenzia " + currentUser.getAgencyId());
            
            return ResponseEntity.ok(users);
        } catch (IllegalArgumentException e) {
            System.err.println("❌ Errore: ruolo non valido - " + role);
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            System.err.println("❌ Errore nel recupero degli utenti: " + e.getMessage());
            e.printStackTrace();
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
            System.out.println("➕ [UserController] Creazione nuovo utente");
            System.out.println("📋 [UserController] Dati ricevuti: " + userData);
            
            // Recupera l'utente loggato (gestore o admin)
            String email = authentication.getName();
            User currentUser = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Utente non trovato"));
            
            // Verifica che l'utente abbia un'agenzia
            if (currentUser.getAgencyId() == null) {
                System.err.println("❌ L'utente non ha un'agenzia associata");
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
            System.out.println("🔐 [UserController] Password temporanea generata");
            
            boolean active = "attivo".equals(userData.get("status"));
            
            // Verifica che l'email non esista già
            if (userRepository.findByEmail(userEmail).isPresent()) {
                System.err.println("❌ Email già esistente: " + userEmail);
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
            
            System.out.println("✅ [UserController] Utente creato con successo: " + savedUser.getId() + " con ruolo " + role);
            
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
            
            System.out.println("📧 [UserController] Email di benvenuto inviata");
            
            return ResponseEntity.status(201).body(savedUser); // 201 Created
            
        } catch (Exception e) {
            System.err.println("❌ [UserController] Errore nella creazione dell'utente: " + e.getMessage());
            e.printStackTrace();
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
            System.out.println("🔄 [UserController] Aggiornamento utente: " + userId);
            System.out.println("📋 [UserController] Dati da aggiornare: " + updateData);
            
            User user = userService.getUserById(userId);
            
            // Aggiorna i campi forniti
            if (updateData.containsKey("firstName")) {
                user.setFirstName((String) updateData.get("firstName"));
            }
            if (updateData.containsKey("lastName")) {
                user.setLastName((String) updateData.get("lastName"));
            }
            if (updateData.containsKey("phoneE164")) {
                user.setPhoneE164((String) updateData.get("phoneE164"));
            }
            if (updateData.containsKey("active")) {
                user.setActive((Boolean) updateData.get("active"));
            }
            
            User updatedUser = userRepository.save(user);
            System.out.println("✅ [UserController] Utente aggiornato con successo");
            
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            System.err.println("❌ [UserController] Errore: " + e.getMessage());
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
            System.out.println("🔄 [UserController] Toggle status per utente: " + userId);
            
            User user = userService.getUserById(userId);
            user.setActive(!user.isActive());
            
            User updatedUser = userRepository.save(user);
            System.out.println("✅ [UserController] Status utente aggiornato: " + updatedUser.isActive());
            
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            System.err.println("❌ [UserController] Errore: " + e.getMessage());
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
                    .orElseThrow(() -> new RuntimeException("Utente non trovato"));
            
            if (currentUser.getAgencyId() == null) {
                return ResponseEntity.status(403).build();
            }
            
            UUID agencyId = currentUser.getAgencyId();
            
            // Statistiche agenti
            List<User> allAgents = userRepository.findByAgencyIdAndRole(agencyId, UserRole.AGENT);
            long activeAgents = allAgents.stream().filter(User::isActive).count();
            long totalAgents = allAgents.size();
            
            // Statistiche immobili dell'agenzia (tramite gli agenti)
            List<UUID> agentIds = allAgents.stream().map(User::getId).collect(Collectors.toList());
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
                        
                        // Trova l'agente
                        if (listing.getAgent() != null) {
                            prop.put("agentName", listing.getAgent().getFirstName() + " " + listing.getAgent().getLastName());
                        } else {
                            prop.put("agentName", "N/A");
                        }
                        
                        return prop;
                    })
                    .collect(Collectors.toList());
            
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
            System.err.println("❌ Errore nel recupero statistiche manager: " + e.getMessage());
            e.printStackTrace();
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
                    .orElseThrow(() -> new RuntimeException("Utente non trovato"));
            
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
                        agentData.put("firstName", agent.getFirstName());
                        agentData.put("lastName", agent.getLastName());
                        agentData.put("phoneE164", agent.getPhoneE164());
                        agentData.put("active", agent.isActive());
                        agentData.put("agencyId", agent.getAgencyId().toString());
                        agentData.put("totalProperties", totalProperties);
                        agentData.put("activeProperties", activeProperties);
                        agentData.put("soldProperties", soldProperties);
                        agentData.put("rentedProperties", rentedProperties);
                        
                        return agentData;
                    })
                    .collect(Collectors.toList());
            
            System.out.println("✅ Recuperati " + agentsWithStats.size() + " agenti con statistiche");
            
            return ResponseEntity.ok(agentsWithStats);
            
        } catch (Exception e) {
            System.err.println("❌ Errore nel recupero agenti con statistiche: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}
