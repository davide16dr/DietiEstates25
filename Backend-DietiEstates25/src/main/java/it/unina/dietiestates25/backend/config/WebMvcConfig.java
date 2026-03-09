package it.unina.dietiestates25.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.storage.upload-dir}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Espone le immagini tramite URL: http://localhost:8080/uploads/listings/{listingId}/{filename}
        // Il path fisico è: uploads/listings/
        // Il path URL è: /uploads/listings/**
        String uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();
        
        registry.addResourceHandler("/uploads/listings/**")
                .addResourceLocations(uploadPath + "/");
        
        System.out.println("📁 Risorse statiche configurate: /uploads/listings/** -> " + uploadPath);
    }
}
