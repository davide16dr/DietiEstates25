package it.unina.dietiestates25.backend.utils;

import java.security.SecureRandom;

public class PasswordGenerator {

    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL_CHARS = "!@#$%&*";
    private static final String ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SPECIAL_CHARS;
    
    private static final SecureRandom RANDOM = new SecureRandom();

    /**
     * Genera una password provvisoria sicura di 12 caratteri
     * Contiene: almeno 1 maiuscola, 1 minuscola, 1 numero e 1 carattere speciale
     */
    public static String generateTemporaryPassword() {
        StringBuilder password = new StringBuilder(12);
        
        // Assicura almeno un carattere per ogni categoria richiesta
        password.append(UPPERCASE.charAt(RANDOM.nextInt(UPPERCASE.length())));
        password.append(LOWERCASE.charAt(RANDOM.nextInt(LOWERCASE.length())));
        password.append(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));
        password.append(SPECIAL_CHARS.charAt(RANDOM.nextInt(SPECIAL_CHARS.length())));
        
        // Riempie i restanti 8 caratteri con caratteri casuali
        for (int i = 4; i < 12; i++) {
            password.append(ALL_CHARS.charAt(RANDOM.nextInt(ALL_CHARS.length())));
        }
        
        // Mescola i caratteri per rendere la password più casuale
        return shuffleString(password.toString());
    }
    
    /**
     * Mescola i caratteri di una stringa in modo casuale
     */
    private static String shuffleString(String input) {
        char[] chars = input.toCharArray();
        
        // Fisher-Yates shuffle algorithm
        for (int i = chars.length - 1; i > 0; i--) {
            int j = RANDOM.nextInt(i + 1);
            char temp = chars[i];
            chars[i] = chars[j];
            chars[j] = temp;
        }
        
        return new String(chars);
    }
}
