package backend.listing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.assertThrows;

import backend.listing.dto.CreateServiceListingRequest;
import backend.listing.dto.AiDescriptionRequest;
import backend.listing.dto.AiDescriptionResponse;
import backend.listing.dto.ServiceListingResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ServiceListingControllerTest {

	@Mock
	private ServiceListingService serviceListingService;

	@Mock
	private Authentication authentication;

	@InjectMocks
	private ServiceListingController serviceListingController;

	private static final CreateServiceListingRequest REQUEST = new CreateServiceListingRequest(
		"Calc tutoring",
		"Tutoring",
		"Math support",
		"25",
		"Per Hour",
		"Mon 4-7",
		"Pius"
	);

	@Test
	void createListingReturnsCreatedResponse() {
		ServiceListingResponse expected = new ServiceListingResponse(
			1L,
			2L,
			"Calc tutoring",
			"Tutoring",
			"Math support",
			"25",
			"Per Hour",
			"Mon 4-7",
			"Pius",
			List.of(),
			null,
			null
		);

		when(authentication.getName()).thenReturn("rahmed16@slu.edu");
		when(serviceListingService.createListing("rahmed16@slu.edu", REQUEST)).thenReturn(expected);

		ResponseEntity<ServiceListingResponse> response = serviceListingController.createListing(authentication, REQUEST);

		assertEquals(HttpStatus.CREATED, response.getStatusCode());
		assertEquals("Calc tutoring", response.getBody().serviceTitle());
		verify(serviceListingService).createListing("rahmed16@slu.edu", REQUEST);
	}

	@Test
	void createListingWithImagesReturnsCreatedResponse() {
		String listingJson = """
			{
			  "serviceTitle":"Calc tutoring",
			  "category":"Tutoring",
			  "description":"Math support",
			  "price":"25",
			  "priceType":"Per Hour",
			  "availability":"Mon 4-7",
			  "serviceArea":"Pius"
			}
			""";
		MockMultipartFile image = new MockMultipartFile("images", "a.jpg", "image/jpeg", new byte[] {1});
		ServiceListingResponse expected = new ServiceListingResponse(
			1L,
			2L,
			"Calc tutoring",
			"Tutoring",
			"Math support",
			"25",
			"Per Hour",
			"Mon 4-7",
			"Pius",
			List.of("/uploads/listings/a.jpg"),
			null,
			null
		);

		when(authentication.getName()).thenReturn("rahmed16@slu.edu");
		when(serviceListingService.createListing(
			org.mockito.ArgumentMatchers.eq("rahmed16@slu.edu"),
			org.mockito.ArgumentMatchers.any(CreateServiceListingRequest.class),
			org.mockito.ArgumentMatchers.anyList()
		)).thenReturn(expected);

		ResponseEntity<ServiceListingResponse> response = serviceListingController.createListingWithImages(
			authentication,
			listingJson,
			List.of(image)
		);

		assertEquals(HttpStatus.CREATED, response.getStatusCode());
		assertEquals(1L, response.getBody().id());
	}

	@Test
	void createListingWithImagesRejectsInvalidJson() {
		ResponseStatusException error = assertThrows(
			ResponseStatusException.class,
			() -> serviceListingController.createListingWithImages(authentication, "{invalid-json", List.of())
		);

		assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
		assertEquals("Invalid listing payload", error.getReason());
	}

	@Test
	void getAllListingsReturnsOkWithBody() {
		List<ServiceListingResponse> expected = List.of(
			new ServiceListingResponse(1L, 2L, "Calc tutoring", "Tutoring", "Math support", "25", "Per Hour", "Mon 4-7", "Pius", List.of(), null, null)
		);
		when(serviceListingService.getAllListings()).thenReturn(expected);

		ResponseEntity<List<ServiceListingResponse>> response = serviceListingController.getAllListings();

		assertEquals(HttpStatus.OK, response.getStatusCode());
		assertEquals(1, response.getBody().size());
		verify(serviceListingService).getAllListings();
	}

	@Test
	void getMyListingsReturnsOkWithOwnerListings() {
		List<ServiceListingResponse> expected = List.of(
			new ServiceListingResponse(1L, 2L, "Calc tutoring", "Tutoring", "Math support", "25", "Per Hour", "Mon 4-7", "Pius", List.of(), null, null)
		);
		when(authentication.getName()).thenReturn("rahmed16@slu.edu");
		when(serviceListingService.requireOwnerIdByEmail("rahmed16@slu.edu")).thenReturn(2L);
		when(serviceListingService.getOwnerListings(2L)).thenReturn(expected);

		ResponseEntity<List<ServiceListingResponse>> response = serviceListingController.getMyListings(authentication);

		assertEquals(HttpStatus.OK, response.getStatusCode());
		assertEquals(1, response.getBody().size());
		verify(serviceListingService).requireOwnerIdByEmail("rahmed16@slu.edu");
		verify(serviceListingService).getOwnerListings(2L);
	}

	@Test
	void improveDescriptionReturnsImprovedText() {
		AiDescriptionRequest request = new AiDescriptionRequest("help with calculus and physics", "Tutoring", "Pius", "Professional");
		AiDescriptionResponse expected = new AiDescriptionResponse("I provide clear calculus and physics tutoring sessions.");

		when(authentication.getName()).thenReturn("rahmed16@slu.edu");
		when(serviceListingService.improveDescription("rahmed16@slu.edu", request)).thenReturn(expected);

		ResponseEntity<AiDescriptionResponse> response = serviceListingController.improveDescription(authentication, request);

		assertEquals(HttpStatus.OK, response.getStatusCode());
		assertEquals(expected.improvedDescription(), response.getBody().improvedDescription());
		verify(serviceListingService).improveDescription("rahmed16@slu.edu", request);
	}
}
