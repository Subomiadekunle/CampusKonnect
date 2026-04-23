package backend.user.dto;

import java.util.List;

public record UserProfileResponse(String name, String email, List<String> preferences, String university) {
}
