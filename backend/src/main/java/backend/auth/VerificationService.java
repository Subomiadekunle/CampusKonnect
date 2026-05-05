package backend.auth;

import java.security.SecureRandom;
import java.time.Duration;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class VerificationService {

	private final StringRedisTemplate redisTemplate;

	private static final Duration CODE_TTL = Duration.ofMinutes(15);

	public VerificationService(StringRedisTemplate redisTemplate) {
		this.redisTemplate = redisTemplate;
	}

	public String generateCode() {
		return String.valueOf(new SecureRandom().nextInt(900000) + 100000);
	}

	public void storeCode(String email, String code) {
		redisTemplate.opsForValue().set("verify:" + email, code, CODE_TTL);
	}

	public void sendVerificationCode(String email, String code) {
		// Temporary local-only behavior until email provider is configured.
		System.out.println("Verification code for " + email + ": " + code);
	}

	public boolean verifyCode(String email, String code) {
		String stored = redisTemplate.opsForValue().get("verify:" + email);
		if (stored == null || !stored.equals(code)) {
			return false;
		}
		redisTemplate.delete("verify:" + email);
		return true;
	}

	public void validateSchoolEmail(String email) {
		if (!email.endsWith("@slu.edu")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email must be a SLU email address");
		}
	}
	
}
