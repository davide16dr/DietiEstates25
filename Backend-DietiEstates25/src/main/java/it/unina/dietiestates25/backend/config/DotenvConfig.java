package it.unina.dietiestates25.backend.config;

import io.github.cdimascio.dotenv.Dotenv;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.util.HashMap;
import java.util.Map;




@Slf4j
public class DotenvConfig implements ApplicationContextInitializer<ConfigurableApplicationContext> {

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        try {
            log.info("📂 Caricamento file .env...");
            
            Dotenv dotenv = Dotenv.configure()
                .directory("./")
                .ignoreIfMissing()
                .load();

            ConfigurableEnvironment environment = applicationContext.getEnvironment();
            Map<String, Object> dotenvProperties = new HashMap<>();

            dotenv.entries().forEach(entry -> {
                dotenvProperties.put(entry.getKey(), entry.getValue());
                log.debug("✅ Caricata variabile .env: {}", entry.getKey());
            });

            environment.getPropertySources()
                .addFirst(new MapPropertySource("dotenvProperties", dotenvProperties));

            log.info("✅ File .env caricato con successo! ({} variabili caricate)", dotenvProperties.size());
        } catch (Exception e) {
            log.warn("⚠️ Impossibile caricare .env: {}", e.getMessage(), e);
        }
    }
}
