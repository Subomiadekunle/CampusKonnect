package backend.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import backend.auth.dto.LoginRequest;
import backend.auth.dto.RegisterRequest;
import backend.user.User;
import backend.user.UserRepository;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

	@Mock
	private VerificationService verificationService;

	@Mock
	private JwtService jwtService;

	@Mock
	private UserRepository userRepository;

	@Mock
	private PasswordEncoder passwordEncoder;

	@InjectMocks
	private AuthService authService;

	@Test
	void registerHashesPassword() {
		RegisterRequest request = new RegisterRequest("Sam", "sam@slu.edu", "secret123");
		User savedUser = new User("Sam", "sam@slu.edu");

		when(userRepository.existsByEmail(request.email())).thenReturn(false);
		when(passwordEncoder.encode(request.password())).thenReturn("hashed-password");
		when(verificationService.generateCode()).thenReturn("123456");
		when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
			User user = invocation.getArgument(0);
			savedUser.setPassword(user.getPassword());
			return savedUser;
		});

		authService.register(request);

		assertEquals("hashed-password", savedUser.getPassword());
		verify(verificationService).storeCode("sam@slu.edu", "123456");
	}

	@Test
	void loginWorksWithCorrectPassword() {
		LoginRequest request = new LoginRequest("sam@slu.edu", "secret123");
		User user = new User("Sam", "sam@slu.edu");
		user.setPassword("hashed-password");
		user.setVerified(true);

		when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("secret123", "hashed-password")).thenReturn(true);
		when(jwtService.generateToken(user)).thenReturn("jwt-token");

		assertEquals("jwt-token", authService.login(request).token());
	}

	@Test
	void loginFailsWithWrongPassword() {
		LoginRequest request = new LoginRequest("sam@slu.edu", "wrong");
		User user = new User("Sam", "sam@slu.edu");
		user.setPassword("hashed-password");
		user.setVerified(true);

		when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(user));
		when(passwordEncoder.matches("wrong", "hashed-password")).thenReturn(false);

		RuntimeException error = assertThrows(RuntimeException.class, () -> authService.login(request));

		assertEquals("Invalid password", error.getMessage());
		verify(jwtService, never()).generateToken(any(User.class));
	}

	@Test
	void verifyAndLoginReturnsToken() {
		User user = new User("Sam", "sam@slu.edu");

		when(verificationService.verifyCode("sam@slu.edu", "123456")).thenReturn(true);
		when(userRepository.findByEmail("sam@slu.edu")).thenReturn(Optional.of(user));
		when(jwtService.generateToken(user)).thenReturn("jwt-token");

		assertEquals("jwt-token", authService.verifyAndLogin("sam@slu.edu", "123456").token());
		assertTrue(user.isVerified());
	}

	@Test
	void verifyAndLoginFailsWithBadCode() {
		when(verificationService.verifyCode("sam@slu.edu", "123456")).thenReturn(false);

		assertThrows(
			ResponseStatusException.class,
			() -> authService.verifyAndLogin("sam@slu.edu", "123456")
		);
	}
}
