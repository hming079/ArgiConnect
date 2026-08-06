package com.agriconnect.auth;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import java.util.*;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtTokens {
    private final String secret;
    private final long expiration;

    public JwtTokens(@Value("${jwt.secret}") String s, @Value("${jwt.expiration}") long e) {
        secret = s;
        expiration = e;
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    public String create(UserRecord u) {
        return Jwts.builder().setSubject(String.valueOf(u.id())).claim("userId", u.id()).claim("email", u.email())
                .claim("role", u.role()).claim("roles", List.of(u.role())).setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration)).signWith(key()).compact();
    }

    public Claims parse(String t) {
        return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(t).getBody();
    }
}
