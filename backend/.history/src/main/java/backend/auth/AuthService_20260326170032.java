package backend.auth;

import backend.auth.dto.AuthResponse;
import backend.auth.dto.RegisterRequest;
import backend.user.User;
import backend.user.UserRepository;
import org.springframework.stereotype.Service;

// This service will handle the authentication logic, such as registering users, logging in, and managing sessions.
@Service
public class AuthService {

	private final VerificationService verificationService;
	private final JwtService jwtService;
	private final UserRepository userRepository;

	public AuthService(VerificationService verificationService, JwtService jwtService, UserRepository userRepository) {
		this.verificationService = verificationService;
		this.jwtService = jwtService;
		this.userRepository = userRepository;
	}
	
	public AuthResponse register(RegisterRequest request) {

	    // 1. check email not already taken
	    if (userRepository.existsByEmail(request.email())) {
	        throw new RuntimeException("Email already in use");
	    }
		//2. check if its a slu email
		verificationService.validateSchoolEmail(request.email());

	    // 3. build the user entity
	    User user = new User(request.name(), request.email());
	    user.setPassword(request.password()); // implement password hashing for this;
		userRepository.save(user);

        // 4. generate code and send verification email
        String code = verificationService.generateCode();
    	verificationService.sendVerificationCode(user.getEmail(), code);

		return new AuthResponse("User registered successfully. Please check your email for verification instructions.");
	}

	


	public boolean verifyCode(String email, String code) {
		if (!verificationService.verifyCode(email, code)) {
			return false;
		}

		User user = userRepository.findByEmail(email).orElseThrow();
		user.setVerified(true);
		userRepository.save(user);
		return true;
	}
}
