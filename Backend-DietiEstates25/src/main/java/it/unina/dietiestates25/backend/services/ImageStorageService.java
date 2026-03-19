package it.unina.dietiestates25.backend.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class ImageStorageService {

    private static final Logger log = LoggerFactory.getLogger(ImageStorageService.class);
    @Value("${app.storage.upload-dir}")
    private String uploadDir;

    @Value("${app.storage.max-images-per-listing}")
    private int maxImagesPerListing;

    @Value("${app.storage.allowed-extensions}")
    private String allowedExtensions;

    private Path rootLocation;

    


    public void init() {
        try {
            rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(rootLocation);
            log.info("Directory upload inizializzata: {}", rootLocation);
        } catch (IOException e) {
            throw new IllegalStateException("Impossibile creare la directory di upload", e);
        }
    }

    


    public String storeImage(MultipartFile file, UUID listingId) {
        if (rootLocation == null) {
            init();
        }

        
        validateImage(file);

        try {
            
            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String filename = listingId + "_" + System.currentTimeMillis() + "_" + UUID.randomUUID() + "." + extension;

            Path listingDir = rootLocation.resolve(listingId.toString()).normalize();
            if (!listingDir.startsWith(rootLocation)) {
                throw new SecurityException("Path non valido per il listingId");
            }
            Files.createDirectories(listingDir);

            Path targetLocation = listingDir.resolve(filename).normalize();
            if (!targetLocation.startsWith(rootLocation)) {
                throw new SecurityException("Path destinazione non valido");
            }
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = Paths.get(listingId.toString(), filename).toString();
            log.debug("Immagine salvata: {}", relativePath);
            return relativePath;

        } catch (IOException e) {
            throw new IllegalStateException("Errore nel salvataggio dell'immagine: " + file.getOriginalFilename(), e);
        }
    }

    


    public List<String> storeImages(List<MultipartFile> files, UUID listingId) {
        if (files.size() > maxImagesPerListing) {
            throw new IllegalArgumentException("Massimo " + maxImagesPerListing + " immagini per annuncio");
        }

        return files.stream()
                .map(file -> storeImage(file, listingId))
                .toList();
    }

    


    public void deleteImage(String relativePath) {
        try {
            Path filePath = rootLocation.resolve(relativePath).normalize();
            if (!filePath.startsWith(rootLocation)) {
                log.warn("Tentativo di path traversal in deleteImage: {}", relativePath);
                return;
            }
            Files.deleteIfExists(filePath);
            log.debug("Immagine eliminata");
        } catch (IOException e) {
            log.warn("Errore nell'eliminazione dell'immagine");
        }
    }

    


    public void deleteListingImages(UUID listingId) {
        try {
            Path listingDir = rootLocation.resolve(listingId.toString());
            if (Files.exists(listingDir)) {
                Files.walk(listingDir)
                    .filter(Files::isRegularFile)
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                        } catch (IOException e) {
                            log.warn("Errore eliminazione file durante pulizia listing");
                        }
                    });
                Files.deleteIfExists(listingDir);
                log.debug("Cartella listing eliminata: {}", listingId);
            }
        } catch (IOException e) {
            log.warn("Errore nell'eliminazione della cartella per listingId: {}", listingId);
        }
    }

    


    private void validateImage(MultipartFile file) {
        
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File vuoto");
        }

        
        String filename = file.getOriginalFilename();
        if (filename == null || !isValidExtension(filename)) {
            throw new IllegalArgumentException("Formato file non supportato. Formati consentiti: " + allowedExtensions);
        }

        
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Il file deve essere un'immagine");
        }
    }

    


    private boolean isValidExtension(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        List<String> allowed = Arrays.asList(allowedExtensions.toLowerCase().split(","));
        return allowed.contains(extension);
    }

    


    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }

    


    public Path getImagePath(String relativePath) {
        if (rootLocation == null) {
            init();
        }
        Path filePath = rootLocation.resolve(relativePath).normalize();
        if (!filePath.startsWith(rootLocation)) {
            throw new SecurityException("Accesso negato: path non valido");
        }
        return filePath;
    }
}
