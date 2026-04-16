package backend.listing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

class ListingImageStorageServiceTest {

	@TempDir
	Path tempDir;

	@Test
	void storeImagesSavesSupportedFilesAndReturnsPublicUrls() {
		ListingImageStorageService storage = new ListingImageStorageService(tempDir.toString());
		MockMultipartFile image = new MockMultipartFile("images", "photo.jpg", "image/jpeg", new byte[] {1, 2, 3});

		List<String> urls = storage.storeImages(List.of(image));

		assertEquals(1, urls.size());
		assertTrueUrl(urls.getFirst());

		String filename = urls.getFirst().substring("/uploads/listings/".length());
		assertFalse(filename.isBlank());
		assertTrue(Files.exists(tempDir.resolve(filename)));
	}

	@Test
	void storeImagesRejectsUnsupportedContentType() {
		ListingImageStorageService storage = new ListingImageStorageService(tempDir.toString());
		MockMultipartFile image = new MockMultipartFile("images", "file.gif", "image/gif", new byte[] {1});

		ResponseStatusException error = assertThrows(
			ResponseStatusException.class,
			() -> storage.storeImages(List.of(image))
		);

		assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
		assertEquals("Only PNG and JPG images are supported", error.getReason());
	}

	@Test
	void storeImagesRejectsMoreThanMaxCount() {
		ListingImageStorageService storage = new ListingImageStorageService(tempDir.toString());
		MockMultipartFile image = new MockMultipartFile("images", "a.jpg", "image/jpeg", new byte[] {1});
		List<MockMultipartFile> images = List.of(image, image, image, image, image, image, image, image, image);

		ResponseStatusException error = assertThrows(
			ResponseStatusException.class,
			() -> storage.storeImages(images.stream().map(i -> (org.springframework.web.multipart.MultipartFile) i).toList())
		);

		assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
		assertEquals("You can upload up to 8 images per listing", error.getReason());
	}

	private void assertTrueUrl(String url) {
		assertTrue(url.startsWith("/uploads/listings/"));
	}
}

