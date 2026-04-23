package backend.user;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

	private final UserRepository userRepository;

	public UserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	public User requireByEmail(String email) {
		return userRepository.findByEmail(email)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
	}

	public User updatePreferences(String email, List<String> preferences) {
		User user = requireByEmail(email);
		user.setPreferences(preferences);
		return userRepository.save(user);
	}

	public User updateUniversity(String email, String university) {
		User user = requireByEmail(email);
		user.setUniversity(university);
		return userRepository.save(user);
	}
}
