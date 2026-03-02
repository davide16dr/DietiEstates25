package it.unina.dietiestates25.backend.utils;

import java.security.SecureRandom;
import java.util.Random;

public class PasswordGenerator {

    private static final String UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final String LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
    private static final String DIGITS = "0123456789";
    private static final String SPECIAL_CHARS = "!@#$%^&*";
    private static final String ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SPECIAL_CHARS;
    
    private static final Random RANDOM = new SecureRandom();

    /**
     * Genera una password provvisoria sicura di 12 caratteri
     * Contiene: maiuscole, minuscole, numeri e caratteri speciali
     */
    public static String generateTemporaryPassword() {
        StringBuilder password = new StringBuilder();
        
        // Assicura almeno un carattere per ogni categoria
        password.append(UPPERCASE.charAt(RANDOM.nextInt(UPPERCASE.length())));
        password.append(LOWERCASE.charAt(RANDOM.nextInt(LOWERCASE.length())));
        password.append(DIGITS.charAt(RANDOM.nextInt(DIGITS.length())));
        password.append(SPECIAL_CHARS.charAt(RANDOM.nextInt(SPECIAL_CHARS.length())));
        
        // Riempie il resto con caratteri casuali
        for (int i = 4; i < 12; i++) {
            password.append(ALL_CHARS.charAt(RANDOM.nextInt(ALL_CHARS.length())));
        }
        
        // Mescola la password
        String result = password.toString();
        char[] chars = result.toCharArray();
        for (int i = 0; i < chars.length; i++) {
            int randomIndex = RANDOM.nextInt(chars.length);
            char temp = chars[i];
            chars[i] = chars[randomIndex];
            chars[randomIndex] = temp;
        }
        
        return new String(chars);
    }
}
