package it.unina.dietiestates25.backend.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import it.unina.dietiestates25.backend.security.JwtAuthFilter;
import it.unina.dietiestates25.backend.security.RateLimitFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String API_LISTINGS_WILDCARD = "/api/listings/*";
    private static final String ROLE_AGENT = "AGENT";
    private static final String ROLE_AGENCY_MANAGER = "AGENCY_MANAGER";

    private final JwtAuthFilter jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter, RateLimitFilter rateLimitFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.rateLimitFilter = rateLimitFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Permetti sia localhost che gli ambienti su AWS
        configuration.setAllowedOrigins(List.of(
            "http://localhost:4200",
            "http://localhost:3000",
            "https://d1k0s1b2zzl0qx.cloudfront.net",
            "https://dietiestates25-amplify.web.app",
            "http://dietiestates25-2-env.eba-kzrqphfm.eu-south-1.elasticbeanstalk.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(cto -> {})
                .referrerPolicy(referrer ->
                    referrer.policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                .addHeaderWriter(new StaticHeadersWriter(
                    "Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()"))
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                    "/api/auth/**",
                    "/auth/**",
                    "/auth/oauth",
                    "/auth/oauth/**",
                    "/error",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/ws/**",
                    "/uploads/**"
                ).permitAll()
                // Endpoint pubblici solo GET per listings
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/listings", "/api/listings/search", API_LISTINGS_WILDCARD).permitAll()
                // Endpoint privati per agenti
                .requestMatchers("/api/listings/agent/**").hasRole(ROLE_AGENT)
                // Endpoint privati per manager e admin
                .requestMatchers("/api/listings/agency/**").hasAnyRole(ROLE_AGENCY_MANAGER, "ADMIN")
                // PUT/DELETE su listings richiedono AGENT o MANAGER
                .requestMatchers(org.springframework.http.HttpMethod.PUT, API_LISTINGS_WILDCARD).hasAnyRole(ROLE_AGENT, ROLE_AGENCY_MANAGER)
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, API_LISTINGS_WILDCARD).hasAnyRole(ROLE_AGENT, ROLE_AGENCY_MANAGER)
                .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
