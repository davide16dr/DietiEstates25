package it.unina.dietiestates25.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import software.amazon.awssdk.services.secretsmanager.SecretsManagerClient;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueRequest;
import software.amazon.awssdk.services.secretsmanager.model.GetSecretValueResponse;
import software.amazon.awssdk.services.secretsmanager.model.SecretsManagerException;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableConfigurationProperties
public class SecretsManagerConfig {

    private final Environment environment;
    private static final String SECRETS_NAME = "dietiestates25/credentials";

    public SecretsManagerConfig(Environment environment) {
        this.environment = environment;
        loadSecretsFromAwsSecretsManager();
    }

    /**
     * Carica i segreti da AWS Secrets Manager durante l'avvio
     */
    private void loadSecretsFromAwsSecretsManager() {
        // Se NON è ambiente production, non caricare da AWS
        String activeProfile = environment.getProperty("spring.profiles.active");
        if (activeProfile == null || !activeProfile.equals("production")) {
            System.out.println("⚠️ Non in production mode, saltando AWS Secrets Manager");
            return;
        }

        try (SecretsManagerClient client = SecretsManagerClient.builder()
                .region(software.amazon.awssdk.regions.Region.EU_SOUTH_1)
                .build()) {

            GetSecretValueRequest request = GetSecretValueRequest.builder()
                    .secretId(SECRETS_NAME)
                    .build();

            GetSecretValueResponse response = client.getSecretValue(request);
            String secret = response.secretString();

            // Parse JSON e imposta come System Properties
            ObjectMapper mapper = new ObjectMapper();
            JsonNode secretNode = mapper.readTree(secret);

            Map<String, String> secrets = new HashMap<>();
            secretNode.fields().forEachRemaining(entry -> {
                secrets.put(entry.getKey(), entry.getValue().asText());
                // Imposta come System Property
                System.setProperty(entry.getKey(), entry.getValue().asText());
            });

            System.out.println("✅ Segreti caricati da AWS Secrets Manager");

        } catch (SecretsManagerException e) {
            System.err.println("❌ Errore nel caricamento dei segreti: " + e.getMessage());
            e.printStackTrace();
        } catch (IOException e) {
            System.err.println("❌ Errore nel parsing JSON dei segreti: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * Getter helper per accedere ai segreti dai Service
     */
    public static String getSecret(String key, String defaultValue) {
        String value = System.getProperty(key);
        return value != null ? value : defaultValue;
    }

    public static String getSecret(String key) {
        return System.getProperty(key);
    }
}
