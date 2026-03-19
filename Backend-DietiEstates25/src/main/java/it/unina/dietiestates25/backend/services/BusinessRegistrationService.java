package it.unina.dietiestates25.backend.services;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(BusinessRegistrationService.class);

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

    



    @Transactional
    public void registerBusiness(RegisterBusinessRequest request) throws Exception {
        
        String normalizedEmail = request.getEmail().toLowerCase().trim();
        
        
        if (userRepository.findByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("Email già registrata nel sistema");
        }

        
        Optional<Agency> existingAgency = agencyRepository.findByVatNumber(request.getVatNumber());
        if (existingAgency.isPresent()) {
            throw new IllegalArgumentException("Partita IVA già registrata nel sistema");
        }

        
        Agency agency = new Agency();
        agency.setName(request.getCompanyName());
        agency.setVatNumber(request.getVatNumber());
        agency.setCity(request.getCity());
        agency.setAddress(request.getAddress());
        agency.setPhoneE164(request.getPhoneE164());
        agency.setEmail(normalizedEmail);

        Agency savedAgency = agencyRepository.save(agency);
        log.info("Agenzia creata con successo: {}", savedAgency.getId());

        
        String temporaryPassword = PasswordGenerator.generateTemporaryPassword();

        
        User manager = new User();
        manager.setRole(UserRole.ADMIN);  
        manager.setFirstName(request.getFirstName());
        manager.setLastName(request.getLastName());
        manager.setEmail(normalizedEmail);
        manager.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        manager.setPhoneE164(request.getPhoneE164());
        manager.setActive(true);
        manager.setAgencyId(savedAgency.getId());

        User savedManager = userRepository.save(manager);
        log.info("Manager creato con successo: {}", savedManager.getId());

        
        userService.addAgencyMembershipIfNeeded(savedManager);

        
        try {
            emailService.sendBusinessRegistrationConfirmation(
                normalizedEmail,
                request.getCompanyName(),
                request.getFirstName(),
                request.getLastName(),
                temporaryPassword
            );
            log.info("Email di conferma inviata a: {}", normalizedEmail);
        } catch (Exception e) {
            log.error("Errore durante l'invio dell'email: {}", e.getMessage());
            
        }
    }
}
