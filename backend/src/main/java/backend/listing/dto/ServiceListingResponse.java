package backend.listing.dto;

import backend.listing.ServiceListing;
import java.time.Instant;
import java.util.List;

public record ServiceListingResponse(
	Long id,
	Long ownerId,
	String serviceTitle,
	String category,
	String description,
	String price,
	String priceType,
	String availability,
	String serviceArea,
	List<String> imageUrls,
	Instant createdAt,
	Instant updatedAt
) {
	public static ServiceListingResponse fromEntity(ServiceListing listing) {
		return new ServiceListingResponse(
			listing.getId(),
			listing.getOwner().getId(),
			listing.getServiceTitle(),
			listing.getCategory(),
			listing.getDescription(),
			listing.getPrice().toPlainString(),
			listing.getPriceType(),
			listing.getAvailability(),
			listing.getServiceArea(),
			listing.getImageUrls(),
			listing.getCreatedAt(),
			listing.getUpdatedAt()
		);
	}
}
