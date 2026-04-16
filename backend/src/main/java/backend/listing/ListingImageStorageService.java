package backend.listing;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ListingImageStorageService {

	private static final long MAX_IMAGE_BYTES = 10L * 1024 * 1024;
	private static final int MAX_IMAGE_COUNT = 8;

	private final Path uploadDir;

	public ListingImageStorageService(
		@Value("${listing.images.upload-dir:uploads/listings}") String uploadDir
	) {
		this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
	}

	public List<String> storeImages(List<MultipartFile> images) {
		if (images == null || images.isEmpty()) {
			return List.of();
		}
		if (images.size() > MAX_IMAGE_COUNT) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You can upload up to 8 images per listing");
		}

		try {
			Files.createDirectories(uploadDir);
		} catch (IOException e) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to initialize image storage", e);
		}

		List<String> urls = new ArrayList<>();
		for (MultipartFile image : images) {
			validateImage(image);
			String ext = extensionOf(image.getOriginalFilename());
			String filename = UUID.randomUUID() + (ext.isBlank() ? ".jpg" : "." + ext);
			Path target = uploadDir.resolve(filename).normalize();

			try (InputStream in = image.getInputStream()) {
				Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
			} catch (IOException e) {
				throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to store uploaded image", e);
			}

			urls.add("/uploads/listings/" + filename);
		}
		return urls;
	}

	private void validateImage(MultipartFile image) {
		if (image == null || image.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded image cannot be empty");
		}
		String contentType = image.getContentType();
		if (contentType == null || (!contentType.equals("image/png") && !contentType.equals("image/jpeg"))) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PNG and JPG images are supported");
		}
		if (image.getSize() > MAX_IMAGE_BYTES) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Each image must be 10MB or less");
		}
	}

	private String extensionOf(String name) {
		if (name == null || !name.contains(".")) {
			return "";
		}
		return name.substring(name.lastIndexOf('.') + 1).toLowerCase();
	}
}
