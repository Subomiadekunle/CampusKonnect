package backend.auth;

import backend.auth.dto.RegisterationResponse;
import backend.auth.dto.AuthResponse;
import backend.auth.dto.LoginRequest;
import backend.auth.dto.RegisterRequest;
import backend.user.User;
import backend.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

// This service will handle the authentication logic, such as registering users, logging in, and managing sessions.
@Service
public class AuthService {

	private final VerificationService verificationService;
	private final JwtService jwtService;
	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	public AuthService(
		VerificationService verificationService,
		JwtService jwtService,
		UserRepository userRepository,
		PasswordEncoder passwordEncoder
	) {
		this.verificationService = verificationService;
		this.jwtService = jwtService;
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}
	
	public RegisterationResponse register(RegisterRequest request) {

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

		return new RegisterationResponse("User registered successfully. Please check your email for verification instructions.");
	}

	private User createUser(RegisterRequest request) {
		User user = new User(request.name(), request.email());
		user.setPassword(passwordEncoder.encode(request.password()));
		return userRepository.save(user);
	}

	private void sendVerification(String email) {
		String code = verificationService.generateCode();
		verificationService.storeCode(email, code);
		verificationService.sendVerificationCode(email, code);
	}

	public AuthResponse verifyAndLogin(String email, String code) {
		if (!verificationService.verifyCode(email, code)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired code");
		}

		User user = userRepository.findByEmail(email).orElseThrow();
		user.setVerified(true);
		userRepository.save(user);

		String token = jwtService.generateToken(user);

		return new AuthResponse(token);
	}
	public AuthResponse login(LoginRequest request) {
		User user = userRepository.findByEmail(request.email())
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		if (!user.isVerified()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Email not verified");
		}

		if (!passwordEncoder.matches(request.password(), user.getPassword())) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid password");
		}

		return new AuthResponse(jwtService.generateToken(user));
	}
}
