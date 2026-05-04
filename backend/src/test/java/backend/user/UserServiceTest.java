package backend.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

	@Mock
	private UserRepository userRepository;

	@InjectMocks
	private UserService userService;

	@Test
	void updatePreferencesTrimsDeduplicatesAndPreservesOrder() {
		User user = new User("Ramedan Ahmed", "rahmed16@slu.edu");
		when(userRepository.findByEmail("rahmed16@slu.edu")).thenReturn(Optional.of(user));
		when(userRepository.save(user)).thenReturn(user);

		User updated = userService.updatePreferences(
			"rahmed16@slu.edu",
			List.of(" Tutoring ", "", "Photography", "Tutoring", "  ", "Nails")
		);

		assertEquals(List.of("Tutoring", "Photography", "Nails"), updated.getPreferences());
		verify(userRepository).save(user);
	}

	@Test
	void updatePreferencesRejectsNullList() {
		User user = new User("Ramedan Ahmed", "rahmed16@slu.edu");
		when(userRepository.findByEmail("rahmed16@slu.edu")).thenReturn(Optional.of(user));

		ResponseStatusException error = assertThrows(
			ResponseStatusException.class,
			() -> userService.updatePreferences("rahmed16@slu.edu", null)
		);

		assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
		assertEquals("preferences is required", error.getReason());
	}

	@Test
	void updateUniversityTrimsValueBeforeSaving() {
		User user = new User("Ramedan Ahmed", "rahmed16@slu.edu");
		when(userRepository.findByEmail("rahmed16@slu.edu")).thenReturn(Optional.of(user));
		when(userRepository.save(user)).thenReturn(user);

		User updated = userService.updateUniversity("rahmed16@slu.edu", "  Saint Louis University  ");

		assertEquals("Saint Louis University", updated.getUniversity());
		verify(userRepository).save(user);
	}
}
