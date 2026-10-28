package com.gameword.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    // Claim chua users.token_version luc cap token
    private static final String VERSION_CLAIM = "ver";

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration:86400000}")
    private Long expiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username, int tokenVersion) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expiration);
        return io.jsonwebtoken.Jwts.builder()
            .subject(username)
            .claim(VERSION_CLAIM, tokenVersion)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(getSigningKey())
            .compact();
    }

    private Claims parseClaims(String token) {
        return io.jsonwebtoken.Jwts.parser()
            .verifyWith(getSigningKey())
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    // Token cap truoc khi co claim "ver" duoc coi la version 0
    public int extractTokenVersion(String token) {
        Integer version = parseClaims(token).get(VERSION_CLAIM, Integer.class);
        return version == null ? 0 : version;
    }

    public boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return extractedUsername.equals(username) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return parseClaims(token).getExpiration().before(new Date());
    }
}
