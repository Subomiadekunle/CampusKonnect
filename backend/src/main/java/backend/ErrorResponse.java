package backend;

public record ErrorResponse(
	String message,
	int status
) {
}
