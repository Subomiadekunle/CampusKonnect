package backend.listing;

import backend.listing.dto.CreateServiceListingRequest;
import backend.listing.dto.AiDescriptionRequest;
import backend.listing.dto.AiDescriptionResponse;
import backend.listing.dto.ServiceListingResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/listings")
public class ServiceListingController {

	private final ServiceListingService serviceListingService;
	private final ObjectMapper objectMapper = new ObjectMapper();

	public ServiceListingController(ServiceListingService serviceListingService) {
		this.serviceListingService = serviceListingService;
	}

	@PostMapping(consumes = "application/json")
	public ResponseEntity<ServiceListingResponse> createListing(
		Authentication authentication,
		@RequestBody CreateServiceListingRequest request
	) {
		ServiceListingResponse response = serviceListingService.createListing(authentication.getName(), request);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@PostMapping(consumes = "multipart/form-data")
	public ResponseEntity<ServiceListingResponse> createListingWithImages(
		Authentication authentication,
		@RequestPart("listing") String listingJson,
		@RequestPart(value = "images", required = false) List<MultipartFile> images
	) {
		CreateServiceListingRequest request = parseListingJson(listingJson);
		ServiceListingResponse response = serviceListingService.createListing(authentication.getName(), request, images);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}

	@GetMapping
	public ResponseEntity<List<ServiceListingResponse>> getAllListings() {
		return ResponseEntity.ok(serviceListingService.getAllListings());
	}

	@GetMapping("/mine")
	public ResponseEntity<List<ServiceListingResponse>> getMyListings(Authentication authentication) {
		Long ownerId = serviceListingService.requireOwnerIdByEmail(authentication.getName());
		return ResponseEntity.ok(serviceListingService.getOwnerListings(ownerId));
	}

	@PostMapping(path = "/ai-description", consumes = "application/json")
	public ResponseEntity<AiDescriptionResponse> improveDescription(
		Authentication authentication,
		@RequestBody AiDescriptionRequest request
	) {
		return ResponseEntity.ok(serviceListingService.improveDescription(authentication.getName(), request));
	}

	private CreateServiceListingRequest parseListingJson(String listingJson) {
		try {
			return objectMapper.readValue(listingJson, CreateServiceListingRequest.class);
		} catch (JsonProcessingException e) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid listing payload");
		}
	}
}
