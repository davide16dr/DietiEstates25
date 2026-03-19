package it.unina.dietiestates25.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * Configurazione WebSocket per notifiche in tempo reale
 * 
 * Endpoint: ws://localhost:8080/ws
 * Topic notifiche: /topic/notifications/{userId}
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Abilita un message broker in-memory per gestire i messaggi
        // I client si iscriveranno a topic che iniziano con "/topic"
        config.enableSimpleBroker("/topic", "/queue");
        
        // I messaggi inviati dai client con destinazione che inizia con "/app"
        // saranno instradati ai metodi @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Registra l'endpoint WebSocket "/ws"
        // I client si connetteranno a ws://localhost:8080/ws
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:4200", "http://localhost:*", "https://main.d310t5yetzwpg1.amplifyapp.com","https://d1cjp7s4vnposu.cloudfront.net", "https://dietiestates25-amplify.web.app")
                .withSockJS(); // Fallback per browser che non supportano WebSocket
    }
}
