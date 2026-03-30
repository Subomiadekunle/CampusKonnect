package backend;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<ErrorResponse> handleResponseStatusException(ResponseStatusException exception) {
		String message = exception.getReason() != null ? exception.getReason() : "Request failed";
		int status = exception.getStatusCode().value();

		return ResponseEntity
			.status(exception.getStatusCode())
			.body(new ErrorResponse(message, status));
	}
}
