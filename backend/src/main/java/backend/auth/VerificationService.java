package backend.auth;

import java.security.SecureRandom;
import java.time.Duration;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

//this service willl handle the verification by sending emails with link to users.
@Service
public class VerificationService {
    private final RedisTemplate<String, String> redisTemplate;
    private static final Duration CODE_TTL = Duration.ofMinutes(15);

    public VerificationService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public String generateCode() {
        return String.valueOf(new SecureRandom().nextInt(900000) + 100000);
    }

    public void storeCode(String email, String code) {
        // Redis handles expiry natively — no Instant math needed
        redisTemplate.opsForValue().set("verify:" + email, code, CODE_TTL);
    }

    public void sendVerificationCode(String email, String code) {
        System.out.println("Sending verification code " + code + " to " + email);
    }

    public boolean verifyCode(String email, String code) {
        String stored = redisTemplate.opsForValue().get("verify:" + email);
        if (stored == null || !stored.equals(code)) return false;
        redisTemplate.delete("verify:" + email); // invalidate after use
        return true;
    }

    public void validateSchoolEmail(String email) {
        if (!email.endsWith("@slu.edu")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email must be a SLU email address");
        }
    }
}
