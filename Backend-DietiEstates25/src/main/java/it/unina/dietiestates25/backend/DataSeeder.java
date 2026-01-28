package it.unina.dietiestates25.backend;

import it.unina.dietiestates25.backend.entities.*;
import it.unina.dietiestates25.backend.entities.enums.*;
import it.unina.dietiestates25.backend.repositories.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class DataSeeder implements CommandLineRunner {

    private final AgencyRepository agencyRepository;
    private final PropertyRepository propertyRepository;
    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;

    public DataSeeder(AgencyRepository agencyRepository,
                      PropertyRepository propertyRepository,
                      ListingRepository listingRepository,
                      ListingImageRepository listingImageRepository) {
        this.agencyRepository = agencyRepository;
        this.propertyRepository = propertyRepository;
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
    }

    @Override
    public void run(String... args) {
        // Evita di inserire dati se già esistono
        if (listingRepository.count() > 0) {
            System.out.println("✅ Database già popolato, skip seeding");
            return;
        }

        System.out.println("🌱 Inizio popolamento database...");

        // Crea agenzia
        Agency agency = new Agency();
        agency.setId(UUID.randomUUID());
        agency.setName("Agenzia Immobiliare Milano Centro");
        agency.setVatNumber("12345678901");
        agency.setAddress("Via Dante 10");
        agency.setCity("Milano");
        agency.setPhoneE164("+390212345678");
        agency.setEmail("info@agenziamc.it");
        agency = agencyRepository.save(agency);

        // Proprietà 1 - Appartamento in vendita
        Property prop1 = createProperty(agency, "Milano", "Via Monte Napoleone 15", 
            45.4689, 9.1963, "Appartamento", 4, 2, 120, 3, true, "A",
            "Elegante appartamento nel cuore di Milano");
        prop1 = propertyRepository.save(prop1);

        Listing listing1 = createListing(prop1, ListingType.SALE, 450000, 
            "Elegante Appartamento in Centro",
            "Splendido appartamento di 120 mq completamente ristrutturato. 4 locali, 2 bagni, cucina abitabile, doppi servizi. Classe energetica A.");
        listing1 = listingRepository.save(listing1);
        
        createImage(listing1, "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", 0);

        // Proprietà 2 - Attico in vendita
        Property prop2 = createProperty(agency, "Milano", "Piazza Duomo 1",
            45.4642, 9.1900, "Attico", 5, 3, 180, 8, true, "A",
            "Attico di lusso con terrazzo panoramico");
        prop2 = propertyRepository.save(prop2);

        Listing listing2 = createListing(prop2, ListingType.SALE, 890000,
            "Attico con Terrazzo Panoramico",
            "Magnifico attico di 180 mq con terrazzo di 60 mq. Vista mozzafiato sul Duomo. 5 locali, 3 bagni, cucina professionale.");
        listing2 = listingRepository.save(listing2);
        
        createImage(listing2, "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800", 0);

        // Proprietà 3 - Bilocale in affitto
        Property prop3 = createProperty(agency, "Milano", "Alzaia Naviglio Grande 42",
            45.4484, 9.1732, "Bilocale", 2, 1, 55, 2, false, "C",
            "Bilocale moderno zona Navigli");
        prop3 = propertyRepository.save(prop3);

        Listing listing3 = createListing(prop3, ListingType.RENT, 1200,
            "Bilocale Moderno zona Navigli",
            "Grazioso bilocale appena ristrutturato nella zona più trendy di Milano. 2 locali, bagno nuovo, cucina a vista.");
        listing3 = listingRepository.save(listing3);
        
        createImage(listing3, "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800", 0);

        // Proprietà 4 - Trilocale in vendita
        Property prop4 = createProperty(agency, "Milano", "Corso Buenos Aires 10",
            45.4783, 9.2058, "Trilocale", 3, 1, 98, 4, true, "A",
            "Trilocale ristrutturato zona Buenos Aires");
        prop4 = propertyRepository.save(prop4);

        Listing listing4 = createListing(prop4, ListingType.SALE, 520000,
            "Trilocale Ristrutturato",
            "Bellissimo trilocale completamente ristrutturato. 3 locali, bagno nuovo, cucina moderna, balcone. Zona ben servita.");
        listing4 = listingRepository.save(listing4);
        
        createImage(listing4, "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", 0);

        // Proprietà 5 - Loft in vendita
        Property prop5 = createProperty(agency, "Milano", "Via Tortona 30",
            45.4509, 9.1654, "Loft", 3, 2, 140, 1, false, "A",
            "Loft di design in zona Tortona");
        prop5 = propertyRepository.save(prop5);

        Listing listing5 = createListing(prop5, ListingType.SALE, 750000,
            "Loft di Design",
            "Straordinario loft open space di 140 mq. Soffitti alti, travi a vista, design contemporaneo. Zona Tortona Fashion District.");
        listing5 = listingRepository.save(listing5);
        
        createImage(listing5, "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800", 0);

        // Proprietà 6 - Monolocale in affitto
        Property prop6 = createProperty(agency, "Milano", "Viale Sabotino 5",
            45.4512, 9.2019, "Monolocale", 1, 1, 35, 1, false, "B",
            "Monolocale zona Porta Romana");
        prop6 = propertyRepository.save(prop6);

        Listing listing6 = createListing(prop6, ListingType.RENT, 950,
            "Monolocale in zona Porta Romana",
            "Comodo monolocale arredato. Angolo cottura, bagno con doccia. Ideale per studenti o professionisti.");
        listing6 = listingRepository.save(listing6);
        
        createImage(listing6, "https://images.unsplash.com/photo-1502672260066-6bc35f0f1edb?w=800", 0);

        // Proprietà 7 - Villa con giardino in vendita
        Property prop7 = createProperty(agency, "Milano", "Via Inganni 85",
            45.4621, 9.1182, "Villa", 6, 3, 250, 0, false, "B",
            "Villa indipendente con giardino");
        prop7 = propertyRepository.save(prop7);

        Listing listing7 = createListing(prop7, ListingType.SALE, 1200000,
            "Villa con Giardino Privato",
            "Splendida villa indipendente di 250 mq con giardino di 500 mq. 6 locali, 3 bagni, taverna, box doppio. Zona residenziale tranquilla.");
        listing7 = listingRepository.save(listing7);
        
        createImage(listing7, "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", 0);

        // Proprietà 8 - Appartamento in affitto zona Centrale
        Property prop8 = createProperty(agency, "Milano", "Via Vittor Pisani 12",
            45.4847, 9.2023, "Appartamento", 3, 1, 85, 5, true, "C",
            "Appartamento zona Stazione Centrale");
        prop8 = propertyRepository.save(prop8);

        Listing listing8 = createListing(prop8, ListingType.RENT, 1800,
            "Appartamento zona Centrale",
            "Appartamento luminoso vicino alla Stazione Centrale. 3 locali, bagno, cucina separata. Ideale per professionisti.");
        listing8 = listingRepository.save(listing8);
        
        createImage(listing8, "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800", 0);

        // Proprietà 9 - Penthouse in vendita
        Property prop9 = createProperty(agency, "Milano", "Corso Sempione 45",
            45.4773, 9.1672, "Penthouse", 4, 2, 160, 10, true, "A",
            "Penthouse esclusivo zona Arco della Pace");
        prop9 = propertyRepository.save(prop9);

        Listing listing9 = createListing(prop9, ListingType.SALE, 980000,
            "Penthouse con Vista Skyline",
            "Esclusivo penthouse di 160 mq con terrazzo panoramico. Vista sullo skyline di Milano. 4 locali, 2 bagni, finiture di pregio.");
        listing9 = listingRepository.save(listing9);
        
        createImage(listing9, "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", 0);

        // Proprietà 10 - Bilocale in vendita Isola
        Property prop10 = createProperty(agency, "Milano", "Via Confalonieri 8",
            45.4868, 9.1876, "Bilocale", 2, 1, 60, 3, true, "B",
            "Bilocale moderno zona Isola");
        prop10 = propertyRepository.save(prop10);

        Listing listing10 = createListing(prop10, ListingType.SALE, 320000,
            "Bilocale Design zona Isola",
            "Moderno bilocale nel cuore del quartiere Isola. 2 locali, bagno, cucina a vista. Finiture contemporanee, vicino a Bosco Verticale.");
        listing10 = listingRepository.save(listing10);
        
        createImage(listing10, "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800", 0);

        // Proprietà 11 - Trilocale in affitto City Life
        Property prop11 = createProperty(agency, "Milano", "Piazza Tre Torri 2",
            45.4703, 9.1524, "Trilocale", 3, 2, 95, 12, true, "A",
            "Trilocale moderno City Life");
        prop11 = propertyRepository.save(prop11);

        Listing listing11 = createListing(prop11, ListingType.RENT, 2500,
            "Trilocale di Lusso City Life",
            "Elegante trilocale nel complesso City Life. 3 locali, 2 bagni, cucina open space. Vista sulle Tre Torri, piscina condominiale.");
        listing11 = listingRepository.save(listing11);
        
        createImage(listing11, "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800", 0);

        // Proprietà 12 - Rustico in vendita
        Property prop12 = createProperty(agency, "Milano", "Via Ripamonti 200",
            45.4289, 9.2089, "Rustico", 4, 2, 180, 0, false, "D",
            "Rustico ristrutturato con corte");
        prop12 = propertyRepository.save(prop12);

        Listing listing12 = createListing(prop12, ListingType.SALE, 550000,
            "Rustico con Corte Privata",
            "Affascinante rustico ristrutturato con corte privata. 4 locali, 2 bagni, travi a vista, camino. Atmosfera unica a Milano.");
        listing12 = listingRepository.save(listing12);
        
        createImage(listing12, "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800", 0);

        // Proprietà 13 - Studio in affitto Brera
        Property prop13 = createProperty(agency, "Milano", "Via Fiori Chiari 5",
            45.4715, 9.1856, "Studio", 1, 1, 40, 2, false, "C",
            "Studio nel cuore di Brera");
        prop13 = propertyRepository.save(prop13);

        Listing listing13 = createListing(prop13, ListingType.RENT, 1100,
            "Studio Artistico Brera",
            "Caratteristico studio nel quartiere Brera. Soffitti affrescati, pavimento originale. Ideale per artisti o creativi.");
        listing13 = listingRepository.save(listing13);
        
        createImage(listing13, "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800", 0);

        // Proprietà 14 - Quadrilocale in vendita
        Property prop14 = createProperty(agency, "Milano", "Viale Papiniano 42",
            45.4589, 9.1678, "Quadrilocale", 4, 2, 130, 6, true, "B",
            "Quadrilocale signorile zona Sant'Agostino");
        prop14 = propertyRepository.save(prop14);

        Listing listing14 = createListing(prop14, ListingType.SALE, 680000,
            "Quadrilocale Signorile",
            "Elegante quadrilocale in palazzo d'epoca. 4 locali, 2 bagni, doppia esposizione. Parquet, stucchi, cantina e posto auto.");
        listing14 = listingRepository.save(listing14);
        
        createImage(listing14, "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800", 0);

        // Proprietà 15 - Appartamento in affitto Città Studi
        Property prop15 = createProperty(agency, "Milano", "Via Celoria 18",
            45.4756, 9.2278, "Appartamento", 2, 1, 50, 1, false, "D",
            "Appartamento zona Città Studi");
        prop15 = propertyRepository.save(prop15);

        Listing listing15 = createListing(prop15, ListingType.RENT, 850,
            "Appartamento per Studenti",
            "Appartamento ideale per studenti vicino al Politecnico. 2 locali, bagno, cucina. Affitto a canone concordato.");
        listing15 = listingRepository.save(listing15);
        
        createImage(listing15, "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800", 0);

        System.out.println("✅ Database popolato con successo! 15 annunci inseriti.");
    }

    private Property createProperty(Agency agency, String city, String address,
                                    double lat, double lng, String type,
                                    int rooms, int bathrooms, int area, int floor,
                                    boolean elevator, String energyClass, String description) {
        Property p = new Property();
        p.setId(UUID.randomUUID());
        p.setAgency(agency);
        p.setCity(city);
        p.setAddress(address);
        p.setLatitude(new BigDecimal(lat));
        p.setLongitude(new BigDecimal(lng));
        p.setPropertyType(type);
        p.setRooms(rooms);
        p.setBathrooms(bathrooms);
        p.setAreaM2(area);
        p.setFloor(floor);
        p.setElevator(elevator);
        p.setEnergyClass(energyClass);
        p.setDescription(description);
        p.setStatus(PropertyStatus.AVAILABLE);
        return p;
    }

    private Listing createListing(Property property, ListingType type, int price,
                                  String title, String description) {
        Listing l = new Listing();
        l.setId(UUID.randomUUID());
        l.setProperty(property);
        l.setType(type);
        l.setStatus(ListingStatus.ACTIVE);
        l.setPriceAmount(price);
        l.setCurrency("EUR");
        l.setTitle(title);
        l.setPublicText(description);
        return l;
    }

    private void createImage(Listing listing, String url, int sortOrder) {
        ListingImage img = new ListingImage();
        img.setId(UUID.randomUUID());
        img.setListing(listing);
        img.setUrl(url);
        img.setSortOrder(sortOrder);
        listingImageRepository.save(img);
    }
}
