package it.unina.dietiestates25.backend.config;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;

/**
 * Carica le variabili dal file .env e le rende disponibili a Spring Boot
 */
public class DotenvConfig implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        try {
            Dotenv dotenv = Dotenv.configure()
                .directory("./")
                .ignoreIfMissing()
                .load();

            ConfigurableEnvironment environment = applicationContext.getEnvironment();
            Map<String, Object> dotenvProperties = new HashMap<>();

            dotenv.entries().forEach(entry -> {
                dotenvProperties.put(entry.getKey(), entry.getValue());
                System.out.println("✅ Caricata variabile .env: " + entry.getKey());
            });

            environment.getPropertySources()
                .addFirst(new MapPropertySource("dotenvProperties", dotenvProperties));

            System.out.println(" File .env caricato con successo!");
        } catch (Exception e) {
            System.err.println("⚠️ Impossibile caricare .env: " + e.getMessage());
        }
    }
}
