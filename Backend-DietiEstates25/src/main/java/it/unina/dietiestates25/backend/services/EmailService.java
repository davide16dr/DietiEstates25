package it.unina.dietiestates25.backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@dietiestates25.it}")
    private String fromEmail;

    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Invia un'email di conferma registrazione aziendale con password provvisoria
     */
    public void sendBusinessRegistrationConfirmation(String toEmail, String companyName, 
                                                      String firstName, String lastName, 
                                                      String temporaryPassword) {
        // Se l'invio email è disabilitato, mostra il messaggio in console
        if (!emailEnabled) {
            System.out.println("[EMAIL DISABILITATO IN SVILUPPO]");
            System.out.println("To: " + toEmail);
            System.out.println("Subject: Benvenuto in DietiEstates25 - Registrazione Confermata");
            System.out.println("Body:");
            System.out.println("---");
            System.out.println(String.format(
                "Caro/a %s %s,\n\n" +
                "La registrazione della tua agenzia \"%s\" su DietiEstates25 è stata confermata con successo!\n\n" +
                "Ecco i tuoi dati di accesso:\n" +
                "Email: %s\n" +
                "Password Temporanea: %s\n\n" +
                "Ti consigliamo di cambiare la password temporanea al primo accesso per motivi di sicurezza.\n\n" +
                "Accedi qui: https://dietiestates25.it/auth/login\n\n" +
                "Se hai domande, contattaci a support@dietiestates25.it\n\n" +
                "Cordiali saluti,\n" +
                "Il Team di DietiEstates25",
                firstName, lastName, companyName, toEmail, temporaryPassword
            ));
            System.out.println("---");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Benvenuto in DietiEstates25 - Registrazione Confermata");

            String body = String.format(
                "Caro/a %s %s,\n\n" +
                "La registrazione della tua agenzia \"%s\" su DietiEstates25 è stata confermata con successo!\n\n" +
                "Ecco i tuoi dati di accesso:\n" +
                "Email: %s\n" +
                "Password Temporanea: %s\n\n" +
                "Ti consigliamo di cambiare la password temporanea al primo accesso per motivi di sicurezza.\n\n" +
                "Accedi qui: https://dietiestates25.it/auth/login\n\n" +
                "Se hai domande, contattaci a support@dietiestates25.it\n\n" +
                "Cordiali saluti,\n" +
                "Il Team di DietiEstates25",
                firstName, lastName, companyName, toEmail, temporaryPassword
            );

            message.setText(body);
            mailSender.send(message);
            
            System.out.println("✅ Email inviata con successo a: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Errore nell'invio dell'email: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Invia un'email di benvenuto a un nuovo agente con le credenziali di accesso
     */
    public void sendAgentCreationConfirmation(String toEmail, String agencyName,
                                               String firstName, String lastName,
                                               String temporaryPassword,
                                               String createdByName) {
        // Se l'invio email è disabilitato, mostra il messaggio in console
        if (!emailEnabled) {
            System.out.println("[EMAIL DISABILITATO IN SVILUPPO]");
            System.out.println("To: " + toEmail);
            System.out.println("Subject: Benvenuto in DietiEstates25 - Account Agente Creato");
            System.out.println("Body:");
            System.out.println("---");
            System.out.println(String.format(
                "Caro/a %s %s,\n\n" +
                "Il tuo account agente per l'agenzia \"%s\" è stato creato con successo da %s!\n\n" +
                "Ecco i tuoi dati di accesso:\n" +
                "Email: %s\n" +
                "Password Temporanea: %s\n\n" +
                "⚠️ IMPORTANTE: Per motivi di sicurezza, ti consigliamo di cambiare la password temporanea al primo accesso.\n\n" +
                "Accedi qui: https://dietiestates25.it/auth/login\n\n" +
                "Una volta effettuato l'accesso potrai:\n" +
                "• Gestire i tuoi immobili\n" +
                "• Programmare visite con i clienti\n" +
                "• Ricevere e gestire offerte\n" +
                "• Visualizzare le statistiche delle tue vendite\n\n" +
                "Se hai domande o hai bisogno di assistenza, contattaci a support@dietiestates25.it\n\n" +
                "Cordiali saluti,\n" +
                "Il Team di DietiEstates25",
                firstName, lastName, agencyName, createdByName, toEmail, temporaryPassword
            ));
            System.out.println("---");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Benvenuto in DietiEstates25 - Account Agente Creato");

            String body = String.format(
                "Caro/a %s %s,\n\n" +
                "Il tuo account agente per l'agenzia \"%s\" è stato creato con successo da %s!\n\n" +
                "Ecco i tuoi dati di accesso:\n" +
                "Email: %s\n" +
                "Password Temporanea: %s\n\n" +
                "⚠️ IMPORTANTE: Per motivi di sicurezza, ti consigliamo di cambiare la password temporanea al primo accesso.\n\n" +
                "Accedi qui: https://dietiestates25.it/auth/login\n\n" +
                "Una volta effettuato l'accesso potrai:\n" +
                "• Gestire i tuoi immobili\n" +
                "• Programmare visite con i clienti\n" +
                "• Ricevere e gestire offerte\n" +
                "• Visualizzare le statistiche delle tue vendite\n\n" +
                "Se hai domande o hai bisogno di assistenza, contattaci a support@dietiestates25.it\n\n" +
                "Cordiali saluti,\n" +
                "Il Team di DietiEstates25",
                firstName, lastName, agencyName, createdByName, toEmail, temporaryPassword
            );

            message.setText(body);
            mailSender.send(message);
            
            System.out.println("✅ Email di benvenuto agente inviata con successo a: " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ Errore nell'invio dell'email all'agente: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
