package it.unina.dietiestates25.backend;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import it.unina.dietiestates25.backend.entities.Agency;
import it.unina.dietiestates25.backend.entities.Listing;
import it.unina.dietiestates25.backend.entities.ListingImage;
import it.unina.dietiestates25.backend.entities.Property;
import it.unina.dietiestates25.backend.entities.User;
import it.unina.dietiestates25.backend.entities.enums.ListingStatus;
import it.unina.dietiestates25.backend.entities.enums.ListingType;
import it.unina.dietiestates25.backend.entities.enums.PropertyStatus;
import it.unina.dietiestates25.backend.entities.enums.UserRole;
import it.unina.dietiestates25.backend.repositories.AgencyRepository;
import it.unina.dietiestates25.backend.repositories.ListingImageRepository;
import it.unina.dietiestates25.backend.repositories.ListingRepository;
import it.unina.dietiestates25.backend.repositories.PropertyRepository;
import it.unina.dietiestates25.backend.repositories.UserRepository;
import it.unina.dietiestates25.backend.services.UserService;

@Component
public class DataSeeder implements CommandLineRunner {

    private final AgencyRepository agencyRepository;
    private final PropertyRepository propertyRepository;
    private final ListingRepository listingRepository;
    private final ListingImageRepository listingImageRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;

    public DataSeeder(AgencyRepository agencyRepository,
                      PropertyRepository propertyRepository,
                      ListingRepository listingRepository,
                      ListingImageRepository listingImageRepository,
                      UserRepository userRepository,
                      PasswordEncoder passwordEncoder,
                      UserService userService) {
        this.agencyRepository = agencyRepository;
        this.propertyRepository = propertyRepository;
        this.listingRepository = listingRepository;
        this.listingImageRepository = listingImageRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userService = userService;
    }

    @Override
    public void run(String... args) {
        try {
            runSeeding();
        } catch (Exception e) {
            System.out.println("⚠️ Seeding saltato (tabelle non ancora create): " + e.getMessage());
        }
    }

    private void runSeeding() {

        Agency agency = null;
        if (agencyRepository.count() == 0) {
            agency = new Agency();
            agency.setId(UUID.randomUUID());
            agency.setName("Agenzia Immobiliare Napoli Centro");
            agency.setVatNumber("12345678901");
            agency.setAddress("Via Toledo 256");
            agency.setCity("Napoli");
            agency.setPhoneE164("+390212345678");
            agency.setEmail("info@agenziamc.it");
            agency = agencyRepository.save(agency);
            System.out.println("🏢 Agenzia creata: " + agency.getName());
        } else {
            agency = agencyRepository.findAll().get(0);
            System.out.println("🏢 Agenzia esistente: " + agency.getName());
        }

        
        agency.setName("Agenzia Immobiliare Napoli Centro");
        agency.setAddress("Via Toledo 256");
        agency.setCity("Napoli");
        agency = agencyRepository.save(agency);
        
        createTestUsers(agency);

        
        if (listingRepository.count() >= 15) {
            enforceNapoliMajorityOnExistingData();
            System.out.println("✅ Database già popolato con abbastanza dati, skip seeding properties");
            return;
        }

        System.out.println("🌱 Inizio popolamento database con proprietà di test...");

        

        
        Property prop1 = createProperty(agency, "Napoli", "Via Monte Napoleone 15", 
            45.4689, 9.1963, "Appartamento", 4, 2, 120, 3, true, "A",
            "Elegante appartamento nel cuore di Napoli");
        prop1 = propertyRepository.save(prop1);

        Listing listing1 = createListing(prop1, ListingType.SALE, 450000, 
            "Elegante Appartamento in Centro",
            "Splendido appartamento di 120 mq completamente ristrutturato. 4 locali, 2 bagni, cucina abitabile, doppi servizi. Classe energetica A.");
        listing1 = listingRepository.save(listing1);
        
        createImage(listing1, "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800", 0);

        
        Property prop2 = createProperty(agency, "Napoli", "Piazza Duomo 1",
            45.4642, 9.1900, "Attico", 5, 3, 180, 8, true, "A",
            "Attico di lusso con terrazzo panoramico");
        prop2 = propertyRepository.save(prop2);

        Listing listing2 = createListing(prop2, ListingType.SALE, 890000,
            "Attico con Terrazzo Panoramico",
            "Magnifico attico di 180 mq con terrazzo di 60 mq. Vista mozzafiato sul Duomo. 5 locali, 3 bagni, cucina professionale.");
        listing2 = listingRepository.save(listing2);
        
        createImage(listing2, "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800", 0);

        
        Property prop3 = createProperty(agency, "Napoli", "Alzaia Naviglio Grande 42",
            45.4484, 9.1732, "Bilocale", 2, 1, 55, 2, false, "C",
            "Bilocale moderno zona Navigli");
        prop3 = propertyRepository.save(prop3);

        Listing listing3 = createListing(prop3, ListingType.RENT, 1200,
            "Bilocale Moderno zona Navigli",
            "Grazioso bilocale appena ristrutturato in una zona centrale di Napoli. 2 locali, bagno nuovo, cucina a vista.");
        listing3 = listingRepository.save(listing3);
        
        createImage(listing3, "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800", 0);

        
        Property prop4 = createProperty(agency, "Napoli", "Corso Buenos Aires 10",
            45.4783, 9.2058, "Trilocale", 3, 1, 98, 4, true, "A",
            "Trilocale ristrutturato zona Buenos Aires");
        prop4 = propertyRepository.save(prop4);

        Listing listing4 = createListing(prop4, ListingType.SALE, 520000,
            "Trilocale Ristrutturato",
            "Bellissimo trilocale completamente ristrutturato. 3 locali, bagno nuovo, cucina moderna, balcone. Zona ben servita.");
        listing4 = listingRepository.save(listing4);
        
        createImage(listing4, "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", 0);

        
        Property prop5 = createProperty(agency, "Napoli", "Via Tortona 30",
            45.4509, 9.1654, "Loft", 3, 2, 140, 1, false, "A",
            "Loft di design in zona Tortona");
        prop5 = propertyRepository.save(prop5);

        Listing listing5 = createListing(prop5, ListingType.SALE, 750000,
            "Loft di Design",
            "Straordinario loft open space di 140 mq. Soffitti alti, travi a vista, design contemporaneo. Zona Tortona Fashion District.");
        listing5 = listingRepository.save(listing5);
        
        createImage(listing5, "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800", 0);

        
        Property prop6 = createProperty(agency, "Napoli", "Viale Sabotino 5",
            45.4512, 9.2019, "Monolocale", 1, 1, 35, 1, false, "B",
            "Monolocale zona Porta Romana");
        prop6 = propertyRepository.save(prop6);

        Listing listing6 = createListing(prop6, ListingType.RENT, 950,
            "Monolocale in zona Porta Romana",
            "Comodo monolocale arredato. Angolo cottura, bagno con doccia. Ideale per studenti o professionisti.");
        listing6 = listingRepository.save(listing6);
        
        createImage(listing6, "https://images.unsplash.com/photo-1502672260066-6bc35f0f1edb?w=800", 0);

        
        Property prop7 = createProperty(agency, "Napoli", "Via Inganni 85",
            45.4621, 9.1182, "Villa", 6, 3, 250, 0, false, "B",
            "Villa indipendente con giardino");
        prop7 = propertyRepository.save(prop7);

        Listing listing7 = createListing(prop7, ListingType.SALE, 1200000,
            "Villa con Giardino Privato",
            "Splendida villa indipendente di 250 mq con giardino di 500 mq. 6 locali, 3 bagni, taverna, box doppio. Zona residenziale tranquilla.");
        listing7 = listingRepository.save(listing7);
        
        createImage(listing7, "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800", 0);

        
        Property prop8 = createProperty(agency, "Napoli", "Via Vittor Pisani 12",
            45.4847, 9.2023, "Appartamento", 3, 1, 85, 5, true, "C",
            "Appartamento zona Stazione Centrale");
        prop8 = propertyRepository.save(prop8);

        Listing listing8 = createListing(prop8, ListingType.RENT, 1800,
            "Appartamento zona Centrale",
            "Appartamento luminoso vicino alla Stazione Centrale. 3 locali, bagno, cucina separata. Ideale per professionisti.");
        listing8 = listingRepository.save(listing8);
        
        createImage(listing8, "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800", 0);

        
        Property prop9 = createProperty(agency, "Napoli", "Corso Sempione 45",
            45.4773, 9.1672, "Penthouse", 4, 2, 160, 10, true, "A",
            "Penthouse esclusivo zona Arco della Pace");
        prop9 = propertyRepository.save(prop9);

        Listing listing9 = createListing(prop9, ListingType.SALE, 980000,
            "Penthouse con Vista Skyline",
            "Esclusivo penthouse di 160 mq con terrazzo panoramico. Vista sullo skyline di Napoli. 4 locali, 2 bagni, finiture di pregio.");
        listing9 = listingRepository.save(listing9);
        
        createImage(listing9, "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", 0);

        
        Property prop10 = createProperty(agency, "Napoli", "Via Confalonieri 8",
            45.4868, 9.1876, "Bilocale", 2, 1, 60, 3, true, "B",
            "Bilocale moderno zona Isola");
        prop10 = propertyRepository.save(prop10);

        Listing listing10 = createListing(prop10, ListingType.SALE, 320000,
            "Bilocale Design zona Isola",
            "Moderno bilocale nel cuore del quartiere Isola. 2 locali, bagno, cucina a vista. Finiture contemporanee, vicino a Bosco Verticale.");
        listing10 = listingRepository.save(listing10);
        
        createImage(listing10, "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800", 0);

        
        Property prop11 = createProperty(agency, "Napoli", "Piazza Tre Torri 2",
            45.4703, 9.1524, "Trilocale", 3, 2, 95, 12, true, "A",
            "Trilocale moderno City Life");
        prop11 = propertyRepository.save(prop11);

        Listing listing11 = createListing(prop11, ListingType.RENT, 2500,
            "Trilocale di Lusso City Life",
            "Elegante trilocale nel complesso City Life. 3 locali, 2 bagni, cucina open space. Vista sulle Tre Torri, piscina condominiale.");
        listing11 = listingRepository.save(listing11);
        
        createImage(listing11, "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800", 0);

        
        Property prop12 = createProperty(agency, "Napoli", "Via Ripamonti 200",
            45.4289, 9.2089, "Rustico", 4, 2, 180, 0, false, "D",
            "Rustico ristrutturato con corte");
        prop12 = propertyRepository.save(prop12);

        Listing listing12 = createListing(prop12, ListingType.SALE, 550000,
            "Rustico con Corte Privata",
            "Affascinante rustico ristrutturato con corte privata. 4 locali, 2 bagni, travi a vista, camino. Atmosfera unica a Napoli.");
        listing12 = listingRepository.save(listing12);
        
        createImage(listing12, "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800", 0);

        
        Property prop13 = createProperty(agency, "Napoli", "Via Fiori Chiari 5",
            45.4715, 9.1856, "Studio", 1, 1, 40, 2, false, "C",
            "Studio nel cuore di Brera");
        prop13 = propertyRepository.save(prop13);

        Listing listing13 = createListing(prop13, ListingType.RENT, 1100,
            "Studio Artistico Brera",
            "Caratteristico studio nel quartiere Brera. Soffitti affrescati, pavimento originale. Ideale per artisti o creativi.");
        listing13 = listingRepository.save(listing13);
        
        createImage(listing13, "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800", 0);

        
        Property prop14 = createProperty(agency, "Napoli", "Viale Papiniano 42",
            45.4589, 9.1678, "Quadrilocale", 4, 2, 130, 6, true, "B",
            "Quadrilocale signorile zona Sant'Agostino");
        prop14 = propertyRepository.save(prop14);

        Listing listing14 = createListing(prop14, ListingType.SALE, 680000,
            "Quadrilocale Signorile",
            "Elegante quadrilocale in palazzo d'epoca. 4 locali, 2 bagni, doppia esposizione. Parquet, stucchi, cantina e posto auto.");
        listing14 = listingRepository.save(listing14);
        
        createImage(listing14, "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800", 0);

        
        Property prop15 = createProperty(agency, "Napoli", "Via Celoria 18",
            45.4756, 9.2278, "Appartamento", 2, 1, 50, 1, false, "D",
            "Appartamento zona Città Studi");
        prop15 = propertyRepository.save(prop15);

        Listing listing15 = createListing(prop15, ListingType.RENT, 850,
            "Appartamento per Studenti",
            "Appartamento ideale per studenti vicino al Politecnico. 2 locali, bagno, cucina. Affitto a canone concordato.");
        listing15 = listingRepository.save(listing15);
        
        createImage(listing15, "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800", 0);

        
        Property prop16 = createProperty(agency, "Napoli", "Via Brera 28",
            45.4721, 9.1868, "Appartamento", 3, 2, 110, 2, false, "A+",
            "Appartamento di design nel cuore di Brera");
        prop16 = propertyRepository.save(prop16);

        Listing listing16 = createListing(prop16, ListingType.SALE, 620000,
            "Appartamento di Design Brera",
            "Esclusivo appartamento di 110 mq nel prestigioso quartiere Brera. Completamente ristrutturato con finiture di lusso. 3 locali, 2 bagni, cucina open space designer, pavimenti in rovere. Classe energetica A+.");
        
        
        User agenteSofia = userRepository.findByEmail("agente2@dietiestates.it").orElse(null);
        if (agenteSofia != null) {
            listing16.setAgent(agenteSofia);
            System.out.println("🏠 Immobile gestito da: " + agenteSofia.getFirstName() + " " + agenteSofia.getLastName());
        }
        
        listing16 = listingRepository.save(listing16);
        
        createImage(listing16, "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800", 0);

        System.out.println("✅ Database popolato con successo! 16 annunci e 4 utenti di test inseriti.");
    }

    private void createTestUsers(Agency agency) {
        
        if (!userRepository.existsByEmail("admin@dietiestates.it")) {
            User admin = new User();
            admin.setId(UUID.randomUUID());
            admin.setEmail("admin@dietiestates.it");
            admin.setPasswordHash(passwordEncoder.encode("Admin123!"));
            admin.setFirstName("Admin");
            admin.setLastName("Sistema");
            admin.setRole(UserRole.ADMIN);
            admin.setActive(true);
            admin = userRepository.save(admin);
            System.out.println("👤 Admin creato: admin@dietiestates.it / Admin123!");
        }

        
        if (!userRepository.existsByEmail("agente@dietiestates.it")) {
            User agent = new User();
            agent.setId(UUID.randomUUID());
            agent.setEmail("agente@dietiestates.it");
            agent.setPasswordHash(passwordEncoder.encode("Agente123!"));
            agent.setFirstName("Marco");
            agent.setLastName("Rossi");
            agent.setRole(UserRole.AGENT);
            agent.setActive(true);
            agent.setPhoneE164("+393331234567");
            agent.setAgencyId(agency.getId());
            agent = userRepository.save(agent);
            
            userService.addAgencyMembershipIfNeeded(agent);
            System.out.println("👤 Agente creato: agente@dietiestates.it / Agente123! (Agenzia: " + agency.getName() + ")");
        } else {
            
            User agent = userRepository.findByEmail("agente@dietiestates.it").orElse(null);
            if (agent != null && agent.getAgencyId() == null) {
                agent.setAgencyId(agency.getId());
                agent = userRepository.save(agent);
                userService.addAgencyMembershipIfNeeded(agent);
                System.out.println("👤 Agente aggiornato con agenzia: " + agency.getName());
            }
        }

        
        if (!userRepository.existsByEmail("agente2@dietiestates.it")) {
            User agent2 = new User();
            agent2.setId(UUID.randomUUID());
            agent2.setEmail("agente2@dietiestates.it");
            agent2.setPasswordHash(passwordEncoder.encode("Agente2123!"));
            agent2.setFirstName("Sofia");
            agent2.setLastName("Verde");
            agent2.setRole(UserRole.AGENT);
            agent2.setActive(true);
            agent2.setPhoneE164("+393339876543");
            agent2.setAgencyId(agency.getId());
            agent2 = userRepository.save(agent2);
            
            userService.addAgencyMembershipIfNeeded(agent2);
            System.out.println("👤 Secondo Agente creato: agente2@dietiestates.it / Agente2123! (Agenzia: " + agency.getName() + ")");
        } else {
            
            User agent2 = userRepository.findByEmail("agente2@dietiestates.it").orElse(null);
            if (agent2 != null && agent2.getAgencyId() == null) {
                agent2.setAgencyId(agency.getId());
                agent2 = userRepository.save(agent2);
                userService.addAgencyMembershipIfNeeded(agent2);
                System.out.println("👤 Secondo Agente aggiornato con agenzia: " + agency.getName());
            }
        }

        
        if (!userRepository.existsByEmail("cliente@dietiestates.it")) {
            User client = new User();
            client.setId(UUID.randomUUID());
            client.setEmail("cliente@dietiestates.it");
            client.setPasswordHash(passwordEncoder.encode("Cliente123!"));
            client.setFirstName("Laura");
            client.setLastName("Bianchi");
            client.setRole(UserRole.CLIENT);
            client.setActive(true);
            client.setPhoneE164("+393337654321");
            client = userRepository.save(client);
            System.out.println("👤 Cliente creato: cliente@dietiestates.it / Cliente123!");
        }

        
        if (!userRepository.existsByEmail("gestore@dietiestates.it")) {
            User gestore = new User();
            gestore.setId(UUID.randomUUID());
            gestore.setEmail("gestore@dietiestates.it");
            gestore.setPasswordHash(passwordEncoder.encode("Gestore123!"));
            gestore.setFirstName("Mario");
            gestore.setLastName("Verdi");
            gestore.setRole(UserRole.AGENCY_MANAGER);
            gestore.setActive(true);
            gestore.setPhoneE164("+393338765432");
            gestore.setAgencyId(agency.getId());
            gestore = userRepository.save(gestore);
            
            userService.addAgencyMembershipIfNeeded(gestore);
            System.out.println("👤 Gestore creato: gestore@dietiestates.it / Gestore123! (Agenzia: " + agency.getName() + ")");
        } else {
            
            User gestore = userRepository.findByEmail("gestore@dietiestates.it").orElse(null);
            if (gestore != null && gestore.getAgencyId() == null) {
                gestore.setAgencyId(agency.getId());
                gestore = userRepository.save(gestore);
                userService.addAgencyMembershipIfNeeded(gestore);
                System.out.println("👤 Gestore aggiornato con agenzia: " + agency.getName());
            }
        }
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
        p.setLatitude(BigDecimal.valueOf(lat));
        p.setLongitude(BigDecimal.valueOf(lng));
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

    private void enforceNapoliMajorityOnExistingData() {
        List<Property> allProperties = propertyRepository.findAll();
        if (allProperties.isEmpty()) {
            return;
        }

        long napoliCount = allProperties.stream()
            .filter(p -> p.getCity() != null && p.getCity().equalsIgnoreCase("Napoli"))
            .count();

        int requiredNapoliMajority = (allProperties.size() / 2) + 1;
        if (napoliCount >= requiredNapoliMajority) {
            return;
        }

        int toConvert = (int) (requiredNapoliMajority - napoliCount);
        List<Property> changed = new ArrayList<>();
        for (Property property : allProperties) {
            if (toConvert == 0) {
                break;
            }

            String city = property.getCity();
            if (city == null || !city.equalsIgnoreCase("Napoli")) {
                property.setCity("Napoli");
                changed.add(property);
                toConvert--;
            }
        }

        if (!changed.isEmpty()) {
            propertyRepository.saveAll(changed);
            System.out.println("📍 Aggiornate " + changed.size() + " proprietà per garantire maggioranza su Napoli");
        }
    }
}