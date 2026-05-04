package backend.review;

import java.util.List;

import org.springframework.stereotype.Service;

import backend.auth.VerificationService;
import backend.listing.ServiceListing;
import backend.user.User;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final VerificationService verificationService;

    public ReviewService(ReviewRepository reviewRepository,
                         VerificationService verificationService) {
        this.reviewRepository = reviewRepository;
        this.verificationService = verificationService;
    }
    public boolean isVerified(User user) {
    return user.isVerified(); // or your actual logic
}

    // CREATE REVIEW
    public Review createReview(User student, ServiceListing provider,
                               int rating, String comment) {
        // Check if student is verified
        Review review = new Review();
        review.setStudent(student);
        review.setProvider(provider);
        review.setRating(rating);
        review.setComment(comment);

        return reviewRepository.save(review);
    }

    // GET REVIEWS FOR PROVIDER
    public List<Review> getReviewsByProvider(Long providerId) {
        return reviewRepository.findByProviderId(providerId);
    }
}