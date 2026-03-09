package it.unina.dietiestates25.backend.repositories;

import it.unina.dietiestates25.backend.entities.ListingImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ListingImageRepository extends JpaRepository<ListingImage, UUID> {
    /**
     * Trova tutte le immagini di un listing
     */
    List<ListingImage> findByListingId(UUID listingId);
    
    /**
     * Trova tutte le immagini di un listing con query nativa che bypassa la cache
     * Usato dopo eliminazioni per garantire dati freschi dal database
     */
    @Query(value = "SELECT * FROM listing_images WHERE listing_id = :listingId ORDER BY sort_order", 
           nativeQuery = true)
    List<ListingImage> findByListingIdNative(@Param("listingId") UUID listingId);
    
    /**
     * Elimina tutte le immagini di un listing che NON sono in una lista di URL specificata
     * Questo metodo esegue l'eliminazione direttamente nel database
     */
    @Modifying
    @Query(value = "DELETE FROM listing_images WHERE listing_id = :listingId AND url NOT IN (:urlsToKeep)", 
           nativeQuery = true)
    void deleteByListingIdAndUrlNotIn(@Param("listingId") UUID listingId, @Param("urlsToKeep") List<String> urlsToKeep);
    
    /**
     * Elimina tutte le immagini di un listing
     */
    @Modifying
    @Query(value = "DELETE FROM listing_images WHERE listing_id = :listingId", 
           nativeQuery = true)
    void deleteAllByListingId(@Param("listingId") UUID listingId);
}
