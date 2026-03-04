package it.unina.dietiestates25.backend.services;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import it.unina.dietiestates25.backend.dto.ChangePasswordRequest;
import it.unina.dietiestates25.backend.entities.Agency;
import it.unina.dietiestates25.backend.entities.AgencyMembership;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.UserRole;
import it.unina.dietiestates25.backend.repositories.AgencyMembershipRepository;
import it.unina.dietiestates25.backend.repositories.AgencyRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AgencyMembershipRepository agencyMembershipRepository;

    @Autowired
    private AgencyRepository agencyRepository;

    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        System.out.println("🔍 [UserService] Tentativo cambio password per userId: " + userId);
        
        // 1. Trova l'utente
        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    System.out.println("❌ [UserService] Utente NON trovato con ID: " + userId);
                    return new RuntimeException("Utente non trovato");
                });

        System.out.println("✅ [UserService] Utente trovato: " + user.getEmail());

        // 2. Verifica che la vecchia password sia corretta
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            System.out.println("❌ [UserService] Password attuale errata per utente: " + user.getEmail());
            throw new RuntimeException("La password attuale non è corretta");
        }

        System.out.println("✅ [UserService] Password attuale verificata correttamente");

        // 3. Valida la nuova password
        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new RuntimeException("La nuova password deve contenere almeno 8 caratteri");
        }

        // 4. Hash della nuova password e salvataggio
        String hashedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setPasswordHash(hashedPassword);
        userRepository.save(user);
        
        System.out.println("✅ [UserService] Password cambiata con successo per utente: " + user.getEmail());
    }

    /**
     * Aggiunge automaticamente un utente alla tabella agency_memberships
     * quando viene assegnato a un'agenzia (per AGENT, AGENCY_MANAGER, ADMIN con agenzia)
     */
    @Transactional
    public void addAgencyMembershipIfNeeded(User user) {
        // Controlla se l'utente ha un'agenzia e se è un ruolo che richiede membership
        if (user.getAgencyId() == null) {
            return;
        }

        UserRole role = user.getRole();
        if (role != UserRole.AGENT && role != UserRole.AGENCY_MANAGER && role != UserRole.ADMIN) {
            System.out.println("⚠️ [UserService] Utente " + user.getEmail() + " ha ruolo " + role + ", non richiede membership");
            return;
        }

        // Verifica se la membership esiste già
        boolean exists = agencyMembershipRepository.existsByAgency_IdAndUser_Id(
            user.getAgencyId(), 
            user.getId()
        );

        if (exists) {
            System.out.println("✅ [UserService] Membership già esistente per " + user.getEmail());
            return;
        }

        // Recupera l'agenzia
        Agency agency = agencyRepository.findById(user.getAgencyId())
            .orElseThrow(() -> new RuntimeException("Agenzia non trovata: " + user.getAgencyId()));

        // Crea la membership
        AgencyMembership membership = new AgencyMembership();
        membership.setAgency(agency);
        membership.setUser(user);
        membership.setMembershipRole(role);

        agencyMembershipRepository.save(membership);
        System.out.println("✅ [UserService] Membership creata per " + user.getEmail() + 
                         " nell'agenzia " + agency.getName() + " con ruolo " + role);
    }

    public User getUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Utente non trovato"));
    }

    /**
     * Crea un nuovo utente con password e lo salva nel database
     */
    @Transactional
    public User createUserWithPassword(User user, String password) {
        System.out.println("➕ [UserService] Creazione nuovo utente: " + user.getEmail());
        
        // Valida la password
        if (password == null || password.length() < 8) {
            throw new RuntimeException("La password deve contenere almeno 8 caratteri");
        }
        
        // Hash della password
        String hashedPassword = passwordEncoder.encode(password);
        user.setPasswordHash(hashedPassword);
        
        // Salva l'utente
        User savedUser = userRepository.save(user);
        System.out.println("✅ [UserService] Utente salvato: " + savedUser.getId());
        
        // Aggiungi la membership all'agenzia se necessario
        addAgencyMembershipIfNeeded(savedUser);
        
        return savedUser;
    }
}
