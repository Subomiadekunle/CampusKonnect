package backend.listing;

import backend.listing.dto.CreateServiceListingRequest;
import backend.listing.dto.ServiceListingResponse;
import backend.user.User;
import backend.user.UserService;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServiceListingService {

	private final ServiceListingRepository serviceListingRepository;
	private final UserService userService;
	private final ListingImageStorageService listingImageStorageService;

	public ServiceListingService(
		ServiceListingRepository serviceListingRepository,
		UserService userService,
		ListingImageStorageService listingImageStorageService
	) {
		this.serviceListingRepository = serviceListingRepository;
		this.userService = userService;
		this.listingImageStorageService = listingImageStorageService;
	}

	@Transactional
	public ServiceListingResponse createListing(String ownerEmail, CreateServiceListingRequest request) {
		return createListing(ownerEmail, request, List.of());
	}

	@Transactional
	public ServiceListingResponse createListing(
		String ownerEmail,
		CreateServiceListingRequest request,
		List<MultipartFile> images
	) {
		validateCreateRequest(request);

		User owner = userService.requireByEmail(ownerEmail);
		ServiceListing listing = new ServiceListing(
			owner,
			request.serviceTitle().trim(),
			request.category().trim(),
			request.description().trim(),
			parsePrice(request.price()),
			request.priceType().trim(),
			request.availability().trim(),
			request.serviceArea().trim()
		);
		listing.setImageUrls(listingImageStorageService.storeImages(images));
		ServiceListing saved = serviceListingRepository.save(listing);
		return ServiceListingResponse.fromEntity(saved);
	}

	public List<ServiceListingResponse> getOwnerListings(Long ownerId) {
		return serviceListingRepository.findAllByOwnerIdOrderByCreatedAtDesc(ownerId)
			.stream()
			.map(ServiceListingResponse::fromEntity)
			.toList();
	}

	public Long requireOwnerIdByEmail(String email) {
		return userService.requireByEmail(email).getId();
	}

	public List<ServiceListingResponse> getAllListings() {
		return serviceListingRepository.findAllByOrderByCreatedAtDesc()
			.stream()
			.map(ServiceListingResponse::fromEntity)
			.toList();
	}

	private void validateCreateRequest(CreateServiceListingRequest request) {
		if (request == null
			|| isBlank(request.serviceTitle())
			|| isBlank(request.category())
			|| isBlank(request.description())
			|| isBlank(request.price())
			|| isBlank(request.priceType())
			|| isBlank(request.availability())
			|| isBlank(request.serviceArea())) {
			throw new ResponseStatusException(
				HttpStatus.BAD_REQUEST,
				"serviceTitle, category, description, price, priceType, availability, and serviceArea are required"
			);
		}
	}

	private BigDecimal parsePrice(String value) {
		try {
			BigDecimal parsed = new BigDecimal(value.trim());
			if (parsed.signum() < 0) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "price must be zero or greater");
			}
			return parsed;
		} catch (NumberFormatException ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "price must be a valid number");
		}
	}

	private boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}
}
