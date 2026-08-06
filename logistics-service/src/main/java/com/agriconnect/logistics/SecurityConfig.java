package com.agriconnect.logistics;

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
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
@EnableMethodSecurity
class SecurityConfig {
    @Bean
    SecurityFilterChain chain(HttpSecurity h, JwtFilter f) throws Exception {
        return h.csrf(c -> c.disable()).sessionManagement(
                s -> s.sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a.requestMatchers("/actuator/health", "/internal/**").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(f, UsernamePasswordAuthenticationFilter.class).build();
    }
}

@org.springframework.stereotype.Component
class JwtFilter extends OncePerRequestFilter {
    private final byte[] secret;

    JwtFilter(@Value("${jwt.secret}") String s) {
        secret = Decoders.BASE64.decode(s);
    }

    protected void doFilterInternal(HttpServletRequest r, HttpServletResponse p, FilterChain c)
            throws ServletException, IOException {
        String h = r.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer "))
            try {
                Claims x = Jwts.parserBuilder().setSigningKey(Keys.hmacShaKeyFor(secret)).build()
                        .parseClaimsJws(h.substring(7)).getBody();
                String role = String.valueOf(x.get("role"));
                var a = new UsernamePasswordAuthenticationToken(x.getSubject(), null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role)));
                SecurityContextHolder.getContext().setAuthentication(a);
            } catch (Exception e) {
                p.sendError(401, "Invalid or expired JWT");
                return;
            }
        c.doFilter(r, p);
    }
}
