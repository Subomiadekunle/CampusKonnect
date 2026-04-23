package backend.listing;

import backend.listing.dto.AiDescriptionRequest;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiDescriptionService {

	private static final Logger log = LoggerFactory.getLogger(AiDescriptionService.class);

	private final String apiKey;
	private final String model;
	private final Duration sdkTimeout;

	public AiDescriptionService(
		@Value("${gemini.api-key:}") String apiKey,
		@Value("${gemini.model:gemini-2.5-flash}") String model,
		@Value("${gemini.timeout-seconds:45}") long timeoutSeconds
	) {
		this.apiKey = apiKey == null ? "" : apiKey.trim();
		this.model = model;
		this.sdkTimeout = Duration.ofSeconds(Math.max(10, timeoutSeconds));
	}

	public String improveDescription(AiDescriptionRequest request) {
		if (isBlank(apiKey)) {
			throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "AI description service is unavailable right now");
		}

		try (Client client = Client.builder().apiKey(apiKey).build()) {
			String prompt = buildPrompt(request);
			GenerateContentResponse response = client.async.models
				.generateContent(model, prompt, null)
				.get(sdkTimeout.toSeconds(), TimeUnit.SECONDS);
			String generatedText = response.text();
			if (isBlank(generatedText)) {
				throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "AI service returned an empty response");
			}
			return sanitizeGeneratedDescription(generatedText);
		} catch (java.util.concurrent.TimeoutException e) {
			throw new ResponseStatusException(
				HttpStatus.GATEWAY_TIMEOUT,
				"AI service timed out. Please try again in a few seconds."
			);
		} catch (ResponseStatusException e) {
			throw e;
		} catch (Exception e) {
			log.error("Gemini request failed (model={}): {}", model, e.getMessage(), e);
			throw new ResponseStatusException(
				HttpStatus.BAD_GATEWAY,
				"AI service request failed. Check GEMINI_API_KEY and GEMINI_MODEL."
			);
		}
	}

	private String buildPrompt(AiDescriptionRequest request) {
		return """
			You are helping a student service provider improve a listing description.
			Rewrite the description to be clear, appealing, and professional.

			Rules:
			- Do not invent services, prices, credentials, or guarantees.
			- Preserve original meaning and constraints.
			- Keep it concise (about 80-140 words unless original is shorter).
			- Use plain text only, no markdown.
			- If text is already strong, return a lightly improved version.

			Context:
			Service type: %s
			Location: %s
			Tone: %s

			Original description:
			%s
			""".formatted(
			defaultValue(request.serviceType()),
			defaultValue(request.location()),
			defaultValue(request.tone()),
			request.description().trim()
		);
	}

	private String sanitizeGeneratedDescription(String value) {
		return value
			.replace("```", "")
			.trim();
	}

	private String defaultValue(String value) {
		return isBlank(value) ? "Not provided" : value.trim();
	}

	private boolean isBlank(String value) {
		return value == null || value.trim().isEmpty();
	}
}
