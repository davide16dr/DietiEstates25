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

    /**
     * Inizializza la directory di upload se non esiste
     */
    public void init() {
        try {
            rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(rootLocation);
            log.info("Directory upload inizializzata: {}", rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Impossibile creare la directory di upload", e);
        }
    }

    /**
     * Salva un'immagine su disco e restituisce il path relativo
     */
    public String storeImage(MultipartFile file, UUID listingId) {
        if (rootLocation == null) {
            init();
        }

        // Validazione file
        validateImage(file);

        try {
            // Nome file univoco: listingId_timestamp_randomUUID.ext
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

            String relativePath = listingId.toString() + "/" + filename;
            log.debug("Immagine salvata: {}", relativePath);
            return relativePath;

        } catch (IOException e) {
            throw new RuntimeException("Errore nel salvataggio dell'immagine: " + file.getOriginalFilename(), e);
        }
    }

    /**
     * Salva multiple immagini e restituisce la lista dei path
     */
    public List<String> storeImages(List<MultipartFile> files, UUID listingId) {
        if (files.size() > maxImagesPerListing) {
            throw new IllegalArgumentException("Massimo " + maxImagesPerListing + " immagini per annuncio");
        }

        return files.stream()
                .map(file -> storeImage(file, listingId))
                .toList();
    }

    /**
     * Elimina un'immagine dal disco
     */
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

    /**
     * Elimina tutte le immagini di un listing
     */
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

    /**
     * Valida formato e dimensione dell'immagine
     */
    private void validateImage(MultipartFile file) {
        // Verifica che il file non sia vuoto
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File vuoto");
        }

        // Verifica estensione
        String filename = file.getOriginalFilename();
        if (filename == null || !isValidExtension(filename)) {
            throw new IllegalArgumentException("Formato file non supportato. Formati consentiti: " + allowedExtensions);
        }

        // Verifica content type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new IllegalArgumentException("Il file deve essere un'immagine");
        }
    }

    /**
     * Verifica se l'estensione è valida
     */
    private boolean isValidExtension(String filename) {
        String extension = getFileExtension(filename).toLowerCase();
        List<String> allowed = Arrays.asList(allowedExtensions.toLowerCase().split(","));
        return allowed.contains(extension);
    }

    /**
     * Estrae l'estensione dal nome file
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }

    /**
     * Ottiene il path assoluto di un'immagine
     */
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
