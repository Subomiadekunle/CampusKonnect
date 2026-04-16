package backend.listing.dto;

public record CreateServiceListingRequest(
	String serviceTitle,
	String category,
	String description,
	String price,
	String priceType,
	String availability,
	String serviceArea
) {
}
