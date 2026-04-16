package backend.listing;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ServiceListingRepository extends JpaRepository<ServiceListing, Long> {
	@EntityGraph(attributePaths = {"owner", "imageUrls"})
	List<ServiceListing> findAllByOrderByCreatedAtDesc();

	@EntityGraph(attributePaths = {"owner", "imageUrls"})
	List<ServiceListing> findAllByOwnerIdOrderByCreatedAtDesc(Long ownerId);
}
