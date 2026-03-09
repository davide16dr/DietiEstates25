package it.unina.dietiestates25.backend.services;

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
            System.out.println("📁 Directory upload inizializzata: " + rootLocation);
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

            // Crea sottodirectory per listing (migliora organizzazione per centinaia di annunci)
            Path listingDir = rootLocation.resolve(listingId.toString());
            Files.createDirectories(listingDir);

            // Salva il file
            Path targetLocation = listingDir.resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Restituisci path relativo: listings/{listingId}/{filename}
            String relativePath = listingId.toString() + "/" + filename;
            System.out.println("✅ Immagine salvata: " + relativePath);
            
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
            Path filePath = rootLocation.resolve(relativePath);
            Files.deleteIfExists(filePath);
            System.out.println("🗑️ Immagine eliminata: " + relativePath);
        } catch (IOException e) {
            System.err.println("⚠️ Errore nell'eliminazione dell'immagine: " + relativePath);
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
                            System.err.println("⚠️ Errore eliminazione file: " + path);
                        }
                    });
                Files.deleteIfExists(listingDir);
                System.out.println("🗑️ Cartella listing eliminata: " + listingId);
            }
        } catch (IOException e) {
            System.err.println("⚠️ Errore nell'eliminazione della cartella: " + listingId);
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
        return rootLocation.resolve(relativePath);
    }
}
