package it.unina.dietiestates25.backend.security;

import java.io.IOException;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Protegge /auth/login da attacchi brute-force:
 * max 10 tentativi per IP in una finestra di 15 minuti.
 */
@Component
@Order(1)
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private static final int  MAX_ATTEMPTS = 10;
    private static final long WINDOW_MS    = 15 * 60 * 1000L; // 15 minuti

    private final ConcurrentHashMap<String, Deque<Long>> loginAttempts = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !("/auth/login".equals(request.getRequestURI())
                && "POST".equals(request.getMethod()));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String ip  = request.getRemoteAddr();
        long   now = System.currentTimeMillis();

        Deque<Long> timestamps = loginAttempts.computeIfAbsent(ip, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            timestamps.removeIf(t -> now - t > WINDOW_MS);

            if (timestamps.size() >= MAX_ATTEMPTS) {
                log.warn("Rate limit superato per IP: {}", ip);
                response.setStatus(429);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                    "{\"error\":\"Troppi tentativi di accesso. Riprova tra qualche minuto.\"}"
                );
                return;
            }

            timestamps.addLast(now);
        }

        chain.doFilter(request, response);
    }
}
