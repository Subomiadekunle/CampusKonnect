// package backend.review;
// import org.springframework.web.bind.annotation.*;
// import java.util.List;
// import backend.review.dto.ReviewRequest;
// @RestController
// @RequestMapping("/reviews")
// public class ReviewController {

//     private final ReviewService reviewService;

//     public ReviewController(ReviewService reviewService) {
//         this.reviewService = reviewService;
//     }

//     // CREATE REVIEW
//     @PostMapping
//     public Review createReview(@RequestBody ReviewRequest request) {
//         return reviewService.createReview(
//                 request.getStudent(),
//                 request.getProvider(),
//                 request.getRating(),
//                 request.getComment()
//         );
//     }

//     // GET REVIEWS FOR PROVIDER
//     @GetMapping("/provider/{id}")
//     public List<Review> getReviews(@PathVariable Long id) {
//         return reviewService.getReviewsByProvider(id);
//     }
// }