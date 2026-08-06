package com.agriconnect.notification;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
class SecurityConfig {
    @Bean
    SecurityFilterChain chain(HttpSecurity h, JwtFilter f) throws Exception {
        return h.csrf(c -> c.disable()).sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(
                        a -> a.requestMatchers("/actuator/health").permitAll().anyRequest().authenticated())
                .addFilterBefore(f, UsernamePasswordAuthenticationFilter.class).build();
    }
}

@Component
class JwtFilter extends OncePerRequestFilter {
    private final byte[] key;

    JwtFilter(@Value("${jwt.secret}") String s) {
        key = Decoders.BASE64.decode(s);
    }

    protected void doFilterInternal(HttpServletRequest q, HttpServletResponse p, FilterChain c)
            throws ServletException, IOException {
        String h = q.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer "))
            try {
                Claims x = Jwts.parserBuilder().setSigningKey(Keys.hmacShaKeyFor(key)).build()
                        .parseClaimsJws(h.substring(7)).getBody();
                SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(
                        x.getSubject(), null, List.of(new SimpleGrantedAuthority("ROLE_" + x.get("role")))));
            } catch (Exception e) {
                p.sendError(401, "Invalid or expired JWT");
                return;
            }
        c.doFilter(q, p);
    }
}
