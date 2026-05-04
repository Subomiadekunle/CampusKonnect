package backend.review.dto;

import backend.listing.ServiceListing;
import backend.user.User;

public class ReviewRequest {

    private User student;
    private ServiceListing provider;
    private int rating;
    private String comment;

    // GETTERS
    public User getStudent() {
        return student;
    }

    public ServiceListing getProvider() {
        return provider;
    }

    public int getRating() {
        return rating;
    }

    public String getComment() {
        return comment;
    }

    // SETTERS
    public void setStudent(User student) {
        this.student = student;
    }

    public void setProvider(ServiceListing provider) {
        this.provider = provider;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}