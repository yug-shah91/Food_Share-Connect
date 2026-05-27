package com.foodshare.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtils {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(String username) {
        return Jwts.builder()
                .subject(username)                          // replaces setSubject()
                .issuedAt(new Date())                       // replaces setIssuedAt()
                .expiration(new Date(System.currentTimeMillis() + jwtExpirationMs)) // replaces setExpiration()
                .signWith(getSigningKey())                  // no algorithm needed in 0.12.x
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parser()                                // replaces parserBuilder()
                .verifyWith(getSigningKey())                // replaces setSigningKey()
                .build()
                .parseSignedClaims(token)                   // replaces parseClaimsJws()
                .getPayload()                               // replaces getBody()
                .getSubject();
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        try {
            String username = getUsernameFromToken(token);
            return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isTokenExpired(String token) {
        Date expiration = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getExpiration();
        return expiration.before(new Date());
    }
}
