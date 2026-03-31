package backend.auth;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import backend.user.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;


// This service creates and reads signed JWTs for authenticated users.
@Service
public class JwtService {

	private final SecretKey signingKey;;
	private final long expirationMs;

	public JwtService(
		@Value("${jwt.secret}") String secret,
		@Value("${jwt.expiration-ms:86400000}") long expirationMs
	) {
		this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.expirationMs = expirationMs;
	}

	public String extractEmail(String token) {
		return extractAllClaims(token).getSubject();
	}

	public String generateToken(User user) {
		Date now = new Date();
		Date expiration = new Date(now.getTime() + expirationMs);

		return Jwts.builder()
			.subject(user.getEmail())
			.issuedAt(now)
			.expiration(expiration)
			.signWith(signingKey)
			.compact();
	}

	private Claims extractAllClaims(String token) {
		return Jwts.parser()
			.verifyWith(signingKey)
			.build()
			.parseSignedClaims(token)
			.getPayload();
	}
    public boolean isTokenValid(String token, User user) {
        try {
            String email = extractEmail(token);
            boolean notExpired = extractAllClaims(token)
                .getExpiration().after(new Date());
            return email.equals(user.getEmail()) && notExpired;
        } catch (Exception e) {
            return false;
        }
    }
}
