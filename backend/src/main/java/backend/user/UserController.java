package backend.user;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import backend.user.dto.UserProfileResponse;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping("/me")
	public ResponseEntity<UserProfileResponse> currentUser(Authentication authentication) {
		User user = userService.requireByEmail(authentication.getName());
		return ResponseEntity.ok(new UserProfileResponse(user.getName(), user.getEmail(), user.getPreferences()));
	}

	@PutMapping("/preferences")
	public ResponseEntity<UserProfileResponse> updatePreferences(
		Authentication authentication,
		@RequestBody List<String> preferences
	) {
		User user = userService.updatePreferences(authentication.getName(), preferences);
		return ResponseEntity.ok(new UserProfileResponse(user.getName(), user.getEmail(), user.getPreferences()));
	}
}
