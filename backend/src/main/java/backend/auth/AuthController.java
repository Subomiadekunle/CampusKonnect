package backend.auth;

import backend.auth.dto.AuthResponse;
import backend.auth.dto.RegisterRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	//Registration
	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
		AuthResponse response = authService.register(request);
		return ResponseEntity.ok(response);
	}


	@PostMapping("/verify")
	public ResponseEntity<String> verifyEmail(@RequestParam String email, @RequestParam String code) {
		 boolean isVerified = authService.verifyCode(email, code);
		 if (isVerified) {
			return ResponseEntity.ok("Email verified successfully!");
		} else {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid or expired code");
		}	
	}
}
