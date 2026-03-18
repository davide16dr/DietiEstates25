package it.unina.dietiestates25.backend.services;

import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(UserService.class);
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
        log.debug("Tentativo cambio password per userId: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.debug("Utente NON trovato con ID: {}", userId);
                    return new IllegalArgumentException("Utente non trovato");
                });

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
            log.debug("Password attuale errata per userId: {}", userId);
            throw new SecurityException("La password attuale non è corretta");
        }

        if (request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new IllegalArgumentException("La nuova password deve contenere almeno 8 caratteri");
        }

        String hashedPassword = passwordEncoder.encode(request.getNewPassword());
        user.setPasswordHash(hashedPassword);
        userRepository.save(user);
        log.debug("Password cambiata con successo per userId: {}", userId);
    }

    



    @Transactional
    public void addAgencyMembershipIfNeeded(User user) {
        
        if (user.getAgencyId() == null) {
            return;
        }

        UserRole role = user.getRole();
        if (role != UserRole.AGENT && role != UserRole.AGENCY_MANAGER && role != UserRole.ADMIN) {
            log.debug("Utente {} ha ruolo {}, membership non richiesta", user.getId(), role);
            return;
        }

        boolean exists = agencyMembershipRepository.existsByAgency_IdAndUser_Id(
            user.getAgencyId(),
            user.getId()
        );

        if (exists) {
            log.debug("Membership già esistente per userId: {}", user.getId());
            return;
        }

        
        Agency agency = agencyRepository.findById(user.getAgencyId())
            .orElseThrow(() -> new IllegalArgumentException("Agenzia non trovata: " + user.getAgencyId()));

        
        AgencyMembership membership = new AgencyMembership();
        membership.setAgency(agency);
        membership.setUser(user);
        membership.setMembershipRole(role);

        agencyMembershipRepository.save(membership);
        log.debug("Membership creata per userId: {} nell'agenzia: {}", user.getId(), agency.getId());
    }

    public User getUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));
    }

    


    @Transactional
    public User createUserWithPassword(User user, String password) {
        log.debug("Creazione nuovo utente");

        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("La password deve contenere almeno 8 caratteri");
        }

        String hashedPassword = passwordEncoder.encode(password);
        user.setPasswordHash(hashedPassword);

        User savedUser = userRepository.save(user);
        log.debug("Utente salvato: {}", savedUser.getId());

        addAgencyMembershipIfNeeded(savedUser);

        return savedUser;
    }
}
