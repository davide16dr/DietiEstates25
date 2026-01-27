import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class HashPassword {
    public static void main(String[] args) {
        if (args.length == 0) {
            System.out.println("Usage: java HashPassword <password>");
            return;
        }
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode(args[0]);
        System.out.println("Password: " + args[0]);
        System.out.println("BCrypt Hash: " + hash);
        
        // Verifica che l'hash funzioni
        boolean matches = encoder.matches(args[0], hash);
        System.out.println("Verification: " + matches);
    }
}
