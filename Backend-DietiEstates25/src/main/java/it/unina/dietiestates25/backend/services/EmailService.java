package it.unina.dietiestates25.backend.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final String DEV_DISABLED_PREFIX = "[EMAIL DISABILITATO IN SVILUPPO]";
    private static final String LOG_TO_PREFIX = "To: {}";
    private static final String BODY_LABEL = "Body:";
    private static final String BODY_SEPARATOR = "---";

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@dietiestates25.it}")
    private String fromEmail;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    


    public void sendBusinessRegistrationConfirmation(String toEmail, String companyName, 
                                                      String firstName, String lastName, 
                                                      String temporaryPassword) {
        
        if (!emailEnabled) {
            log.info(DEV_DISABLED_PREFIX);
            log.info(LOG_TO_PREFIX, toEmail);
            log.info("Subject: Benvenuto in DietiEstates25 - Registrazione Confermata");
            log.info(BODY_LABEL);
            log.info(BODY_SEPARATOR);
            log.info(buildBusinessRegistrationBody(firstName, lastName, companyName, toEmail, temporaryPassword));
            log.info(BODY_SEPARATOR);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Benvenuto in DietiEstates25 - Registrazione Confermata");

            String body = buildBusinessRegistrationBody(firstName, lastName, companyName, toEmail, temporaryPassword);

            message.setText(body);
            mailSender.send(message);
            
            log.info("✅ Email inviata con successo a: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Errore nell'invio dell'email: {}", e.getMessage(), e);
        }
    }

    


    public void sendAgentCreationConfirmation(String toEmail, String agencyName,
                                               String firstName, String lastName,
                                               String temporaryPassword,
                                               String createdByName) {
        
        if (!emailEnabled) {
            log.info(DEV_DISABLED_PREFIX);
            log.info(LOG_TO_PREFIX, toEmail);
            log.info("Subject: Benvenuto in DietiEstates25 - Account Agente Creato");
            log.info(BODY_LABEL);
            log.info(BODY_SEPARATOR);
            log.info(buildAgentCreationBody(firstName, lastName, agencyName, createdByName, toEmail, temporaryPassword));
            log.info(BODY_SEPARATOR);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Benvenuto in DietiEstates25 - Account Agente Creato");

            String body = buildAgentCreationBody(firstName, lastName, agencyName, createdByName, toEmail, temporaryPassword);

            message.setText(body);
            mailSender.send(message);
            
            log.info("✅ Email di benvenuto agente inviata con successo a: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Errore nell'invio dell'email all'agente: {}", e.getMessage(), e);
        }
    }

    


    public void sendManagerCreationConfirmation(String toEmail, String agencyName,
                                                 String firstName, String lastName,
                                                 String temporaryPassword,
                                                 String createdByName) {
        
        if (!emailEnabled) {
            log.info(DEV_DISABLED_PREFIX);
            log.info(LOG_TO_PREFIX, toEmail);
            log.info("Subject: Benvenuto in DietiEstates25 - Account Gestore Creato");
            log.info(BODY_LABEL);
            log.info(BODY_SEPARATOR);
            log.info(buildManagerCreationBody(firstName, lastName, agencyName, createdByName, toEmail, temporaryPassword));
            log.info(BODY_SEPARATOR);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Benvenuto in DietiEstates25 - Account Gestore Creato");

            String body = buildManagerCreationBody(firstName, lastName, agencyName, createdByName, toEmail, temporaryPassword);

            message.setText(body);
            mailSender.send(message);
            
            log.info("✅ Email di benvenuto gestore inviata con successo a: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Errore nell'invio dell'email al gestore: {}", e.getMessage(), e);
        }
    }

    


    public void sendPasswordResetEmail(String toEmail, String firstName, String resetLink) {
        if (!emailEnabled) {
            log.info(DEV_DISABLED_PREFIX);
            log.info(LOG_TO_PREFIX, toEmail);
            log.info("Subject: DietiEstates25 - Reset Password");
            log.info(BODY_LABEL);
            log.info(BODY_SEPARATOR);
            log.info(buildPasswordResetBody(firstName, resetLink));
            log.info(BODY_SEPARATOR);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("DietiEstates25 - Reset Password");

            String body = buildPasswordResetBody(firstName, resetLink);

            message.setText(body);
            mailSender.send(message);

            log.info("✅ Email reset password inviata a: {}", toEmail);
        } catch (Exception e) {
            log.error("❌ Errore nell'invio dell'email di reset: {}", e.getMessage(), e);
        }
    }

    private String buildBusinessRegistrationBody(String firstName, String lastName, String companyName, String toEmail,
                                                 String temporaryPassword) {
        return """
                Caro/a %s %s,

                La registrazione della tua agenzia "%s" su DietiEstates25 è stata confermata con successo!

                Ecco i tuoi dati di accesso:
                Email: %s
                Password Temporanea: %s

                Ti consigliamo di cambiare la password temporanea al primo accesso per motivi di sicurezza.

                Accedi qui: https://dietiestates25.it/auth/login

                Se hai domande, contattaci a support@dietiestates25.it

                Cordiali saluti,
                Il Team di DietiEstates25
                """.formatted(firstName, lastName, companyName, toEmail, temporaryPassword);
    }

    private String buildAgentCreationBody(String firstName, String lastName, String agencyName, String createdByName,
                                          String toEmail, String temporaryPassword) {
        return """
                Caro/a %s %s,

                Il tuo account agente per l'agenzia "%s" è stato creato con successo da %s!

                Ecco i tuoi dati di accesso:
                Email: %s
                Password Temporanea: %s

                ⚠️ IMPORTANTE: Per motivi di sicurezza, ti consigliamo di cambiare la password temporanea al primo accesso.

                Accedi qui: https://dietiestates25.it/auth/login

                Una volta effettuato l'accesso potrai:
                • Gestire i tuoi immobili
                • Programmare visite con i clienti
                • Ricevere e gestire offerte
                • Visualizzare le statistiche delle tue vendite

                Se hai domande o hai bisogno di assistenza, contattaci a support@dietiestates25.it

                Cordiali saluti,
                Il Team di DietiEstates25
                """.formatted(firstName, lastName, agencyName, createdByName, toEmail, temporaryPassword);
    }

    private String buildManagerCreationBody(String firstName, String lastName, String agencyName, String createdByName,
                                            String toEmail, String temporaryPassword) {
        return """
                Caro/a %s %s,

                Il tuo account gestore per l'agenzia "%s" è stato creato con successo da %s!

                Ecco i tuoi dati di accesso:
                Email: %s
                Password Temporanea: %s

                ⚠️ IMPORTANTE: Per motivi di sicurezza, ti consigliamo di cambiare la password temporanea al primo accesso.

                Accedi qui: https://dietiestates25.it/auth/login

                Una volta effettuato l'accesso potrai:
                • Gestire gli agenti della tua agenzia
                • Monitorare le performance e le statistiche
                • Supervisionare gli immobili in vendita
                • Visualizzare report dettagliati

                Se hai domande o hai bisogno di assistenza, contattaci a support@dietiestates25.it

                Cordiali saluti,
                Il Team di DietiEstates25
                """.formatted(firstName, lastName, agencyName, createdByName, toEmail, temporaryPassword);
    }

    private String buildPasswordResetBody(String firstName, String resetLink) {
        return """
                Caro/a %s,

                Abbiamo ricevuto una richiesta di reset della password per il tuo account.

                Clicca sul link qui sotto per reimpostare la tua password (valido per 1 ora):
                %s

                Se non hai richiesto il reset della password, ignora questa email.

                Cordiali saluti,
                Il Team di DietiEstates25
                """.formatted(firstName, resetLink);
    }
}
