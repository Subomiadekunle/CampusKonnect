package backend.auth;

import backend.auth.dto.AuthResponse;
import backend.auth.dto.LoginRequest;
import backend.auth.dto.RegisterRequest;
import backend.auth.dto.RegisterationResponse;
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
	public ResponseEntity<RegisterationResponse> register(@RequestBody RegisterRequest request) {
		return ResponseEntity.ok(authService.register(request));
	}


	@PostMapping("/verify")
	public ResponseEntity<AuthResponse> verifyEmail(@RequestParam String email, @RequestParam String code) {
		return ResponseEntity.ok(authService.verifyAndLogin(email, code));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
    	return ResponseEntity.ok(authService.login(request));
	}
}
