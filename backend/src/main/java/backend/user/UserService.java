package backend.user;

<<<<<<< HEAD
import java.util.List;
=======
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
>>>>>>> fda74ba070091679cd9d10c2bc5f3f94a72855f0

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

	private static final int MAX_PREFERENCE_COUNT = 20;
	private static final int MAX_PREFERENCE_LENGTH = 80;
	private static final int MAX_UNIVERSITY_LENGTH = 120;

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
<<<<<<< HEAD
		user.setPreferences(preferences);
=======
		user.setPreferences(sanitizePreferences(preferences));
>>>>>>> fda74ba070091679cd9d10c2bc5f3f94a72855f0
		return userRepository.save(user);
	}

	public User updateUniversity(String email, String university) {
<<<<<<< HEAD
		User user = requireByEmail(email);
		user.setUniversity(university);
		return userRepository.save(user);
	}
=======
		String normalizedUniversity = normalizeUniversity(university);
		User user = requireByEmail(email);
		user.setUniversity(normalizedUniversity);
		return userRepository.save(user);
	}

	private List<String> sanitizePreferences(List<String> preferences) {
		if (preferences == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "preferences is required");
		}
		if (preferences.size() > MAX_PREFERENCE_COUNT) {
			throw new ResponseStatusException(
				HttpStatus.BAD_REQUEST,
				"preferences must include " + MAX_PREFERENCE_COUNT + " items or fewer"
			);
		}

		Set<String> cleaned = new LinkedHashSet<>();
		for (String preference : preferences) {
			if (preference == null) {
				continue;
			}
			String normalized = preference.trim();
			if (normalized.isEmpty()) {
				continue;
			}
			if (normalized.length() > MAX_PREFERENCE_LENGTH) {
				throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"each preference must be " + MAX_PREFERENCE_LENGTH + " characters or fewer"
				);
			}
			cleaned.add(normalized);
		}

		return List.copyOf(cleaned);
	}

	private String normalizeUniversity(String university) {
		if (university == null || university.trim().isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "university is required");
		}
		String normalized = university.trim();
		if (normalized.length() > MAX_UNIVERSITY_LENGTH) {
			throw new ResponseStatusException(
				HttpStatus.BAD_REQUEST,
				"university must be " + MAX_UNIVERSITY_LENGTH + " characters or fewer"
			);
		}
		return normalized;
	}
>>>>>>> fda74ba070091679cd9d10c2bc5f3f94a72855f0
}
