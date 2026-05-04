package backend.listing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

class ListingLocationGeocodingServiceTest {

	private TestHarness harness;

	@AfterEach
	void tearDown() {
		if (harness != null) {
			harness.close();
		}
	}

	@Test
	void resolveCoordinatesReturnsNearbyBoundedCampusMatch() throws IOException {
		harness = new TestHarness();
		harness.enqueue("Saint Louis University", false, response("38.6368", "-90.2349"));
		harness.enqueue("Spring Hall, Saint Louis University", true, response("38.6371", "-90.2362"));

		ListingLocationGeocodingService.ListingCoordinates coordinates = harness.service.resolveCoordinates(
			new ListingLocationGeocodingService.CreateListingLocationRequest(
				"Spring Hall",
				"Saint Louis University",
				null,
				null
			)
		);

		assertEquals(38.6371, coordinates.latitude());
		assertEquals(-90.2362, coordinates.longitude());
	}

	@Test
	void resolveCoordinatesRejectsMatchesThatAreTooFarFromCampus() throws IOException {
		harness = new TestHarness();
		harness.enqueue("Saint Louis University", false, response("38.6368", "-90.2349"));

		for (String query : searchQueries("Spring Hall", "Saint Louis University")) {
			harness.enqueue(query, true, "[]");
			harness.enqueue(query, false, response("5.0000", "-58.0000"));
		}

		ResponseStatusException error = assertThrows(
			ResponseStatusException.class,
			() -> harness.service.resolveCoordinates(
				new ListingLocationGeocodingService.CreateListingLocationRequest(
					"Spring Hall",
					"Saint Louis University",
					null,
					null
				)
			)
		);

		assertEquals(
			"Unable to determine a map location for that service area. Try a more specific location like a building and campus name.",
			error.getReason()
		);
	}

	@Test
	void resolveCoordinatesChoosesClosestUnboundedResultNearCampus() throws IOException {
		harness = new TestHarness();
		harness.enqueue("Saint Louis University", false, response("38.6368", "-90.2349"));

		for (String query : searchQueries("Spring Hall", "Saint Louis University")) {
			harness.enqueue(query, true, "[]");
		}

		harness.enqueue(
			"Spring Hall, Saint Louis University",
			false,
			"""
			[
			  {"lat":"38.7000","lon":"-90.3100"},
			  {"lat":"38.6370","lon":"-90.2355"}
			]
			"""
		);

		ListingLocationGeocodingService.ListingCoordinates coordinates = harness.service.resolveCoordinates(
			new ListingLocationGeocodingService.CreateListingLocationRequest(
				"Spring Hall",
				"Saint Louis University",
				null,
				null
			)
		);

		assertEquals(38.6370, coordinates.latitude());
		assertEquals(-90.2355, coordinates.longitude());
	}

	private static List<String> searchQueries(String serviceArea, String university) {
		return List.of(
			serviceArea + ", " + university,
			serviceArea + " " + university,
			serviceArea + " at " + university,
			serviceArea + " near " + university,
			serviceArea
		);
	}

	private static String response(String lat, String lon) {
		return "[{\"lat\":\"" + lat + "\",\"lon\":\"" + lon + "\"}]";
	}

	private static final class TestHarness implements AutoCloseable {
		private final HttpServer server;
		private final Map<String, Deque<String>> responses = new HashMap<>();
		private final ListingLocationGeocodingService service;

		private TestHarness() throws IOException {
			server = HttpServer.create(new InetSocketAddress(0), 0);
			server.createContext("/search", this::handleSearch);
			server.start();

			String baseUrl = "http://127.0.0.1:" + server.getAddress().getPort();
			RestClient client = RestClient.builder()
				.baseUrl(baseUrl)
				.defaultHeader("User-Agent", "CampusKonnect/1.0")
				.build();
			service = new ListingLocationGeocodingService(client);
		}

		private void enqueue(String query, boolean bounded, String body) {
			responses.computeIfAbsent(key(query, bounded), ignored -> new ArrayDeque<>()).add(body);
		}

		private void handleSearch(HttpExchange exchange) throws IOException {
			String query = null;
			boolean bounded = false;

			String rawQuery = exchange.getRequestURI().getRawQuery();
			if (rawQuery != null) {
				for (String pair : rawQuery.split("&")) {
					String[] parts = pair.split("=", 2);
					String name = URLDecoder.decode(parts[0], StandardCharsets.UTF_8);
					String value = parts.length > 1
						? URLDecoder.decode(parts[1], StandardCharsets.UTF_8)
						: "";
					if (name.equals("q")) {
						query = value;
					}
					if (name.equals("bounded") && value.equals("1")) {
						bounded = true;
					}
				}
			}

			String body = "[]";
			if (query != null) {
				Deque<String> queue = responses.get(key(query, bounded));
				if (queue != null && !queue.isEmpty()) {
					body = queue.removeFirst();
				}
			}

			byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
			exchange.getResponseHeaders().add("Content-Type", "application/json");
			exchange.sendResponseHeaders(200, bytes.length);
			try (OutputStream outputStream = exchange.getResponseBody()) {
				outputStream.write(bytes);
			}
		}

		private String key(String query, boolean bounded) {
			return query + "|" + bounded;
		}

		@Override
		public void close() {
			server.stop(0);
		}
	}
}
