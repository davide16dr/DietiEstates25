package it.unina.dietiestates25.backend.services;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import it.unina.dietiestates25.backend.dto.auth.RegisterBusinessRequest;
import it.unina.dietiestates25.backend.entities.Agency;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.UserRole;
import it.unina.dietiestates25.backend.repositories.AgencyRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.utils.PasswordGenerator;

@Service
public class BusinessRegistrationService {

    private final AgencyRepository agencyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final UserService userService;

    public BusinessRegistrationService(AgencyRepository agencyRepository, 
                                       UserRepository userRepository,
                                       PasswordEncoder passwordEncoder,
                                       EmailService emailService,
                                       UserService userService) {
        this.agencyRepository = agencyRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.userService = userService;
    }

    /**
     * Registra una nuova agenzia e crea l'utente manager associato
     * Invia un'email di conferma con password provvisoria
     */
    @Transactional
    public void registerBusiness(RegisterBusinessRequest request) throws Exception {
        // Normalizza l'email a minuscolo
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        
        // Verifica che l'email non sia già registrata
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("Email già registrata nel sistema");
        }

        // Verifica che la Partita IVA non sia già registrata
        Optional<Agency> existingAgency = agencyRepository.findByVatNumber(request.getVatNumber());
        if (existingAgency.isPresent()) {
            throw new IllegalArgumentException("Partita IVA già registrata nel sistema");
        }

        // Crea la nuova agenzia
        Agency agency = new Agency();
        agency.setName(request.getCompanyName());
        agency.setVatNumber(request.getVatNumber());
        agency.setCity(request.getCity());
        agency.setAddress(request.getAddress());
        agency.setPhoneE164(request.getPhoneE164());
        agency.setEmail(normalizedEmail);

        Agency savedAgency = agencyRepository.save(agency);
        System.out.println("Agenzia creata con successo: " + savedAgency.getId());

        // Genera una password provvisoria sicura
        String temporaryPassword = PasswordGenerator.generateTemporaryPassword();

        // Crea l'utente manager associato all'agenzia
        User manager = new User();
        manager.setRole(UserRole.ADMIN);  // Primo manager è ADMIN dell'agenzia
        manager.setFirstName(request.getFirstName());
        manager.setLastName(request.getLastName());
        manager.setEmail(normalizedEmail);
        manager.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        manager.setPhoneE164(request.getPhoneE164());
        manager.setActive(true);
        manager.setAgencyId(savedAgency.getId());

        User savedManager = userRepository.save(manager);
        System.out.println("Manager creato con successo: " + savedManager.getId());

        // Aggiungi automaticamente alla tabella agency_memberships
        userService.addAgencyMembershipIfNeeded(savedManager);

        // Invia l'email di conferma registrazione
        try {
            emailService.sendBusinessRegistrationConfirmation(
                normalizedEmail,
                request.getCompanyName(),
                request.getFirstName(),
                request.getLastName(),
                temporaryPassword
            );
            System.out.println("Email di conferma inviata a: " + normalizedEmail);
        } catch (Exception e) {
            System.err.println("Errore durante l'invio dell'email: " + e.getMessage());
            // Non lanciamo un'eccezione qui perché la registrazione è già completata
        }
    }
}
