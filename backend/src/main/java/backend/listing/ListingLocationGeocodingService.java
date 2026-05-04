package backend.listing;

import backend.user.User;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ListingLocationGeocodingService {

	private static final String GEOCODER_BASE_URL = "https://nominatim.openstreetmap.org";
	private static final String GEOCODER_USER_AGENT = "CampusKonnect/1.0";
	private static final double CAMPUS_SEARCH_RADIUS_DEGREES = 0.05;
	private static final double MAX_DISTANCE_FROM_CAMPUS_KM = 12.0;

	private final RestClient restClient;

	public ListingLocationGeocodingService() {
		this.restClient = RestClient.builder()
			.baseUrl(GEOCODER_BASE_URL)
			.defaultHeader("User-Agent", GEOCODER_USER_AGENT)
			.build();
	}

	public ListingCoordinates resolveCoordinates(CreateListingLocationRequest request) {
		if (request.latitude() != null || request.longitude() != null) {
			return validateProvidedCoordinates(request.latitude(), request.longitude());
		}

		String serviceArea = normalizeRequiredValue(request.serviceArea(), "service area");
		String university = normalizeRequiredValue(request.university(), "university");
		ListingCoordinates campusCoordinates = resolveCampusCoordinates(university);

		try {
			for (String query : buildSearchQueries(serviceArea, university)) {
				NominatimSearchResult[] results = search(query, campusCoordinates, true);

				if (results == null || results.length == 0) {
					continue;
				}

				ListingCoordinates match = toCoordinates(results[0]);
				if (distanceKm(campusCoordinates, match) <= MAX_DISTANCE_FROM_CAMPUS_KM) {
					return match;
				}
			}

			for (String query : buildSearchQueries(serviceArea, university)) {
				NominatimSearchResult[] results = search(query, campusCoordinates, false);

				if (results == null || results.length == 0) {
					continue;
				}

				ListingCoordinates closestMatch = null;
				double closestDistance = Double.MAX_VALUE;
				for (NominatimSearchResult result : results) {
					ListingCoordinates candidate = toCoordinates(result);
					double distance = distanceKm(campusCoordinates, candidate);
					if (distance < closestDistance) {
						closestDistance = distance;
						closestMatch = candidate;
					}
				}

				if (closestMatch != null && closestDistance <= MAX_DISTANCE_FROM_CAMPUS_KM) {
					return closestMatch;
				}
			}

			throw new ResponseStatusException(
				HttpStatus.BAD_REQUEST,
				"Unable to determine a map location for that service area. Try a more specific location like a building and campus name."
			);
		} catch (ResponseStatusException ex) {
			throw ex;
		} catch (NumberFormatException | RestClientException ex) {
			throw new ResponseStatusException(
				HttpStatus.SERVICE_UNAVAILABLE,
				"Unable to determine a map location right now. Please try again."
			);
		}
	}

	public CreateListingLocationRequest fromUserAndRequest(User owner, String serviceArea, Double latitude, Double longitude) {
		if (owner == null) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "listing owner is required");
		}
		return new CreateListingLocationRequest(serviceArea, owner.getUniversity(), latitude, longitude);
	}

	private ListingCoordinates resolveCampusCoordinates(String university) {
		try {
			NominatimSearchResult[] results = search(university, null, false);
			if (results == null || results.length == 0) {
				throw new ResponseStatusException(
					HttpStatus.BAD_REQUEST,
					"Unable to determine your university location. Update your university name in Account and try again."
				);
			}
			return toCoordinates(results[0]);
		} catch (ResponseStatusException ex) {
			throw ex;
		} catch (NumberFormatException | RestClientException ex) {
			throw new ResponseStatusException(
				HttpStatus.SERVICE_UNAVAILABLE,
				"Unable to determine a map location right now. Please try again."
			);
		}
	}

	private Set<String> buildSearchQueries(String serviceArea, String university) {
		Set<String> queries = new LinkedHashSet<>();
		queries.add(serviceArea + ", " + university);
		queries.add(serviceArea + " " + university);
		queries.add(serviceArea + " at " + university);
		queries.add(serviceArea + " near " + university);
		queries.add(serviceArea);
		return queries;
	}

	private NominatimSearchResult[] search(String query, ListingCoordinates campusCoordinates, boolean bounded) {
		return restClient.get()
			.uri(uriBuilder -> {
				uriBuilder
					.path("/search")
					.queryParam("q", query)
					.queryParam("format", "jsonv2")
					.queryParam("limit", bounded ? 5 : 10);

				if (bounded && campusCoordinates != null) {
					double north = campusCoordinates.latitude() + CAMPUS_SEARCH_RADIUS_DEGREES;
					double south = campusCoordinates.latitude() - CAMPUS_SEARCH_RADIUS_DEGREES;
					double east = campusCoordinates.longitude() + CAMPUS_SEARCH_RADIUS_DEGREES;
					double west = campusCoordinates.longitude() - CAMPUS_SEARCH_RADIUS_DEGREES;
					uriBuilder
						.queryParam("viewbox", west + "," + north + "," + east + "," + south)
						.queryParam("bounded", 1);
				}

				return uriBuilder.build();
			})
			.retrieve()
			.body(NominatimSearchResult[].class);
	}

	private ListingCoordinates toCoordinates(NominatimSearchResult result) {
		return new ListingCoordinates(
			Double.parseDouble(result.lat()),
			Double.parseDouble(result.lon())
		);
	}

	private double distanceKm(ListingCoordinates from, ListingCoordinates to) {
		double earthRadiusKm = 6371.0;
		double latDistance = Math.toRadians(to.latitude() - from.latitude());
		double lonDistance = Math.toRadians(to.longitude() - from.longitude());
		double startLat = Math.toRadians(from.latitude());
		double endLat = Math.toRadians(to.latitude());

		double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
			+ Math.cos(startLat) * Math.cos(endLat)
			* Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return earthRadiusKm * c;
	}

	private ListingCoordinates validateProvidedCoordinates(Double latitude, Double longitude) {
		if (latitude == null || longitude == null) {
			throw new ResponseStatusException(
				HttpStatus.BAD_REQUEST,
				"latitude and longitude must both be provided together"
			);
		}
		if (latitude < -90 || latitude > 90) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "latitude must be between -90 and 90");
		}
		if (longitude < -180 || longitude > 180) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "longitude must be between -180 and 180");
		}
		return new ListingCoordinates(latitude, longitude);
	}

	private String normalizeRequiredValue(String value, String fieldLabel) {
		if (value == null || value.trim().isEmpty()) {
			String message = fieldLabel.equals("university")
				? "Set your university in Account before creating a listing location."
				: fieldLabel + " is required";
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
		}
		return value.trim();
	}

	public record ListingCoordinates(double latitude, double longitude) {
	}

	public record CreateListingLocationRequest(
		String serviceArea,
		String university,
		Double latitude,
		Double longitude
	) {
	}

	private record NominatimSearchResult(String lat, String lon) {
	}
}
