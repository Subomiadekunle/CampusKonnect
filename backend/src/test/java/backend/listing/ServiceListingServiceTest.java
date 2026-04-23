package backend.listing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import backend.listing.dto.CreateServiceListingRequest;
import backend.listing.dto.AiDescriptionRequest;
import backend.listing.dto.AiDescriptionResponse;
import backend.listing.dto.ServiceListingResponse;
import backend.user.User;
import java.math.BigDecimal;
import backend.user.UserService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class ServiceListingServiceTest {

	@Mock
	private ServiceListingRepository serviceListingRepository;

	@Mock
	private UserService userService;

	@Mock
	private ListingImageStorageService listingImageStorageService;

	@Mock
	private AiDescriptionService aiDescriptionService;

	@InjectMocks
	private ServiceListingService serviceListingService;

	private static final CreateServiceListingRequest VALID_REQUEST = new CreateServiceListingRequest(
		"  Calculus Tutoring  ",
		"  Tutoring  ",
		"  Experienced calculus tutor for STEM classes.  ",
		"  75  ",
		"  Per Hour  ",
		"  Mon/Wed 4pm-7pm  ",
		"  Pius Library  "
	);

	@Test
	void createListingSavesTrimmedValues() {
		User owner = new User("Ramedan Ahmed", "rahmed16@slu.edu");

		when(userService.requireByEmail("rahmed16@slu.edu")).thenReturn(owner);
		when(listingImageStorageService.storeImages(any())).thenReturn(List.of());
		when(serviceListingRepository.save(any(ServiceListing.class))).thenAnswer(invocation -> invocation.getArgument(0));

		ServiceListingResponse result = serviceListingService.createListing("rahmed16@slu.edu", VALID_REQUEST);

		assertEquals("Calculus Tutoring", result.serviceTitle());
		assertEquals("Tutoring", result.category());
		assertEquals("Experienced calculus tutor for STEM classes.", result.description());
		assertEquals("75", result.price());
		assertEquals("Per Hour", result.priceType());
		assertEquals("Mon/Wed 4pm-7pm", result.availability());
		assertEquals("Pius Library", result.serviceArea());
		verify(serviceListingRepository).save(any(ServiceListing.class));
		verify(listingImageStorageService).storeImages(eq(List.of()));
	}

	@Test
	void createListingWithImagesUsesStoredUrls() {
		User owner = new User("Ramedan Ahmed", "rahmed16@slu.edu");
		MockMultipartFile img = new MockMultipartFile("images", "a.jpg", "image/jpeg", new byte[] {1, 2, 3});
		List<String> imageUrls = List.of("/uploads/listings/a.jpg");

		when(userService.requireByEmail("rahmed16@slu.edu")).thenReturn(owner);
		when(listingImageStorageService.storeImages(any())).thenReturn(imageUrls);
		when(serviceListingRepository.save(any(ServiceListing.class))).thenAnswer(invocation -> invocation.getArgument(0));

		ServiceListingResponse result = serviceListingService.createListing(
			"rahmed16@slu.edu",
			VALID_REQUEST,
			List.of(img)
		);

		assertEquals(imageUrls, result.imageUrls());
		verify(listingImageStorageService).storeImages(any());
	}

	@Test
	void createListingRejectsMissingFields() {
		CreateServiceListingRequest request = new CreateServiceListingRequest("  ", "Tutoring", "desc", "20", "Per Hour", "Mon", "Pius");

		ResponseStatusException error = assertThrows(
			ResponseStatusException.class,
			() -> serviceListingService.createListing("rahmed16@slu.edu", request)
		);

		assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
		assertEquals(
			"serviceTitle, category, description, price, priceType, availability, and serviceArea are required",
			error.getReason()
		);
	}

	@Test
	void createListingRejectsInvalidPriceFormat() {
		CreateServiceListingRequest request = new CreateServiceListingRequest(
			"Title",
			"Tutoring",
			"desc",
			"abc",
			"Per Hour",
			"Mon",
			"Pius"
		);

		ResponseStatusException error = assertThrows(
			ResponseStatusException.class,
			() -> serviceListingService.createListing("rahmed16@slu.edu", request)
		);

		assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
		assertEquals("price must be a valid number", error.getReason());
	}

	@Test
	void createListingRejectsNegativePrice() {
		CreateServiceListingRequest request = new CreateServiceListingRequest(
			"Title",
			"Tutoring",
			"desc",
			"-1",
			"Per Hour",
			"Mon",
			"Pius"
		);

		ResponseStatusException error = assertThrows(
			ResponseStatusException.class,
			() -> serviceListingService.createListing("rahmed16@slu.edu", request)
		);

		assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
		assertEquals("price must be zero or greater", error.getReason());
	}

	@Test
	void getAllListingsMapsEntitiesToResponse() {
		User owner = new User("Ramedan Ahmed", "rahmed16@slu.edu");
		ServiceListing listing = new ServiceListing(
			owner,
			"Calc tutoring",
			"Tutoring",
			"Math support",
			new BigDecimal("25"),
			"Per Hour",
			"Mon 4-7",
			"Pius"
		);

		when(serviceListingRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(listing));

		List<ServiceListingResponse> result = serviceListingService.getAllListings();

		assertEquals(1, result.size());
		assertEquals("Calc tutoring", result.getFirst().serviceTitle());
		assertEquals("25", result.getFirst().price());
		assertEquals("Pius", result.getFirst().serviceArea());
		assertEquals("Mon 4-7", result.getFirst().availability());
	}

	@Test
	void getOwnerListingsMapsEntitiesToResponse() {
		User owner = new User("Ramedan Ahmed", "rahmed16@slu.edu");
		ServiceListing listing = new ServiceListing(
			owner,
			"Chem tutoring",
			"Tutoring",
			"Chem support",
			new BigDecimal("30"),
			"Per Hour",
			"Tue 2-4",
			"Ritter"
		);

		when(serviceListingRepository.findAllByOwnerIdOrderByCreatedAtDesc(7L)).thenReturn(List.of(listing));

		List<ServiceListingResponse> result = serviceListingService.getOwnerListings(7L);

		assertEquals(1, result.size());
		assertEquals("Chem tutoring", result.getFirst().serviceTitle());
	}

	@Test
	void improveDescriptionDelegatesToAiService() {
		AiDescriptionRequest request = new AiDescriptionRequest(
			"I can tutor calc",
			"Tutoring",
			"Pius",
			"Professional"
		);
		when(userService.requireByEmail("rahmed16@slu.edu")).thenReturn(new User("Ramedan", "rahmed16@slu.edu"));
		when(aiDescriptionService.improveDescription(any(AiDescriptionRequest.class)))
			.thenReturn("I provide clear and reliable calculus tutoring for students.");

		AiDescriptionResponse response = serviceListingService.improveDescription("rahmed16@slu.edu", request);

		assertEquals("I provide clear and reliable calculus tutoring for students.", response.improvedDescription());
		verify(userService).requireByEmail("rahmed16@slu.edu");
		verify(aiDescriptionService).improveDescription(any(AiDescriptionRequest.class));
	}

	@Test
	void improveDescriptionRejectsMissingDescription() {
		AiDescriptionRequest request = new AiDescriptionRequest("   ", "Tutoring", "Pius", "Professional");

		ResponseStatusException error = assertThrows(
			ResponseStatusException.class,
			() -> serviceListingService.improveDescription("rahmed16@slu.edu", request)
		);

		assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
		assertEquals("description is required", error.getReason());
	}
}
