package it.unina.dietiestates25.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.Environment;
import org.springframework.core.env.MapPropertySource;
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

    private static final Logger logger = LoggerFactory.getLogger(SecretsManagerConfig.class);
    private final Environment environment;
    private final ConfigurableEnvironment configurableEnvironment;
    private static final String CREDENTIALS_SECRET_NAME = "dietiestates25/credentials";

    public SecretsManagerConfig(Environment environment, ConfigurableEnvironment configurableEnvironment) {
        this.environment = environment;
        this.configurableEnvironment = configurableEnvironment;
        loadSecretsFromAwsSecretsManager();
    }

    /**
     * Carica i segreti da AWS Secrets Manager durante l'avvio
     */
    private void loadSecretsFromAwsSecretsManager() {
        // Controlla se AWS Secrets Manager è abilitato
        Boolean enabled = environment.getProperty("app.aws.secrets-manager.enabled", Boolean.class, false);
        if (!enabled) {
            logger.info("AWS Secrets Manager disabilitato, saltando caricamento segreti");
            return;
        }

        try (SecretsManagerClient client = SecretsManagerClient.builder()
                .region(software.amazon.awssdk.regions.Region.EU_SOUTH_1)
                .build()) {

            // Carica le credenziali da dietiestates25/credentials
            loadCredentialsFromSecret(client, CREDENTIALS_SECRET_NAME);

            logger.info("✅ Segreti caricati da AWS Secrets Manager");

        } catch (SecretsManagerException e) {
            logger.error("❌ Errore nel caricamento dei segreti da AWS Secrets Manager: {}", e.getMessage(), e);
            throw new RuntimeException("Impossibile caricare i segreti da AWS Secrets Manager", e);
        } catch (IOException e) {
            logger.error("❌ Errore nel parsing JSON dei segreti: {}", e.getMessage(), e);
            throw new RuntimeException("Errore nel parsing JSON dei segreti", e);
        }
    }

    /**
     * Carica TUTTE le credenziali dal secret AWS e le rende disponibili come properties di Spring
     */
    private void loadCredentialsFromSecret(SecretsManagerClient client, String secretName) throws IOException {
        GetSecretValueRequest request = GetSecretValueRequest.builder()
                .secretId(secretName)
                .build();

        GetSecretValueResponse response = client.getSecretValue(request);
        String secret = response.secretString();

        // Parse JSON e imposta come System Properties e Spring Properties
        ObjectMapper mapper = new ObjectMapper();
        JsonNode secretNode = mapper.readTree(secret);

        Map<String, Object> secrets = new HashMap<>();
        secretNode.fields().forEachRemaining(entry -> {
            String key = entry.getKey();
            String value = entry.getValue().asText();
            
            // Imposta come System Property
            System.setProperty(key, value);
            
            // Imposta come Spring Property
            secrets.put(key, value);
            
            logger.debug("✅ Caricata credenziale da AWS Secrets Manager: {}", key);
        });
        
        // Aggiungi le properties a Spring Environment
        configurableEnvironment.getPropertySources()
            .addFirst(new MapPropertySource("awsSecretsManager", secrets));

        logger.info("✅ Caricate {} credenziali da AWS Secrets Manager", secrets.size());
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
