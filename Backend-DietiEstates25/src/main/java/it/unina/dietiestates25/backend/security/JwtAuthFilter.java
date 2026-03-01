package it.unina.dietiestates25.backend.security;

import java.io.IOException;
import java.util.List;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;

    public JwtAuthFilter(JwtService jwtService, UserDetailsServiceImpl userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Salta il filtro JWT SOLO per gli endpoint pubblici specifici
        return path.startsWith("/auth/") || 
               path.equals("/api/listings") || // Solo GET senza ID
               path.matches("^/api/listings/[a-f0-9-]{36}$") || // GET per UUID specifico
               path.startsWith("/v3/api-docs/") ||
               path.startsWith("/swagger-ui/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = auth.substring(7);
        String username;
        try {
            username = jwtService.extractUsername(token);
        } catch (Exception e) {
            chain.doFilter(request, response);
            return;
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails details = userDetailsService.loadUserByUsername(username);
            if (jwtService.isTokenValid(token, details.getUsername())) {
                // Estrai i ruoli dai claims del token
                var claims = jwtService.extractAllClaims(token);
                var roles = (String) claims.get("role");

                // Log per il debug dei ruoli estratti
                System.out.println("Ruoli estratti dal token: " + roles);
                System.out.println("Claims estratti: " + claims);

                // Crea le authorities basate sui ruoli
                var authorities = List.of(new SimpleGrantedAuthority("ROLE_" + roles));

                // Imposta l'autenticazione con i ruoli
                var authToken = new UsernamePasswordAuthenticationToken(
                        details, null, authorities
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        chain.doFilter(request, response);
    }
}
