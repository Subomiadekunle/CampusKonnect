package backend.listing.dto;

public record AiDescriptionRequest(
	String description,
	String serviceType,
	String location,
	String tone
) {}
