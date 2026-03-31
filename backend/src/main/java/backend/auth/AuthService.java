package backend.auth;

import org.springframework.stereotype.Service;

import backend.auth.dto.AuthResponse;
import backend.auth.dto.LoginRequest;
import backend.auth.dto.RegisterRequest;
import backend.user.User;
import backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

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
	        throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
	    }
		//2. check if its a slu email
		verificationService.validateSchoolEmail(request.email());

	    // 3. build the user entity
		User user = createUser(request);

        // 4. generate code and send verification email
		sendVerification(request.email());

		return new AuthResponse("User registered successfully. Please check your email for verification instructions.");
	}

	private User createUser(RegisterRequest request) {
		User user = new User(request.name(), request.email());
		user.setPassword(request.password()); // add hashing here in the future
		return userRepository.save(user);
	}

	private void sendVerification(String email) {
		String code = verificationService.generateCode();
		verificationService.storeCode(email, code);
		verificationService.sendVerificationCode(email, code);
	}

	


	public boolean verifyCodeRecieved(String email, String code) {
		if (!verificationService.verifyCode(email, code)) {
			return false;
		}

		User user = userRepository.findByEmail(email).orElseThrow();
		user.setVerified(true);
		userRepository.save(user);
		return true;
	}
	public AuthResponse login(LoginRequest request) {

    // 1. Find user by email
    User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new RuntimeException("User not found"));

    // 2. Check if user is verified (optional but recommended)
    if (!user.isVerified()) {
        throw new RuntimeException("Email not verified");
    }

    // 3. Check password
    if (!user.getPassword().equals(request.password())) {
        throw new RuntimeException("Invalid password");
    }

    // 4. Generate JWT token
	String token = jwtService.generateToken(user);
	
    // 5. Return token
    return new AuthResponse(token);
}
}


